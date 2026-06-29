import Anthropic from "@anthropic-ai/sdk";

export interface Classification {
  kind: "task" | "note" | "journal" | "decision" | "capture";
  urgency: "today" | "week" | "month" | "someday";
  summary: string;
  tags: string[];
  entity_name?: string;
}

const SYSTEM = `You are a personal assistant classifier. Given a raw capture (voice note or text), classify it.
Respond with JSON only — no markdown, no explanation.

Output format:
{
  "kind": "task" | "note" | "journal" | "decision" | "capture",
  "urgency": "today" | "week" | "month" | "someday",
  "summary": "short cleaned-up summary",
  "tags": ["tag1", "tag2"],
  "entity_name": "person or company name if mentioned, else omit"
}

Rules:
- kind=task if it's something to DO
- kind=journal if it's a personal reflection or feeling
- kind=decision if it's a choice being made or considered
- kind=note for everything else
- urgency=today only if explicitly urgent or time-critical today
- tags should be 1-3 lowercase strings`;

export async function classifyCapture(text: string): Promise<Classification> {
  // Try Anthropic first
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    return JSON.parse(raw.replace(/```json?|```/g, "").trim()) as Classification;
  } catch (anthropicErr) {
    console.error("Anthropic classify failed, trying OpenAI", anthropicErr);
  }

  // Fallback: OpenAI
  try {
    const { default: OpenAI } = await import("openai");
    const oai = new OpenAI();
    const res = await oai.chat.completions.create({
      model: process.env.OPENAI_CLASSIFIER_MODEL ?? "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: text },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "";
    return JSON.parse(raw.replace(/```json?|```/g, "").trim()) as Classification;
  } catch (oaiErr) {
    console.error("OpenAI classify failed, using regex fallback", oaiErr);
  }

  // Last resort: regex
  const isTask = /\b(do|fix|build|call|send|finish|complete|create|make|update|check)\b/i.test(text);
  const isUrgent = /\b(today|urgent|asap|now|immediately)\b/i.test(text);
  return {
    kind: isTask ? "task" : "capture",
    urgency: isUrgent ? "today" : "someday",
    summary: text.slice(0, 120),
    tags: [],
  };
}
