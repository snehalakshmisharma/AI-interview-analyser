import { NextRequest, NextResponse } from "next/server";
import { getOIDCAuthUrl } from "@/lib/oauth";
import { generateOAuthState } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Check if OIDC is configured before attempting
  if (!process.env.OIDC_CLIENT_ID || !process.env.OIDC_ISSUER_URL) {
    console.warn("SSO login attempted but OIDC is not configured (missing OIDC_CLIENT_ID or OIDC_ISSUER_URL)");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Institutional SSO is not configured for this deployment. Please use email/password or Google login.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const state = generateOAuthState();
    const url = getOIDCAuthUrl(state);

    const res = NextResponse.redirect(url);
    res.cookies.set("oidc_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (error: unknown) {
    console.error("OIDC init error:", error);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Institutional SSO is not available. Please use another sign-in method.");
    return NextResponse.redirect(loginUrl);
  }
}
