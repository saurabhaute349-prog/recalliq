-- MeetingMind Phase 2 — ONE-SHOT recovery migration (idempotent)
-- Run in Supabase → SQL Editor when you see:
--   PGRST205 (table not in schema cache)
--   42703 (column does not exist)
-- Safe to re-run. Reload API schema after running (Settings → API → Reload).

-- ---------------------------------------------------------------------------
-- profiles — onboarding + avatar
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step text not null default 'welcome',
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb,
  add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- meetings — organization + demo
-- ---------------------------------------------------------------------------
alter table public.meetings
  add column if not exists category text,
  add column if not exists archived boolean not null default false,
  add column if not exists pinned boolean not null default false,
  add column if not exists favorite boolean not null default false,
  add column if not exists is_demo boolean not null default false;

create index if not exists meetings_user_org_idx
  on public.meetings (user_id, pinned desc, favorite desc, created_at desc);

create index if not exists meetings_user_archived_idx
  on public.meetings (user_id, archived, created_at desc);

-- ---------------------------------------------------------------------------
-- meeting_intelligence
-- ---------------------------------------------------------------------------
create table if not exists public.meeting_intelligence (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  people jsonb not null default '[]'::jsonb,
  companies jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  deadlines jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  product_names jsonb not null default '[]'::jsonb,
  priorities jsonb not null default '[]'::jsonb,
  summary text,
  suggested_questions jsonb not null default '[]'::jsonb,
  meeting_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (meeting_id)
);

alter table public.meeting_intelligence
  add column if not exists people jsonb not null default '[]'::jsonb,
  add column if not exists companies jsonb not null default '[]'::jsonb,
  add column if not exists action_items jsonb not null default '[]'::jsonb,
  add column if not exists blockers jsonb not null default '[]'::jsonb,
  add column if not exists deadlines jsonb not null default '[]'::jsonb,
  add column if not exists decisions jsonb not null default '[]'::jsonb,
  add column if not exists risks jsonb not null default '[]'::jsonb,
  add column if not exists product_names jsonb not null default '[]'::jsonb,
  add column if not exists priorities jsonb not null default '[]'::jsonb,
  add column if not exists summary text,
  add column if not exists suggested_questions jsonb not null default '[]'::jsonb,
  add column if not exists meeting_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists meeting_intelligence_user_id_idx
  on public.meeting_intelligence (user_id);

create index if not exists meeting_intelligence_meeting_id_idx
  on public.meeting_intelligence (meeting_id);

-- ---------------------------------------------------------------------------
-- meeting_tags
-- ---------------------------------------------------------------------------
create table if not exists public.meeting_tags (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (meeting_id, tag)
);

create index if not exists meeting_tags_user_id_idx
  on public.meeting_tags (user_id);

-- ---------------------------------------------------------------------------
-- favorite_meetings
-- ---------------------------------------------------------------------------
create table if not exists public.favorite_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, meeting_id)
);

create index if not exists favorite_meetings_user_id_idx
  on public.favorite_meetings (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.meeting_intelligence enable row level security;
alter table public.meeting_tags enable row level security;
alter table public.favorite_meetings enable row level security;

drop policy if exists "meeting_intelligence_select_own" on public.meeting_intelligence;
create policy "meeting_intelligence_select_own"
  on public.meeting_intelligence for select using (auth.uid() = user_id);

drop policy if exists "meeting_intelligence_insert_own" on public.meeting_intelligence;
create policy "meeting_intelligence_insert_own"
  on public.meeting_intelligence for insert with check (auth.uid() = user_id);

drop policy if exists "meeting_intelligence_update_own" on public.meeting_intelligence;
create policy "meeting_intelligence_update_own"
  on public.meeting_intelligence for update using (auth.uid() = user_id);

drop policy if exists "meeting_intelligence_delete_own" on public.meeting_intelligence;
create policy "meeting_intelligence_delete_own"
  on public.meeting_intelligence for delete using (auth.uid() = user_id);

drop policy if exists "meeting_tags_select_own" on public.meeting_tags;
create policy "meeting_tags_select_own"
  on public.meeting_tags for select using (auth.uid() = user_id);

drop policy if exists "meeting_tags_insert_own" on public.meeting_tags;
create policy "meeting_tags_insert_own"
  on public.meeting_tags for insert with check (auth.uid() = user_id);

drop policy if exists "meeting_tags_delete_own" on public.meeting_tags;
create policy "meeting_tags_delete_own"
  on public.meeting_tags for delete using (auth.uid() = user_id);

drop policy if exists "favorite_meetings_select_own" on public.favorite_meetings;
create policy "favorite_meetings_select_own"
  on public.favorite_meetings for select using (auth.uid() = user_id);

drop policy if exists "favorite_meetings_insert_own" on public.favorite_meetings;
create policy "favorite_meetings_insert_own"
  on public.favorite_meetings for insert with check (auth.uid() = user_id);

drop policy if exists "favorite_meetings_delete_own" on public.favorite_meetings;
create policy "favorite_meetings_delete_own"
  on public.favorite_meetings for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.meeting_intelligence to authenticated;
grant select, insert, delete on public.meeting_tags to authenticated;
grant select, insert, delete on public.favorite_meetings to authenticated;

-- profiles: ensure authenticated users can update onboarding fields (RLS)
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Notify PostgREST to reload schema (Supabase does this automatically; may take ~1 min)
notify pgrst, 'reload schema';
