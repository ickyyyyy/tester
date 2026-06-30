"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface GoalItem {
  id: string;
  text: string;
  done: boolean;
  completed_at?: string;
  scope?: "week" | "month";
}

export default function GoalsPage() {
  const [wk, setWk] = useState<GoalItem[]>([]);
  const [mo, setMo] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [wkInput, setWkInput] = useState("");
  const [moInput, setMoInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setWk((data.week ?? []).map((g: GoalItem) => ({ ...g, scope: "week" })));
      setMo((data.month ?? []).map((g: GoalItem) => ({ ...g, scope: "month" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveScope(scope: "week" | "month", items: GoalItem[]) {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items }),
    }).catch(console.error);
  }

  async function addGoal(scope: "week" | "month", text: string) {
    if (!text.trim()) return;
    const item: GoalItem = { id: crypto.randomUUID(), text, done: false, scope };
    if (scope === "week") {
      const next = [...wk, item];
      setWk(next);
      setWkInput("");
      await saveScope("week", next);
    } else {
      const next = [...mo, item];
      setMo(next);
      setMoInput("");
      await saveScope("month", next);
    }
  }

  async function toggleGoal(scope: "week" | "month", id: string) {
    const toggle = (items: GoalItem[]) =>
      items.map(g =>
        g.id === id
          ? { ...g, done: !g.done, completed_at: !g.done ? new Date().toISOString() : undefined }
          : g
      );
    if (scope === "week") {
      const next = toggle(wk);
      setWk(next);
      await saveScope("week", next);
    } else {
      const next = toggle(mo);
      setMo(next);
      await saveScope("month", next);
    }
  }

  async function deleteGoal(scope: "week" | "month", id: string) {
    if (scope === "week") {
      const next = wk.filter(g => g.id !== id);
      setWk(next);
      await saveScope("week", next);
    } else {
      const next = mo.filter(g => g.id !== id);
      setMo(next);
      await saveScope("month", next);
    }
  }

  const allItems = [...wk, ...mo];
  const active = allItems.filter(g => !g.done);
  const completed = allItems.filter(g => g.done).sort((a, b) =>
    new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime()
  );

  function fmtDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ink-4)" }}>Goals</h1>
        <div className="flex gap-2">
          {(["active", "completed"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 text-xs rounded-full transition-colors"
              style={{
                background: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "var(--ink-0)" : "var(--ink-3)",
                border: `1px solid ${tab === t ? "var(--accent)" : "var(--ink-2)"}`,
              }}
            >
              {t === "active" ? `Active (${active.length})` : `Completed (${completed.length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--ink-3)" }}>Loading…</p>
      ) : tab === "active" ? (
        <div className="flex flex-col gap-4">
          {(["week", "month"] as const).map(scope => {
            const items = (scope === "week" ? wk : mo).filter(g => !g.done);
            const input = scope === "week" ? wkInput : moInput;
            const setInput = scope === "week" ? setWkInput : setMoInput;
            return (
              <Panel key={scope}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
                  This {scope === "week" ? "Week" : "Month"}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map(g => (
                    <div key={g.id} className="flex items-center gap-3 group">
                      <button
                        onClick={() => toggleGoal(scope, g.id)}
                        className="text-sm shrink-0"
                        style={{ color: "var(--ink-3)" }}
                        title="Mark complete"
                      >
                        ○
                      </button>
                      <span className="text-sm flex-1" style={{ color: "var(--ink-4)" }}>{g.text}</span>
                      <button
                        onClick={() => deleteGoal(scope, g.id)}
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--danger)" }}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--ink-2)" }}>No active goals for this {scope}.</p>
                  )}
                </div>
                <form
                  onSubmit={e => { e.preventDefault(); addGoal(scope, input); }}
                  className="flex gap-2 pt-1"
                >
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Add a ${scope === "week" ? "weekly" : "monthly"} goal…`}
                    className="flex-1 rounded px-3 py-1.5 text-sm outline-none"
                    style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded text-sm font-bold"
                    style={{ background: "var(--accent)", color: "var(--ink-0)" }}
                  >
                    +
                  </button>
                </form>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          {completed.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--ink-3)" }}>
              No completed goals yet. Check one off to see it here.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {completed.map(g => (
                <div key={g.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => toggleGoal(g.scope!, g.id)}
                    className="text-sm shrink-0 mt-0.5"
                    style={{ color: "var(--ok)" }}
                    title="Mark incomplete"
                  >
                    ✓
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--ink-3)", textDecoration: "line-through" }}>
                      {g.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-2)" }}>
                      {g.scope === "week" ? "Weekly" : "Monthly"} goal · completed {fmtDate(g.completed_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGoal(g.scope!, g.id)}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--danger)" }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </PageShell>
  );
}
