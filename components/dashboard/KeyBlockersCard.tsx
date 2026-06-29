"use client";

import { Panel } from "./Panel";

export interface BlockerTask {
  id: string;
  title: string;
  temperature?: string;
  owner?: string;
  stuck_since?: string;
}

function stuckDays(since?: string): number {
  if (!since) return 0;
  return Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
}

const tempColor: Record<string, string> = {
  hot: "var(--danger)",
  warm: "var(--warn)",
  cool: "var(--accent)",
};

export function KeyBlockersCard({ tasks }: { tasks?: BlockerTask[] }) {
  const items = tasks ?? [];
  const hot = items.filter(t => t.temperature === "hot");
  const rest = items.filter(t => t.temperature !== "hot");

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">Key Blockers</p>
        <span className="num text-[10px] font-semibold text-[var(--ink-3)]">{items.length} active</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-[var(--ink-3)]">No blockers — clear runway.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...hot, ...rest].slice(0, 5).map(t => {
            const temp = t.temperature ?? "warm";
            const days = stuckDays(t.stuck_since);
            return (
              <div key={t.id} className="flex flex-col gap-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 w-10 shrink-0"
                    style={{ color: tempColor[temp] ?? "var(--warn)" }}>
                    {temp.toUpperCase()}
                  </span>
                  <p className="text-xs text-[var(--ink-4)] flex-1 leading-snug">{t.title}</p>
                </div>
                <div className="flex items-center gap-2 pl-12">
                  <span className="text-[10px] text-[var(--ink-3)]">
                    Owner {t.owner ?? "You"}
                  </span>
                  {days > 0 && (
                    <span className="text-[10px] font-semibold" style={{ color: days >= 3 ? "var(--danger)" : "var(--warn)" }}>
                      · Stuck {days}d
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {items.length > 5 && (
            <p className="text-[10px] text-[var(--ink-3)]">+ {items.length - 5} more</p>
          )}
        </div>
      )}
    </Panel>
  );
}
