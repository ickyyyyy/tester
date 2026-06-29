import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { meals } = await req.json();
  const db = adminClient();

  const { data: existing } = await db
    .from("daily_logs")
    .select("notes")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", date)
    .maybeSingle();

  const notes = existing?.notes ? JSON.parse(existing.notes) : {};
  notes.nutrition = { meals };

  const { error } = await db.from("daily_logs").upsert({
    user_id: OPERATOR.userId,
    log_date: date,
    notes: JSON.stringify(notes),
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
