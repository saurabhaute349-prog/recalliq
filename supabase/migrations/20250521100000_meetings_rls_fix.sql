-- Ensure meetings table + RLS policies for authenticated inserts

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

alter table public.meetings enable row level security;

drop policy if exists "Users can create own meetings" on public.meetings;
drop policy if exists "meetings_insert_own" on public.meetings;
create policy "Users can create own meetings"
  on public.meetings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own meetings" on public.meetings;
drop policy if exists "meetings_select_own" on public.meetings;
create policy "Users can read own meetings"
  on public.meetings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own meetings" on public.meetings;
drop policy if exists "meetings_update_own" on public.meetings;
create policy "Users can update own meetings"
  on public.meetings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meetings" on public.meetings;
drop policy if exists "meetings_delete_own" on public.meetings;
create policy "Users can delete own meetings"
  on public.meetings
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.meetings to authenticated;
