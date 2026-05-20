-- Align billing_events default currency with INR Pro plan
alter table public.billing_events
  alter column currency set default 'INR';
