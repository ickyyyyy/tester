"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { OPERATOR } from "@/lib/config/operator";

export function OperatorCard() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: OPERATOR.timezone }));
      setDate(now.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", timeZone: OPERATOR.timezone }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const utcOffset = (() => {
    try {
      const off = -new Date().getTimezoneOffset();
      return `UTC${off >= 0 ? "+" : ""}${off / 60}`;
    } catch { return "UTC"; }
  })();

  return (
    <Panel accent>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ok)]">Online</span>
        </div>
        <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{utcOffset}</span>
      </div>
      <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">
        {OPERATOR.role} · {OPERATOR.location}
      </p>
      <p className="text-base font-semibold text-[var(--ink-4)] mb-3">{OPERATOR.name}</p>
      <p className="num text-2xl font-bold text-[var(--ink-4)] tracking-tight">{time}</p>
      <p className="text-xs text-[var(--ink-3)] mt-0.5 uppercase tracking-wider">{date}</p>
    </Panel>
  );
}
