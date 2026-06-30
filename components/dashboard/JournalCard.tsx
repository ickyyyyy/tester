"use client";

import { useState, useEffect, useRef } from "react";
import { Panel } from "./Panel";

export function JournalCard() {
  const [compose, setCompose] = useState("");
  const [saving, setSaving] = useState(false);
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
    } catch { /* ignore */ }
    finally { setSaving(false); }
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

      <a href="/journal" className="text-[10px]" style={{ color: "var(--accent)" }}>
        View entries in Journal tab →
      </a>
    </Panel>
  );
}
