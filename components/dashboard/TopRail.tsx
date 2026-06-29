"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { label: "HOME",    href: "/" },
  { label: "CRM",     href: "/crm" },
  { label: "BRAIN",   href: "/brain" },
  { label: "FINANCE", href: "/finance" },
  { label: "JOURNAL", href: "/journal" },
  { label: "HEALTH",  href: "/health" },
  { label: "REVIEW",  href: "/review" },
];

export function TopRail() {
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header
      className="sticky top-0 z-50 flex items-center h-11 px-5 border-b"
      style={{ background: "var(--ink-0)", borderColor: "var(--ink-2)" }}
    >
      <span className="text-[11px] font-bold tracking-tight shrink-0 mr-6" style={{ color: "var(--ink-4)", fontFamily: "monospace" }}>
        LANDIN OS <span style={{ color: "var(--accent)" }}>//</span> V0
      </span>

      <nav className="flex gap-0 flex-1">
        {TABS.map((t) => {
          const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className="px-3 py-1 text-[10px] font-bold tracking-widest transition-colors"
              style={{
                border: `1px solid ${active ? "var(--ink-3)" : "transparent"}`,
                color: active ? "var(--ink-4)" : "var(--ink-3)",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{date}</span>
        <span className="num text-[10px]" style={{ color: "var(--ink-3)" }}>{time}</span>
        <button
          onClick={logout}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          title="Log out"
        >
          L
        </button>
      </div>
    </header>
  );
}
