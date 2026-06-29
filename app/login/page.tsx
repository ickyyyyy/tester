"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(params.get("from") ?? "/");
    } else {
      setError("Wrong password.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center" style={{ background: "var(--ink-0)" }}>
      <form
        onSubmit={submit}
        className="glass flex flex-col gap-4 p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--ink-4)" }}>
          Personal OS
        </h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{
            background: "var(--ink-2)",
            color: "var(--ink-4)",
            border: "1px solid var(--ink-2)",
          }}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--ink-0)" }}
        >
          {loading ? "…" : "Enter"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
