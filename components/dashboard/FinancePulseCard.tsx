"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { PlaidConnectButton } from "./PlaidConnectButton";
import type { PlaidSnapshot } from "@/app/api/plaid/accounts/route";

const FALLBACK_SPARK = [0.3, 0.38, 0.34, 0.50, 0.46, 0.60, 0.55, 0.68, 0.64, 0.78, 0.74, 0.90];

export function FinancePulseCard() {
  const [data, setData] = useState<PlaidSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    fetch("/api/plaid/accounts")
      .then(r => r.json())
      .then(d => {
        setConnected(d.connected);
        setData(d.snapshot ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  const W = 200, H = 36;
  const pts = FALLBACK_SPARK;
  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;
  const coords = pts
    .map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - min) / range) * (H - 4) - 2}`)
    .join(" ");

  return (
    <Panel>
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>Net Worth</p>
        <div className="flex items-center gap-1.5">
          {connected && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--ok)", color: "var(--ink-0)" }}>
              ▲ LIVE
            </span>
          )}
          <button
            onClick={() => setBlurred(b => !b)}
            title={blurred ? "Show" : "Hide"}
            className="text-[11px] leading-none"
            style={{ color: "var(--ink-3)" }}
          >
            {blurred ? "👁" : "🙈"}
          </button>
        </div>
      </div>

      <div style={{ filter: blurred ? "blur(8px)" : "none", transition: "filter 0.2s", userSelect: blurred ? "none" : "auto" }}>
        <p className="num text-2xl font-bold" style={{ color: data ? "var(--ok)" : "var(--ink-2)" }}>
          {loading ? "…" : data ? fmt(data.net_worth) : "—"}
        </p>

        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
          <polyline points={coords} fill="none" stroke="var(--ok)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        <div className="flex flex-col gap-1.5">
          {[
            { label: "Liquid",     value: data ? fmt(data.liquid) : "—",      color: "var(--ok)" },
            { label: "Invested",   value: data ? fmt(data.invested) : "—",    color: "var(--accent)" },
            { label: "Liabilities",value: data ? fmt(data.liabilities) : "—", color: "var(--danger)" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{row.label}</span>
              <span className="num text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {!loading && !connected && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>Connect your accounts to see live balances.</p>
          <PlaidConnectButton />
        </div>
      )}

      {!loading && connected && (
        <div className="pt-1">
          <PlaidConnectButton />
        </div>
      )}
    </Panel>
  );
}
