-- Applied live 2026-07-22 by a concurrent session (not this one) auditing
-- the hv_* pipeline's grants -- captured here after the fact per the
-- Migration Drift Protocol (HANDOFF.md), filename timestamp matches the
-- exact schema_migrations.version this was applied under.
begin;

revoke execute on function public.hv_classify_corpus_dispatch(integer, integer) from anon, authenticated;
revoke execute on function public.hv_classify_corpus_harvest() from anon, authenticated;
revoke execute on function public.hv_dedup_assign(double precision, integer) from anon, authenticated;
revoke execute on function public.hv_embed_dispatch(text[]) from anon, authenticated;
revoke execute on function public.hv_embed_harvest() from anon, authenticated;
revoke execute on function public.hv_entities_dispatch(integer) from anon, authenticated;
revoke execute on function public.hv_entities_harvest() from anon, authenticated;
revoke execute on function public.hv_pipeline_tick() from anon, authenticated;
revoke execute on function public.hv_promote_signals(numeric) from anon, authenticated;
revoke execute on function public.hv_quality_promote_tick() from anon, authenticated;
revoke execute on function public.hv_translate_dispatch(integer, boolean) from anon, authenticated;
revoke execute on function public.hv_translate_harvest() from anon, authenticated;

commit;
