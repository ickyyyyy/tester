import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";

async function getSheetData(): Promise<string> {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_FINANCE_ID!,
    range: "A1:Z200",
  });
  return (res.data.values ?? []).map(r => r.join("\t")).join("\n");
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const incomingSecret = authHeader?.replace("Bearer ", "") ?? req.headers.get("x-api-secret");
  if (incomingSecret !== process.env.CRON_SECRET && incomingSecret !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawData = await getSheetData();
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `You are a financial analyst. Given raw Google Sheets data, extract a full financial snapshot. Respond with JSON only:
{
  "net_worth": number,
  "liquid": number,
  "invested": number,
  "liabilities": number,
  "monthly_income": number,
  "monthly_expenses": number,
  "savings_rate": number,
  "runway_months": number,
  "accounts": {
    "checking": number, "savings": number, "hysa": number,
    "equities": number, "index": number, "crypto": number, "private": number, "stables": number,
    "cc_float": number, "car_lease": number, "loc": number, "tax_accrual": number
  },
  "top_expense_categories": [{"name": string, "amount": number}],
  "summary": "2-3 sentence narrative",
  "alerts": ["observations"]
}`,
      messages: [{ role: "user", content: `Finance data:\n${rawData.slice(0, 8000)}` }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const snapshot = JSON.parse(raw.replace(/```json?|```/g, "").trim());
    const today = new Date().toISOString().split("T")[0];
    const db = adminClient();

    const existing = await db
      .from("daily_logs")
      .select("notes")
      .eq("user_id", OPERATOR.userId)
      .eq("log_date", today)
      .maybeSingle();

    const currentNotes = existing.data?.notes ? JSON.parse(existing.data.notes as string) : {};
    const merged = { ...currentNotes, finance_snapshot: snapshot };

    await db.from("daily_logs").upsert(
      { user_id: OPERATOR.userId, log_date: today, notes: JSON.stringify(merged) },
      { onConflict: "user_id,log_date" }
    );

    return NextResponse.json({ ok: true, date: today, snapshot });
  } catch (e) {
    console.error("Finance snapshot failed", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
