import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function GET() {
  const db = adminClient();
  const { data, error } = await db
    .from("entities")
    .select("*")
    .eq("user_id", OPERATOR.userId)
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entities: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = adminClient();
  const { data, error } = await db
    .from("entities")
    .insert({
      user_id: OPERATOR.userId,
      name: body.name,
      kind: body.type ?? "person",
      type: body.type ?? "person",
      status: body.status ?? "lead",
      tags: body.tags ?? [],
      priority: body.priority ?? "p5",
      temperature: body.temperature ?? "warm",
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
