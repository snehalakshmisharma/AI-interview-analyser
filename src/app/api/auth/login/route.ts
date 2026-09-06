import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signJWT({ userId: user.id, email: user.email, role: user.role, name: user.name });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error && "cause" in error) {
      const cause = error.cause as { code?: string } | undefined;
      if (cause?.code === "ECONNREFUSED") {
        return NextResponse.json(
          { error: "Database unavailable. Start PostgreSQL and try again." },
          { status: 503 },
        );
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
