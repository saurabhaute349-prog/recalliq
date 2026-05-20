-- MeetingMind: billing audit log + webhook idempotency

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  amount integer,
  currency text not null default 'USD',
  status text not null,
  razorpay_event_id text,
  razorpay_payment_id text,
  razorpay_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists billing_events_razorpay_event_id_idx
  on public.billing_events (razorpay_event_id)
  where razorpay_event_id is not null;

create index if not exists billing_events_user_id_created_at_idx
  on public.billing_events (user_id, created_at desc);

comment on table public.billing_events is 'Razorpay billing webhook and checkout audit trail';
comment on column public.profiles.plan_type is 'User plan: free | pro (spec name: plan)';

alter table public.billing_events enable row level security;

drop policy if exists "billing_events_select_own" on public.billing_events;
create policy "billing_events_select_own"
  on public.billing_events for select
  using (auth.uid() = user_id);
