"use client";

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

export function SessionCard({ tasks }: { tasks?: Task[] }) {
  const items = (tasks ?? []).slice(0, 3);

  return (
    <Panel title="Session" accent>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>
          Nothing urgent and key for today.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((t, i) => (
            <li key={t.id} className="flex items-start gap-3">
              <span
                className="num text-xs font-bold mt-0.5 w-4 shrink-0"
                style={{ color: "var(--accent)" }}
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <Link
                  href={`/crm?task=${t.id}`}
                  className="text-sm truncate hover:underline"
                  style={{ color: "var(--ink-4)" }}
                >
                  {t.title}
                </Link>
                {t.time_estimate_min && (
                  <span className="num text-[10px]" style={{ color: "var(--ink-3)" }}>
                    ~{t.time_estimate_min}m
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
