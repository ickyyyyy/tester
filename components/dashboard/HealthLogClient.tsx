"use client";

import { useState } from "react";
import { Panel } from "./Panel";

export default function HealthLogClient() {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function localDateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function logHealthNote() {
    if (!note.trim()) return;
    setSaving(true);
    const res = await fetch("/api/capture", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-secret": "" },
      body: JSON.stringify({ text: note, source: "health" }),
    });
    if (res.ok) {
      setMsg("Logged!");
      setNote("");
    } else {
      setMsg("Failed — try again.");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <Panel className="p-4">
      <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Log a health note</h3>
      <p className="text-xs text-[var(--ink-3)] mb-3">{localDateKey()}</p>
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") logHealthNote(); }}
          placeholder="e.g. ran 5k, slept 7h, felt energised…"
          className="flex-1 glass px-3 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none"
        />
        <button
          onClick={logHealthNote}
          disabled={saving || !note.trim()}
          className="glass px-4 py-1.5 text-sm text-[var(--accent)] disabled:opacity-40"
        >
          {saving ? "…" : "Log"}
        </button>
      </div>
      {msg && <p className="text-xs text-[var(--ok)] mt-2">{msg}</p>}
    </Panel>
  );
}
