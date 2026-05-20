-- MeetingMind Phase 1 — idempotent schema + RLS stabilization
-- Run once in Supabase → SQL Editor (safe to re-run)

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  meetings_used integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists plan_type text not null default 'free',
  add column if not exists plan text,
  add column if not exists meetings_used integer not null default 0,
  add column if not exists meetings_limit integer not null default 3,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists full_name text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles
set plan_type = coalesce(nullif(plan_type, ''), plan, 'free')
where plan_type is null or plan_type = '';

-- ---------------------------------------------------------------------------
-- meetings
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled meeting',
  transcript text not null default '',
  summary text,
  participant_count integer not null default 0,
  message_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.meetings
  add column if not exists title text not null default 'Untitled meeting',
  add column if not exists transcript text not null default '',
  add column if not exists summary text,
  add column if not exists participant_count integer not null default 0,
  add column if not exists message_count integer not null default 0,
  add column if not exists original_filename text,
  add column if not exists upload_type text,
  add column if not exists transcript_raw text,
  add column if not exists duration_seconds integer,
  add column if not exists uploaded_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists category text,
  add column if not exists archived boolean not null default false,
  add column if not exists pinned boolean not null default false,
  add column if not exists favorite boolean not null default false,
  add column if not exists is_demo boolean not null default false;

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step text not null default 'welcome',
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb,
  add column if not exists avatar_url text;

create index if not exists meetings_user_org_idx
  on public.meetings (user_id, pinned desc, favorite desc, created_at desc);

create index if not exists meetings_user_archived_idx
  on public.meetings (user_id, archived, created_at desc);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- billing_events (app uses metadata + created_at; payload/processed_at aliases)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  amount integer,
  currency text not null default 'INR',
  status text not null,
  razorpay_event_id text,
  razorpay_payment_id text,
  razorpay_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.billing_events
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists payload jsonb,
  add column if not exists processed_at timestamptz;

update public.billing_events
set payload = metadata
where payload is null and metadata is not null;

update public.billing_events
set processed_at = created_at
where processed_at is null;

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists meetings_user_id_created_at_idx
  on public.meetings (user_id, created_at desc);

create index if not exists chat_messages_meeting_id_created_at_idx
  on public.chat_messages (meeting_id, created_at asc);

create index if not exists profiles_plan_type_idx on public.profiles (plan_type);

create unique index if not exists billing_events_razorpay_event_id_idx
  on public.billing_events (razorpay_event_id)
  where razorpay_event_id is not null;

create index if not exists billing_events_user_id_created_at_idx
  on public.billing_events (user_id, created_at desc);

-- full-text search (Phase 1 search)
alter table public.meetings
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(transcript, '')), 'C')
  ) stored;

create index if not exists meetings_search_vector_idx
  on public.meetings using gin (search_vector);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.billing_events enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- meetings
drop policy if exists "Users can create own meetings" on public.meetings;
drop policy if exists "meetings_insert_own" on public.meetings;
create policy "Users can create own meetings"
  on public.meetings for insert with check (auth.uid() = user_id);

drop policy if exists "Users can read own meetings" on public.meetings;
drop policy if exists "meetings_select_own" on public.meetings;
create policy "Users can read own meetings"
  on public.meetings for select using (auth.uid() = user_id);

drop policy if exists "Users can update own meetings" on public.meetings;
drop policy if exists "meetings_update_own" on public.meetings;
create policy "Users can update own meetings"
  on public.meetings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meetings" on public.meetings;
drop policy if exists "meetings_delete_own" on public.meetings;
create policy "Users can delete own meetings"
  on public.meetings for delete using (auth.uid() = user_id);

-- chat_messages
drop policy if exists "Users can read own chat messages" on public.chat_messages;
drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "Users can read own chat messages"
  on public.chat_messages for select using (auth.uid() = user_id);

drop policy if exists "Users can create own chat messages" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "Users can create own chat messages"
  on public.chat_messages for insert with check (auth.uid() = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own"
  on public.chat_messages for update using (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages for delete using (auth.uid() = user_id);

-- billing_events (read-only for users; writes via service role)
drop policy if exists "billing_events_select_own" on public.billing_events;
create policy "billing_events_select_own"
  on public.billing_events for select using (auth.uid() = user_id);

-- grants
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant select on public.billing_events to authenticated;
