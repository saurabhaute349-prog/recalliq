-- Production security hardening: profile billing columns + chat message ownership

-- Block authenticated users from self-updating billing / quota fields on profiles.
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if new.plan_type is distinct from old.plan_type
     or new.subscription_status is distinct from old.subscription_status
     or new.current_period_end is distinct from old.current_period_end
     or new.razorpay_customer_id is distinct from old.razorpay_customer_id
     or new.razorpay_subscription_id is distinct from old.razorpay_subscription_id
     or new.meetings_used is distinct from old.meetings_used
  then
    raise exception 'profile_billing_update_denied'
      using hint = 'Billing and usage fields are managed by Recalliq billing only.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_columns on public.profiles;
create trigger protect_profile_sensitive_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_sensitive_columns();

-- Legacy plan column (if present)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'plan'
  ) then
    create or replace function public.protect_profile_plan_column()
    returns trigger
    language plpgsql
    set search_path = public
    as $fn$
    begin
      if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
        return new;
      end if;
      if auth.uid() is not null and new.plan is distinct from old.plan then
        raise exception 'profile_billing_update_denied';
      end if;
      return new;
    end;
    $fn$;

    drop trigger if exists protect_profile_plan_column on public.profiles;
    create trigger protect_profile_plan_column
      before update on public.profiles
      for each row
      execute function public.protect_profile_plan_column();
  end if;
end $$;

-- Chat messages must belong to a meeting owned by the same user
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.meetings m
      where m.id = meeting_id
        and m.user_id = auth.uid()
    )
  );
