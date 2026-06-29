"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { OPERATOR } from "@/lib/config/operator";

export interface Task {
  id: string;
  title: string;
  urgency: string;
  key: boolean;
  priority_score: number;
  time_estimate_min?: number | null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function SessionCard({ tasks }: { tasks?: Task[] }) {
  const items = (tasks ?? []).slice(0, 3);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [capture, setCapture] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function sendCapture() {
    if (!capture.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: capture }),
      });
      setFeedback("Captured");
      setCapture("");
      setTimeout(() => setFeedback(""), 2000);
    } catch {
      setFeedback("Failed");
      setTimeout(() => setFeedback(""), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      {/* Greeting + clock */}
      <div className="mb-2">
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--ink-3)" }}>{date}</p>
        <p className="text-xl font-bold" style={{ color: "var(--ink-4)" }}>
          {greeting()}, {OPERATOR.name}.
        </p>
        <p className="num text-5xl font-bold tracking-tight mt-0.5" style={{ color: "var(--ink-4)" }}>{time}</p>
      </div>

      {/* Inline capture */}
      <form onSubmit={(e) => { e.preventDefault(); sendCapture(); }} className="flex gap-2">
        <input
          value={capture}
          onChange={e => setCapture(e.target.value)}
          placeholder="Capture a thought or task…"
          className="flex-1 rounded px-3 py-1.5 text-xs outline-none"
          style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
        />
        <button
          type="submit"
          disabled={loading || !capture.trim()}
          className="rounded px-3 py-1.5 text-xs font-bold disabled:opacity-40 transition-opacity min-w-[2rem]"
          style={{ background: "var(--accent)", color: "var(--ink-0)" }}
        >
          {feedback || (loading ? "…" : "+")}
        </button>
      </form>

      {/* Focus tasks */}
      {items.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>Today's Focus</p>
          <ol className="flex flex-col gap-2">
            {items.map((t, i) => (
              <li key={t.id} className="flex items-start gap-3">
                <span className="num text-xs font-bold mt-0.5 w-4 shrink-0" style={{ color: "var(--accent)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="text-sm flex-1 truncate" style={{ color: "var(--ink-4)" }}>{t.title}</span>
                  {t.time_estimate_min && (
                    <span className="num text-[10px] shrink-0" style={{ color: "var(--ink-3)" }}>~{t.time_estimate_min}m</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}
