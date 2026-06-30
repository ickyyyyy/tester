"use client";

import { useState } from "react";

interface Fields {
  net_worth: string;
  monthly_income: string;
  monthly_expenses: string;
  liquid: string;
  invested: string;
  liabilities: string;
}

const EMPTY: Fields = {
  net_worth: "",
  monthly_income: "",
  monthly_expenses: "",
  liquid: "",
  invested: "",
  liabilities: "",
};

export default function FinanceRefreshButton() {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function set(k: keyof Fields, v: string) {
    setFields(f => ({ ...f, [k]: v }));
  }

  function num(v: string) {
    const n = parseFloat(v.replace(/,/g, ""));
    return isNaN(n) ? undefined : n;
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const nw = num(fields.net_worth);
    const income = num(fields.monthly_income);
    const expenses = num(fields.monthly_expenses);
    const liquid = num(fields.liquid);
    const invested = num(fields.invested);
    const liabilities = num(fields.liabilities);

    const savings_rate = income && expenses ? ((income - expenses) / income) * 100 : undefined;
    const runway_months = expenses && liquid ? liquid / expenses : undefined;

    const snapshot = {
      net_worth: nw,
      monthly_income: income,
      monthly_expenses: expenses,
      liquid,
      invested,
      liabilities,
      savings_rate,
      runway_months,
    };

    const res = await fetch("/api/finance/snapshot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(snapshot),
    });

    if (res.ok) {
      setMsg("Saved!");
      setOpen(false);
      setFields(EMPTY);
      setTimeout(() => { setMsg(""); window.location.reload(); }, 800);
    } else {
      setMsg("Save failed.");
    }
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs" style={{ color: "var(--ok)" }}>{msg}</span>}
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1.5 text-sm rounded-md border transition-colors"
        style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "transparent" }}
      >
        {open ? "Cancel" : "✏ Update Numbers"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-xl p-6 w-96 flex flex-col gap-4"
            style={{ background: "var(--ink-1)", border: "1px solid var(--ink-2)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>
              Update Finance Numbers
            </h2>

            {(
              [
                { key: "net_worth", label: "Net Worth" },
                { key: "liquid", label: "Liquid Cash" },
                { key: "invested", label: "Invested Assets" },
                { key: "liabilities", label: "Liabilities" },
                { key: "monthly_income", label: "Monthly Income" },
                { key: "monthly_expenses", label: "Monthly Expenses" },
              ] as { key: keyof Fields; label: string }[]
            ).map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                  {label}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={fields[key]}
                  onChange={e => set(key, e.target.value)}
                  className="rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--ink-2)", color: "var(--ink-4)", border: "1px solid var(--ink-2)" }}
                />
              </div>
            ))}

            <button
              onClick={save}
              disabled={saving}
              className="rounded-md py-2 text-sm font-semibold disabled:opacity-40 mt-1"
              style={{ background: "var(--accent)", color: "var(--ink-0)" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
