-- MeetingMind: baseline tables + sync missing columns (safe to re-run)
-- Fixes Postgres 42703 when app queries columns added after initial setup.

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
  add column if not exists full_name text,
  add column if not exists meetings_used integer not null default 0,
  add column if not exists plan_type text not null default 'free',
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- plan_type constraint (ignore if already present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_type_check
      check (plan_type in ('free', 'pro'));
  end if;
end $$;

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
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.chat_messages
  add column if not exists meeting_id uuid,
  add column if not exists user_id uuid,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_messages_role_check'
      and conrelid = 'public.chat_messages'::regclass
  ) then
    alter table public.chat_messages
      add constraint chat_messages_role_check
      check (role in ('user', 'assistant'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists meetings_user_id_created_at_idx
  on public.meetings (user_id, created_at desc);

create index if not exists chat_messages_meeting_id_created_at_idx
  on public.chat_messages (meeting_id, created_at asc);

create index if not exists profiles_plan_type_idx on public.profiles (plan_type);

create index if not exists profiles_razorpay_subscription_id_idx
  on public.profiles (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- auth trigger: profile on signup (Google + email)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, meetings_used, plan_type)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    0,
    'free'
  )
  on conflict (id) do update
    set full_name = excluded.full_name
    where public.profiles.full_name is null
      or public.profiles.full_name = '';

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- backfill profiles for users created before trigger
insert into public.profiles (id, full_name, meetings_used, plan_type)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  0,
  'free'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- ---------------------------------------------------------------------------
-- RLS (enable + policies; idempotent)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "meetings_select_own" on public.meetings;
create policy "meetings_select_own"
  on public.meetings for select
  using (auth.uid() = user_id);

drop policy if exists "meetings_insert_own" on public.meetings;
create policy "meetings_insert_own"
  on public.meetings for insert
  with check (auth.uid() = user_id);

drop policy if exists "meetings_update_own" on public.meetings;
create policy "meetings_update_own"
  on public.meetings for update
  using (auth.uid() = user_id);

drop policy if exists "meetings_delete_own" on public.meetings;
create policy "meetings_delete_own"
  on public.meetings for delete
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own"
  on public.chat_messages for update
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
