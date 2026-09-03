import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, interviews } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.role !== "FACULTY" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allStudents = await db.select().from(users).where(eq(users.role, "STUDENT")).orderBy(desc(users.createdAt));
  const allInterviews = await db.select().from(interviews);

  const studentsWithStats = allStudents.map(student => {
    const studentInterviews = allInterviews.filter(i => i.studentId === student.id);
    const completed = studentInterviews.filter(i => i.overallScore !== null);
    const avgScore = completed.length ? Math.round(completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length) : 0;
    const techAvg = completed.length ? Math.round(completed.reduce((sum, i) => sum + (i.technicalScore || 0), 0) / completed.length) : 0;
    const commAvg = completed.length ? Math.round(completed.reduce((sum, i) => sum + (i.communicationScore || 0), 0) / completed.length) : 0;
    const lastInterview = studentInterviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year,
      totalInterviews: studentInterviews.length,
      completedInterviews: completed.length,
      avgScore,
      techAvg,
      commAvg,
      lastInterviewDate: lastInterview?.createdAt || null,
      placementReadiness: lastInterview?.placementReadiness || 0,
    };
  });

  const totalInterviews = allInterviews.length;
  const avgOverall = allInterviews.filter(i => i.overallScore).length ? Math.round(allInterviews.filter(i => i.overallScore).reduce((sum, i) => sum + (i.overallScore || 0), 0) / allInterviews.filter(i => i.overallScore).length) : 0;

  return NextResponse.json({
    students: studentsWithStats,
    stats: {
      totalStudents: allStudents.length,
      totalInterviews,
      avgOverall,
    }
  });
}
