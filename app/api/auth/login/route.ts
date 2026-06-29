import { NextRequest, NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signSession();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
