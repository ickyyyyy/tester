import { NextResponse } from "next/server";

export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
}

export async function GET() {
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!icalUrl) return NextResponse.json({ events: [] });

  try {
    const res = await fetch(icalUrl, { next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json({ events: [] });
    const text = await res.text();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ICAL = require("ical.js") as {
      parse: (s: string) => unknown;
      Component: new (p: unknown) => {
        getAllSubcomponents: (name: string) => unknown[];
      };
      Event: new (c: unknown) => {
        uid: string;
        summary: string;
        location: string;
        description: string;
        startDate: { toJSDate: () => Date; isDate: boolean } | null;
        endDate: { toJSDate: () => Date } | null;
      };
    };

    const comp = new ICAL.Component(ICAL.parse(text));
    const vevents = comp.getAllSubcomponents("vevent");

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const raw: CalEvent[] = [];
    for (const v of vevents) {
      const ev = new ICAL.Event(v);
      const start = ev.startDate?.toJSDate();
      const end = ev.endDate?.toJSDate();
      if (!start) continue;
      const s = start;
      if (s < now || s > weekEnd) continue;
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
    const events = raw.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 20);

    return NextResponse.json({ events });
  } catch (e) {
    console.error("Calendar fetch failed", e);
    return NextResponse.json({ events: [] });
  }
}
