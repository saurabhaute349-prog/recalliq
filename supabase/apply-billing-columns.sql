-- Run once in Supabase → SQL Editor (fixes checkout: missing billing columns)

alter table public.profiles
  add column if not exists plan_type text not null default 'free',
  add column if not exists plan text,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

-- Backfill plan_type from legacy `plan` column when present
update public.profiles
set plan_type = coalesce(nullif(plan_type, ''), plan, 'free')
where plan_type is null or plan_type = '';

alter table public.profiles
  alter column plan_type set default 'free';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_type_check
      check (plan_type in ('free', 'pro'));
  end if;
end $$;

create index if not exists profiles_plan_type_idx on public.profiles (plan_type);
create index if not exists profiles_razorpay_subscription_id_idx
  on public.profiles (razorpay_subscription_id)
  where razorpay_subscription_id is not null;
