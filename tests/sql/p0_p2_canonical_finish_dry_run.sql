\set ON_ERROR_STOP on

create schema if not exists extensions;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;

create table public.hv_dispatch_budget (
  stage text primary key,
  budget_date date not null default current_date,
  calls_used integer not null default 0,
  daily_ceiling integer not null default 500
);
insert into public.hv_dispatch_budget(stage, daily_ceiling)
values ('classify', 10000), ('translate', 10000), ('embed', 10000), ('entities', 10000)
on conflict (stage) do nothing;

create table public.signals (
  id text primary key,
  headline text,
  url text,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  classifier_version text,
  is_representative boolean,
  reviewed boolean default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table public.excluded_source_domains (
  domain text primary key
);

create table public.classifier_validation (
  classifier_version text primary key,
  gate_passed boolean not null default false
);

create table public.hv_signal_review_queue (
  signal_id text primary key references public.signals(id) on delete cascade,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'skipped')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create table public.hv_classify_prefilter_dispositions (
  signal_id text primary key references public.signals(id) on delete cascade,
  eligible boolean not null,
  disposition text not null,
  filter_version text not null,
  input_hash text not null,
  translated_text_used boolean not null default false,
  language text,
  evaluated_at timestamptz not null default now()
);

create table public.hv_pipeline_stage_log (
  id bigserial primary key,
  stage text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.hv_signal_review_queue enable row level security;
alter table public.hv_classify_prefilter_dispositions enable row level security;
alter table public.hv_pipeline_stage_log enable row level security;

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language sql
security definer
set search_path to 'pg_catalog', 'public', 'extensions'
as $$ select 777 $$;

create or replace function public.hv_pipeline_tick()
returns jsonb
language sql
security definer
set search_path to 'public'
as $$ select '{"pending_embedding_guard":true}'::jsonb $$;

create temp table preserved_defs(name text primary key, body text not null);
insert into preserved_defs values
  ('hv_dedup_assign', pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure)),
  ('hv_pipeline_tick', pg_get_functiondef('public.hv_pipeline_tick()'::regprocedure));

-- Zero-state apply of the canonical finish and same-database idempotent replay.
\i supabase/migrations/20260821100000_p0_p2_canonical_finish.sql
\i supabase/migrations/20260821100000_p0_p2_canonical_finish.sql

-- The canonical finish must not replace HNSW KNN dedup or the pending-embedding tick.
do $$
declare
  v_before text;
  v_after text;
begin
  select body into v_before from preserved_defs where name='hv_dedup_assign';
  select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure) into v_after;
  if v_before <> v_after then raise exception 'hv_dedup_assign changed'; end if;

  select body into v_before from preserved_defs where name='hv_pipeline_tick';
  select pg_get_functiondef('public.hv_pipeline_tick()'::regprocedure) into v_after;
  if v_before <> v_after then raise exception 'hv_pipeline_tick changed'; end if;
end
$$;

-- Exact aggregate accounting: admitted measured units advance both stage and
-- global counters, and the 8,000 hard cap fails closed without overrun.
do $$
declare
  v_allowed integer;
  v_stage_used integer;
  v_global_used integer;
begin
  v_allowed := public.hv_consume_dispatch_budget('classify', 3);
  if v_allowed <> 3 then raise exception 'expected 3 admitted, got %', v_allowed; end if;

  v_allowed := public.hv_consume_dispatch_budget('classify', 7997);
  if v_allowed <> 7997 then raise exception 'expected 7997 admitted, got %', v_allowed; end if;

  v_allowed := public.hv_consume_dispatch_budget('classify', 1);
  if v_allowed <> 0 then raise exception 'global hard cap failed closed: %', v_allowed; end if;

  select calls_used into v_stage_used from public.hv_dispatch_budget where stage='classify';
  select dispatch_units into v_global_used from public.hv_pipeline_cost_budget where budget_date=current_date;
  if v_stage_used <> 8000 or v_global_used <> 8000 then
    raise exception 'budget counters drifted stage=% global=%', v_stage_used, v_global_used;
  end if;
  if public.hv_pipeline_budget_remaining() <> 0 then
    raise exception 'remaining budget not zero at hard cap';
  end if;
end
$$;

-- Hard 0.80 floor remains hard even if a caller requests 0.65.
insert into public.classifier_validation(classifier_version, gate_passed)
values ('validated-v1', true);
insert into public.signals(
  id, headline, url, quality_label, quality_confidence, content_type, impact,
  classifier_version, is_representative, reviewed
) values
  ('below-floor', 'Cannabis regulation update', 'https://authority.example/a', 'signal', 0.79, 'regulatory', 'medium', 'validated-v1', true, false),
  ('at-floor', 'Cannabis regulation update', 'https://authority.example/b', 'signal', 0.80, 'regulatory', 'high', 'validated-v1', true, false),
  ('gate-false', 'Cannabis regulation update', 'https://authority.example/c', 'signal', 0.99, 'regulatory', 'high', 'unvalidated-v1', true, false);

do $$
declare
  v_promoted integer;
begin
  v_promoted := public.hv_promote_signals(0.65);
  if v_promoted <> 1 then raise exception 'expected one promotion, got %', v_promoted; end if;
  if (select reviewed from public.signals where id='below-floor') then
    raise exception '0.79 signal crossed hard 0.80 floor';
  end if;
  if not (select reviewed from public.signals where id='at-floor') then
    raise exception '0.80 validated signal did not promote';
  end if;
  if (select reviewed from public.signals where id='gate-false') then
    raise exception 'classifier_validation gate failed open';
  end if;
  if not exists (
    select 1 from public.hv_signal_review_queue
    where signal_id='below-floor' and status='pending'
  ) then
    raise exception '0.65-0.80 signal was not queued for human review';
  end if;
end
$$;

-- Internal tables require RLS + FORCE RLS and deny browser roles.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'hv_signal_review_queue',
    'hv_classify_prefilter_dispositions',
    'hv_pipeline_stage_log',
    'hv_pipeline_cost_budget'
  ] loop
    if not (
      select c.relrowsecurity and c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=v_table
    ) then
      raise exception 'RLS/FORCE RLS missing on %', v_table;
    end if;
    if has_table_privilege('anon', 'public.' || v_table, 'select')
       or has_table_privilege('authenticated', 'public.' || v_table, 'select') then
      raise exception 'browser read leaked on %', v_table;
    end if;
  end loop;
end
$$;

-- Snapshot is observability only and reports the canonical contracts.
do $$
declare
  v_snapshot jsonb := public.hv_eval_gate_snapshot();
begin
  if (v_snapshot->>'promote_floor')::numeric <> 0.80 then
    raise exception 'snapshot promote floor drifted: %', v_snapshot;
  end if;
  if (v_snapshot->>'global_daily_dispatch_cap')::integer <> 8000 then
    raise exception 'snapshot global cap drifted: %', v_snapshot;
  end if;
  if v_snapshot->>'publication_gate' <> 'classifier_validation.gate_passed' then
    raise exception 'snapshot publication gate drifted: %', v_snapshot;
  end if;
end
$$;

select 'P0-P2 canonical finish zero-state, idempotence, budget, floor, gate, RLS and preservation: PASS';
