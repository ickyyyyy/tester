"use client";

import { Panel } from "./Panel";

export function KeyBlockersCard({ tasks }: { tasks?: { id: string; title: string }[] }) {
  const items = tasks ?? [];

  return (
    <Panel title="Key Blockers">
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>
          No blockers — clear runway.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-2 text-xs"
              style={{ color: "var(--ink-4)" }}
            >
              <span style={{ color: "var(--danger)" }}>▲</span>
              {t.title}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
