import { HomeShell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { FinancePulseCard } from "@/components/dashboard/FinancePulseCard";
import { KeyBlockersCard } from "@/components/dashboard/KeyBlockersCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { HabitTrackerCard } from "@/components/dashboard/HabitTrackerCard";
import { PrioritiesCard } from "@/components/dashboard/PrioritiesCard";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
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
        .select("id,title,urgency,key,priority_score,time_estimate_min")
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
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const tasks =
      tasksRes.status === "fulfilled" ? (tasksRes.value.data ?? []) : [];
    const goalsNotes =
      goalsRes.status === "fulfilled" && goalsRes.value.data?.notes
        ? JSON.parse(goalsRes.value.data.notes)
        : {};
    const finance =
      financeRes.status === "fulfilled" && financeRes.value.data?.notes
        ? JSON.parse(financeRes.value.data.notes)?.finance ?? null
        : null;

    return { tasks, goalsNotes, finance };
  } catch {
    return { tasks: [], goalsNotes: {}, finance: null };
  }
}

export default async function HomePage() {
  const { tasks, goalsNotes, finance } = await getData();

  const sessionTasks = tasks
    .filter((t) => t.urgency === "today" && t.key)
    .slice(0, 3);

  const blockers = tasks
    .filter((t) => t.urgency === "today" && !t.key)
    .slice(0, 4);

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
