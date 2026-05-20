-- Phase 2 batch 2: onboarding, organization, profile avatar

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step text not null default 'welcome',
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb,
  add column if not exists avatar_url text;

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
