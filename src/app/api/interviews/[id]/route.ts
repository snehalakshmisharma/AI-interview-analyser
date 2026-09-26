import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews, interviewQuestions, questions, responses, evaluations } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);
    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    // IDOR protection: students can only see their own interviews
    if (payload.role === "STUDENT" && interview.studentId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const iqs = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.interviewId, id));

    const questionIds = iqs.map(iq => iq.questionId);

    let qs: typeof questions.$inferSelect[] = [];
    if (questionIds.length > 0) {
      qs = await db.select().from(questions).where(inArray(questions.id, questionIds));
    }

    const orderedQuestions = [...iqs]
      .sort((a, b) => a.sequence - b.sequence)
      .map(iq => ({ ...iq, question: qs.find(question => question.id === iq.questionId) }));

    const iqIds = iqs.map(iq => iq.id);

    let interviewResponses: typeof responses.$inferSelect[] = [];
    if (iqIds.length > 0) {
      interviewResponses = await db
        .select()
        .from(responses)
        .where(inArray(responses.interviewQuestionId, iqIds));
    }

    const responseIds = interviewResponses.map(response => response.id);

    let evals: typeof evaluations.$inferSelect[] = [];
    if (responseIds.length > 0) {
      evals = await db
        .select()
        .from(evaluations)
        .where(inArray(evaluations.responseId, responseIds));
    }

    return NextResponse.json({
      interview,
      questions: orderedQuestions,
      responses: interviewResponses,
      evaluations: evals,
    });
  } catch (error: unknown) {
    console.error("Interview load error:", error);
    return NextResponse.json({ error: "Failed to load interview data" }, { status: 500 });
  }
}
