-- Harbourview Fresh Regulatory Sources Engine
-- Extends existing regulatory_signals tables for working source checks.

alter table regulatory_signals.sources
  add column if not exists access_method text not null default 'html',
  add column if not exists watch_frequency text not null default 'daily',
  add column if not exists watcher_enabled boolean not null default true,
  add column if not exists watch_status text not null default 'disabled',
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_changed_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_content_hash text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'regulatory_sources_access_method_check') then
    alter table regulatory_signals.sources
      add constraint regulatory_sources_access_method_check
      check (access_method in ('rss','api','html','pdf','manual'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'regulatory_sources_watch_status_check') then
    alter table regulatory_signals.sources
      add constraint regulatory_sources_watch_status_check
      check (watch_status in ('healthy','changed','stale','failing','blocked','manual_review','disabled'));
  end if;
end $$;

create table if not exists regulatory_signals.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references regulatory_signals.sources(id) on delete cascade,
  source_url text not null,
  title text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  raw_text text,
  content_hash text not null,
  previous_hash text,
  changed boolean not null default false,
  storage_path text,
  created_at timestamptz not null default now(),
  constraint regulatory_source_snapshots_source_url_not_empty check (length(trim(source_url)) > 0),
  constraint regulatory_source_snapshots_hash_not_empty check (length(trim(content_hash)) > 0)
);

create table if not exists regulatory_signals.source_check_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references regulatory_signals.sources(id) on delete cascade,
  checked_at timestamptz not null default now(),
  status text not null,
  http_status integer,
  response_time_ms integer,
  content_hash text,
  previous_hash text,
  changed boolean not null default false,
  snapshot_id uuid references regulatory_signals.source_snapshots(id) on delete set null,
  signal_id uuid references regulatory_signals.signals(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint regulatory_source_check_runs_status_check check (status in ('healthy','changed','stale','failing','blocked','manual_review','disabled'))
);

create index if not exists regulatory_source_snapshots_source_time_idx
  on regulatory_signals.source_snapshots(source_id, captured_at desc);
create index if not exists regulatory_source_snapshots_changed_idx
  on regulatory_signals.source_snapshots(changed, captured_at desc);
create index if not exists regulatory_source_check_runs_source_time_idx
  on regulatory_signals.source_check_runs(source_id, checked_at desc);
create index if not exists regulatory_sources_watch_status_idx
  on regulatory_signals.sources(watch_status, last_checked_at desc);

alter table regulatory_signals.source_snapshots enable row level security;
alter table regulatory_signals.source_check_runs enable row level security;

revoke all on regulatory_signals.source_snapshots from anon;
revoke all on regulatory_signals.source_check_runs from anon;
revoke all on regulatory_signals.source_snapshots from authenticated;
revoke all on regulatory_signals.source_check_runs from authenticated;

grant select, insert, update, delete on regulatory_signals.source_snapshots to authenticated;
grant select, insert, update, delete on regulatory_signals.source_check_runs to authenticated;

drop policy if exists regulatory_source_snapshots_admin_operator_only on regulatory_signals.source_snapshots;
drop policy if exists regulatory_source_check_runs_admin_operator_only on regulatory_signals.source_check_runs;

create policy regulatory_source_snapshots_admin_operator_only
  on regulatory_signals.source_snapshots
  for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

create policy regulatory_source_check_runs_admin_operator_only
  on regulatory_signals.source_check_runs
  for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

create or replace view regulatory_signals.public_source_status as
select
  id,
  source_name,
  source_type,
  source_tier,
  country_code,
  country_name,
  region,
  jurisdiction,
  regulator_name,
  watch_status,
  last_checked_at,
  last_success_at,
  last_changed_at,
  updated_at
from regulatory_signals.sources
where is_active = true
  and source_tier = 'tier_1_official';

grant select on regulatory_signals.public_source_status to anon;
grant select on regulatory_signals.public_source_status to authenticated;

comment on table regulatory_signals.source_snapshots is 'Private immutable source-check snapshots for Fresh Regulatory Sources Engine.';
comment on table regulatory_signals.source_check_runs is 'Private watcher execution log for official regulatory sources.';
comment on view regulatory_signals.public_source_status is 'Public-safe status projection for official regulatory source health; excludes errors, raw text, storage paths and internal notes.';
