import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "No question" }, { status: 400 });
  }

  // 1. Embed the question
  const { default: OpenAI } = await import("openai");
  const oai = new OpenAI();
  const embRes = await oai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  const embedding = embRes.data[0].embedding;

  // 2. Retrieve relevant chunks
  const db = adminClient();
  const { data: chunks } = await db.rpc("match_memory_chunks", {
    query_embedding: embedding,
    match_count: 8,
    p_user_id: OPERATOR.userId,
  });

  const context = (chunks ?? [])
    .map((c: { text: string; source_type: string }) => `[${c.source_type}] ${c.text}`)
    .join("\n\n");

  // 3. Ask Claude with RAG context
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a personal AI assistant with access to the user's notes, captures, and memory. Answer concisely based on the provided context. If the context doesn't contain enough information, say so.`,
    messages: [
      {
        role: "user",
        content: `Context from memory:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer = msg.content[0].type === "text" ? msg.content[0].text : "";
  return NextResponse.json({ answer, chunks_used: chunks?.length ?? 0 });
}
