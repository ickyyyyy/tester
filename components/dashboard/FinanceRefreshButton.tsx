"use client";

import { useState } from "react";

export default function FinanceRefreshButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function trigger() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/finance/snapshot", {
      headers: { "x-api-secret": "" },
    });
    if (res.ok) {
      setMsg("Snapshot updated!");
    } else {
      setMsg("Failed — check server logs.");
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-[var(--ink-3)]">{msg}</span>}
      <button
        onClick={trigger}
        disabled={loading}
        className="glass px-3 py-1.5 text-sm text-[var(--accent)] disabled:opacity-40"
      >
        {loading ? "Refreshing…" : "↻ Refresh"}
      </button>
    </div>
  );
}
