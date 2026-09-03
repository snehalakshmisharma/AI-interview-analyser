import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews, interviewQuestions, questions } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (studentId && payload.role !== "FACULTY" && payload.role !== "ADMIN" && payload.userId !== studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetStudentId = studentId || (payload.role === "STUDENT" ? payload.userId : undefined);

  let queryResult;
  if (targetStudentId) {
    queryResult = await db.select().from(interviews).where(eq(interviews.studentId, targetStudentId)).orderBy(desc(interviews.createdAt));
  } else if (payload.role === "FACULTY" || payload.role === "ADMIN") {
    queryResult = await db.select().from(interviews).orderBy(desc(interviews.createdAt)).limit(100);
  } else {
    queryResult = await db.select().from(interviews).where(eq(interviews.studentId, payload.userId)).orderBy(desc(interviews.createdAt));
  }

  return NextResponse.json({ interviews: queryResult });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can create interviews" }, { status: 403 });
  }

  const body = await req.json();
  const { type, category, difficulty, mode, totalQuestions } = body;

  if (!type || !category || !difficulty || !mode || !totalQuestions) {
    return NextResponse.json({ error: "Missing required fields: type, category, difficulty, mode, totalQuestions" }, { status: 400 });
  }

  const validTypes = ["HR", "TECHNICAL", "BEHAVIORAL", "MIXED"];
  const validCategories = ["GENERAL", "CS", "DATA_SCIENCE_AI", "SOFTWARE_DEV", "HR", "BEHAVIORAL", "CUSTOM"];
  const validDifficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const validModes = ["TEXT", "AUDIO", "VIDEO"];

  if (!validTypes.includes(type)) return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
  if (!validCategories.includes(category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if (!validDifficulties.includes(difficulty)) return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  if (!validModes.includes(mode)) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  const numQuestions = parseInt(totalQuestions);
  if (isNaN(numQuestions) || ![5, 10, 15].includes(numQuestions)) {
    return NextResponse.json({ error: "Total questions must be 5, 10, or 15" }, { status: 400 });
  }

  // Get questions from DB matching criteria with proper filtering
  const allQuestions = await db.select().from(questions);

  let filtered = allQuestions.filter(q => {
    const typeMatch = type === "MIXED" ? true : q.interviewType === type;

    let catMatch: boolean;
    if (category === "CUSTOM" || category === "GENERAL") {
      catMatch = true;
    } else {
      catMatch = q.category === category;
    }

    const diffMatch = q.difficulty === difficulty;
    return typeMatch && catMatch && diffMatch;
  });

  // Fallback 1: relax difficulty, keep type & category
  if (filtered.length < numQuestions) {
    filtered = allQuestions.filter(q => {
      const typeMatch = type === "MIXED" ? true : q.interviewType === type;
      const catMatch = category === "CUSTOM" || category === "GENERAL" ? true : q.category === category;
      return typeMatch && catMatch;
    });
  }

  // Fallback 2: just match type
  if (filtered.length < numQuestions) {
    filtered = allQuestions.filter(q => type === "MIXED" ? true : q.interviewType === type);
  }

  // Fallback 3: use all questions
  if (filtered.length < numQuestions) {
    filtered = allQuestions;
  }

  if (filtered.length === 0) {
    return NextResponse.json({ error: "No questions available. Please seed the database first." }, { status: 400 });
  }

  // Shuffle and take
  const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, numQuestions);

  const [interview] = await db.insert(interviews).values({
    studentId: payload.userId,
    type,
    category,
    difficulty,
    mode,
    totalQuestions: shuffled.length,
    status: "IN_PROGRESS",
  }).returning();

  // Insert interview questions (bulk for efficiency)
  const iqValues = shuffled.map((q, i) => ({
    interviewId: interview.id,
    questionId: q.id,
    sequence: i + 1,
  }));
  await db.insert(interviewQuestions).values(iqValues);

  return NextResponse.json({ interview, questions: shuffled });
}
