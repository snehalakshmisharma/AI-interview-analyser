import { NextRequest, NextResponse } from "next/server";
import { exchangeOIDCCode } from "@/lib/oauth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signJWT } from "@/lib/auth";
import * as jose from "jose";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oidc_state")?.value;

  const buildLoginUrl = (message: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", message);
    return url;
  };

  if (!code) {
    return NextResponse.redirect(buildLoginUrl("Institutional sign-in failed. No authorization code received."));
  }

  if (state && storedState && state !== storedState) {
    console.error("OIDC state mismatch — possible CSRF attack");
    return NextResponse.redirect(buildLoginUrl("Institutional sign-in failed. Security validation error."));
  }

  try {
    const tokens = await exchangeOIDCCode(code);
    let email = "";
    let name = "";

    if (tokens.id_token) {
      try {
        const payload = jose.decodeJwt(tokens.id_token);
        email = (payload.email as string) || "";
        name = (payload.name as string) || (payload.preferred_username as string) || email;
      } catch (decodeErr) {
        console.error("Failed to decode OIDC id_token:", decodeErr);
      }
    }

    if (!email) {
      throw new Error("No email in OIDC token — cannot identify user");
    }

    let [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      const [newUser] = await db.insert(users).values({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        role: "STUDENT",
      }).returning();
      user = newUser;
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
    res.cookies.delete("oidc_state");
    return res;
  } catch (err: unknown) {
    console.error("OIDC callback error:", err);
    return NextResponse.redirect(buildLoginUrl("Institutional sign-in failed. Please try again or use another method."));
  }
}
