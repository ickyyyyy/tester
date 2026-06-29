import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = adminClient();

  const allowed = ["name", "type", "status", "tags", "notes", "last_contact"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from("entities")
    .update(update)
    .eq("id", id)
    .eq("user_id", OPERATOR.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = adminClient();

  const { error } = await db
    .from("entities")
    .delete()
    .eq("id", id)
    .eq("user_id", OPERATOR.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
