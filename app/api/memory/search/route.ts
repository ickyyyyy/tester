import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export async function POST(req: NextRequest) {
  const { query, limit = 10 } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "No query" }, { status: 400 });
  }

  const { default: OpenAI } = await import("openai");
  const oai = new OpenAI();

  const embRes = await oai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const embedding = embRes.data[0].embedding;

  const db = adminClient();
  const { data, error } = await db.rpc("match_memory_chunks", {
    query_embedding: embedding,
    match_count: limit,
    p_user_id: OPERATOR.userId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
