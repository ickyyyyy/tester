"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Panel } from "./Panel";

interface JournalEntry {
  id: string;
  raw_text: string;
  classification: { summary: string; tags: string[]; kind?: string };
  created_at: string;
}

export function JournalCard() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [compose, setCompose] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const finalVoiceRef = useRef("");

  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/entries");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    baseTextRef.current = compose;
    finalVoiceRef.current = "";

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalVoiceRef.current += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const base = baseTextRef.current;
      const voice = finalVoiceRef.current + interim;
      setCompose(base + (base && voice ? " " : "") + voice);
    };

    recognition.onend = () => {
      setListening(false);
      const base = baseTextRef.current;
      const voice = finalVoiceRef.current.trim();
      setCompose(base + (base && voice ? " " : "") + voice);
    };

    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function save() {
    const text = compose.trim();
    if (!text) return;
    recognitionRef.current?.stop();
    setSaving(true);
    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, source: "journal" }),
      });
      setCompose("");
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <Panel title="Journal">
      {/* Compose */}
      <form onSubmit={e => { e.preventDefault(); save(); }} className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            value={compose}
            onChange={e => setCompose(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }}
            placeholder="Write a thought, reflection, or note… (⌘↵)"
            rows={3}
            className="w-full rounded px-3 py-2 pr-9 text-xs outline-none resize-none"
            style={{ background: "var(--ink-2)", color: "var(--ink-4)" }}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              title={listening ? "Stop recording" : "Speak to write"}
              className="absolute right-2 top-2 w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{
                background: listening ? "var(--danger)" : "var(--ink-3)",
                color: "var(--ink-0)",
              }}
            >
              {listening ? (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                  <rect width="6" height="6" rx="0.5" />
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <rect x="2.5" y="0.5" width="4" height="5" rx="2" />
                  <path d="M1 4.5a3.5 3.5 0 006 0" />
                  <line x1="4.5" y1="8" x2="4.5" y2="6.5" />
                </svg>
              )}
            </button>
          )}
        </div>

        {listening && (
          <p className="text-[10px] animate-pulse" style={{ color: "var(--danger)" }}>
            ● Recording — speak now
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !compose.trim()}
          className="self-end rounded px-3 py-1 text-xs font-bold disabled:opacity-40 transition-opacity"
          style={{ background: "var(--accent)", color: "var(--ink-0)" }}
        >
          {saving ? "…" : "Save"}
        </button>
      </form>

      {/* Entry feed */}
      {loading ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>No entries yet — write or speak above.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
          {entries.slice(0, 12).map(e => (
            <div key={e.id} className="flex flex-col gap-0.5 pb-2 border-b" style={{ borderColor: "var(--ink-2)" }}>
              <p className="text-xs leading-snug" style={{ color: "var(--ink-4)" }}>
                {e.raw_text.length > 100 ? e.raw_text.slice(0, 100) + "…" : e.raw_text}
              </p>
              <div className="flex items-center gap-2">
                {e.classification?.kind && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    {e.classification.kind}
                  </span>
                )}
                <span className="text-[9px]" style={{ color: "var(--ink-3)" }}>{relativeTime(e.created_at)}</span>
              </div>
            </div>
          ))}
          {entries.length > 12 && (
            <a href="/journal" className="text-[10px] text-center py-0.5" style={{ color: "var(--accent)" }}>
              View all {entries.length} entries →
            </a>
          )}
        </div>
      )}
    </Panel>
  );
}
