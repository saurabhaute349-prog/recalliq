-- MeetingMind billing: extend profiles for Razorpay subscriptions

alter table public.profiles
  add column if not exists plan_type text not null default 'free'
    check (plan_type in ('free', 'pro')),
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

create index if not exists profiles_plan_type_idx on public.profiles (plan_type);
create index if not exists profiles_razorpay_subscription_id_idx
  on public.profiles (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

comment on column public.profiles.plan_type is 'free | pro';
comment on column public.profiles.subscription_status is 'Razorpay subscription status mirror';
comment on column public.profiles.current_period_end is 'Current billing period end (UTC)';

-- Ensure new auth users get a profile row with defaults
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
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    0,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
