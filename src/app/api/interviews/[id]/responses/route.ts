import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviewQuestions, responses, questions, speechAnalyses, evaluations, interviews } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { evaluateResponse } from "@/lib/ai-evaluation";
import { analyzeSpeechMetrics } from "@/lib/speech";
import { writeFile, mkdir } from "fs/promises";
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
    let interviewQuestionId: string;
    let textContent: string | null = null;
    let audioPath: string | null = null;
    let videoPath: string | null = null;
    let responseType: "TEXT" | "AUDIO" | "VIDEO" = "TEXT";
    let duration: number | undefined;
    let transcriptText: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      interviewQuestionId = formData.get("interviewQuestionId") as string;
      textContent = formData.get("textContent") as string | null;
      const file = formData.get("file") as File | null;
      const durationStr = formData.get("duration") as string | null;
      if (durationStr) duration = parseInt(durationStr);
      responseType = (formData.get("responseType") as "TEXT" | "AUDIO" | "VIDEO") || "AUDIO";

      if (file) {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        const ext = file.name.split(".").pop() || "webm";
        const filename = `${randomUUID()}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);
        if (responseType === "VIDEO") videoPath = `/uploads/${filename}`;
        else audioPath = `/uploads/${filename}`;
      }
    } else {
      const body = await req.json();
      interviewQuestionId = body.interviewQuestionId;
      textContent = body.textContent;
      responseType = body.responseType || "TEXT";
      duration = body.duration;
      transcriptText = body.transcriptText || null;
    }

    if (!interviewQuestionId) {
      return NextResponse.json({ error: "interviewQuestionId is required" }, { status: 400 });
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

    // Determine transcript/text for evaluation
    let finalTranscript = transcriptText || textContent || "";

    if ((responseType === "AUDIO" || responseType === "VIDEO") && !finalTranscript && textContent) {
      finalTranscript = textContent;
    }

    if (!finalTranscript && (audioPath || videoPath)) {
      finalTranscript = "[Audio/video response submitted. In demo mode, please also include text for AI analysis.]";
    }

    if (!finalTranscript || finalTranscript.trim().length < 2) {
      return NextResponse.json({ error: "Response text is required (minimum 2 characters)" }, { status: 400 });
    }

    // Create response record
    const [response] = await db.insert(responses).values({
      interviewQuestionId,
      responseType,
      textContent: textContent || finalTranscript,
      audioPath,
      videoPath,
      transcriptText: finalTranscript,
      duration: duration ?? null,
    }).returning();

    // Speech analysis (works on transcript text)
    const speechMetrics = analyzeSpeechMetrics(finalTranscript, duration);

    await db.insert(speechAnalyses).values({
      responseId: response.id,
      duration: speechMetrics.duration,
      speakingRate: speechMetrics.speakingRate,
      pauseCount: speechMetrics.pauseCount,
      avgPauseDuration: speechMetrics.avgPauseDuration,
      fillerWordsCount: speechMetrics.fillerWordsCount,
      fluencyScore: speechMetrics.fluencyScore,
      confidenceIndicator: speechMetrics.confidenceIndicator,
      rawData: speechMetrics.rawData,
    });

    // AI Evaluation
    const { result: evalResult, mode } = await evaluateResponse({
      question: question.questionText,
      expectedConcepts: question.expectedConcepts as string[],
      evaluationGuidance: question.evaluationGuidance,
      candidateResponse: finalTranscript,
      speechInfo: {
        duration: speechMetrics.duration,
        speakingRate: speechMetrics.speakingRate,
        pauseCount: speechMetrics.pauseCount,
        fluencyScore: speechMetrics.fluencyScore,
      },
    });

    const [evaluation] = await db.insert(evaluations).values({
      responseId: response.id,
      technicalScore: evalResult.technical_score,
      relevanceScore: evalResult.relevance_score,
      communicationScore: evalResult.communication_score,
      fluencyScore: evalResult.fluency_score,
      grammarScore: evalResult.grammar_score,
      vocabularyScore: evalResult.vocabulary_score,
      problemSolvingScore: evalResult.problem_solving_score,
      structureScore: evalResult.structure_score,
      confidenceScore: evalResult.confidence_indicator,
      overallScore: evalResult.overall_score,
      explanation: evalResult.explanation,
      strengths: evalResult.strengths,
      improvementAreas: evalResult.improvement_areas,
      missingConcepts: evalResult.missing_concepts,
      recommendations: evalResult.recommendations,
    }).returning();

    return NextResponse.json({ response, speechMetrics, evaluation, mode });
  } catch (error: unknown) {
    console.error("Response submission error:", error);
    return NextResponse.json({ error: "Failed to submit response. Please try again." }, { status: 500 });
  }
}
