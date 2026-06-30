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

  async function uncomplete(scope: "week" | "month", id: string) {
    const unmark = (items: GoalItem[]) =>
      items.map(g => g.id === id ? { ...g, done: false, completed_at: undefined } : g);
    if (scope === "week") { const next = unmark(wk); setWk(next); await saveScope("week", next); }
    else { const next = unmark(mo); setMo(next); await saveScope("month", next); }
  }

  async function deleteGoal(scope: "week" | "month", id: string) {
    if (scope === "week") { const next = wk.filter(g => g.id !== id); setWk(next); await saveScope("week", next); }
    else { const next = mo.filter(g => g.id !== id); setMo(next); await saveScope("month", next); }
  }

  const completed = [...wk, ...mo]
    .filter(g => g.done)
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime());

  function fmtDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <PageShell>
      <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--ink-4)" }}>
        Completed Goals
      </h1>
      <p className="text-xs mb-6" style={{ color: "var(--ink-3)" }}>
        Goals you check off on the home page appear here with a timestamp.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--ink-3)" }}>Loading…</p>
      ) : completed.length === 0 ? (
        <Panel>
          <p className="text-sm text-center py-8" style={{ color: "var(--ink-3)" }}>
            No completed goals yet. Check one off on the home page.
          </p>
        </Panel>
      ) : (
        <Panel>
          <div className="flex flex-col gap-4">
            {completed.map(g => (
              <div key={g.id} className="flex items-start gap-3 group">
                <span className="text-sm shrink-0 mt-0.5" style={{ color: "var(--ok)" }}>✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--ink-4)" }}>{g.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                    {g.scope === "week" ? "Weekly" : "Monthly"} · {fmtDate(g.completed_at)}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => uncomplete(g.scope!, g.id)}
                    className="text-xs"
                    style={{ color: "var(--ink-3)" }}
                    title="Move back to active"
                  >
                    undo
                  </button>
                  <button
                    onClick={() => deleteGoal(g.scope!, g.id)}
                    className="text-xs"
                    style={{ color: "var(--danger)" }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </PageShell>
  );
}
