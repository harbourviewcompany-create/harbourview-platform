-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260722200145.
--
-- Rewriting this file cannot affect production: 20260722200145 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

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
