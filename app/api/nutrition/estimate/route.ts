import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Estimate the macros for this food/meal. Respond with JSON only, no markdown.
Food: "${text}"
Output format: {"kcal": number, "p": number, "c": number, "f": number}
All values are per serving described. p=protein grams, c=carbs grams, f=fat grams.`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  try {
    const json = JSON.parse(raw.replace(/```json?|```/g, "").trim());
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ kcal: 0, p: 0, c: 0, f: 0 });
  }
}
