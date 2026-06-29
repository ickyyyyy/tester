"use client";

import { Panel } from "./Panel";

interface FinanceSnapshot {
  net_worth?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_rate?: number;
  summary?: string;
  [key: string]: unknown;
}

export function FinancePulseCard({ data }: { data?: FinanceSnapshot | null }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);

  const nw = data?.net_worth;
  const income = data?.monthly_income;
  const expenses = data?.monthly_expenses;
  const rate = data?.savings_rate;

  return (
    <Panel>
      <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1">Net Worth · Live</p>
      {nw != null ? (
        <p className="num text-2xl font-bold text-[var(--ok)] mb-3">{fmt(nw)}</p>
      ) : (
        <p className="num text-2xl font-bold text-[var(--ink-2)] mb-3">—</p>
      )}
      <div className="flex flex-col gap-1.5">
        {[
          { label: "Income/mo", value: income != null ? fmt(income) : "—", color: "var(--ok)" },
          { label: "Burn/mo",   value: expenses != null ? fmt(expenses) : "—", color: "var(--danger)" },
          { label: "Save rate", value: rate != null ? `${rate.toFixed(1)}%` : "—", color: "var(--accent)" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{row.label}</span>
            <span className="num text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>
      {!data && (
        <p className="text-[10px] text-[var(--ink-3)] mt-3">No snapshot — connect Google Sheets or trigger cron.</p>
      )}
    </Panel>
  );
}
