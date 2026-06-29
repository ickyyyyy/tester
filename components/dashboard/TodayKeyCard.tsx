"use client";

import { Panel } from "./Panel";

export interface TodayTask {
  id: string;
  title: string;
  time_estimate_min?: number | null;
  temperature?: string;
  urgency?: string;
}

const tempColor: Record<string, string> = {
  hot:  "var(--danger)",
  warm: "var(--warn)",
  cool: "var(--accent)",
};

export function TodayKeyCard({ tasks }: { tasks?: TodayTask[] }) {
  const items = tasks ?? [];

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>Today · Key</p>
        <span className="num text-[10px] font-semibold" style={{ color: "var(--ink-3)" }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>No key tasks — looking clear.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.slice(0, 6).map((t, i) => (
            <div key={t.id} className="flex items-start gap-2">
              <span className="num text-[10px] font-bold mt-0.5 w-4 shrink-0" style={{ color: "var(--accent)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug" style={{ color: "var(--ink-4)" }}>{t.title}</p>
                {t.time_estimate_min && (
                  <span className="num text-[10px]" style={{ color: "var(--ink-3)" }}>~{t.time_estimate_min}m</span>
                )}
              </div>
              {t.temperature && t.temperature !== "warm" && (
                <span
                  className="text-[9px] font-bold uppercase shrink-0 mt-0.5"
                  style={{ color: tempColor[t.temperature] ?? "var(--warn)" }}
                >
                  {t.temperature}
                </span>
              )}
            </div>
          ))}
          {items.length > 6 && (
            <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>+{items.length - 6} more</p>
          )}
        </div>
      )}
    </Panel>
  );
}
