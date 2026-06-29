import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const db = adminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from("daily_logs")
    .select("log_date, notes")
    .eq("user_id", OPERATOR.userId)
    .gte("log_date", since.toISOString().slice(0, 10))
    .order("log_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => {
    const notes = r.notes ? JSON.parse(r.notes) : {};
    return { date: r.log_date, done: notes.habits?.done ?? [], total: notes.habits?.total ?? 6 };
  });

  return NextResponse.json(rows);
}
