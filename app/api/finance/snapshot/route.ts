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
  const sheetId = process.env.GOOGLE_SHEETS_FINANCE_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:Z200",
  });
  const rows = res.data.values ?? [];
  return rows.map((r) => r.join("\t")).join("\n");
}

export async function GET(req: NextRequest) {
  // Auth: cron secret or API secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const apiSecret = process.env.API_SECRET;
  const incomingSecret = authHeader?.replace("Bearer ", "") ?? req.headers.get("x-api-secret");

  if (incomingSecret !== cronSecret && incomingSecret !== apiSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawData = await getSheetData();

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a financial analyst assistant. Given raw Google Sheets finance data, extract a concise snapshot. Respond with JSON only:
{
  "net_worth": number,
  "monthly_income": number,
  "monthly_expenses": number,
  "savings_rate": number,
  "top_expense_categories": [{"name": string, "amount": number}],
  "summary": "2-3 sentence narrative",
  "alerts": ["any important observations"]
}`,
      messages: [
        {
          role: "user",
          content: `Finance sheet data:\n${rawData.slice(0, 8000)}`,
        },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const snapshot = JSON.parse(raw.replace(/```json?|```/g, "").trim());

    const db = adminClient();
    const today = new Date().toISOString().split("T")[0];

    await db.from("daily_logs").upsert(
      {
        user_id: OPERATOR.userId,
        log_date: today,
        notes: { finance_snapshot: snapshot },
      },
      { onConflict: "user_id,log_date", ignoreDuplicates: false }
    );

    await db.from("audit_log").insert({
      user_id: OPERATOR.userId,
      action: "finance_snapshot",
      resource_type: "daily_log",
      resource_id: today,
      metadata: { snapshot },
    });

    return NextResponse.json({ ok: true, date: today, snapshot });
  } catch (e) {
    console.error("Finance snapshot failed", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
