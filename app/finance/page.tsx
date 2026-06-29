import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";
import FinanceRefreshButton from "@/components/dashboard/FinanceRefreshButton";

async function getFinanceSnapshots() {
  const db = adminClient();
  const { data } = await db
    .from("daily_logs")
    .select("log_date, notes")
    .eq("user_id", OPERATOR.userId)
    .not("notes->finance_snapshot", "is", null)
    .order("log_date", { ascending: false })
    .limit(30);
  return data ?? [];
}

export default async function FinancePage() {
  const logs = await getFinanceSnapshots();
  const latest = logs[0];
  const snap = latest?.notes?.finance_snapshot as Record<string, unknown> | undefined;

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink-4)]">Finance</h1>
        <FinanceRefreshButton />
      </div>

      {snap ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Net Worth", value: snap.net_worth as number, prefix: "$", color: "var(--ok)" },
              { label: "Monthly Income", value: snap.monthly_income as number, prefix: "$", color: "var(--accent)" },
              { label: "Monthly Expenses", value: snap.monthly_expenses as number, prefix: "$", color: "var(--danger)" },
              { label: "Savings Rate", value: snap.savings_rate as number, prefix: "", suffix: "%", color: "var(--warn)" },
            ].map(({ label, value, prefix, suffix, color }) => (
              <Panel key={label} className="p-4 text-center">
                <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider mb-2">{label}</p>
                <p className="num text-2xl font-bold" style={{ color }}>
                  {prefix}{typeof value === "number" ? value.toLocaleString() : "—"}{suffix ?? ""}
                </p>
              </Panel>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Panel className="p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Top Expenses</h3>
              {((snap.top_expense_categories as Array<{ name: string; amount: number }>) ?? []).map((cat) => (
                <div key={cat.name} className="flex justify-between items-center py-1.5 border-b border-[var(--ink-2)] last:border-0">
                  <span className="text-sm text-[var(--ink-4)]">{cat.name}</span>
                  <span className="num text-sm text-[var(--danger)]">${cat.amount.toLocaleString()}</span>
                </div>
              ))}
            </Panel>

            <Panel className="p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Summary</h3>
              <p className="text-sm text-[var(--ink-3)] leading-relaxed">{snap.summary as string}</p>
              {((snap.alerts as string[]) ?? []).length > 0 && (
                <div className="mt-3 space-y-1">
                  {(snap.alerts as string[]).map((a, i) => (
                    <p key={i} className="text-xs text-[var(--warn)] flex gap-1.5">
                      <span>⚠</span>{a}
                    </p>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel className="p-4">
            <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Snapshot History</h3>
            <div className="space-y-1">
              {logs.slice(0, 10).map((log) => {
                const s = log.notes?.finance_snapshot as Record<string, unknown>;
                return (
                  <div key={log.log_date} className="flex items-center justify-between py-1.5 border-b border-[var(--ink-2)] last:border-0">
                    <span className="text-sm text-[var(--ink-3)]">{log.log_date}</span>
                    <div className="flex gap-4">
                      <span className="num text-sm text-[var(--ok)]">${(s?.net_worth as number)?.toLocaleString() ?? "—"}</span>
                      <span className="num text-sm text-[var(--warn)]">{(s?.savings_rate as number)?.toFixed(1) ?? "—"}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      ) : (
        <Panel className="p-8 text-center">
          <p className="text-[var(--ink-3)] mb-4">No finance snapshots yet.</p>
          <p className="text-sm text-[var(--ink-3)]">
            Connect your Google Sheet in .env.local, then trigger a snapshot manually or wait for the 5am UTC cron.
          </p>
        </Panel>
      )}
    </PageShell>
  );
}
