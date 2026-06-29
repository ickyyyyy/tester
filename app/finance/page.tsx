import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";
import FinanceRefreshButton from "@/components/dashboard/FinanceRefreshButton";

interface Snapshot {
  net_worth?: number;
  liquid?: number;
  invested?: number;
  liabilities?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_rate?: number;
  runway_months?: number;
  accounts?: Record<string, number>;
  top_expense_categories?: Array<{ name: string; amount: number }>;
  summary?: string;
  alerts?: string[];
}

async function getLogs() {
  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("log_date, notes")
    .eq("user_id", OPERATOR.userId)
    .order("log_date", { ascending: false })
    .limit(30);
  return (data ?? [])
    .map(r => ({ date: r.log_date as string, snap: (() => { try { return JSON.parse(r.notes as string)?.finance_snapshot as Snapshot | undefined; } catch { return undefined; } })() }))
    .filter(r => r.snap);
}

const fmt = (n: number | undefined) =>
  n == null ? "—" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const pctFmt = (n: number | undefined) => n == null ? "—" : `${n.toFixed(1)}%`;

const ACCOUNT_LABELS: Record<string, string> = {
  checking: "Checking", savings: "Savings", hysa: "HYSA",
  equities: "Equities", index: "Index", crypto: "Crypto", private: "Private", stables: "Stables",
  cc_float: "CC Float", car_lease: "Car Lease", loc: "LOC", tax_accrual: "Tax Accr.",
};
const LIQUID_KEYS = ["checking", "savings", "hysa", "stables"];
const INVESTED_KEYS = ["equities", "index", "crypto", "private"];
const LIABILITY_KEYS = ["cc_float", "car_lease", "loc", "tax_accrual"];

export default async function FinancePage() {
  const logs = await getLogs();
  const latest = logs[0]?.snap;

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink-4)]">Finance</h1>
        <FinanceRefreshButton />
      </div>

      {latest ? (
        <>
          {/* Net worth hero */}
          <Panel accent className="mb-5 p-5">
            <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1">Net Worth · Live</p>
            <p className="num text-4xl font-bold text-[var(--ok)] mb-1">{fmt(latest.net_worth)}</p>
            <div className="flex gap-6 mt-3">
              {[
                { label: "Runway", value: latest.runway_months != null ? `${latest.runway_months}mo` : "—", color: "var(--accent)" },
                { label: "Income/mo", value: fmt(latest.monthly_income), color: "var(--ok)" },
                { label: "Burn/mo", value: fmt(latest.monthly_expenses), color: "var(--danger)" },
                { label: "Save rate", value: pctFmt(latest.savings_rate), color: "var(--warn)" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{label}</p>
                  <p className="num text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* a1 Liquid */}
            <Panel className="p-4">
              <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1">a1 · Liquid Cash</p>
              <p className="num text-xl font-bold text-[var(--ok)] mb-3">{fmt(latest.liquid)}</p>
              {LIQUID_KEYS.map(k => (
                <div key={k} className="flex justify-between py-1 border-b border-[var(--ink-2)] last:border-0">
                  <span className="text-xs text-[var(--ink-3)] uppercase tracking-wider">{ACCOUNT_LABELS[k]}</span>
                  <span className="num text-xs text-[var(--ink-4)]">{fmt(latest.accounts?.[k])}</span>
                </div>
              ))}
            </Panel>

            {/* a2 Invested */}
            <Panel className="p-4">
              <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1">a2 · Invested Assets</p>
              <p className="num text-xl font-bold text-[var(--accent)] mb-3">{fmt(latest.invested)}</p>
              {INVESTED_KEYS.map(k => (
                <div key={k} className="flex justify-between py-1 border-b border-[var(--ink-2)] last:border-0">
                  <span className="text-xs text-[var(--ink-3)] uppercase tracking-wider">{ACCOUNT_LABELS[k]}</span>
                  <span className="num text-xs text-[var(--ink-4)]">{fmt(latest.accounts?.[k])}</span>
                </div>
              ))}
            </Panel>

            {/* a3 Liabilities */}
            <Panel className="p-4">
              <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1">a3 · Liabilities</p>
              <p className="num text-xl font-bold text-[var(--danger)] mb-3">{fmt(latest.liabilities)}</p>
              {LIABILITY_KEYS.map(k => (
                <div key={k} className="flex justify-between py-1 border-b border-[var(--ink-2)] last:border-0">
                  <span className="text-xs text-[var(--ink-3)] uppercase tracking-wider">{ACCOUNT_LABELS[k]}</span>
                  <span className="num text-xs text-[var(--ink-4)]">{fmt(latest.accounts?.[k])}</span>
                </div>
              ))}
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Top expenses */}
            <Panel className="p-4">
              <p className="text-xs font-semibold text-[var(--ink-4)] mb-3 uppercase tracking-wider">Top Expenses</p>
              {(latest.top_expense_categories ?? []).map(cat => (
                <div key={cat.name} className="flex justify-between py-1.5 border-b border-[var(--ink-2)] last:border-0">
                  <span className="text-sm text-[var(--ink-4)]">{cat.name}</span>
                  <span className="num text-sm text-[var(--danger)]">{fmt(cat.amount)}</span>
                </div>
              ))}
            </Panel>

            {/* Summary + alerts */}
            <Panel className="p-4">
              <p className="text-xs font-semibold text-[var(--ink-4)] mb-3 uppercase tracking-wider">Summary</p>
              <p className="text-sm text-[var(--ink-3)] leading-relaxed">{latest.summary}</p>
              {(latest.alerts ?? []).length > 0 && (
                <div className="mt-3 space-y-1">
                  {(latest.alerts ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-[var(--warn)] flex gap-1.5"><span>⚠</span>{a}</p>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* a4 Snapshot history */}
          <Panel className="p-4">
            <p className="text-xs font-semibold text-[var(--ink-4)] mb-3 uppercase tracking-wider">a4 · Snapshot History · {logs.length}mo</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[var(--ink-3)] border-b border-[var(--ink-2)] uppercase tracking-wider">
                  <th className="pb-2 font-medium pr-4">Period</th>
                  <th className="pb-2 font-medium text-right pr-4">Net Worth</th>
                  <th className="pb-2 font-medium text-right pr-4">Liquid</th>
                  <th className="pb-2 font-medium text-right pr-4">Invested</th>
                  <th className="pb-2 font-medium text-right pr-4">Liabilities</th>
                  <th className="pb-2 font-medium text-right">Δ vs Prior</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 24).map((row, i) => {
                  const prev = logs[i + 1]?.snap;
                  const delta = row.snap?.net_worth != null && prev?.net_worth != null
                    ? row.snap.net_worth - prev.net_worth : null;
                  return (
                    <tr key={row.date} className="border-b border-[var(--ink-2)] last:border-0">
                      <td className="py-1.5 pr-4 text-[var(--ink-3)]">{row.date.slice(0, 7)}</td>
                      <td className="py-1.5 pr-4 text-right num text-[var(--ok)]">{fmt(row.snap?.net_worth)}</td>
                      <td className="py-1.5 pr-4 text-right num text-[var(--ink-4)]">{fmt(row.snap?.liquid)}</td>
                      <td className="py-1.5 pr-4 text-right num text-[var(--accent)]">{fmt(row.snap?.invested)}</td>
                      <td className="py-1.5 pr-4 text-right num text-[var(--danger)]">{fmt(row.snap?.liabilities)}</td>
                      <td className="py-1.5 text-right num" style={{ color: delta == null ? "var(--ink-3)" : delta >= 0 ? "var(--ok)" : "var(--danger)" }}>
                        {delta == null ? "—" : `${delta >= 0 ? "+" : ""}${fmt(delta)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </>
      ) : (
        <Panel className="p-8 text-center">
          <p className="text-[var(--ink-3)] mb-2">No finance snapshots yet.</p>
          <p className="text-sm text-[var(--ink-3)]">Connect Google Sheets in .env.local, then trigger a refresh above.</p>
        </Panel>
      )}
    </PageShell>
  );
}
