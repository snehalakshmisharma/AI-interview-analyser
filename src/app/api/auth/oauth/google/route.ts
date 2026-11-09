import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/oauth";
import { generateOAuthState } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const state = generateOAuthState();

    // If Google OAuth credentials are not configured
    if (!isGoogleOAuthConfigured()) {
      const isDemo = process.env.AI_MODE === "demo" || process.env.NODE_ENV !== "production";
      if (isDemo) {
        // Fallback to seamless demo Google account login for local dev and testing
        const demoCallbackUrl = new URL("/api/auth/oauth/google/callback", req.url);
        demoCallbackUrl.searchParams.set("code", "demo_google_auth_code");
        demoCallbackUrl.searchParams.set("state", state);

        const res = NextResponse.redirect(demoCallbackUrl);
        res.cookies.set("oauth_state", state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 600,
          path: "/",
        });
        return res;
      }

      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set(
        "error",
        "Google sign-in is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
      );
      return NextResponse.redirect(loginUrl);
    }

    const url = getGoogleAuthUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "OAuth initialization error";
    console.error("Google OAuth init error:", error);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", `Google sign-in error: ${message}`);
    return NextResponse.redirect(loginUrl);
  }
}
