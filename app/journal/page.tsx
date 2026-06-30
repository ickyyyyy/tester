"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface JournalEntry {
  id: string;
  raw_text: string;
  classification: { summary: string; tags: string[]; kind?: string };
  created_at: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "journal" | "decision" | "note">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/journal/entries");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoading(false);
  }, []);

  async function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
    await fetch("/api/journal/entries", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!compose.trim()) return;
    setSaving(true);
    await fetch("/api/capture", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-secret": "" },
      body: JSON.stringify({ text: compose, source: "journal" }),
    });
    setCompose("");
    setSaving(false);
    load();
  }

  const filtered = entries.filter((e) =>
    filter === "all" ? true : e.classification?.kind === filter
  );

  const kindColor: Record<string, string> = {
    journal: "var(--warn)",
    decision: "var(--accent)",
    note: "var(--ok)",
    capture: "var(--ink-3)",
    task: "var(--danger)",
  };

  return (
    <PageShell>
      <h1 className="text-xl font-semibold text-[var(--ink-4)] mb-6">Journal</h1>

      <Panel accent className="mb-6 p-4">
        <textarea
          value={compose}
          onChange={(e) => setCompose(e.target.value)}
          placeholder="Write a reflection, decision, or note…"
          rows={4}
          className="w-full bg-transparent text-sm text-[var(--ink-4)] outline-none resize-none placeholder-[var(--ink-3)]"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={save}
            disabled={saving || !compose.trim()}
            className="glass px-4 py-1.5 text-sm text-[var(--accent)] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save entry"}
          </button>
        </div>
      </Panel>

      <div className="flex gap-2 mb-4">
        {(["all", "journal", "decision", "note"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f ? "bg-[var(--accent)] text-[var(--ink-0)]" : "glass text-[var(--ink-3)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-3)]">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Panel key={entry.id} className="p-4">
              <div className="flex items-start justify-between gap-4 group">
                <div className="flex-1">
                  <p className="text-sm text-[var(--ink-4)] leading-relaxed whitespace-pre-wrap">
                    {entry.raw_text}
                  </p>
                  {entry.classification?.summary && entry.classification.summary !== entry.raw_text && (
                    <p className="text-xs text-[var(--ink-3)] mt-2 italic">→ {entry.classification.summary}</p>
                  )}
                  {entry.classification?.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.classification.tags.map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-[var(--ink-2)] text-[var(--ink-3)]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `color-mix(in oklch, ${kindColor[entry.classification?.kind ?? "capture"] ?? "var(--ink-3)"} 15%, transparent)`,
                        color: kindColor[entry.classification?.kind ?? "capture"] ?? "var(--ink-3)",
                      }}
                    >
                      {entry.classification?.kind ?? "capture"}
                    </span>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--danger)" }}
                      title="Delete entry"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-xs text-[var(--ink-3)]">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Panel>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--ink-3)] text-center mt-8">No entries yet.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
