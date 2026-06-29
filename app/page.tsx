import { HomeShell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { FinancePulseCard } from "@/components/dashboard/FinancePulseCard";
import { KeyBlockersCard } from "@/components/dashboard/KeyBlockersCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { HabitTrackerCard } from "@/components/dashboard/HabitTrackerCard";
import { PrioritiesCard } from "@/components/dashboard/PrioritiesCard";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { CaptureBox } from "@/components/dashboard/CaptureBox";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

async function getData() {
  try {
    const db = adminClient();
    const userId = OPERATOR.userId;

    const [tasksRes, goalsRes, financeRes] = await Promise.allSettled([
      db
        .from("tasks")
        .select("id,title,urgency,key,priority_score,time_estimate_min,temperature,stuck_since,is_blocker,owner")
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("priority_score", { ascending: false })
        .limit(100),
      db
        .from("daily_logs")
        .select("notes")
        .eq("user_id", userId)
        .eq("log_date", "2000-01-01")
        .maybeSingle(),
      db
        .from("daily_logs")
        .select("notes")
        .eq("user_id", userId)
        .not("notes", "is", null)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const tasks = tasksRes.status === "fulfilled" ? (tasksRes.value.data ?? []) : [];
    const goalsNotes =
      goalsRes.status === "fulfilled" && goalsRes.value.data?.notes
        ? JSON.parse(goalsRes.value.data.notes as string)
        : {};
    const financeNotes =
      financeRes.status === "fulfilled" && financeRes.value.data?.notes
        ? JSON.parse(financeRes.value.data.notes as string)
        : {};

    return { tasks, goalsNotes, finance: financeNotes.finance_snapshot ?? null };
  } catch {
    return { tasks: [], goalsNotes: {}, finance: null };
  }
}

export default async function HomePage() {
  const { tasks, goalsNotes, finance } = await getData();

  const sessionTasks = tasks.filter((t) => t.urgency === "today" && t.key).slice(0, 3);
  const blockers = tasks
    .filter((t) => t.is_blocker || (t.urgency === "today" && !t.key))
    .map(t => ({
      id: t.id,
      title: t.title,
      temperature: t.temperature ?? "warm",
      owner: t.owner ?? undefined,
      stuck_since: t.stuck_since ?? undefined,
    }))
    .slice(0, 7);

  return (
    <>
      <HomeShell
        left={
          <>
            <OperatorCard />
            <FinancePulseCard data={finance} />
            <KeyBlockersCard tasks={blockers} />
          </>
        }
        center={
          <>
            <SessionCard tasks={sessionTasks} />
            <HabitTrackerCard />
            <CalendarCard />
            <PrioritiesCard
              weekItems={goalsNotes.goals_week_items ?? []}
              monthItems={goalsNotes.goals_month_items ?? []}
            />
          </>
        }
        right={
          <>
            <NutritionCard />
          </>
        }
      />
      <CaptureBox />
    </>
  );
}
