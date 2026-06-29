"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { label: "Home",    href: "/" },
  { label: "CRM",     href: "/crm" },
  { label: "Brain",   href: "/brain" },
  { label: "Finance", href: "/finance" },
  { label: "Journal", href: "/journal" },
  { label: "Health",  href: "/health" },
  { label: "Review",  href: "/review" },
];

export function TopRail() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
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
      className="sticky top-0 z-50 flex items-center gap-4 px-5 h-12 border-b"
      style={{
        background: "oklch(from var(--ink-0) l c h / 0.88)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--ink-2)",
      }}
    >
      {/* Brand */}
      <span
        className="text-sm font-bold tracking-tight shrink-0"
        style={{ color: "var(--accent)" }}
      >
        OS
      </span>

      {/* Nav tabs */}
      <nav className="flex gap-1 flex-1">
        {TABS.map((t) => {
          const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: active ? "var(--ink-2)" : "transparent",
                color: active ? "var(--accent)" : "var(--ink-3)",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* Clock + avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="num text-xs" style={{ color: "var(--ink-3)" }}>
          {time}
        </span>
        <button
          onClick={logout}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--ink-2)", color: "var(--accent)" }}
          title="Log out"
        >
          U
        </button>
      </div>
    </header>
  );
}
