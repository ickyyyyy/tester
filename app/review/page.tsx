"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface Review {
  id?: string;
  week_start: string;
  wins?: string;
  open_loops?: string;
  content_shipped?: string;
  next_week_top3?: string;
  what_slipped?: string;
  people_to_follow?: string;
  health_pattern?: string;
  sealed?: boolean;
}

function weekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function weekLabel(ws: string): string {
  const start = new Date(ws);
  const end = new Date(ws);
  end.setDate(end.getDate() + 6);
  return `W${Math.ceil((start.getDate()) / 7)} · ${start.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} → ${end.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}`;
}

const FIELDS: Array<{ key: keyof Review; label: string; placeholder: string }> = [
  { key: "wins",            label: "Wins This Week",             placeholder: "What shipped, closed, or hit?" },
  { key: "open_loops",      label: "Open Loops",                  placeholder: "What's still unresolved?" },
  { key: "content_shipped", label: "Content Shipped",             placeholder: "Published, sent, or shared?" },
  { key: "next_week_top3",  label: "Next Week — Top 3",           placeholder: "1) … 2) … 3) …" },
  { key: "what_slipped",    label: "What Slipped",                placeholder: "What was planned but not done?" },
  { key: "people_to_follow",label: "People to Follow Up With",    placeholder: "Names to ping next week…" },
  { key: "health_pattern",  label: "Health Pattern",              placeholder: "Sleep, HRV, energy, exercise…" },
];

export default function ReviewPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const week = weekStart(weekOffset);
  const [review, setReview] = useState<Review>({ week_start: week });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sealing, setSealing] = useState(false);

  const load = useCallback(async (w: string) => {
    const res = await fetch(`/api/review?week=${w}`);
    if (res.ok) {
      const d = await res.json();
      setReview(d.review ?? { week_start: w });
    }
  }, []);

  useEffect(() => { load(week); }, [week, load]);

  async function save(patch: Partial<Review> = {}) {
    setSaving(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...review, ...patch, week_start: week }),
    });
    if (res.ok) {
      const d = await res.json();
      setReview(d);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function sealWeek() {
    setSealing(true);
    await save({ sealed: true });
    setSealing(false);
  }

  function update(key: keyof Review, value: string) {
    setReview(r => ({ ...r, [key]: value }));
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink-4)]">Weekly Review</h1>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">{weekLabel(week)}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-[var(--ok)]">Auto-saved</span>}
          <button onClick={() => setWeekOffset(o => o - 1)} className="glass px-3 py-1.5 text-sm text-[var(--ink-3)]">‹ Prior</button>
          {weekOffset < 0 && <button onClick={() => setWeekOffset(o => o + 1)} className="glass px-3 py-1.5 text-sm text-[var(--ink-3)]">Next ›</button>}
          {weekOffset === 0 && <button onClick={() => setWeekOffset(0)} className="glass px-3 py-1.5 text-xs text-[var(--ink-3)]">This Week</button>}
        </div>
      </div>

      {review.sealed && (
        <div className="glass border border-[var(--ok)]/40 rounded-lg px-4 py-2 mb-5 flex items-center gap-2">
          <span className="text-[var(--ok)] text-sm">✓</span>
          <span className="text-sm text-[var(--ink-3)]">Week sealed — read only.</span>
          <button onClick={() => save({ sealed: false })} className="ml-auto text-xs text-[var(--ink-3)] hover:text-[var(--ink-4)]">Unseal</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <Panel key={key} className={`p-4 ${key === "next_week_top3" ? "col-span-2" : ""}`}>
            <label className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider block mb-2">{label}</label>
            <textarea
              value={(review[key] as string) ?? ""}
              onChange={e => update(key, e.target.value)}
              onBlur={() => save()}
              placeholder={placeholder}
              disabled={!!review.sealed}
              rows={key === "next_week_top3" ? 3 : 4}
              className="w-full bg-transparent text-sm text-[var(--ink-4)] outline-none resize-none placeholder-[var(--ink-3)] disabled:opacity-50"
            />
          </Panel>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => save()}
          disabled={saving}
          className="glass px-5 py-2 text-sm text-[var(--accent)] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {!review.sealed && (
          <button
            onClick={sealWeek}
            disabled={sealing}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
            style={{ background: "var(--ok)", color: "var(--ink-0)" }}
          >
            {sealing ? "Sealing…" : "Seal Week ✓"}
          </button>
        )}
      </div>
    </PageShell>
  );
}
