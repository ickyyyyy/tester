import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "open";
  const db = adminClient();

  const query = db
    .from("tasks")
    .select("*")
    .eq("user_id", OPERATOR.userId)
    .order("priority_score", { ascending: false });

  if (status === "open") query.is("completed_at", null);
  else query.not("completed_at", "is", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = adminClient();

  const { data, error } = await db
    .from("tasks")
    .insert({ ...body, user_id: OPERATOR.userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
