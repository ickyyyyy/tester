import { ReactNode } from "react";

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function Panel({ title, children, className = "", accent }: PanelProps) {
  return (
    <section
      className={`glass flex flex-col gap-3 p-4 ${className}`}
      style={accent ? { borderColor: "var(--accent)" } : undefined}
    >
      {title && (
        <h2
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--ink-3)" }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
