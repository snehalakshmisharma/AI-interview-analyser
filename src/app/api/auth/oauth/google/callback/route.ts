import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/oauth";
import { db } from "@/db";
import { users, oauthAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { signJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;
  const error = req.nextUrl.searchParams.get("error");

  const buildLoginUrl = (message: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", message);
    return url;
  };

  if (error) {
    console.error("Google OAuth returned error:", error);
    return NextResponse.redirect(buildLoginUrl("Google sign-in was cancelled or denied."));
  }

  if (!code) {
    return NextResponse.redirect(buildLoginUrl("Google sign-in failed. No authorization code received."));
  }

  if (state && storedState && state !== storedState) {
    console.error("OAuth state mismatch — possible CSRF attack");
    return NextResponse.redirect(buildLoginUrl("Google sign-in failed. Security validation error."));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    if (!userInfo.email) {
      throw new Error("No email returned from Google");
    }

    // Find or create user
    let [existingAccount] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, "google"), eq(oauthAccounts.providerAccountId, userInfo.sub)))
      .limit(1);

    let user;
    if (existingAccount) {
      // Google account found — log in existing user
      [user] = await db.select().from(users).where(eq(users.id, existingAccount.userId)).limit(1);
    } else {
      // Check by email
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userInfo.email.toLowerCase()))
        .limit(1);

      if (byEmail) {
        // Email exists — link Google account to this user
        user = byEmail;
        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: "google",
          providerAccountId: userInfo.sub,
          accessToken: tokens.access_token,
        });
      } else {
        // New user — create user and OAuth account
        const [newUser] = await db.insert(users).values({
          name: userInfo.name || userInfo.email.split("@")[0],
          email: userInfo.email.toLowerCase(),
          role: "STUDENT",
          avatarUrl: userInfo.picture || null,
        }).returning();

        user = newUser;

        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: "google",
          providerAccountId: userInfo.sub,
          accessToken: tokens.access_token,
        });
      }
    }

    if (!user) {
      throw new Error("User not found after OAuth");
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const redirectPath = user.role === "FACULTY" || user.role === "ADMIN" ? "/faculty" : "/dashboard";
    const res = NextResponse.redirect(new URL(redirectPath, req.url));
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.delete("oauth_state");
    return res;
  } catch (err: unknown) {
    console.error("Google OAuth callback error:", err);
    // Never expose raw DB errors or stack traces to the user
    return NextResponse.redirect(buildLoginUrl("Google sign-in failed. Please try again."));
  }
}
