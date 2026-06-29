import { NextResponse } from "next/server";

export async function GET() {
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();

  if (!icalUrl) {
    return NextResponse.json({ error: "GOOGLE_CALENDAR_ICAL_URL is not set" });
  }

  try {
    const res = await fetch(icalUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({
        error: `Fetch failed: ${res.status} ${res.statusText}`,
        url_prefix: icalUrl.slice(0, 60),
      });
    }
    const text = await res.text();
    return NextResponse.json({
      ok: true,
      url_prefix: icalUrl.slice(0, 60),
      bytes: text.length,
      has_events: text.includes("BEGIN:VEVENT"),
      event_count: (text.match(/BEGIN:VEVENT/g) ?? []).length,
      preview: text.slice(0, 400),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), url_prefix: icalUrl.slice(0, 60) });
  }
}
