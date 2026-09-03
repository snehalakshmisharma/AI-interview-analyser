import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/oauth";
import { generateOAuthState } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const state = generateOAuthState();
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
    const message = error instanceof Error ? error.message : "OAuth not configured";
    console.error("Google OAuth init error:", error);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Google sign-in is not configured. Please contact the administrator.");
    return NextResponse.redirect(loginUrl);
  }
}
