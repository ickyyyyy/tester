import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { classifyCapture } from "@/lib/router/classifyCapture";
import { OPERATOR } from "@/lib/config/operator";

export async function POST(req: NextRequest) {
  const { text, source = "web" } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const db = adminClient();
  const userId = OPERATOR.userId;

  // 1. Classify
  const classification = await classifyCapture(text);

  // 2. Write raw capture
  const { data: capture, error: captureErr } = await db
    .from("raw_captures")
    .insert({
      user_id: userId,
      source,
      raw_text: text,
      classification,
      llm_source: "anthropic",
      routed_to: classification.kind,
    })
    .select()
    .single();

  if (captureErr) {
    console.error("Capture insert failed", captureErr);
    return NextResponse.json({ error: captureErr.message }, { status: 500 });
  }

  // 3. Route to downstream table
  let routedId: string | null = null;
  if (classification.kind === "task") {
    const { data: task } = await db
      .from("tasks")
      .insert({
        user_id: userId,
        title: classification.summary,
        urgency: classification.urgency,
        tags: classification.tags,
        priority_score: classification.urgency === "today" ? 100 : 50,
      })
      .select("id")
      .single();
    routedId = task?.id ?? null;
  }

  // 4. Update capture with routed_id
  if (routedId) {
    await db
      .from("raw_captures")
      .update({ routed_id: routedId })
      .eq("id", capture.id);
  }

  // 5. Embed and write to memory_chunks (non-blocking)
  embedAndStore(text, "capture", capture.id, userId).catch(console.error);

  // 6. Audit log
  await db.from("audit_log").insert({
    user_id: userId,
    action: "capture",
    resource_type: classification.kind,
    resource_id: routedId ?? capture.id,
    metadata: { source, classification },
  });

  return NextResponse.json({
    ok: true,
    capture_id: capture.id,
    routed_to: classification.kind,
    routed_id: routedId,
    summary: classification.summary,
  });
}

async function embedAndStore(
  text: string,
  sourceType: string,
  sourceId: string,
  userId: string
) {
  try {
    const { default: OpenAI } = await import("openai");
    const oai = new OpenAI();
    const res = await oai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const embedding = res.data[0].embedding;
    const db = adminClient();
    await db.from("memory_chunks").insert({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      text,
      embedding,
    });
  } catch (e) {
    console.error("Embed failed", e);
  }
}
