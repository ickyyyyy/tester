"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface MemoryChunk {
  id: string;
  text: string;
  source_type: string;
  created_at: string;
  similarity?: number;
}

export default function BrainPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemoryChunk[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "ask">("ask");

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setAnswer("");

    if (mode === "ask") {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer ?? "");
        setResults(data.chunks ?? []);
      }
    } else {
      const res = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, limit: 15 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    }
    setLoading(false);
  }

  const sourceColor: Record<string, string> = {
    capture: "var(--accent)",
    task: "var(--ok)",
    journal: "var(--warn)",
    note: "var(--ink-3)",
  };

  return (
    <PageShell>
      <h1 className="text-xl font-semibold text-[var(--ink-4)] mb-6">Brain / Memory</h1>

      <Panel className="mb-6">
        <div className="flex gap-2 mb-4">
          {(["ask", "search"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                mode === m ? "bg-[var(--accent)] text-[var(--ink-0)]" : "text-[var(--ink-3)] hover:text-[var(--ink-4)]"
              }`}
            >
              {m === "ask" ? "Ask AI" : "Search Memory"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder={mode === "ask" ? "Ask anything about your notes, tasks, or captures…" : "Search your memory…"}
            className="flex-1 glass px-4 py-2 text-sm text-[var(--ink-4)] bg-transparent outline-none"
          />
          <button
            onClick={run}
            disabled={loading || !query.trim()}
            className="glass px-5 py-2 text-sm text-[var(--accent)] disabled:opacity-40 transition-opacity"
          >
            {loading ? "…" : mode === "ask" ? "Ask" : "Search"}
          </button>
        </div>
      </Panel>

      {answer && (
        <Panel accent className="mb-6 p-5">
          <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-2">Answer</p>
          <p className="text-sm text-[var(--ink-4)] leading-relaxed whitespace-pre-wrap">{answer}</p>
        </Panel>
      )}

      {results.length > 0 && (
        <div>
          <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider mb-3">
            {results.length} memory chunk{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-3">
            {results.map((chunk) => (
              <Panel key={chunk.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-[var(--ink-4)] leading-relaxed flex-1">{chunk.text}</p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `color-mix(in oklch, ${sourceColor[chunk.source_type] ?? "var(--ink-3)"} 15%, transparent)`,
                        color: sourceColor[chunk.source_type] ?? "var(--ink-3)",
                      }}
                    >
                      {chunk.source_type}
                    </span>
                    {chunk.similarity !== undefined && (
                      <span className="text-xs text-[var(--ink-3)] num">{(chunk.similarity * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--ink-3)] mt-2">
                  {new Date(chunk.created_at).toLocaleDateString()}
                </p>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {!loading && !answer && results.length === 0 && query && (
        <p className="text-sm text-[var(--ink-3)] text-center mt-8">No results found.</p>
      )}
    </PageShell>
  );
}
