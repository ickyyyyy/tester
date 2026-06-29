"use client";

import { useEffect, useState, useCallback } from "react";
import { Panel } from "./Panel";

const HABITS = [
  { name: "Gym",               category: "FITNESS",  sub: "",          target: null },
  { name: "Supplements",       category: "HEALTH",   sub: "",          target: 3 },
  { name: "Creative session",  category: "OUTPUT",   sub: "",          target: 7 },
  { name: "Community session", category: "OPS",      sub: "",          target: 4 },
  { name: "Finance check",     category: "OPS",      sub: "20-30 MIN", target: 5 },
  { name: "Wind-down session", category: "EVENING",  sub: "",          target: 4 },
];

function localDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function HabitTrackerCard() {
  const today = localDateKey();
  const [done, setDone] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(`os-habits-${today}`);
    if (cached) setDone(JSON.parse(cached));
    fetch("/api/habits?days=1")
      .then(r => r.json())
      .then((data) => {
        const row = data.find((r: { date: string }) => r.date === today);
        if (row?.done) {
          setDone(row.done);
          localStorage.setItem(`os-habits-${today}`, JSON.stringify(row.done));
        }
      }).catch(() => {});
  }, [today]);

  const toggle = useCallback(async (habit: string) => {
    const next = done.includes(habit) ? done.filter(h => h !== habit) : [...done, habit];
    setDone(next);
    localStorage.setItem(`os-habits-${today}`, JSON.stringify(next));
    setSyncing(true);
    try {
      await fetch(`/api/habits/${today}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: next, total: HABITS.length }),
      });
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, [done, today]);

  const doneCount = done.length;
  const total = HABITS.length;

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>Daily Habits</p>
        <span className="num text-[10px] font-semibold" style={{ color: "var(--ink-3)" }}>
          {doneCount}/{total}{syncing ? " ·" : ""}
        </span>
      </div>

      {/* 3×2 grid */}
      <div className="grid grid-cols-3 gap-2">
        {HABITS.map(h => {
          const checked = done.includes(h.name);
          return (
            <button
              key={h.name}
              onClick={() => toggle(h.name)}
              className="flex flex-col gap-1 p-2 rounded text-left transition-all"
              style={{
                background: checked ? "color-mix(in oklch, var(--ok) 12%, var(--ink-1))" : "var(--ink-1)",
                border: `1px solid ${checked ? "color-mix(in oklch, var(--ok) 40%, transparent)" : "var(--ink-2)"}`,
              }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-widest leading-none"
                style={{ color: checked ? "var(--ok)" : "var(--accent)" }}
              >
                {h.category}{h.sub ? ` · ${h.sub}` : ""}
              </span>
              <span
                className="text-[11px] font-medium leading-tight"
                style={{
                  color: checked ? "var(--ink-3)" : "var(--ink-4)",
                  textDecoration: checked ? "line-through" : "none",
                }}
              >
                {h.name}
              </span>
              {h.target && (
                <span className="num text-[9px]" style={{ color: "var(--ink-3)" }}>
                  {checked ? h.target : 0}/{h.target}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
