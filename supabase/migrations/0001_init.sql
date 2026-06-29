-- Enable pgvector
create extension if not exists vector;

-- ── entities ──────────────────────────────────────────────────────────
create table entities (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  kind        text not null,            -- person | company | project | etc.
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ── raw_captures ──────────────────────────────────────────────────────
create table raw_captures (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  source          text not null,        -- telegram | web
  raw_text        text not null,
  audio_url       text,
  classification  jsonb,
  llm_source      text,
  routed_to       text,
  routed_id       uuid,
  created_at      timestamptz not null default now()
);

-- ── tasks ─────────────────────────────────────────────────────────────
create table tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  title               text not null,
  description         text,
  urgency             text not null default 'someday',  -- today | week | month | someday
  key                 boolean not null default false,
  priority_score      float8 not null default 0,
  time_estimate_min   int,
  tags                text[] not null default '{}',
  due_date            date,
  owner               text,
  entity_id           uuid references entities(id) on delete set null,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── daily_logs ────────────────────────────────────────────────────────
create table daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  log_date    date not null,
  notes       text,                     -- JSON blob for habits/nutrition/finance/goals
  mood        int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ── memory_chunks ─────────────────────────────────────────────────────
create table memory_chunks (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  source_type  text not null,           -- capture | task | journal | habit | meal
  source_id    uuid,
  text         text not null,
  embedding    vector(1536),
  created_at   timestamptz not null default now()
);

create index on memory_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── audit_log ─────────────────────────────────────────────────────────
create table audit_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  action         text not null,
  resource_type  text,
  resource_id    uuid,
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ── Row-Level Security (deny-all; service role bypasses) ──────────────
alter table entities       enable row level security;
alter table raw_captures   enable row level security;
alter table tasks          enable row level security;
alter table daily_logs     enable row level security;
alter table memory_chunks  enable row level security;
alter table audit_log      enable row level security;

-- deny-all policies (service role key always bypasses RLS)
create policy "deny all" on entities       for all using (false);
create policy "deny all" on raw_captures   for all using (false);
create policy "deny all" on tasks          for all using (false);
create policy "deny all" on daily_logs     for all using (false);
create policy "deny all" on memory_chunks  for all using (false);
create policy "deny all" on audit_log      for all using (false);
