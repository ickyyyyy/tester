"use client";

import { useEffect, useState, useCallback } from "react";
import { Panel } from "./Panel";

const DEFAULT_HABITS = [
  { name: "Exercise",   category: "Body" },
  { name: "Read",       category: "Mind" },
  { name: "Journal",    category: "Mind" },
  { name: "Meditate",   category: "Mind" },
  { name: "No alcohol", category: "Body" },
  { name: "Sleep 7h+",  category: "Body" },
];

function localDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function useResetCountdown() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function HabitTrackerCard() {
  const today = localDateKey();
  const [done, setDone] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const resetIn = useResetCountdown();

  useEffect(() => {
    const cached = localStorage.getItem(`os-habits-${today}`);
    if (cached) setDone(JSON.parse(cached));
    fetch(`/api/habits?days=1`)
      .then(r => r.json())
      .then((data) => {
        const todayRow = data.find((r: { date: string }) => r.date === today);
        if (todayRow?.done) {
          setDone(todayRow.done);
          localStorage.setItem(`os-habits-${today}`, JSON.stringify(todayRow.done));
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
        body: JSON.stringify({ done: next, total: DEFAULT_HABITS.length }),
      });
    } catch (e) { console.error("Habit sync failed", e); }
    finally { setSyncing(false); }
  }, [done, today]);

  const pct = DEFAULT_HABITS.length > 0 ? Math.round((done.length / DEFAULT_HABITS.length) * 100) : 0;
  const score = done.length * Math.floor(100 / DEFAULT_HABITS.length);

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">Daily Score · Resets {resetIn}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="num text-2xl font-bold text-[var(--ink-4)]">{score}</span>
            <span className="text-xs text-[var(--ink-3)]">{done.length}/{DEFAULT_HABITS.length} · {pct}%{syncing ? " ·" : ""}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
          background: `conic-gradient(var(--ok) ${pct}%, var(--ink-2) 0)`,
        }}>
          <span className="num text-[10px] font-bold text-[var(--ink-4)]">{pct}%</span>
        </div>
      </div>

      <div className="h-1 rounded-full bg-[var(--ink-2)] mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--ok)] transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-col gap-2">
        {DEFAULT_HABITS.map(h => {
          const checked = done.includes(h.name);
          return (
            <button key={h.name} onClick={() => toggle(h.name)} className="flex items-center gap-3 text-left group">
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? "border-[var(--ok)] bg-[var(--ok)]" : "border-[var(--ink-2)] group-hover:border-[var(--ink-3)]"}`}>
                {checked && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="var(--ink-0)" strokeWidth={2}>
                    <polyline points="1.5,5 4,8 8.5,2" />
                  </svg>
                )}
              </span>
              <span className="text-xs flex-1" style={{ color: checked ? "var(--ink-3)" : "var(--ink-4)", textDecoration: checked ? "line-through" : "none" }}>
                {h.name}
              </span>
              <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{h.category}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
