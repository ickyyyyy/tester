import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "No query" }, { status: 400 });
  }

  const db = adminClient();

  // Fetch all open tasks for Claude to filter
  const { data: tasks } = await db
    .from("tasks")
    .select("id, title, urgency, tags, status, due_date, created_at")
    .eq("user_id", OPERATOR.userId)
    .neq("status", "done")
    .order("created_at", { ascending: false })
    .limit(200);

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a task search assistant. Given a list of tasks and a natural language query, return the IDs of matching tasks. Respond with JSON only: {"ids": ["id1", "id2"]}`,
    messages: [
      {
        role: "user",
        content: `Query: "${query}"\n\nTasks:\n${JSON.stringify(tasks, null, 2)}`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const { ids = [] } = JSON.parse(raw.replace(/```json?|```/g, "").trim());

  const filtered = (tasks ?? []).filter((t) => ids.includes(t.id));
  return NextResponse.json({ tasks: filtered, query });
}
