"use client";

import { useState } from "react";
import { Panel } from "./Panel";

interface GoalItem {
  id: string;
  text: string;
  done: boolean;
  completed_at?: string;
  scope?: "week" | "month";
}

export function PrioritiesCard({
  weekItems = [],
  monthItems = [],
}: {
  weekItems?: GoalItem[];
  monthItems?: GoalItem[];
}) {
  const [wk, setWk] = useState<GoalItem[]>(weekItems.map(g => ({ ...g, scope: "week" })));
  const [mo, setMo] = useState<GoalItem[]>(monthItems.map(g => ({ ...g, scope: "month" })));
  const [wkInput, setWkInput] = useState("");
  const [moInput, setMoInput] = useState("");
  const [tab, setTab] = useState<"goals" | "completed">("goals");

  async function save(scope: "week" | "month", items: GoalItem[]) {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items }),
    }).catch(console.error);
  }

  async function addGoal(scope: "week" | "month", text: string) {
    if (!text.trim()) return;
    const newItem: GoalItem = { id: crypto.randomUUID(), text, done: false, scope };
    if (scope === "week") { const next = [...wk, newItem]; setWk(next); setWkInput(""); await save("week", next); }
    else { const next = [...mo, newItem]; setMo(next); setMoInput(""); await save("month", next); }
  }

  async function toggleGoal(scope: "week" | "month", id: string) {
    const toggle = (items: GoalItem[]) =>
      items.map(g => g.id === id
        ? { ...g, done: !g.done, completed_at: !g.done ? new Date().toISOString() : undefined }
        : g
      );
    if (scope === "week") { const next = toggle(wk); setWk(next); await save("week", next); }
    else { const next = toggle(mo); setMo(next); await save("month", next); }
  }

  const allItems = [...wk, ...mo];
  const active = allItems.filter(g => !g.done);
  const completed = allItems.filter(g => g.done).sort((a, b) =>
    new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime()
  );

  function fmtDate(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <Panel>
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-2">
          {(["goals", "completed"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-[10px] font-bold uppercase tracking-widest pb-0.5"
              style={{
                color: tab === t ? "var(--accent)" : "var(--ink-3)",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {t === "goals" ? "Goals" : `Completed (${completed.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === "goals" && (
        <div className="flex flex-col gap-4">
          {(["week", "month"] as const).map(scope => {
            const scopeActive = active.filter(g => g.scope === scope);
            const input = scope === "week" ? wkInput : moInput;
            const setInput = scope === "week" ? setWkInput : setMoInput;
            return (
              <div key={scope} className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
                  This {scope === "week" ? "Week" : "Month"}
                </p>
                {scopeActive.map(g => (
                  <button key={g.id} onClick={() => toggleGoal(scope, g.id)} className="flex items-start gap-2 text-left">
                    <span className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>○</span>
                    <span className="text-xs flex-1" style={{ color: "var(--ink-4)" }}>{g.text}</span>
                  </button>
                ))}
                {scopeActive.length === 0 && (
                  <p className="text-[10px]" style={{ color: "var(--ink-2)" }}>No active goals</p>
                )}
                <form onSubmit={e => { e.preventDefault(); addGoal(scope, input); }} className="flex gap-2 mt-0.5">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Add a ${scope === "week" ? "weekly" : "monthly"} goal…`}
                    className="flex-1 rounded px-2 py-1 text-xs outline-none"
                    style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
                  />
                  <button
                    type="submit"
                    className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--ink-2)", color: "var(--accent)" }}
                  >
                    +
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {tab === "completed" && (
        <div className="flex flex-col gap-2">
          {completed.length === 0 && (
            <p className="text-[10px]" style={{ color: "var(--ink-2)" }}>No completed goals yet.</p>
          )}
          {completed.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.scope!, g.id)}
              className="flex items-start gap-2 text-left"
              title="Click to uncheck"
            >
              <span className="text-xs mt-0.5" style={{ color: "var(--ok)" }}>✓</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs" style={{ color: "var(--ink-3)", textDecoration: "line-through" }}>{g.text}</span>
                <span className="text-[9px]" style={{ color: "var(--ink-2)" }}>
                  {g.scope === "week" ? "Weekly" : "Monthly"} · {fmtDate(g.completed_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
