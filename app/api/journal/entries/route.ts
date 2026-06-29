import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function GET() {
  const db = adminClient();
  const { data, error } = await db
    .from("raw_captures")
    .select("id, raw_text, classification, created_at")
    .eq("user_id", OPERATOR.userId)
    .in("routed_to", ["journal", "note", "decision"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}
