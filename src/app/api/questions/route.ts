import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const type = searchParams.get("type");

  let query = db.select().from(questions);
  
  // For simplicity, fetch all then filter in memory (small dataset)
  const all = await db.select().from(questions);
  let filtered = all;

  if (category) filtered = filtered.filter(q => q.category === category);
  if (difficulty) filtered = filtered.filter(q => q.difficulty === difficulty);
  if (type) filtered = filtered.filter(q => q.interviewType === type);

  return NextResponse.json({ questions: filtered });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "FACULTY" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { questionText, category, difficulty, interviewType, expectedConcepts, evaluationGuidance, timeLimit } = body;

  if (!questionText || !category || !difficulty || !interviewType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db.insert(questions).values({
    questionText,
    category,
    difficulty,
    interviewType,
    expectedConcepts: expectedConcepts || [],
    evaluationGuidance: evaluationGuidance || "Evaluate based on correctness and clarity",
    timeLimit: timeLimit || 120,
  }).returning();

  return NextResponse.json({ question: created });
}
