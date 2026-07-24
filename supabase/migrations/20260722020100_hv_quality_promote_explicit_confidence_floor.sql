-- Stage 3 promotion pipeline hardening: hv_quality_promote_tick() called
-- hv_promote_signals(0.0) -- a hardcoded zero confidence floor, meaning the
-- classifier's own confidence score was not actually enforced as a gate,
-- only quality_label='signal' was. In the one manual production run on
-- 2026-07-20 this happened not to matter (all 1,102 promoted rows carried
-- confidence >= 0.8, avg 0.856), but that was incidental, not designed-in
-- safety, and directly conflicts with
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md guardrail #2 ("validate judgment
-- against labels before wiring it... no classifier drives promotion until
-- it clears the eval-set bar") and the now-superseded
-- docs/control/STAGE3_PROMOTION.md's own stated default of 0.65 for the
-- (unused) sibling promotion path api.promote_classified_signals.
--
-- Fix: hv_promote_signals' own default parameter changes from 0.0 to 0.65,
-- and hv_quality_promote_tick is updated to pass 0.65 explicitly rather than
-- 0.0, so the floor holds regardless of caller. This does not change
-- anything for rows already promoted -- promotion is one-directional
-- (reviewed=false -> true only) per the existing WHERE clause invariant in
-- hv_promote_signals, unchanged by this migration.
--
-- Both hv-quality-pipeline and hv-quality-promote crons remain INACTIVE --
-- this migration only changes what would happen if/when they (or a manual
-- call) run. It does not enable continuous automation. That remains a
-- separate, explicit decision -- see docs/control/STAGE3_PROMOTION.md.
--
-- Rollback: re-run CREATE OR REPLACE with the prior signature
-- (`p_min_conf numeric DEFAULT 0.0`) and revert hv_quality_promote_tick's
-- call site to pass 0.0, restoring prior (unenforced) behavior. Not
-- recommended.

create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;

create or replace function public.hv_quality_promote_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.65);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$function$;
