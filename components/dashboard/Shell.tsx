import { ReactNode } from "react";

/** Three-column home layout: narrow | wide | narrow */
export function HomeShell({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[220px_1fr_220px] gap-3 p-4 min-h-[calc(100dvh-3rem)]">
      <div className="flex flex-col gap-3">{left}</div>
      <div className="flex flex-col gap-3">{center}</div>
      <div className="flex flex-col gap-3">{right}</div>
    </div>
  );
}

/** Full-width single-column layout for tab pages */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col gap-4">{children}</div>
  );
}
