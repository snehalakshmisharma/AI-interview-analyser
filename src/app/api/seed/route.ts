import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions, users } from "@/db/schema";
import { SEED_QUESTIONS } from "@/lib/seed-questions";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Security: Only allow seeding in development mode or with the correct secret key
export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const seedSecret = process.env.SEED_SECRET;

  if (!isDev) {
    // In production, require a SEED_SECRET header
    const authHeader = req.headers.get("x-seed-secret");
    if (!seedSecret || authHeader !== seedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    let questionsSeeded = 0;
    // Seed questions if empty
    const existingQuestions = await db.select().from(questions).limit(1);
    if (existingQuestions.length === 0) {
      for (const q of SEED_QUESTIONS) {
        await db.insert(questions).values({
          questionText: q.questionText,
          category: q.category as "GENERAL" | "CS" | "DATA_SCIENCE_AI" | "SOFTWARE_DEV" | "HR" | "BEHAVIORAL",
          difficulty: q.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
          interviewType: q.interviewType as "HR" | "TECHNICAL" | "BEHAVIORAL" | "MIXED",
          expectedConcepts: [...q.expectedConcepts],
          evaluationGuidance: q.evaluationGuidance,
          timeLimit: q.timeLimit,
        });
        questionsSeeded++;
      }
    }

    let usersSeeded = 0;
    // Seed demo users
    const demoUsers = [
      { name: "Demo Student", email: "student@demo.com", password: "demo123", role: "STUDENT" as const, department: "CSE", year: "Final Year" },
      { name: "Demo Faculty", email: "faculty@demo.com", password: "demo123", role: "FACULTY" as const, department: "CSE", year: "" },
    ];

    for (const du of demoUsers) {
      const [existing] = await db.select().from(users).where(eq(users.email, du.email)).limit(1);
      if (!existing) {
        const hash = await hashPassword(du.password);
        await db.insert(users).values({
          name: du.name,
          email: du.email,
          passwordHash: hash,
          role: du.role,
          department: du.department,
          year: du.year,
        });
        usersSeeded++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded: ${questionsSeeded} questions, ${usersSeeded} demo users`,
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to seed the database" });
}
