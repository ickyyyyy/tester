import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

function weekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") ?? weekStart(new Date());
  const db = adminClient();

  const { data } = await db
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", OPERATOR.userId)
    .eq("week_start", week)
    .maybeSingle();

  return NextResponse.json({ review: data ?? null, week });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const week = body.week_start ?? weekStart(new Date());
  const db = adminClient();

  const fields = ["wins", "open_loops", "content_shipped", "next_week_top3", "what_slipped", "people_to_follow", "health_pattern", "sealed"];
  const update: Record<string, unknown> = { week_start: week, user_id: OPERATOR.userId, updated_at: new Date().toISOString() };
  for (const f of fields) {
    if (f in body) update[f] = body[f];
  }

  const { data, error } = await db
    .from("weekly_reviews")
    .upsert(update, { onConflict: "user_id,week_start" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
