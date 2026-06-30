"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "./Panel";

interface GoalItem {
  id: string;
  text: string;
  done: boolean;
  completed_at?: string;
  scope?: "week" | "month";
}

export function PrioritiesCard() {
  const [wk, setWk] = useState<GoalItem[]>([]);
  const [mo, setMo] = useState<GoalItem[]>([]);
  const [wkInput, setWkInput] = useState("");
  const [moInput, setMoInput] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setWk((data.week ?? []).map((g: GoalItem) => ({ ...g, scope: "week" })));
      setMo((data.month ?? []).map((g: GoalItem) => ({ ...g, scope: "month" })));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(scope: "week" | "month", items: GoalItem[]) {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items }),
    }).catch(console.error);
  }

  async function addGoal(scope: "week" | "month", text: string) {
    if (!text.trim()) return;
    const item: GoalItem = { id: crypto.randomUUID(), text, done: false, scope };
    if (scope === "week") { const next = [...wk, item]; setWk(next); setWkInput(""); await save("week", next); }
    else { const next = [...mo, item]; setMo(next); setMoInput(""); await save("month", next); }
  }

  async function completeGoal(scope: "week" | "month", id: string) {
    const mark = (items: GoalItem[]) =>
      items.map(g => g.id === id ? { ...g, done: true, completed_at: new Date().toISOString() } : g);
    if (scope === "week") { const next = mark(wk); setWk(next); await save("week", next); }
    else { const next = mark(mo); setMo(next); await save("month", next); }
  }

  const activeWk = wk.filter(g => !g.done);
  const activeMo = mo.filter(g => !g.done);

  return (
    <Panel title="Goals">
      {(["week", "month"] as const).map((scope, i) => {
        const items = scope === "week" ? activeWk : activeMo;
        const input = scope === "week" ? wkInput : moInput;
        const setInput = scope === "week" ? setWkInput : setMoInput;
        return (
          <div key={scope}>
            {i > 0 && <hr className="mb-3" style={{ borderColor: "var(--ink-2)" }} />}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--ink-3)" }}>
              This {scope === "week" ? "Week" : "Month"}
            </p>
            <div className="flex flex-col gap-2 mb-2">
              {items.map(g => (
                <button key={g.id} onClick={() => completeGoal(scope, g.id)} className="flex items-start gap-2 text-left">
                  <span className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>○</span>
                  <span className="text-xs flex-1" style={{ color: "var(--ink-4)" }}>{g.text}</span>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-[10px]" style={{ color: "var(--ink-2)" }}>No goals yet.</p>
              )}
            </div>
            <form onSubmit={e => { e.preventDefault(); addGoal(scope, input); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Add ${scope === "week" ? "weekly" : "monthly"} goal…`}
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
    </Panel>
  );
}
