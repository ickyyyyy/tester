import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Allow cron/API callers with secret header, or authenticated browser sessions
  const incomingSecret =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.headers.get("x-api-secret");
  const authed = await getSession();
  if (!authed && incomingSecret !== process.env.CRON_SECRET && incomingSecret !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await req.json();
  const today = new Date().toISOString().split("T")[0];
  const db = adminClient();

  const existing = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", today)
    .maybeSingle();

  const currentNotes = existing.data?.notes ? JSON.parse(existing.data.notes as string) : {};
  const merged = { ...currentNotes, finance_snapshot: snapshot };

  const { error } = await db.from("daily_logs").upsert(
    { user_id: OPERATOR.userId, log_date: today, notes: JSON.stringify(merged) },
    { onConflict: "user_id,log_date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, date: today });
}
