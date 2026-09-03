import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, year: user.year } });
}
