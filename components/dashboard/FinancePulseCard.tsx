"use client";

import { useState } from "react";
import { Panel } from "./Panel";

interface FinanceSnapshot {
  net_worth?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_rate?: number;
  daily_change?: number;
  monthly_change?: number;
  sparkline?: number[];
  [key: string]: unknown;
}

const FALLBACK_SPARK = [0.3, 0.38, 0.34, 0.50, 0.46, 0.60, 0.55, 0.68, 0.64, 0.78, 0.74, 0.90];

export function FinancePulseCard({ data }: { data?: FinanceSnapshot | null }) {
  const [blurred, setBlurred] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  const nw = data?.net_worth;
  const income = data?.monthly_income;
  const expenses = data?.monthly_expenses;
  const rate = data?.savings_rate;

  const pts = (data?.sparkline && data.sparkline.length > 1) ? data.sparkline : FALLBACK_SPARK;
  const W = 200, H = 36;
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
          {nw != null && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--ok)", color: "var(--ink-0)" }}
            >
              ▲ LIVE
            </span>
          )}
          <button
            onClick={() => setBlurred(b => !b)}
            title={blurred ? "Show numbers" : "Hide numbers"}
            className="text-[11px] leading-none"
            style={{ color: "var(--ink-3)" }}
          >
            {blurred ? "👁" : "🙈"}
          </button>
        </div>
      </div>

      <div style={{ filter: blurred ? "blur(8px)" : "none", transition: "filter 0.2s", userSelect: blurred ? "none" : "auto" }}>
      <p className="num text-2xl font-bold" style={{ color: nw != null ? "var(--ok)" : "var(--ink-2)" }}>
        {nw != null ? fmt(nw) : "—"}
      </p>

      {/* Sparkline */}
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <polyline
          points={coords}
          fill="none"
          stroke="var(--ok)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex flex-col gap-1.5">
        {[
          { label: "Income / mo",  value: income != null ? fmt(income) : "—",              color: "var(--ok)" },
          { label: "Burn / mo",    value: expenses != null ? fmt(expenses) : "—",           color: "var(--danger)" },
          { label: "Save rate",    value: rate != null ? `${rate.toFixed(1)}%` : "—",       color: "var(--accent)" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{row.label}</span>
            <span className="num text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      </div>

      {!data && (
        <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
          No snapshot — connect a Google Sheet to populate.
        </p>
      )}
    </Panel>
  );
}
