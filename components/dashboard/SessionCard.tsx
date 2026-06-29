"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import Link from "next/link";

export interface Task {
  id: string;
  title: string;
  urgency: string;
  key: boolean;
  priority_score: number;
  time_estimate_min?: number | null;
}

interface Prices { btc: number | null; xau: number | null; ndx: number | null }

function usePrices(): Prices {
  const [prices, setPrices] = useState<Prices>({ btc: null, xau: null, ndx: null });
  useEffect(() => {
    fetch("/api/prices").then(r => r.ok ? r.json() : null).then(d => { if (d) setPrices(d); }).catch(() => {});
    const id = setInterval(() => {
      fetch("/api/prices").then(r => r.ok ? r.json() : null).then(d => { if (d) setPrices(d); }).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return prices;
}

function useStreak(): number {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    fetch("/api/habits?days=60").then(r => r.ok ? r.json() : []).then((rows: { date: string; done: string[] }[]) => {
      const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
      let s = 0;
      for (const row of sorted) {
        if (row.done?.length > 0) s++; else break;
      }
      setStreak(s);
    }).catch(() => {});
  }, []);
  return streak;
}

export function SessionCard({ tasks }: { tasks?: Task[] }) {
  const items = (tasks ?? []).slice(0, 3);
  const prices = usePrices();
  const streak = useStreak();
  const [focus, setFocus] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("os-today-focus") ?? "";
    return "";
  });

  const fmtPrice = (n: number | null, prefix = "$") =>
    n == null ? "—" : `${prefix}${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const tickers = [
    { label: "BTC", value: fmtPrice(prices.btc) },
    { label: "XAU", value: fmtPrice(prices.xau) },
    { label: "NDX", value: fmtPrice(prices.ndx, "") },
  ];

  return (
    <Panel>
      {/* Tickers */}
      <div className="flex gap-3 mb-4 pb-3 border-b border-[var(--ink-2)]">
        {tickers.map(t => (
          <div key={t.label} className="flex items-baseline gap-1">
            <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{t.label}</span>
            <span className="num text-xs text-[var(--ink-4)]">{t.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">Streak</span>
          <span className="num text-xs font-bold text-[var(--accent)]">{streak}d</span>
        </div>
      </div>

      {/* Focus */}
      <div className="mb-4">
        <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">Today I will</p>
        <input
          value={focus}
          onChange={e => { setFocus(e.target.value); localStorage.setItem("os-today-focus", e.target.value); }}
          placeholder="Set today's one thing…"
          className="w-full bg-transparent text-sm text-[var(--ink-4)] outline-none placeholder-[var(--ink-3)] border-b border-[var(--ink-2)] pb-1 focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Session tasks */}
      <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-2">Focus</p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--ink-3)]">Nothing urgent and key for today.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((t, i) => (
            <li key={t.id} className="flex items-start gap-3">
              <span className="num text-xs font-bold mt-0.5 w-4 shrink-0 text-[var(--accent)]">{i + 1}</span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <Link href={`/crm?task=${t.id}`} className="text-sm truncate hover:underline text-[var(--ink-4)]">
                  {t.title}
                </Link>
                {t.time_estimate_min && (
                  <span className="num text-[10px] text-[var(--ink-3)]">~{t.time_estimate_min}m</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
