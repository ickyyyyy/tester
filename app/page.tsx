import { HomeShell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { FinancePulseCard } from "@/components/dashboard/FinancePulseCard";
import { TodayKeyCard } from "@/components/dashboard/TodayKeyCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { HabitTrackerCard } from "@/components/dashboard/HabitTrackerCard";
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

    const { data } = await db
      .from("tasks")
      .select("id,title,urgency,key,priority_score,time_estimate_min,temperature,stuck_since,is_blocker,owner")
      .eq("user_id", userId)
      .is("completed_at", null)
      .order("priority_score", { ascending: false })
      .limit(100);

    return { tasks: data ?? [] };
  } catch {
    return { tasks: [] };
  }
}

export default async function HomePage() {
  const { tasks } = await getData();

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
            <NutritionCard />
          </>
        }
      />
      <CaptureBox />
    </>
  );
}
