-- Security fix, found while addressing a CodeRabbit review comment on
-- hv_promote_signals: all 12 public.hv_* pipeline functions (the Pipeline B
-- machinery -- classify dispatch/harvest, translate, embed, entities, dedup,
-- promote, and the two tick orchestrators) are SECURITY DEFINER and callable
-- via the PUBLIC pseudo-role grant, with NO internal authorization check --
-- unlike the 11 api.* signal-review RPCs hardened on 2026-07-21/22, these
-- public.* pipeline internals were never touched by that pass.
--
-- Concrete exposure: anyone with the public anon key could call
-- hv_classify_corpus_dispatch(p_limit, p_scope_days) directly with arbitrary
-- parameters, triggering unbounded paid LLM dispatch calls at will. Or call
-- hv_pipeline_tick()/hv_promote_signals()/hv_dedup_assign() on demand, bypassing
-- cron scheduling and the DoS-prone dedup query's normal 10-minute cadence.
--
-- None of these 12 functions have any legitimate external caller. They are
-- pure internal pipeline/cron machinery -- both cron jobs that call them
-- (hv-quality-pipeline, hv-quality-promote) run as the `postgres` role, which
-- keeps its own explicit grant below, so this changes nothing about what
-- actually works today.
--
-- Self-correction recorded here rather than silently fixed: this migration's
-- first applied version revoked EXECUTE from `anon, authenticated` explicitly,
-- which did NOT work -- both roles still inherited access via the PUBLIC
-- pseudo-role grant (`=X/postgres`), which was left untouched. Same trap
-- INTELLIGENCE_ARCHITECTURE_SPEC.md guardrail #6 names, and the same mistake
-- already caught and fixed once this session for the api.* functions --
-- caught again immediately via a live post-apply grant check before moving on,
-- and corrected to REVOKE ... FROM PUBLIC, verified to actually remove anon
-- and authenticated from the effective grant list this time.
--
-- Rollback: `grant execute on function <fn> to public;` per function below --
-- not recommended, restores the unauthenticated exposure.

-- Replay guard added 2026-08-05. The twelve signatures and the REVOKE ... FROM
-- PUBLIC semantics are unchanged; only the "does it exist yet" test is new.
--
-- In production all twelve existed when this ran. Zero-state replay differs for
-- two of them:
--   hv_dedup_assign(double precision, integer) is first created eight days
--     later, by 20260730110000_fix_hv_dedup_assign_timeout_and_ranking.sql
--   hv_pipeline_tick() has no creator anywhere in the repository
-- REVOKE on a missing function is a hard error, so replay stopped here.
--
-- Guarding does not reopen the exposure this migration closes. Both later
-- definitions of hv_dedup_assign are SECURITY DEFINER, and
-- 20260804190000_production_security_hardening.sql performs a catalog-wide
-- REVOKE of EXECUTE from public/anon/authenticated/service_role across every
-- prosecdef routine in this schema before re-granting from an explicit
-- allowlist -- so it is closed again there, and
-- supabase/tests/production_security_hardening.sql asserts it afterwards.
-- hv_pipeline_tick never exists during replay, so there is nothing to expose.
do $revoke_hv_pipeline_public_execute$
declare
  target text;
begin
  foreach target in array array[
    'public.hv_classify_corpus_dispatch(integer, integer)',
    'public.hv_classify_corpus_harvest()',
    'public.hv_dedup_assign(double precision, integer)',
    'public.hv_embed_dispatch(text[])',
    'public.hv_embed_harvest()',
    'public.hv_entities_dispatch(integer)',
    'public.hv_entities_harvest()',
    'public.hv_pipeline_tick()',
    'public.hv_promote_signals(numeric)',
    'public.hv_quality_promote_tick()',
    'public.hv_translate_dispatch(integer, boolean)',
    'public.hv_translate_harvest()'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping revoke, % not present yet', target;
    else
      execute format('revoke execute on function %s from public', target);
    end if;
  end loop;
end
$revoke_hv_pipeline_public_execute$;
