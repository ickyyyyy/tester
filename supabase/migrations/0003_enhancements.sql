-- Tasks: blocker + temperature fields
alter table tasks add column if not exists temperature  text    default 'warm';   -- hot | warm | cool
alter table tasks add column if not exists stuck_since  date;
alter table tasks add column if not exists is_blocker   boolean not null default false;
alter table tasks add column if not exists status       text    not null default 'open'; -- open | in_progress | done | blocked

-- Entities: full CRM columns (kind stays for legacy; type is the preferred label)
alter table entities add column if not exists type         text    not null default 'person';
alter table entities add column if not exists status       text    not null default 'lead';
alter table entities add column if not exists tags         text[]  not null default '{}';
alter table entities add column if not exists last_contact date;
alter table entities add column if not exists priority     text    default 'p5';    -- p1–p7
alter table entities add column if not exists temperature  text    default 'warm';  -- hot | warm | cool
alter table entities add column if not exists notes        text;
alter table entities add column if not exists updated_at   timestamptz not null default now();
update entities set type = kind where type = 'person' and kind <> 'person';

-- Weekly reviews
create table if not exists weekly_reviews (
  id                uuid        primary key default gen_random_uuid(),
  user_id           text        not null,
  week_start        date        not null,
  wins              text,
  open_loops        text,
  content_shipped   text,
  next_week_top3    text,
  what_slipped      text,
  people_to_follow  text,
  health_pattern    text,
  sealed            boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table weekly_reviews enable row level security;
create policy "deny all" on weekly_reviews for all using (false);
