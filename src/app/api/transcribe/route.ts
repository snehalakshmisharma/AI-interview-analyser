import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/speech";
import { verifyJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "audio/webm";

    const result = await transcribeAudio(buffer, mimeType);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Transcribe API error:", error);
    return NextResponse.json({ error: "Transcription service unavailable" }, { status: 500 });
  }
}
