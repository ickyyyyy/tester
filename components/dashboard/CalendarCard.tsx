"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
}

const TAG_COLORS = [
  "var(--accent)", "var(--ok)", "var(--warn)", "var(--danger)", "var(--ink-3)",
];

function tagColor(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return TAG_COLORS[h % TAG_COLORS.length];
}

function fmtTime(iso: string, allDay: boolean) {
  if (allDay) return "All day";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
}

export function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by day
  const byDay: Record<string, CalEvent[]> = {};
  for (const ev of events) {
    const key = ev.start.slice(0, 10);
    byDay[key] = byDay[key] ?? [];
    byDay[key].push(ev);
  }
  const days = Object.keys(byDay).sort().slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Panel>
      <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-3">Calendar — Next 7 Days</p>

      {loading ? (
        <p className="text-xs text-[var(--ink-3)]">Loading…</p>
      ) : days.length === 0 ? (
        <p className="text-xs text-[var(--ink-3)]">
          {process.env.NEXT_PUBLIC_APP_URL ? "No upcoming events." : "Set GOOGLE_CALENDAR_ICAL_URL to connect your calendar."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map(day => (
            <div key={day}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${day === today ? "text-[var(--accent)]" : "text-[var(--ink-3)]"}`}>
                {day === today ? "Today · " : ""}{dayLabel(byDay[day][0].start)}
              </p>
              <div className="flex flex-col gap-1.5 pl-2 border-l-2" style={{ borderColor: day === today ? "var(--accent)" : "var(--ink-2)" }}>
                {byDay[day].map(ev => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <span className="num text-[10px] text-[var(--ink-3)] w-16 shrink-0 pt-0.5">
                      {fmtTime(ev.start, ev.allDay)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--ink-4)] truncate">{ev.title}</p>
                      {ev.location && (
                        <p className="text-[10px] text-[var(--ink-3)] truncate">{ev.location}</p>
                      )}
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: tagColor(ev.title) }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
