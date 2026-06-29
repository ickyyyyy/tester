import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import type { CalEvent } from "@/app/api/calendar/route";

const CACHE_DATE = "2000-01-04";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.CRON_SECRET && secret !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const events: CalEvent[] = body.events ?? [];

  const db = adminClient();
  const { error } = await db.from("daily_logs").upsert(
    {
      user_id: OPERATOR.userId,
      log_date: CACHE_DATE,
      notes: JSON.stringify({ events, synced_at: new Date().toISOString() }),
    },
    { onConflict: "user_id,log_date" }
  );

  if (error) {
    console.error("Calendar sync write failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: events.length, synced_at: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && secret !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("notes, updated_at")
    .eq("user_id", OPERATOR.userId)
    .eq("log_date", CACHE_DATE)
    .maybeSingle();

  if (!data?.notes) {
    return NextResponse.json({ status: "empty", events: [] });
  }

  try {
    const parsed = JSON.parse(data.notes as string);
    return NextResponse.json({ status: "ok", count: parsed.events?.length ?? 0, synced_at: parsed.synced_at });
  } catch {
    return NextResponse.json({ status: "parse_error" });
  }
}
