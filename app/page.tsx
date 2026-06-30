import { HomeShell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { FinancePulseCard } from "@/components/dashboard/FinancePulseCard";
import { TodayKeyCard } from "@/components/dashboard/TodayKeyCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { HabitTrackerCard } from "@/components/dashboard/HabitTrackerCard";
import { PrioritiesCard } from "@/components/dashboard/PrioritiesCard";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { JournalCard } from "@/components/dashboard/JournalCard";
import { CaptureBox } from "@/components/dashboard/CaptureBox";
import { adminClient } from "@/lib/supabase";
import { OPERATOR } from "@/lib/config/operator";

async function getData() {
  try {
    const db = adminClient();
    const userId = OPERATOR.userId;

    const [tasksRes, goalsRes] = await Promise.allSettled([
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
    ]);

    const tasks = tasksRes.status === "fulfilled" ? (tasksRes.value.data ?? []) : [];
    const goalsNotes =
      goalsRes.status === "fulfilled" && goalsRes.value.data?.notes
        ? JSON.parse(goalsRes.value.data.notes as string)
        : {};

    return { tasks, goalsNotes };
  } catch {
    return { tasks: [], goalsNotes: {}, finance: null };
  }
}

export default async function HomePage() {
  const { tasks, goalsNotes } = await getData();

  const sessionTasks = tasks.filter((t) => t.urgency === "today" && t.key).slice(0, 3);
  const todayTasks = tasks
    .filter((t) => t.urgency === "today")
    .map(t => ({
      id: t.id,
      title: t.title,
      temperature: t.temperature ?? "warm",
      time_estimate_min: t.time_estimate_min ?? null,
      urgency: t.urgency,
    }))
    .slice(0, 8);

  return (
    <>
      <HomeShell
        left={
          <>
            <OperatorCard />
            <FinancePulseCard />
            <TodayKeyCard tasks={todayTasks} />
          </>
        }
        center={
          <>
            <SessionCard tasks={sessionTasks} />
            <HabitTrackerCard />
            <JournalCard />
            <CalendarCard />
          </>
        }
        right={
          <>
            <PrioritiesCard
              weekItems={goalsNotes.goals_week_items ?? []}
              monthItems={goalsNotes.goals_month_items ?? []}
            />
            <NutritionCard />
          </>
        }
      />
      <CaptureBox />
    </>
  );
}
