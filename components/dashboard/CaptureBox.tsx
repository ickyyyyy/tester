"use client";

import { useState, useRef } from "react";

export function CaptureBox() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setToast(`Captured → ${data.routed_to ?? "inbox"}`);
      setText("");
      setOpen(false);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
      setToast("Failed to capture");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-xs font-medium z-50"
          style={{ background: "var(--ok)", color: "var(--ink-0)" }}
        >
          {toast}
        </div>
      )}

      {/* Floating bar */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass"
        style={{ width: open ? "min(520px, 92vw)" : "auto", transition: "width 0.2s" }}
      >
        {open ? (
          <div className="flex flex-col gap-2 p-3">
            <textarea
              ref={ref}
              autoFocus
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                if (e.key === "Escape") { setOpen(false); setText(""); }
              }}
              placeholder="Capture a thought, task, or note… (⌘↵ to send)"
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => { setOpen(false); setText(""); }}
                className="text-xs px-2"
                style={{ color: "var(--ink-3)" }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || !text.trim()}
                className="rounded-md px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                style={{ background: "var(--accent)", color: "var(--ink-0)" }}
              >
                {loading ? "…" : "Capture"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setOpen(true); setTimeout(() => ref.current?.focus(), 50); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            style={{ color: "var(--ink-3)" }}
          >
            <span style={{ color: "var(--accent)" }}>+</span>
            Capture…
          </button>
        )}
      </div>
    </>
  );
}
