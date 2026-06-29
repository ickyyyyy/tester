import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google-calendar";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
}

const CACHE_DATE = "2000-01-04";

function dateWindow() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(todayStart.getDate() + 7);
  return { todayStart, weekEnd };
}

async function fetchFromCache(): Promise<CalEvent[] | null> {
  try {
    const db = adminClient();
    const { data } = await db
      .from("daily_logs")
      .select("notes")
      .eq("user_id", OPERATOR.userId)
      .eq("log_date", CACHE_DATE)
      .maybeSingle();
    if (!data?.notes) return null;
    const parsed = JSON.parse(data.notes as string);
    const events: CalEvent[] = parsed.events ?? [];
    // Filter to current week window
    const { todayStart, weekEnd } = dateWindow();
    return events
      .filter((ev) => {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        return end >= todayStart && start <= weekEnd;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  } catch {
    return null;
  }
}

async function fetchViaGoogleAPI(token: string): Promise<CalEvent[]> {
  const { todayStart, weekEnd } = dateWindow();
  const params = new URLSearchParams({
    timeMin: todayStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "25",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.items ?? []).map((ev: any) => ({
    id: ev.id,
    title: ev.summary ?? "(No title)",
    start: ev.start.dateTime ?? ev.start.date,
    end: ev.end.dateTime ?? ev.end.date,
    allDay: !ev.start.dateTime,
    location: ev.location ?? undefined,
    description: ev.description ?? undefined,
  }));
}

async function fetchViaIcal(icalUrl: string): Promise<CalEvent[]> {
  const res = await fetch(icalUrl, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const text = await res.text();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ICAL = require("ical.js") as {
    parse: (s: string) => unknown;
    Component: new (p: unknown) => { getAllSubcomponents: (n: string) => unknown[] };
    Event: new (c: unknown) => {
      uid: string; summary: string; location: string; description: string;
      startDate: { toJSDate: () => Date; isDate: boolean } | null;
      endDate: { toJSDate: () => Date } | null;
    };
  };

  const { todayStart, weekEnd } = dateWindow();
  const comp = new ICAL.Component(ICAL.parse(text));
  const raw: CalEvent[] = [];

  for (const v of comp.getAllSubcomponents("vevent")) {
    const ev = new ICAL.Event(v);
    const start = ev.startDate?.toJSDate();
    const end = ev.endDate?.toJSDate();
    if (!start) continue;
    const eventEnd = end ?? start;
    if (eventEnd < todayStart || start > weekEnd) continue;
    raw.push({
      id: ev.uid ?? String(Math.random()),
      title: ev.summary ?? "(No title)",
      start: start.toISOString(),
      end: end?.toISOString() ?? start.toISOString(),
      allDay: ev.startDate?.isDate ?? false,
      location: ev.location ?? undefined,
      description: ev.description ?? undefined,
    });
  }

  return raw.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 20);
}

export async function GET() {
  try {
    // 1. Try MCP-synced cache in Supabase
    const cached = await fetchFromCache();
    if (cached !== null) {
      return NextResponse.json({ events: cached, source: "cache" });
    }

    // 2. Try Google OAuth
    const token = await getValidAccessToken();
    if (token) {
      const events = await fetchViaGoogleAPI(token);
      return NextResponse.json({ events, source: "google" });
    }

    // 3. Fall back to iCal
    const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();
    if (icalUrl) {
      const events = await fetchViaIcal(icalUrl);
      return NextResponse.json({ events, source: "ical" });
    }

    return NextResponse.json({ events: [] });
  } catch (e) {
    console.error("Calendar fetch failed:", e);
    return NextResponse.json({ events: [] });
  }
}
