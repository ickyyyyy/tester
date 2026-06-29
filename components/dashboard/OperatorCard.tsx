import { Panel } from "./Panel";
import { OPERATOR } from "@/lib/config/operator";

export function OperatorCard() {
  return (
    <Panel title="Operator">
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold" style={{ color: "var(--ink-4)" }}>
          {OPERATOR.name}
        </p>
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>
          {OPERATOR.role} · {OPERATOR.location}
        </p>
      </div>
      <div
        className="rounded-md px-3 py-2 text-xs"
        style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
      >
        <span style={{ color: "var(--ink-3)" }}>Focus → </span>
        {OPERATOR.focus}
      </div>
    </Panel>
  );
}
