-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260925115756
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create table if not exists public.full_depth_capture_dispatch_config (
  id boolean primary key default true check (id),
  dispatch_token text not null,
  enabled boolean not null default true,
  batch_limit integer not null default 25 check (batch_limit between 1 and 25),
  schedule_minutes integer not null default 2 check (schedule_minutes between 1 and 60),
  updated_at timestamptz not null default now()
);

alter table public.full_depth_capture_dispatch_config enable row level security;
revoke all on public.full_depth_capture_dispatch_config from anon, authenticated;

insert into public.full_depth_capture_dispatch_config(id, dispatch_token, enabled, batch_limit, schedule_minutes)
values (
  true,
  encode(gen_random_bytes(32),'hex'),
  true,
  25,
  2
)
on conflict (id) do nothing;

create or replace function public.get_full_depth_capture_dispatch_token()
returns text
language sql
security definer
set search_path = public
as $$
  select dispatch_token
  from public.full_depth_capture_dispatch_config
  where id = true and enabled = true
$$;

revoke all on function public.get_full_depth_capture_dispatch_token() from public, anon, authenticated;
grant execute on function public.get_full_depth_capture_dispatch_token() to service_role;

select cron.schedule(
  'harbourview-full-depth-authority-capture',
  '*/2 * * * *',
  $cron$
  select net.http_post(
    url := current_setting('app.settings.full_depth_capture_function_url', true),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-harbourview-dispatch-token', public.get_full_depth_capture_dispatch_token()
    ),
    body := jsonb_build_object(
      'limit', 25
    )
  );
  $cron$
)
where not exists (
  select 1 from cron.job where jobname = 'harbourview-full-depth-authority-capture'
);
