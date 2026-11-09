import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, getGoogleUserInfo, isGoogleOAuthConfigured } from "@/lib/oauth";
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
    let tokens: { access_token: string; id_token: string; refresh_token?: string };
    let userInfo: { email: string; name: string; picture?: string; sub: string };

    if (code === "demo_google_auth_code" && !isGoogleOAuthConfigured()) {
      // Demo Google authentication when Google Cloud credentials are not configured
      tokens = {
        access_token: "demo_google_access_token",
        id_token: "demo_google_id_token",
      };
      userInfo = {
        sub: "demo_google_sub_1001",
        email: "student.google@demo.com",
        name: "Google Demo Student",
        picture: "https://api.dicebear.com/7.x/bottts/svg?seed=GoogleDemo",
      };
    } else {
      // Real Google OAuth exchange
      tokens = await exchangeGoogleCode(code);
      userInfo = await getGoogleUserInfo(tokens.access_token);
    }

    if (!userInfo.email) {
      throw new Error("No email returned from Google profile");
    }

    // 1. Look up existing OAuth account by provider and Google sub
    const [existingAccount] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, "google"), eq(oauthAccounts.providerAccountId, userInfo.sub)))
      .limit(1);

    let user;

    if (existingAccount) {
      // Account found: fetch the linked user
      const [existingUser] = await db.select().from(users).where(eq(users.id, existingAccount.userId)).limit(1);
      user = existingUser;

      // Update tokens and user avatar if available
      await db
        .update(oauthAccounts)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
        })
        .where(eq(oauthAccounts.id, existingAccount.id));

      if (userInfo.picture && !user?.avatarUrl) {
        await db.update(users).set({ avatarUrl: userInfo.picture }).where(eq(users.id, user.id));
      }
    } else {
      // 2. Check if a user already exists with this email
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userInfo.email.toLowerCase()))
        .limit(1);

      if (byEmail) {
        user = byEmail;

        // Check if user already had an existing Google record
        const [existingUserOauth] = await db
          .select()
          .from(oauthAccounts)
          .where(and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, "google")))
          .limit(1);

        if (existingUserOauth) {
          await db
            .update(oauthAccounts)
            .set({
              providerAccountId: userInfo.sub,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || existingUserOauth.refreshToken,
            })
            .where(eq(oauthAccounts.id, existingUserOauth.id));
        } else {
          await db.insert(oauthAccounts).values({
            userId: user.id,
            provider: "google",
            providerAccountId: userInfo.sub,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
          });
        }

        if (userInfo.picture && !user.avatarUrl) {
          await db.update(users).set({ avatarUrl: userInfo.picture }).where(eq(users.id, user.id));
        }
      } else {
        // 3. Brand new user: create user and OAuth account
        const [newUser] = await db
          .insert(users)
          .values({
            name: userInfo.name || userInfo.email.split("@")[0],
            email: userInfo.email.toLowerCase(),
            role: "STUDENT",
            avatarUrl: userInfo.picture || null,
          })
          .returning();

        user = newUser;

        await db.insert(oauthAccounts).values({
          userId: user.id,
          provider: "google",
          providerAccountId: userInfo.sub,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
        });
      }
    }

    if (!user) {
      throw new Error("Unable to link or create user after Google sign-in");
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

    res.cookies.set("oauth_state", "", {
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(buildLoginUrl(`Google sign-in failed: ${errorMsg}`));
  }
}
