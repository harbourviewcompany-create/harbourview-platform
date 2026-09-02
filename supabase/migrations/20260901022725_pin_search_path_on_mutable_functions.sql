-- Reconstructed from production. Verbatim statements for version 20260901022725.
-- Applied live via Supabase MCP apply_migration on 2026-09-01 02:27:25 UTC by
-- harbourviewcompany@gmail.com; this file is the repository record of that
-- change, recovered verbatim from supabase_migrations.schema_migrations.statements.
-- Body md5 matches the live recorded statement: bd765a4b1cd58e83a7c59664e6057407
-- NOTE: this migration broke three pgvector-dependent functions by pinning
-- them to `public` alone. See 20260902021703 and 20260902021818 for the
-- regression and its fix. Do not replay this file without those two.

alter function public.set_updated_at() set search_path = 'public';
alter function public.hv_truncate_at_word_boundary(text, integer) set search_path = 'public';
alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = 'public';
alter function public.hv_local_classify_gate(vector) set search_path = 'public';
alter function public._digest_smart_truncate(text, integer) set search_path = 'public';
alter function public._digest_manual_why(text, text, text, text, text) set search_path = 'public';
alter function public._backfill_strip_site_suffix(text, text) set search_path = 'public';
