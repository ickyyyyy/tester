import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";
import HealthLogClient from "@/components/dashboard/HealthLogClient";

interface DayLog {
  log_date: string;
  notes: {
    habits?: Record<string, boolean>;
    nutrition?: { meals: Array<{ name: string; kcal: number; p: number; c: number; f: number }> };
    finance_snapshot?: unknown;
  };
}

async function getLogs(): Promise<DayLog[]> {
  const db = adminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await db
    .from("daily_logs")
    .select("log_date, notes")
    .eq("user_id", OPERATOR.userId)
    .gte("log_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("log_date", { ascending: false });

  return (data ?? []) as DayLog[];
}

export default async function HealthPage() {
  const logs = await getLogs();

  const nutritionData = logs
    .filter((l) => l.notes?.nutrition?.meals?.length)
    .map((l) => {
      const meals = l.notes.nutrition!.meals;
      const totals = meals.reduce(
        (acc, m) => ({ kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }),
        { kcal: 0, p: 0, c: 0, f: 0 }
      );
      return { date: l.log_date, ...totals };
    });

  const avgKcal =
    nutritionData.length > 0
      ? nutritionData.reduce((s, d) => s + d.kcal, 0) / nutritionData.length
      : 0;

  const habitLogs = logs.filter((l) => l.notes?.habits);
  const allHabitKeys = [...new Set(habitLogs.flatMap((l) => Object.keys(l.notes.habits ?? {})))];

  return (
    <PageShell>
      <h1 className="text-xl font-semibold text-[var(--ink-4)] mb-6">Health</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Panel className="p-4 text-center">
          <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider mb-1">Avg Daily kcal</p>
          <p className="num text-2xl font-bold text-[var(--ok)]">{avgKcal.toFixed(0)}</p>
          <p className="text-xs text-[var(--ink-3)] mt-1">30-day average</p>
        </Panel>
        <Panel className="p-4 text-center">
          <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider mb-1">Tracking Days</p>
          <p className="num text-2xl font-bold text-[var(--accent)]">{nutritionData.length}</p>
          <p className="text-xs text-[var(--ink-3)] mt-1">of last 30 days</p>
        </Panel>
        <Panel className="p-4 text-center">
          <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider mb-1">Habit Logs</p>
          <p className="num text-2xl font-bold text-[var(--warn)]">{habitLogs.length}</p>
          <p className="text-xs text-[var(--ink-3)] mt-1">days recorded</p>
        </Panel>
      </div>

      {allHabitKeys.length > 0 && (
        <Panel className="mb-6 p-4">
          <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Habit Heatmap (30 days)</h3>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="text-left text-[var(--ink-3)] pb-2 pr-4 font-medium">Habit</th>
                  {logs.slice(0, 14).map((l) => (
                    <th key={l.log_date} className="pb-2 px-1 text-[var(--ink-3)] font-normal text-center">
                      {new Date(l.log_date).getDate()}
                    </th>
                  ))}
                  <th className="pb-2 px-2 text-[var(--ink-3)] font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {allHabitKeys.map((habit) => {
                  const completions = habitLogs.filter((l) => l.notes.habits?.[habit]).length;
                  const pct = habitLogs.length > 0 ? (completions / habitLogs.length) * 100 : 0;
                  return (
                    <tr key={habit}>
                      <td className="pr-4 py-1 text-[var(--ink-4)] whitespace-nowrap">{habit}</td>
                      {logs.slice(0, 14).map((l) => {
                        const done = l.notes.habits?.[habit];
                        return (
                          <td key={l.log_date} className="px-1 py-1 text-center">
                            <span
                              className="inline-block w-4 h-4 rounded-sm"
                              style={{ background: done ? "var(--ok)" : "var(--ink-2)" }}
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-right num" style={{ color: pct >= 80 ? "var(--ok)" : pct >= 50 ? "var(--warn)" : "var(--danger)" }}>
                        {pct.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {nutritionData.length > 0 && (
        <Panel className="mb-6 p-4">
          <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3">Nutrition Log (30 days)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--ink-3)] border-b border-[var(--ink-2)]">
                <th className="pb-2 text-left font-medium">Date</th>
                <th className="pb-2 text-right font-medium">kcal</th>
                <th className="pb-2 text-right font-medium">Protein</th>
                <th className="pb-2 text-right font-medium">Carbs</th>
                <th className="pb-2 text-right font-medium">Fat</th>
              </tr>
            </thead>
            <tbody>
              {nutritionData.map((d) => (
                <tr key={d.date} className="border-b border-[var(--ink-2)] last:border-0">
                  <td className="py-1.5 text-[var(--ink-3)]">{d.date}</td>
                  <td className="py-1.5 text-right num text-[var(--ok)]">{d.kcal}</td>
                  <td className="py-1.5 text-right num text-[var(--accent)]">{d.p}g</td>
                  <td className="py-1.5 text-right num text-[var(--warn)]">{d.c}g</td>
                  <td className="py-1.5 text-right num text-[var(--ink-3)]">{d.f}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <HealthLogClient />
    </PageShell>
  );
}
