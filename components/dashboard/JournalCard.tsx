"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "./Panel";

interface JournalEntry {
  id: string;
  raw_text: string;
  classification: { summary: string; tags: string[]; kind?: string };
  created_at: string;
}

export function JournalCard() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [compose, setCompose] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/entries");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!compose.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: compose, source: "journal" }),
      });
      setCompose("");
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <Panel title="Journal">
      {/* Quick-write */}
      <form
        onSubmit={e => { e.preventDefault(); save(); }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={compose}
          onChange={e => setCompose(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }}
          placeholder="Write a thought, reflection, or note… (⌘↵)"
          rows={3}
          className="w-full rounded px-3 py-2 text-xs outline-none resize-none"
          style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
        />
        <button
          type="submit"
          disabled={saving || !compose.trim()}
          className="self-end rounded px-3 py-1 text-xs font-bold disabled:opacity-40 transition-opacity"
          style={{ background: "var(--accent)", color: "var(--ink-0)" }}
        >
          {saving ? "…" : "Save"}
        </button>
      </form>

      {/* Entry feed */}
      {loading ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>No entries yet — write something above.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {entries.slice(0, 10).map(e => (
            <div
              key={e.id}
              className="flex flex-col gap-1 pb-2 border-b"
              style={{ borderColor: "var(--ink-2)" }}
            >
              <p className="text-xs leading-snug" style={{ color: "var(--ink-4)" }}>
                {e.raw_text.length > 120 ? e.raw_text.slice(0, 120) + "…" : e.raw_text}
              </p>
              <div className="flex items-center gap-2">
                {e.classification?.kind && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    {e.classification.kind}
                  </span>
                )}
                <span className="text-[9px]" style={{ color: "var(--ink-3)" }}>
                  {relativeTime(e.created_at)}
                </span>
              </div>
            </div>
          ))}
          {entries.length > 10 && (
            <a
              href="/journal"
              className="text-[10px] text-center"
              style={{ color: "var(--accent)" }}
            >
              View all {entries.length} entries →
            </a>
          )}
        </div>
      )}
    </Panel>
  );
}
