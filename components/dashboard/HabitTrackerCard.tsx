"use client";

import { useEffect, useState, useCallback } from "react";
import { Panel } from "./Panel";

const DEFAULT_HABITS = [
  "Exercise",
  "Read",
  "Journal",
  "Meditate",
  "No alcohol",
  "Sleep 7h+",
];

function localDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storageKey(date: string) {
  return `os-habits-${date}`;
}

export function HabitTrackerCard() {
  const today = localDateKey();
  const [done, setDone] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Load from localStorage on mount, then hydrate from server
  useEffect(() => {
    const cached = localStorage.getItem(storageKey(today));
    if (cached) setDone(JSON.parse(cached));

    fetch(`/api/habits?days=1`)
      .then((r) => r.json())
      .then((data) => {
        const todayRow = data.find((r: { date: string }) => r.date === today);
        if (todayRow?.done) {
          setDone(todayRow.done);
          localStorage.setItem(storageKey(today), JSON.stringify(todayRow.done));
        }
      })
      .catch(() => {});
  }, [today]);

  const toggle = useCallback(
    async (habit: string) => {
      const next = done.includes(habit)
        ? done.filter((h) => h !== habit)
        : [...done, habit];

      setDone(next);
      localStorage.setItem(storageKey(today), JSON.stringify(next));

      setSyncing(true);
      try {
        await fetch(`/api/habits/${today}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ done: next, total: DEFAULT_HABITS.length }),
        });
      } catch (e) {
        console.error("Habit sync failed", e);
      } finally {
        setSyncing(false);
      }
    },
    [done, today]
  );

  return (
    <Panel title={`Habits${syncing ? " ·" : ""}`}>
      <div className="flex flex-col gap-2">
        {DEFAULT_HABITS.map((h) => {
          const checked = done.includes(h);
          return (
            <button
              key={h}
              onClick={() => toggle(h)}
              className="flex items-center gap-3 text-left"
            >
              <span
                className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                style={{
                  borderColor: checked ? "var(--ok)" : "var(--ink-2)",
                  background: checked ? "var(--ok)" : "transparent",
                }}
              >
                {checked && (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="var(--ink-0)"
                    strokeWidth={2}
                  >
                    <polyline points="1.5,5 4,8 8.5,2" />
                  </svg>
                )}
              </span>
              <span
                className="text-xs"
                style={{ color: checked ? "var(--ink-3)" : "var(--ink-4)" }}
              >
                {h}
              </span>
            </button>
          );
        })}
      </div>
      <p className="num text-[10px]" style={{ color: "var(--ink-3)" }}>
        {done.length}/{DEFAULT_HABITS.length} today
      </p>
    </Panel>
  );
}
