-- Phase 2: meeting intelligence, tags, favorites

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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (meeting_id)
);

create index if not exists meeting_intelligence_user_id_idx
  on public.meeting_intelligence (user_id);

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

create table if not exists public.favorite_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, meeting_id)
);

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

grant select, insert, update, delete on public.meeting_intelligence to authenticated;
grant select, insert, delete on public.meeting_tags to authenticated;
grant select, insert, delete on public.favorite_meetings to authenticated;
