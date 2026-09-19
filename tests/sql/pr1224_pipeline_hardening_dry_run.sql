\set ON_ERROR_STOP on

create schema if not exists api;
create schema if not exists auth;
create schema if not exists net;
create schema if not exists vault;

do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;

create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.user_roles (
  user_id uuid not null,
  role text not null
);

create table public.hv_alert_log (
  id bigserial primary key,
  alert_key text not null,
  severity text not null check (severity in ('critical','warning','ok')),
  value text,
  detail text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  notified_at timestamptz,
  resolved_at timestamptz
);
create unique index idx_hv_alert_log_open
  on public.hv_alert_log(alert_key) where resolved_at is null;

create table net._http_response (
  id bigint primary key,
  status_code integer,
  content jsonb
);

create table vault.decrypted_secrets (
  name text primary key,
  decrypted_secret text
);

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
as $$ select null::text, null::text, null::text, null::text where false $$;

create or replace function net.http_post(
  url text,
  headers jsonb,
  body jsonb,
  timeout_milliseconds integer
)
returns bigint
language sql
as $$ select 9001::bigint $$;

create or replace function api.add_signal_to_eval_set(
  p_signal_id text,
  p_quality_label text,
  p_content_type text,
  p_impact text,
  p_notes text default null,
  p_labeled_by text default 'fixture'
)
returns jsonb
language sql
security definer
as $$ select jsonb_build_object('ok', true, 'labeled_by', p_labeled_by) $$;

grant usage on schema api, auth to authenticated, service_role;
grant select on public.user_roles to authenticated;
grant execute on function auth.uid() to authenticated, service_role;
grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)
  to authenticated, service_role;

\i supabase/migrations/20260802080000_harden_eval_labels_and_alert_delivery.sql

do $$
begin
  if has_function_privilege('authenticated', 'api.add_signal_to_eval_set(text,text,text,text,text,text)', 'execute') then
    raise exception 'authenticated still has direct eval-set mutation access';
  end if;
  if not has_function_privilege('service_role', 'api.add_signal_to_eval_set(text,text,text,text,text,text)', 'execute') then
    raise exception 'service_role lost direct eval-set mutation access';
  end if;
  if not has_function_privilege('authenticated', 'api.admin_add_signal_to_eval_set(text,text,text,text,text)', 'execute') then
    raise exception 'authenticated admin wrapper is unavailable';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
set role authenticated;
do $$
begin
  perform api.admin_add_signal_to_eval_set('signal-1','signal','market','high',null);
  raise exception 'unauthorized wrapper call unexpectedly succeeded';
exception
  when insufficient_privilege then null;
end $$;
reset role;

insert into public.user_roles(user_id, role)
values ('11111111-1111-1111-1111-111111111111', 'operator');
set role authenticated;
do $$
declare result jsonb;
begin
  result := api.admin_add_signal_to_eval_set('signal-1','signal','market','high',null);
  if result->>'labeled_by' <> 'user:11111111-1111-1111-1111-111111111111' then
    raise exception 'wrapper accepted or generated the wrong audit identity: %', result;
  end if;
end $$;
reset role;

insert into public.hv_alert_log(
  alert_key, severity, delivery_request_id, delivery_status, delivery_attempts, delivery_queued_at
) values
  ('delivered-case', 'critical', 101, 'queued', 1, now()),
  ('failed-case', 'warning', 102, 'queued', 1, now());
insert into net._http_response(id, status_code, content) values
  (101, 202, '{"message":"accepted"}'),
  (102, 422, '{"recipient":"private@example.com","api_key":"secret"}');

select public.hv_alert_tick();

do $$
declare
  delivered public.hv_alert_log%rowtype;
  failed public.hv_alert_log%rowtype;
begin
  select * into delivered from public.hv_alert_log where alert_key = 'delivered-case';
  select * into failed from public.hv_alert_log where alert_key = 'failed-case';

  if delivered.delivery_status <> 'delivered' or delivered.notified_at is null then
    raise exception '2xx response was not reconciled as delivered';
  end if;
  if failed.delivery_status <> 'failed' or failed.notified_at is not null then
    raise exception 'non-2xx response was not reconciled as failed';
  end if;
  if failed.last_delivery_error <> 'provider_rejected:http_422' then
    raise exception 'failure text is not sanitized: %', failed.last_delivery_error;
  end if;
  if failed.last_delivery_error like '%private@example.com%' or failed.last_delivery_error like '%secret%' then
    raise exception 'provider response content leaked into persisted diagnostics';
  end if;
end $$;

do $$
begin
  begin
    insert into public.hv_alert_log(alert_key, severity, delivery_status)
    values ('bad-status', 'warning', 'invalid');
    raise exception 'delivery-status constraint did not reject an invalid value';
  exception
    when check_violation then null;
  end;
end $$;
