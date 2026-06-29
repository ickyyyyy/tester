import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

const SENTINEL = "2000-01-01";

export async function GET() {
  const db = adminClient();
  const { data, error } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", SENTINEL)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const notes = data?.notes ? JSON.parse(data.notes) : {};
  return NextResponse.json({
    week: notes.goals_week_items ?? [],
    month: notes.goals_month_items ?? [],
  });
}

export async function POST(req: NextRequest) {
  const { scope, items } = await req.json();
  const db = adminClient();

  const { data: existing } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", SENTINEL)
    .maybeSingle();

  const notes = existing?.notes ? JSON.parse(existing.notes) : {};
  if (scope === "week") notes.goals_week_items = items;
  else notes.goals_month_items = items;

  const { error } = await db.from("daily_logs").upsert({
    user_id: OPERATOR.userId,
    log_date: SENTINEL,
    notes: JSON.stringify(notes),
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
