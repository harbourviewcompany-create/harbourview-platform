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

revoke execute on function public.hv_classify_corpus_dispatch(integer, integer) from public;
revoke execute on function public.hv_classify_corpus_harvest() from public;
revoke execute on function public.hv_dedup_assign(double precision, integer) from public;
revoke execute on function public.hv_embed_dispatch(text[]) from public;
revoke execute on function public.hv_embed_harvest() from public;
revoke execute on function public.hv_entities_dispatch(integer) from public;
revoke execute on function public.hv_entities_harvest() from public;
revoke execute on function public.hv_pipeline_tick() from public;
revoke execute on function public.hv_promote_signals(numeric) from public;
revoke execute on function public.hv_quality_promote_tick() from public;
revoke execute on function public.hv_translate_dispatch(integer, boolean) from public;
revoke execute on function public.hv_translate_harvest() from public;
