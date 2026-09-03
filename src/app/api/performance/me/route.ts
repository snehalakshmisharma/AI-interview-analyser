import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { verifyJWT } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { calculatePlacementReadiness } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentInterviews = await db.select().from(interviews).where(eq(interviews.studentId, payload.userId)).orderBy(desc(interviews.createdAt));

  const completed = studentInterviews.filter(i => i.status === "ANALYZED" && i.overallScore !== null);

  const avg = (arr: (number | null | undefined)[]) => {
    const valid = arr.filter((n): n is number => typeof n === "number");
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };

  const overallAvg = avg(completed.map(i => i.overallScore));
  const techAvg = avg(completed.map(i => i.technicalScore));
  const commAvg = avg(completed.map(i => i.communicationScore));
  const fluencyAvg = avg(completed.map(i => i.fluencyScore));

  const readiness = calculatePlacementReadiness({ technical: techAvg, communication: commAvg, overall: overallAvg });

  // Trends - last 10
  const trends = completed.slice(0, 10).reverse().map(i => ({
    date: i.completedAt || i.createdAt,
    overall: i.overallScore,
    technical: i.technicalScore,
    communication: i.communicationScore,
    fluency: i.fluencyScore,
  }));

  // Category performance
  const categoryMap: Record<string, number[]> = {};
  completed.forEach(i => {
    if (!categoryMap[i.category]) categoryMap[i.category] = [];
    if (i.overallScore) categoryMap[i.category].push(i.overallScore);
  });

  const categoryPerformance = Object.entries(categoryMap).map(([cat, scores]) => ({
    category: cat,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length,
  }));

  return NextResponse.json({
    totalInterviews: studentInterviews.length,
    completedInterviews: completed.length,
    averageScores: {
      overall: overallAvg,
      technical: techAvg,
      communication: commAvg,
      fluency: fluencyAvg,
    },
    readiness,
    trends,
    categoryPerformance,
    recentInterviews: studentInterviews.slice(0, 5),
  });
}
