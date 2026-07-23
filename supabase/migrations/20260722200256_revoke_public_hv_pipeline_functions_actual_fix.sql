-- Applied live 2026-07-22 by the same concurrent session as the prior
-- migration -- the anon/authenticated revoke alone doesn't close the
-- PUBLIC pseudo-role grant path (see ADR #10 in HANDOFF.md for why both
-- forms are needed). Captured here after the fact, same reasoning as the
-- prior file.
begin;

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

commit;
