"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { PageShell } from "@/components/dashboard/Shell";

interface Entity {
  id: string;
  name: string;
  type: string;
  status?: string;
  tags?: string[];
  last_contact?: string;
  notes?: string;
  created_at: string;
}

const STATUSES = ["lead", "active", "nurture", "closed"] as const;
const TYPES = ["person", "company", "partner", "investor"] as const;

export default function CRMPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list" | "category">("kanban");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("person");
  const [newStatus, setNewStatus] = useState<string>("lead");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/entities");
    if (res.ok) {
      const data = await res.json();
      setEntities(data.entities ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entities.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || e.type === filterType;
    return matchSearch && matchType;
  });

  const byStatus = (status: string) => filtered.filter((e) => (e.status ?? "lead") === status);

  async function addEntity() {
    if (!newName.trim()) return;
    const res = await fetch("/api/crm/entities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType, status: newStatus }),
    });
    if (res.ok) {
      setNewName("");
      setShowAdd(false);
      load();
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/crm/entities/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }

  const EntityCard = ({ entity }: { entity: Entity }) => (
    <div className="glass p-3 mb-2 cursor-pointer hover:border-[var(--accent)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[var(--ink-4)] text-sm">{entity.name}</p>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">{entity.type}</p>
          {entity.last_contact && (
            <p className="text-xs text-[var(--ink-3)] mt-1">
              Last: {new Date(entity.last_contact).toLocaleDateString()}
            </p>
          )}
        </div>
        {entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entity.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-[var(--ink-2)] text-[var(--ink-3)]">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 mt-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(entity.id, s)}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              (entity.status ?? "lead") === s
                ? "bg-[var(--accent)] text-[var(--ink-0)]"
                : "bg-[var(--ink-2)] text-[var(--ink-3)] hover:bg-[var(--ink-1)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink-4)]">CRM</h1>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="glass px-3 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none w-40"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none"
          >
            <option value="all">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex glass rounded-lg overflow-hidden">
            {(["kanban", "list", "category"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  view === v ? "bg-[var(--accent)] text-[var(--ink-0)]" : "text-[var(--ink-3)]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="glass px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--ink-2)] transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {showAdd && (
        <Panel className="mb-6 p-4">
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <label className="text-xs text-[var(--ink-3)] block mb-1">Name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addEntity(); if (e.key === "Escape") setShowAdd(false); }}
                className="glass px-3 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--ink-3)] block mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--ink-3)] block mb-1">Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="glass px-2 py-1.5 text-sm text-[var(--ink-4)] bg-transparent outline-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={addEntity} className="glass px-4 py-1.5 text-sm text-[var(--accent)]">Save</button>
            <button onClick={() => setShowAdd(false)} className="text-sm text-[var(--ink-3)]">Cancel</button>
          </div>
        </Panel>
      )}

      {loading ? (
        <p className="text-[var(--ink-3)] text-sm">Loading…</p>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-4 gap-4">
          {STATUSES.map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">{status}</span>
                <span className="text-xs text-[var(--ink-3)] num">{byStatus(status).length}</span>
              </div>
              {byStatus(status).map((e) => <EntityCard key={e.id} entity={e} />)}
            </div>
          ))}
        </div>
      ) : view === "list" ? (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--ink-3)] border-b border-[var(--ink-2)]">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-[var(--ink-2)] last:border-0">
                  <td className="py-2 text-[var(--ink-4)]">{e.name}</td>
                  <td className="py-2 text-[var(--ink-3)]">{e.type}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      e.status === "active" ? "bg-[var(--ok)]/20 text-[var(--ok)]" :
                      e.status === "lead" ? "bg-[var(--accent)]/20 text-[var(--accent)]" :
                      e.status === "closed" ? "bg-[var(--ink-2)] text-[var(--ink-3)]" :
                      "bg-[var(--warn)]/20 text-[var(--warn)]"
                    }`}>{e.status ?? "lead"}</span>
                  </td>
                  <td className="py-2 text-[var(--ink-3)]">
                    {e.last_contact ? new Date(e.last_contact).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {TYPES.map((type) => {
            const items = filtered.filter((e) => e.type === type);
            if (!items.length) return null;
            return (
              <Panel key={type}>
                <h3 className="text-sm font-semibold text-[var(--ink-4)] mb-3 capitalize">{type}s</h3>
                {items.map((e) => <EntityCard key={e.id} entity={e} />)}
              </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
