import { NextRequest, NextResponse } from "next/server";

const URGENCY_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "🔴 Today", callback_data: "urgency:today" },
      { text: "📅 This Week", callback_data: "urgency:week" },
    ],
    [
      { text: "🗓 This Month", callback_data: "urgency:month" },
      { text: "📦 Someday", callback_data: "urgency:someday" },
    ],
    [{ text: "⭐ Key", callback_data: "urgency:key" }],
  ],
};

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Handle callback queries (urgency override buttons)
  if (body.callback_query) {
    const { data, message } = body.callback_query;
    if (data?.startsWith("urgency:")) {
      const urgency = data.replace("urgency:", "");
      const token = process.env.TELEGRAM_BOT_TOKEN!;
      // Acknowledge callback
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: `Urgency set to: ${urgency}`,
        }),
      });
      // TODO: update the task in DB using routed_id stored in message metadata
    }
    return NextResponse.json({ ok: true });
  }

  const msg = body.message;
  if (!msg) return NextResponse.json({ ok: true });

  // Verify sender
  const allowedUserId = Number(process.env.TELEGRAM_USER_ID);
  if (allowedUserId && msg.from?.id !== allowedUserId) {
    return NextResponse.json({ ok: true }); // silently ignore
  }

  let text: string | null = null;

  // Voice note → transcribe via Whisper
  if (msg.voice) {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN!;
      const fileRes = await fetch(
        `https://api.telegram.org/bot${token}/getFile?file_id=${msg.voice.file_id}`
      );
      const fileData = await fileRes.json();
      const filePath = fileData.result.file_path;
      const audioUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
      const audioRes = await fetch(audioUrl);
      const audioBlob = await audioRes.blob();

      const { default: OpenAI } = await import("openai");
      const oai = new OpenAI();
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.ogg");
      formData.append("model", "whisper-1");
      const transcription = await oai.audio.transcriptions.create({
        file: new File([audioBlob], "audio.ogg", { type: "audio/ogg" }),
        model: "whisper-1",
      });
      text = transcription.text;
    } catch (e) {
      console.error("Whisper transcription failed", e);
      await sendTelegramMessage(msg.chat.id, "❌ Failed to transcribe voice note.");
      return NextResponse.json({ ok: true });
    }
  } else if (msg.text) {
    text = msg.text;
  }

  if (!text) return NextResponse.json({ ok: true });

  // Run through the capture pipeline
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const captureRes = await fetch(`${baseUrl}/api/capture`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-secret": process.env.API_SECRET ?? "",
    },
    body: JSON.stringify({ text, source: "telegram" }),
  });
  const captured = await captureRes.json();

  // Reply with confirmation + urgency override keyboard
  const emoji =
    captured.routed_to === "task" ? "✅" : captured.routed_to === "journal" ? "📓" : "📥";
  await sendTelegramMessage(
    msg.chat.id,
    `${emoji} Captured as ${captured.routed_to}:\n"${captured.summary}"`,
    URGENCY_KEYBOARD
  );

  return NextResponse.json({ ok: true });
}
