-- =============================================================================
-- Harbourview P0-P2 canonical finish — 2026-08-21
-- =============================================================================
-- Depends on:
--   20260820130000_hv_pipeline_optimization.sql
--   20260820131000_hv_review_queue_resolve.sql
--
-- This forward migration is the canonical replacement for the removed
-- 20260820180000_p0_p2_pipeline_optimization.sql. It does not mutate pg_cron.
-- It preserves the repaired PR #1598 dispatch/retry/manual-review path, the
-- authoritative HNSW KNN dedup implementation, the extensions search_path,
-- pending-embedding exclusion in hv_pipeline_tick(), and classifier_validation
-- as the mechanical publication gate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Accurate global 8,000-unit daily dispatch ceiling
-- -----------------------------------------------------------------------------
-- The existing stage budgets remain authoritative lower ceilings. The global
-- ceiling is consumed inside hv_consume_dispatch_budget(), after each dispatcher
-- has selected its actual candidate set. This avoids the removed migration's
-- reservation-before-selection accounting defect.
create table if not exists public.hv_pipeline_cost_budget (
  budget_date date primary key,
  dispatch_units integer not null default 0 check (dispatch_units >= 0),
  hard_cap integer not null default 8000 check (hard_cap > 0),
  updated_at timestamptz not null default now()
);

alter table public.hv_pipeline_cost_budget enable row level security;
alter table public.hv_pipeline_cost_budget force row level security;

drop policy if exists hv_pipeline_cost_budget_service_select
  on public.hv_pipeline_cost_budget;
create policy hv_pipeline_cost_budget_service_select
  on public.hv_pipeline_cost_budget
  for select
  to service_role
  using (true);

revoke all on table public.hv_pipeline_cost_budget
  from public, anon, authenticated, service_role;
grant select on table public.hv_pipeline_cost_budget to service_role;

comment on table public.hv_pipeline_cost_budget is
  'Internal aggregate dispatch-unit ceiling. Charged only for the actual batch admitted by hv_consume_dispatch_budget; browser roles have no access.';

create or replace function public.hv_pipeline_budget_remaining()
returns integer
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select greatest(
    8000 - coalesce(
      (
        select b.dispatch_units
        from public.hv_pipeline_cost_budget b
        where b.budget_date = current_date
      ),
      0
    ),
    0
  );
$function$;

create or replace function public.hv_consume_dispatch_budget(
  p_stage text,
  p_requested integer
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_stage_ceiling integer;
  v_stage_used integer;
  v_global_cap integer;
  v_global_used integer;
  v_allowed integer;
  v_requested integer := greatest(coalesce(p_requested, 0), 0);
begin
  if v_requested = 0 then
    return 0;
  end if;

  -- Reset only the addressed stage at the UTC database-day boundary.
  update public.hv_dispatch_budget
  set budget_date = current_date,
      calls_used = 0
  where stage = p_stage
    and budget_date <> current_date;

  -- Unknown stage names fail closed. Lock the stage row so concurrent dispatches
  -- cannot over-consume its existing per-stage ceiling.
  select b.daily_ceiling, b.calls_used
    into v_stage_ceiling, v_stage_used
  from public.hv_dispatch_budget b
  where b.stage = p_stage
  for update;

  if not found then
    return 0;
  end if;

  insert into public.hv_pipeline_cost_budget (
    budget_date,
    dispatch_units,
    hard_cap,
    updated_at
  )
  values (current_date, 0, 8000, now())
  on conflict (budget_date) do update
    set hard_cap = 8000,
        updated_at = excluded.updated_at;

  -- Lock the aggregate row in the same transaction. The admitted amount is the
  -- intersection of the caller's measured batch, the stage ceiling and the
  -- global 8,000-unit ceiling.
  select b.hard_cap, b.dispatch_units
    into v_global_cap, v_global_used
  from public.hv_pipeline_cost_budget b
  where b.budget_date = current_date
  for update;

  v_allowed := least(
    v_requested,
    greatest(v_stage_ceiling - v_stage_used, 0),
    greatest(v_global_cap - v_global_used, 0)
  );

  if v_allowed <= 0 then
    return 0;
  end if;

  update public.hv_dispatch_budget
  set calls_used = calls_used + v_allowed
  where stage = p_stage;

  update public.hv_pipeline_cost_budget
  set dispatch_units = dispatch_units + v_allowed,
      updated_at = now()
  where budget_date = current_date;

  return v_allowed;
end
$function$;

revoke all on function public.hv_pipeline_budget_remaining()
  from public, anon, authenticated;
revoke all on function public.hv_consume_dispatch_budget(text, integer)
  from public, anon, authenticated;
grant execute on function public.hv_pipeline_budget_remaining()
  to service_role;

comment on function public.hv_consume_dispatch_budget(text, integer) is
  'Atomically admits the measured dispatch batch against both its preserved per-stage ceiling and the aggregate 8,000-unit daily ceiling.';

-- -----------------------------------------------------------------------------
-- 2. Hard 0.80 automatic-promotion floor + 0.65–0.80 human review band
-- -----------------------------------------------------------------------------
create or replace function public.hv_promote_signals(
  p_min_conf numeric default 0.80
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  n integer;
  v_queued integer;
  v_floor numeric := greatest(0.80, least(coalesce(p_min_conf, 0.80), 0.99));
begin
  insert into public.hv_signal_review_queue (
    signal_id,
    quality_label,
    quality_confidence,
    content_type,
    impact,
    reason,
    status
  )
  select
    s.id,
    s.quality_label,
    s.quality_confidence,
    s.content_type,
    s.impact,
    'below_automatic_promotion_floor',
    'pending'
  from public.signals s
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= 0.65
    and s.quality_confidence < v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\\.)?([^/]+).*',
      '\\2'
    ) not in (select domain from public.excluded_source_domains)
  on conflict (signal_id) do update
    set quality_label = excluded.quality_label,
        quality_confidence = excluded.quality_confidence,
        content_type = excluded.content_type,
        impact = excluded.impact,
        reason = excluded.reason
  where public.hv_signal_review_queue.status = 'pending';

  get diagnostics v_queued = row_count;

  update public.signals s
  set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1
      from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and not exists (
      select 1
      from public.hv_signal_review_queue q
      where q.signal_id = s.id
        and q.status in ('pending', 'rejected', 'skipped')
    )
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\\.)?([^/]+).*',
      '\\2'
    ) not in (select domain from public.excluded_source_domains);

  get diagnostics n = row_count;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'promote',
    jsonb_build_object(
      'promoted', n,
      'min_conf', v_floor,
      'review_floor', 0.65,
      'queued_borderline', v_queued,
      'classifier_validation_gate', 'required'
    )
  );

  return n;
end
$function$;

revoke all on function public.hv_promote_signals(numeric)
  from public, anon, authenticated;

comment on function public.hv_promote_signals(numeric) is
  'Auto-promotion floor is hard >=0.80. 0.65–0.80 remains human-review territory. classifier_validation.gate_passed remains mandatory.';

-- -----------------------------------------------------------------------------
-- 3. Internal table RLS / ACL hardening
-- -----------------------------------------------------------------------------
alter table public.hv_signal_review_queue enable row level security;
alter table public.hv_signal_review_queue force row level security;
alter table public.hv_classify_prefilter_dispositions enable row level security;
alter table public.hv_classify_prefilter_dispositions force row level security;
alter table public.hv_pipeline_stage_log enable row level security;
alter table public.hv_pipeline_stage_log force row level security;

revoke all on table public.hv_signal_review_queue
  from public, anon, authenticated;
revoke all on table public.hv_classify_prefilter_dispositions
  from public, anon, authenticated;
revoke all on table public.hv_pipeline_stage_log
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Read-only gate snapshot. This is observability only; promotion never calls
--    it and classifier_validation remains the publication authority.
-- -----------------------------------------------------------------------------
create or replace function public.hv_eval_gate_snapshot()
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'publication_gate', 'classifier_validation.gate_passed',
    'gate_passed_versions', (
      select count(*)
      from public.classifier_validation cv
      where cv.gate_passed = true
    ),
    'promote_floor', 0.80,
    'human_review_floor', 0.65,
    'global_daily_dispatch_cap', 8000,
    'global_budget_remaining_today', public.hv_pipeline_budget_remaining(),
    'mechanical_gate_preserved', true
  );
$function$;

revoke all on function public.hv_eval_gate_snapshot()
  from public, anon, authenticated;
grant execute on function public.hv_eval_gate_snapshot()
  to service_role;

comment on function public.hv_eval_gate_snapshot() is
  'Read-only P0-P2 observability snapshot. Not an authorization gate; classifier_validation remains authoritative.';

-- Preservation boundary: this migration intentionally does not redefine
-- hv_classify_corpus_dispatch, hv_classify_corpus_harvest, hv_dedup_assign,
-- hv_pipeline_tick, hv_quality_promote_tick, or any HNSW index.
