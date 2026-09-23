-- Signal Engine: per-source yield metrics for Gate 1 (source authority).
-- Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §9.3
-- Additive, fail-closed. Does not change promote path.

create table if not exists public.source_yield_metrics (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  n_snapshots integer not null default 0 check (n_snapshots >= 0),
  n_signals integer not null default 0 check (n_signals >= 0),
  n_promoted integer not null default 0 check (n_promoted >= 0),
  junk_rate numeric check (junk_rate is null or (junk_rate >= 0 and junk_rate <= 1)),
  promotion_rate numeric check (promotion_rate is null or (promotion_rate >= 0 and promotion_rate <= 1)),
  precision_proxy numeric check (precision_proxy is null or (precision_proxy >= 0 and precision_proxy <= 1)),
  freshness_hours_p50 numeric,
  metrics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (source_id, window_start, window_end)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'source_registry'
  ) and not exists (
    select 1 from pg_constraint where conname = 'source_yield_metrics_source_id_fkey'
  ) then
    alter table public.source_yield_metrics
      add constraint source_yield_metrics_source_id_fkey
      foreign key (source_id) references public.source_registry (id) on delete cascade;
  end if;
exception
  when others then
    raise notice 'source_yield_metrics FK skipped: %', sqlerrm;
end $$;

create index if not exists source_yield_metrics_source_window_idx
  on public.source_yield_metrics (source_id, window_end desc);

alter table public.source_yield_metrics enable row level security;
alter table public.source_yield_metrics force row level security;
revoke all on table public.source_yield_metrics from anon, authenticated, public;

comment on table public.source_yield_metrics is
  'Rolling yield/quality metrics per source for autonomy Gate 1. Service-role writers only.';

-- Best-effort refresh for the last 7 days. Idempotent per (source, window).
-- Does not promote signals. Safe to call from cron with service role.
create or replace function private.refresh_source_yield_metrics_7d()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $fn$
declare
  v_start timestamptz := date_trunc('day', now() at time zone 'utc') - interval '7 days';
  v_end timestamptz := date_trunc('day', now() at time zone 'utc') + interval '1 day';
  n int := 0;
begin
  -- Prefer signals.source_id when present; otherwise skip (no fabricated joins).
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'signals' and column_name = 'source_id'
  ) then
    insert into public.source_yield_metrics (
      source_id,
      window_start,
      window_end,
      n_signals,
      n_promoted,
      promotion_rate,
      updated_at
    )
    select
      s.source_id,
      v_start,
      v_end,
      count(*)::integer,
      count(*) filter (where s.reviewed is true)::integer,
      case
        when count(*) = 0 then null
        else (count(*) filter (where s.reviewed is true))::numeric / count(*)::numeric
      end,
      now()
    from public.signals s
    where s.source_id is not null
      and coalesce(s.created_at, s.reviewed_at, now()) >= v_start
      and coalesce(s.created_at, s.reviewed_at, now()) < v_end
    group by s.source_id
    on conflict (source_id, window_start, window_end) do update set
      n_signals = excluded.n_signals,
      n_promoted = excluded.n_promoted,
      promotion_rate = excluded.promotion_rate,
      updated_at = now();

    get diagnostics n = row_count;
  end if;

  return n;
exception
  when others then
    raise notice 'refresh_source_yield_metrics_7d: %', sqlerrm;
    return 0;
end;
$fn$;

revoke all on function private.refresh_source_yield_metrics_7d() from public, anon, authenticated;

comment on function private.refresh_source_yield_metrics_7d() is
  'Service-only yield rollup for the trailing 7-day UTC window. Observability only.';
