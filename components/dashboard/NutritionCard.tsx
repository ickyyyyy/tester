"use client";

import { useState, useEffect, useRef } from "react";
import { Panel } from "./Panel";

interface Meal {
  id: string;
  t: string;   // time label
  n: string;   // name
  kcal: number;
  p: number;
  c: number;
  f: number;
  estimated?: boolean;
}

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const storageKey = () => `os-nutrition-${localDateKey()}`;

export function NutritionCard() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const redistributeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey());
    if (raw) setMeals(JSON.parse(raw));
  }, []);

  function save(next: Meal[]) {
    setMeals(next);
    localStorage.setItem(storageKey(), JSON.stringify(next));
    // Persist to Supabase
    fetch(`/api/nutrition/${localDateKey()}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ meals: next }),
    }).catch(console.error);
  }

  async function addMeal() {
    if (!input.trim()) return;
    setLoading(true);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let est = { kcal: 0, p: 0, c: 0, f: 0 };
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.kcal === "number") est = data;
      }
    } catch { /* estimation unavailable, use zeros */ }
    const meal: Meal = { id: crypto.randomUUID(), t: now, n: input, estimated: est.kcal > 0, ...est };
    save([...meals, meal]);
    setInput("");
    setLoading(false);
  }

  function removeMeal(id: string) {
    save(meals.filter((m) => m.id !== id));
  }

  const totals = meals.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <Panel title="Nutrition">
      {/* Totals */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: "kcal", val: Math.round(totals.kcal) },
          { label: "P", val: Math.round(totals.p) + "g" },
          { label: "C", val: Math.round(totals.c) + "g" },
          { label: "F", val: Math.round(totals.f) + "g" },
        ].map((x) => (
          <div key={x.label} className="rounded-md py-1.5" style={{ background: "var(--ink-2)" }}>
            <div className="num text-sm font-semibold" style={{ color: "var(--ink-4)" }}>{x.val}</div>
            <div className="text-[9px]" style={{ color: "var(--ink-3)" }}>{x.label}</div>
          </div>
        ))}
      </div>

      {/* Meal list */}
      {meals.length > 0 && (
        <ul className="flex flex-col gap-1">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-xs group">
              <span className="num w-10 shrink-0" style={{ color: "var(--ink-3)" }}>{m.t}</span>
              <span className="flex-1 truncate" style={{ color: "var(--ink-4)" }}>{m.n}</span>
              <span className="num shrink-0" style={{ color: "var(--ok)" }}>{Math.round(m.kcal)}</span>
              <button
                onClick={() => removeMeal(m.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] px-1"
                style={{ color: "var(--danger)" }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add meal */}
      <form
        onSubmit={(e) => { e.preventDefault(); addMeal(); }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 2 eggs, toast with butter"
          className="flex-1 rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-40 transition-opacity"
          style={{ background: "var(--accent)", color: "var(--ink-0)" }}
        >
          {loading ? "…" : "+"}
        </button>
      </form>
    </Panel>
  );
}
