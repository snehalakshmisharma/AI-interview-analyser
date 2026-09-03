import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews, interviewQuestions, responses, evaluations } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";
import { calculatePlacementReadiness } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [interview] = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);
  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  // Only the owning student (or faculty/admin) can complete an interview
  if (payload.role === "STUDENT" && interview.studentId !== payload.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (interview.status === "ANALYZED") {
    return NextResponse.json({ error: "Interview is already completed and analyzed" }, { status: 400 });
  }

  // Get interview questions for this interview
  const iqs = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.interviewId, id));

  if (iqs.length === 0) {
    return NextResponse.json({ error: "No questions found for this interview" }, { status: 400 });
  }

  const iqIds = iqs.map(iq => iq.id);

  // Get responses scoped to this interview (inArray instead of fetching all)
  const interviewResponses = await db
    .select()
    .from(responses)
    .where(inArray(responses.interviewQuestionId, iqIds));

  if (interviewResponses.length === 0) {
    return NextResponse.json({ error: "No responses found. Please submit at least one answer." }, { status: 400 });
  }

  const responseIds = interviewResponses.map(r => r.id);

  // Get evaluations scoped to these responses
  const relevantEvals = await db
    .select()
    .from(evaluations)
    .where(inArray(evaluations.responseId, responseIds));

  if (relevantEvals.length === 0) {
    return NextResponse.json({ error: "No evaluations found. Please ensure responses were submitted successfully." }, { status: 400 });
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const overallScore = avg(relevantEvals.map(e => e.overallScore));
  const technicalScore = avg(relevantEvals.map(e => e.technicalScore));
  const communicationScore = avg(relevantEvals.map(e => e.communicationScore));
  const fluencyScore = avg(relevantEvals.map(e => e.fluencyScore));
  const relevanceScore = avg(relevantEvals.map(e => e.relevanceScore));

  const readiness = calculatePlacementReadiness({
    technical: technicalScore,
    communication: communicationScore,
    overall: overallScore,
  });

  await db.update(interviews).set({
    status: "ANALYZED",
    completedAt: new Date(),
    overallScore,
    technicalScore,
    communicationScore,
    fluencyScore,
    relevanceScore,
    placementReadiness: readiness.overallReadiness,
  }).where(eq(interviews.id, id));

  return NextResponse.json({
    success: true,
    overallScore,
    technicalScore,
    communicationScore,
    fluencyScore,
    relevanceScore,
    placementReadiness: readiness.overallReadiness,
    interviewId: id,
  });
}
