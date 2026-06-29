"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface Entity {
  id: string;
  name: string;
  type: string;
  kind?: string;
  status?: string;
  tags?: string[];
  last_contact?: string;
  notes?: string;
  priority?: string;
  temperature?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const STATUSES = ["lead", "active", "nurture", "closed"] as const;
const TYPES = ["person", "company", "partner", "investor"] as const;
const PRIORITIES = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;
const TEMPS = ["hot", "warm", "cool"] as const;

const tempColor: Record<string, string> = {
  hot: "var(--danger)", warm: "var(--warn)", cool: "var(--accent)",
};

const prioColor: Record<string, string> = {
  p1: "var(--danger)", p2: "var(--warn)", p3: "var(--accent)",
  p4: "var(--ok)", p5: "var(--ink-3)", p6: "var(--ink-3)", p7: "var(--ink-3)",
};

function isOverdue(e: Entity) {
  if (!e.last_contact) return false;
  const days = Math.floor((Date.now() - new Date(e.last_contact).getTime()) / 86_400_000);
  return days > 14;
}

function isThisWeek(e: Entity) {
  if (!e.last_contact) return false;
  const days = Math.floor((Date.now() - new Date(e.last_contact).getTime()) / 86_400_000);
  return days <= 7;
}

type TimeFilter = "all" | "overdue" | "today" | "week" | "later";

export default function CRMPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list" | "category">("kanban");
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("person");
  const [newStatus, setNewStatus] = useState<string>("lead");
  const [newPriority, setNewPriority] = useState<string>("p5");
  const [newTemp, setNewTemp] = useState<string>("warm");
  const [cmdOpen, setCmdOpen] = useState(false);
  const cmdRef = useRef<HTMLInputElement>(null);
  const [cmdQuery, setCmdQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/entities");
    if (res.ok) { const d = await res.json(); setEntities(d.entities ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ⌘K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") { setCmdOpen(false); setCmdQuery(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (cmdOpen) cmdRef.current?.focus(); }, [cmdOpen]);

  const filtered = entities.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchTime =
      timeFilter === "all" ? true :
      timeFilter === "overdue" ? isOverdue(e) :
      timeFilter === "today" ? !isThisWeek(e) && !isOverdue(e) :
      timeFilter === "week" ? isThisWeek(e) :
      !e.last_contact;
    return matchSearch && matchTime;
  });

  const cmdFiltered = entities.filter(e =>
    !cmdQuery || e.name.toLowerCase().includes(cmdQuery.toLowerCase())
  ).slice(0, 6);

  const byStatus = (status: string) => filtered.filter(e => (e.status ?? "lead") === status);
  const overdueCnt = entities.filter(isOverdue).length;

  async function addEntity() {
    if (!newName.trim()) return;
    const res = await fetch("/api/crm/entities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType, status: newStatus, priority: newPriority, temperature: newTemp }),
    });
    if (res.ok) { setNewName(""); setShowAdd(false); load(); }
  }

  async function updateField(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/crm/entities/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  const EntityCard = ({ entity: e }: { entity: Entity }) => {
    const temp = e.temperature ?? "warm";
    const prio = e.priority ?? "p5";
    return (
      <div className="glass p-3 mb-2 hover:border-[var(--accent)] transition-colors">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase" style={{ color: prioColor[prio] }}>{prio.toUpperCase()}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tempColor[temp] }}>{temp}</span>
            </div>
            <p className="font-medium text-[var(--ink-4)] text-sm truncate">{e.name}</p>
            <p className="text-[10px] text-[var(--ink-3)] mt-0.5">{e.type ?? e.kind ?? "person"}</p>
          </div>
          {e.tags && e.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 shrink-0">
              {e.tags.slice(0, 2).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--ink-2)] text-[var(--ink-3)]">{t}</span>
              ))}
            </div>
          )}
        </div>
        {e.notes && <p className="text-[10px] text-[var(--ink-3)] mb-2 line-clamp-2">{e.notes}</p>}
        {e.last_contact && (
          <p className="text-[10px] text-[var(--ink-3)] mb-2">Last {new Date(e.last_contact).toLocaleDateString()}</p>
        )}
        <div className="flex gap-1 flex-wrap">
          {TEMPS.map(t => (
            <button key={t} onClick={() => updateField(e.id, { temperature: t })}
              className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
              style={{ background: temp === t ? tempColor[t] : "var(--ink-2)", color: temp === t ? "var(--ink-0)" : "var(--ink-3)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const TIME_TABS: { key: TimeFilter; label: string }[] = [
    { key: "overdue", label: `Overdue${overdueCnt > 0 ? ` · ${overdueCnt}` : ""}` },
    { key: "today",   label: "Today" },
    { key: "week",    label: "This Week" },
    { key: "later",   label: "Later" },
    { key: "all",     label: "All" },
  ];

  return (
    <PageShell>
      {/* ⌘K command palette */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/40" onClick={() => setCmdOpen(false)}>
          <div className="glass w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <input
              ref={cmdRef}
              value={cmdQuery}
              onChange={e => setCmdQuery(e.target.value)}
              placeholder="Search people, companies…"
              className="w-full px-5 py-4 text-sm text-[var(--ink-4)] bg-transparent outline-none border-b border-[var(--ink-2)]"
            />
            {cmdFiltered.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--ink-2)] cursor-pointer transition-colors"
                onClick={() => { setCmdOpen(false); setCmdQuery(""); setSearch(e.name); }}>
                <span className="text-[10px] font-bold uppercase" style={{ color: prioColor[e.priority ?? "p5"] }}>{(e.priority ?? "p5").toUpperCase()}</span>
                <span className="text-sm text-[var(--ink-4)]">{e.name}</span>
                <span className="text-xs text-[var(--ink-3)] ml-auto">{e.type ?? e.kind}</span>
              </div>
            ))}
            {cmdFiltered.length === 0 && <p className="px-5 py-3 text-sm text-[var(--ink-3)]">No results</p>}
            <p className="px-5 py-2 text-[10px] text-[var(--ink-3)] border-t border-[var(--ink-2)]">⌘K to close</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--ink-4)]">CRM</h1>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="glass px-3 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none w-36" />
          <button onClick={() => setCmdOpen(true)} className="glass px-3 py-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink-4)]">⌘K</button>
          <div className="flex glass rounded-lg overflow-hidden">
            {(["kanban", "list", "category"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs transition-colors ${view === v ? "bg-[var(--accent)] text-[var(--ink-0)]" : "text-[var(--ink-3)]"}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} className="glass px-3 py-1.5 text-sm text-[var(--accent)]">+ Add</button>
        </div>
      </div>

      {/* Time filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-[var(--ink-2)] pb-3">
        {TIME_TABS.map(tab => (
          <button key={tab.key} onClick={() => setTimeFilter(tab.key)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${timeFilter === tab.key ? "bg-[var(--accent)] text-[var(--ink-0)]" : "text-[var(--ink-3)] hover:text-[var(--ink-4)]"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {showAdd && (
        <Panel className="mb-5 p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: "Name", el: <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addEntity(); if (e.key === "Escape") setShowAdd(false); }} className="glass px-3 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none w-full" /> },
              { label: "Type", el: <select value={newType} onChange={e => setNewType(e.target.value)} className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-[var(--ink-1)] outline-none w-full">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select> },
              { label: "Status", el: <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-[var(--ink-1)] outline-none w-full">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select> },
              { label: "Priority", el: <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-[var(--ink-1)] outline-none w-full">{PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}</select> },
            ].map(({ label, el }) => (
              <div key={label}><label className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider block mb-1">{label}</label>{el}</div>
            ))}
          </div>
          <div className="flex gap-2">
            {TEMPS.map(t => (
              <button key={t} onClick={() => setNewTemp(t)}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{ background: newTemp === t ? tempColor[t] : "var(--ink-2)", color: newTemp === t ? "var(--ink-0)" : "var(--ink-3)" }}>
                {t}
              </button>
            ))}
            <button onClick={addEntity} className="ml-auto glass px-4 py-1 text-sm text-[var(--accent)]">Save</button>
            <button onClick={() => setShowAdd(false)} className="text-sm text-[var(--ink-3)]">Cancel</button>
          </div>
        </Panel>
      )}

      {loading ? <p className="text-sm text-[var(--ink-3)]">Loading…</p>
        : view === "kanban" ? (
          <div className="grid grid-cols-4 gap-4">
            {STATUSES.map(status => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{status}</span>
                  <span className="text-[10px] text-[var(--ink-3)] num">{byStatus(status).length}</span>
                </div>
                {byStatus(status).map(e => <EntityCard key={e.id} entity={e} />)}
              </div>
            ))}
          </div>
        ) : view === "list" ? (
          <Panel>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[var(--ink-3)] border-b border-[var(--ink-2)] uppercase tracking-wider">
                  <th className="pb-2 font-medium pr-4">Prio</th>
                  <th className="pb-2 font-medium pr-4">Name</th>
                  <th className="pb-2 font-medium pr-4">Type</th>
                  <th className="pb-2 font-medium pr-4">Status</th>
                  <th className="pb-2 font-medium pr-4">Temp</th>
                  <th className="pb-2 font-medium">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => (a.priority ?? "p5").localeCompare(b.priority ?? "p5")).map(e => (
                  <tr key={e.id} className="border-b border-[var(--ink-2)] last:border-0">
                    <td className="py-2 pr-4"><span className="text-xs font-bold" style={{ color: prioColor[e.priority ?? "p5"] }}>{(e.priority ?? "p5").toUpperCase()}</span></td>
                    <td className="py-2 pr-4 text-[var(--ink-4)] font-medium">{e.name}</td>
                    <td className="py-2 pr-4 text-[var(--ink-3)] text-xs">{e.type ?? e.kind}</td>
                    <td className="py-2 pr-4"><span className={`text-[10px] px-2 py-0.5 rounded ${e.status === "active" ? "bg-[var(--ok)]/20 text-[var(--ok)]" : "bg-[var(--ink-2)] text-[var(--ink-3)]"}`}>{e.status ?? "lead"}</span></td>
                    <td className="py-2 pr-4"><span className="text-[10px] font-semibold uppercase" style={{ color: tempColor[e.temperature ?? "warm"] }}>{(e.temperature ?? "warm").toUpperCase()}</span></td>
                    <td className="py-2 text-[var(--ink-3)] text-xs">{e.last_contact ? new Date(e.last_contact).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {TYPES.map(type => {
              const items = filtered.filter(e => (e.type ?? e.kind) === type);
              if (!items.length) return null;
              return (
                <Panel key={type}>
                  <h3 className="text-xs font-semibold text-[var(--ink-4)] mb-3 uppercase tracking-wider">{type}s <span className="text-[var(--ink-3)] num">{items.length}</span></h3>
                  {items.map(e => <EntityCard key={e.id} entity={e} />)}
                </Panel>
              );
            })}
          </div>
        )}
    </PageShell>
  );
}
