"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { OPERATOR } from "@/lib/config/operator";

export function OperatorCard() {
  const [time, setTime] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: OPERATOR.timezone }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/habits?days=60")
      .then(r => r.ok ? r.json() : [])
      .then((rows: { date: string; done: string[] }[]) => {
        const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
        let s = 0;
        for (const row of sorted) {
          if (row.done?.length > 0) s++; else break;
        }
        setStreak(s);
      }).catch(() => {});
  }, []);

  return (
    <Panel accent>
      {/* Avatar + status */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src="/avatar.jpg"
            alt={OPERATOR.name}
            className="w-12 h-12 rounded-full object-cover border-2"
            style={{ borderColor: "var(--accent)" }}
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              const fallback = el.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="w-12 h-12 rounded-full items-center justify-center text-lg font-bold border-2 hidden"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--ink-1)" }}
          >
            {OPERATOR.name[0]}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ok)" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ok)" }}>Online</span>
          </div>
          <p className="text-base font-bold" style={{ color: "var(--ink-4)" }}>{OPERATOR.name}</p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            {OPERATOR.role} · {OPERATOR.location}
          </p>
        </div>
      </div>

      {/* Focus */}
      <p
        className="text-xs italic"
        style={{ color: "var(--ink-3)", borderLeft: "2px solid var(--accent)", paddingLeft: "8px" }}
      >
        {OPERATOR.focus}
      </p>

      {/* Time + streak */}
      <div className="flex items-end justify-between">
        <div>
          <p className="num text-2xl font-bold" style={{ color: "var(--ink-4)" }}>{time}</p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{OPERATOR.timezone}</p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-bold" style={{ color: "var(--accent)" }}>{streak}</p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>Day Streak</p>
        </div>
      </div>
    </Panel>
  );
}
