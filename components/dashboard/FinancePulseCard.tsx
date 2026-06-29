"use client";

import { Panel } from "./Panel";

interface FinanceSnapshot {
  net_worth: number;
  currency: string;
  as_of: string;
  categories: { name: string; value: number }[];
}

export function FinancePulseCard({ data }: { data?: FinanceSnapshot | null }) {
  if (!data) {
    return (
      <Panel title="Finance Pulse">
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>
          No snapshot yet — run a refresh or wait for the daily cron.
        </p>
      </Panel>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  return (
    <Panel title="Finance Pulse">
      <div className="flex items-baseline gap-2">
        <span className="num text-2xl font-bold" style={{ color: "var(--ok)" }}>
          {fmt(data.net_worth)}
        </span>
        <span className="text-xs" style={{ color: "var(--ink-3)" }}>
          net worth
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {data.categories.slice(0, 5).map((c) => (
          <li key={c.name} className="flex justify-between text-xs">
            <span style={{ color: "var(--ink-3)" }}>{c.name}</span>
            <span className="num" style={{ color: "var(--ink-4)" }}>
              {fmt(c.value)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
        as of {data.as_of}
      </p>
    </Panel>
  );
}
