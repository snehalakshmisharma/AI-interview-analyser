import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, interviews } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.role !== "FACULTY" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [student] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const studentInterviews = await db.select().from(interviews).where(eq(interviews.studentId, id)).orderBy(desc(interviews.createdAt));

  return NextResponse.json({ student, interviews: studentInterviews });
}
