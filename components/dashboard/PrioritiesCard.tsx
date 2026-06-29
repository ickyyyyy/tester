"use client";

import { useState } from "react";
import { Panel } from "./Panel";

interface GoalItem {
  id: string;
  text: string;
  done: boolean;
}

export function PrioritiesCard({
  weekItems = [],
  monthItems = [],
}: {
  weekItems?: GoalItem[];
  monthItems?: GoalItem[];
}) {
  const [wk, setWk] = useState(weekItems);
  const [mo, setMo] = useState(monthItems);
  const [wkInput, setWkInput] = useState("");
  const [moInput, setMoInput] = useState("");

  async function addGoal(scope: "week" | "month", text: string) {
    if (!text.trim()) return;
    const newItem: GoalItem = { id: crypto.randomUUID(), text, done: false };
    const next = scope === "week" ? [...wk, newItem] : [...mo, newItem];
    if (scope === "week") { setWk(next); setWkInput(""); }
    else { setMo(next); setMoInput(""); }

    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items: next }),
    }).catch(console.error);
  }

  async function toggleGoal(scope: "week" | "month", id: string) {
    const toggle = (items: GoalItem[]) =>
      items.map((g) => (g.id === id ? { ...g, done: !g.done } : g));
    const next = scope === "week" ? toggle(wk) : toggle(mo);
    if (scope === "week") setWk(next); else setMo(next);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items: next }),
    }).catch(console.error);
  }

  function GoalList({ scope, items, input, setInput }: {
    scope: "week" | "month";
    items: GoalItem[];
    input: string;
    setInput: (v: string) => void;
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
          This {scope === "week" ? "Week" : "Month"}
        </p>
        {items.map((g) => (
          <button
            key={g.id}
            onClick={() => toggleGoal(scope, g.id)}
            className="flex items-start gap-2 text-left"
          >
            <span
              className="mt-0.5 text-xs"
              style={{ color: g.done ? "var(--ok)" : "var(--ink-3)" }}
            >
              {g.done ? "✓" : "○"}
            </span>
            <span
              className="text-xs"
              style={{
                color: g.done ? "var(--ink-3)" : "var(--ink-4)",
                textDecoration: g.done ? "line-through" : "none",
              }}
            >
              {g.text}
            </span>
          </button>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); addGoal(scope, input); }}
          className="flex gap-1 mt-1"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add goal…"
            className="flex-1 rounded px-2 py-1 text-xs outline-none"
            style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
          />
        </form>
      </div>
    );
  }

  return (
    <Panel title="Priorities">
      <GoalList scope="week" items={wk} input={wkInput} setInput={setWkInput} />
      <hr style={{ borderColor: "var(--ink-2)" }} />
      <GoalList scope="month" items={mo} input={moInput} setInput={setMoInput} />
    </Panel>
  );
}
