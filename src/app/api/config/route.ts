import { NextResponse } from "next/server";

export async function GET() {
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY);
  return NextResponse.json({
    aiMode: process.env.AI_MODE || "demo",
    hasGemini,
    hasOpenAI: hasGemini, // Backward-compatibility alias
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasOIDC: !!(process.env.OIDC_CLIENT_ID && process.env.OIDC_ISSUER_URL),
  });
}
