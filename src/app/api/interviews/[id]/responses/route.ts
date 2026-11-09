import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviewQuestions, responses, questions, speechAnalyses, evaluations, interviews } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { transcribeAudio, validateAudioFile } from "@/lib/speech";
import { analyzeAndPersistResponse } from "@/lib/response-analysis";
import { validateResponseSubmission, validateResponseEdit } from "@/lib/response-validation";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // OWNERSHIP CHECK: verify student owns this interview
    const [interview] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, interviewId), eq(interviews.studentId, payload.userId)))
      .limit(1);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found or access denied" }, { status: 404 });
    }

    if (interview.status === "ANALYZED") {
      return NextResponse.json({ error: "Interview is already completed" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || "";
    let submission: Record<string, unknown>;
    let file: File | null = null;
    let audioPath: string | null = null;
    let videoPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      file = formData.get("file") instanceof File ? formData.get("file") as File : null;
      const durationStr = formData.get("duration") as string | null;
      submission = {
        interviewQuestionId: formData.get("interviewQuestionId"),
        responseType: formData.get("responseType") || "AUDIO",
        textContent: formData.get("textContent"),
        duration: durationStr ? Number(durationStr) : undefined,
        ...(formData.has("transcript") ? { transcript: formData.get("transcript") } : {}),
        ...(formData.has("transcriptText") ? { transcriptText: formData.get("transcriptText") } : {}),
      };
    } else {
      submission = await req.json();
    }

    const parsedSubmission = validateResponseSubmission(submission);
    if (!parsedSubmission.success) {
      if (parsedSubmission.status === 403) console.warn("Rejected client-supplied media transcript", { interviewId, userId: payload.userId });
      return NextResponse.json({ error: parsedSubmission.error }, { status: parsedSubmission.status });
    }
    const { interviewQuestionId, responseType, duration, textContent } = parsedSubmission.data;

    if (responseType !== "TEXT" && !file) {
      return NextResponse.json({ error: "An audio or video recording is required" }, { status: 400 });
    }
    if (file) {
      const validation = validateAudioFile(file);
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify interview question belongs to this interview
    const [iq] = await db
      .select()
      .from(interviewQuestions)
      .where(and(eq(interviewQuestions.id, interviewQuestionId), eq(interviewQuestions.interviewId, interviewId)))
      .limit(1);

    if (!iq) {
      return NextResponse.json({ error: "Interview question not found" }, { status: 404 });
    }

    // Fetch the question directly by ID (no full table scan)
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, iq.questionId))
      .limit(1);

    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    let finalTranscript = (textContent || "").trim();
    let transcriptStatus = "READY";
    let transcriptionError: string | undefined;

    if (responseType !== "TEXT" && file) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      const ext = file.name.split(".").pop() || "webm";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      if (responseType === "VIDEO") videoPath = `/uploads/${filename}`;
      else audioPath = `/uploads/${filename}`;

      const transcription = await transcribeAudio(buffer, file.type || "audio/webm");
      transcriptionError = transcription.error;
      finalTranscript = transcription.error
        ? "[Transcription unavailable. Please re-record your response.]"
        : transcription.transcript;
      transcriptStatus = transcription.error ? "UNAVAILABLE" : finalTranscript.trim() ? "READY" : "NO_SPEECH";
    }

    if (responseType === "TEXT" && finalTranscript.length < 2) {
      return NextResponse.json({ error: "Response text is required (minimum 2 characters)" }, { status: 400 });
    }

    const [previousResponse] = await db.select().from(responses)
      .where(eq(responses.interviewQuestionId, interviewQuestionId)).limit(1);
    let response: typeof responses.$inferSelect;
    const responseValues = {
      interviewQuestionId,
      responseType,
      textContent: responseType === "TEXT" ? finalTranscript : null,
      audioPath,
      videoPath,
      transcriptText: finalTranscript,
      transcriptLocked: responseType !== "TEXT",
      transcriptStatus,
      duration: duration ?? null,
      submittedAt: new Date(),
    };

    if (previousResponse) {
      await db.delete(evaluations).where(eq(evaluations.responseId, previousResponse.id));
      await db.delete(speechAnalyses).where(eq(speechAnalyses.responseId, previousResponse.id));
      [response] = await db.update(responses).set(responseValues)
        .where(eq(responses.id, previousResponse.id)).returning();
    } else {
      [response] = await db.insert(responses).values(responseValues).returning();
    }

    if (previousResponse) {
      const previousPaths = [previousResponse.audioPath, previousResponse.videoPath].filter((value): value is string => Boolean(value));
      await Promise.all(previousPaths.map(async (oldPath) => {
        const oldFile = path.join(process.cwd(), "public", oldPath.replace(/^\//, ""));
        try { await unlink(oldFile); } catch {}
      }));
    }

    if (transcriptionError) console.warn("Media transcription unavailable", { interviewId, responseId: response.id, error: transcriptionError });

    const analysis = await analyzeAndPersistResponse({
      responseId: response.id,
      question,
      candidateResponse: response.transcriptStatus === "READY" ? response.transcriptText || "" : "",
      duration: response.duration,
    });

    return NextResponse.json({ response, ...analysis });
  } catch (error: unknown) {
    console.error("Response submission error:", error);
    return NextResponse.json({ error: "Failed to submit response. Please try again." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as Record<string, unknown>;
    if (typeof body.responseId !== "string") {
      return NextResponse.json({ error: "responseId is required" }, { status: 400 });
    }

    const [interview] = await db.select().from(interviews)
      .where(and(eq(interviews.id, interviewId), eq(interviews.studentId, payload.userId))).limit(1);
    if (!interview) return NextResponse.json({ error: "Interview not found or access denied" }, { status: 404 });

    const [response] = await db.select().from(responses).where(eq(responses.id, body.responseId)).limit(1);
    if (!response) return NextResponse.json({ error: "Response not found" }, { status: 404 });
    const [interviewQuestion] = await db.select().from(interviewQuestions)
      .where(and(eq(interviewQuestions.id, response.interviewQuestionId), eq(interviewQuestions.interviewId, interviewId))).limit(1);
    if (!interviewQuestion) return NextResponse.json({ error: "Response not found" }, { status: 404 });
    const [question] = await db.select().from(questions).where(eq(questions.id, interviewQuestion.questionId)).limit(1);
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const parsedEdit = validateResponseEdit(body, response.responseType, response.transcriptLocked);
    if (!parsedEdit.success) {
      if (parsedEdit.status === 403) console.warn("Rejected attempt to edit a locked media transcript", { interviewId, responseId: response.id, userId: payload.userId });
      return NextResponse.json({ error: parsedEdit.error }, { status: parsedEdit.status });
    }

    const [updatedResponse] = await db.update(responses).set({
      textContent: parsedEdit.textContent,
      transcriptText: parsedEdit.textContent,
      transcriptStatus: "READY",
      submittedAt: new Date(),
    }).where(eq(responses.id, response.id)).returning();

    const analysis = await analyzeAndPersistResponse({
      responseId: response.id,
      question,
      candidateResponse: updatedResponse.transcriptText || "",
      duration: updatedResponse.duration,
    });

    return NextResponse.json({ response: updatedResponse, ...analysis });
  } catch (error: unknown) {
    console.error("Response update error:", error);
    return NextResponse.json({ error: "Failed to update response" }, { status: 500 });
  }
}
