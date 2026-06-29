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

function getWeekDays(): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEvents(d.events ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now.toISOString().slice(0, 10);
  const weekDays = getWeekDays();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEvents = events
    .filter(e => !e.allDay && e.start.slice(0, 10) === todayStr)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <Panel>
      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((d, i) => {
          const isToday = d.toISOString().slice(0, 10) === todayStr;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: isToday ? "var(--accent)" : "var(--ink-3)" }}
              >
                {DAY_LABELS[i]}
              </span>
              <span
                className="num w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "var(--ink-0)" : "var(--ink-3)",
                  border: isToday ? "none" : "1px solid transparent",
                }}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today timeline */}
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--ink-3)" }}>Today</p>
      {todayEvents.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>No events today.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {todayEvents.map(ev => {
            const evMin = new Date(ev.start).getHours() * 60 + new Date(ev.start).getMinutes();
            const isPast = evMin < nowMinutes;
            const isNext = !isPast && todayEvents.findIndex(e => new Date(e.start).getHours() * 60 + new Date(e.start).getMinutes() >= nowMinutes) === todayEvents.indexOf(ev);
            return (
              <div key={ev.id} className="flex items-start gap-2">
                <span
                  className="num text-[10px] shrink-0 w-10 pt-0.5"
                  style={{ color: isPast ? "var(--ink-3)" : "var(--ink-4)" }}
                >
                  {fmtTime(ev.start)}
                </span>
                {isNext && (
                  <span className="text-[9px] font-bold shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>▶</span>
                )}
                <p
                  className="text-xs flex-1 truncate"
                  style={{
                    color: isPast ? "var(--ink-3)" : "var(--ink-4)",
                    textDecoration: isPast ? "line-through" : "none",
                  }}
                >
                  {ev.title}
                </p>
              </div>
            );
          })}
          {/* NOW line */}
          <div className="flex items-center gap-2 mt-1">
            <span className="num text-[9px] font-bold" style={{ color: "var(--accent)" }}>NOW</span>
            <div className="flex-1 h-px" style={{ background: "var(--accent)", opacity: 0.4 }} />
            <span className="num text-[9px]" style={{ color: "var(--accent)" }}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}
