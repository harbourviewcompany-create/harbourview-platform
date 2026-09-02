-- Reconstructed from production. Verbatim statements for version 20260902021818.
-- Applied live via Supabase MCP apply_migration on 2026-09-02 02:18:18 UTC by
-- harbourviewcompany@gmail.com; this file is the repository record of that
-- change, recovered verbatim from supabase_migrations.schema_migrations.statements.
-- Body md5 matches the live recorded statement: 953591d244c47d04af9313422d93227e
-- This is the migration that actually resolved the regression opened by
-- 20260901022725. Verified live: all three functions now report
-- proconfig search_path=public, extensions.

alter function public.hv_embed_harvest() set search_path to public, extensions;
alter function public.hv_local_classify_gate(vector) set search_path to public, extensions;
alter function public.hv_gemini_embed_backfill_tick(integer) set search_path to public, extensions;
