-- Reconstructed from production. Verbatim statements for version 20260902021703.
-- Applied live via Supabase MCP apply_migration on 2026-09-02 02:17:03 UTC by
-- harbourviewcompany@gmail.com; this file is the repository record of that
-- change, recovered verbatim from supabase_migrations.schema_migrations.statements.
-- Body md5 matches the live recorded statement: 1298052b99285ee78a20a3d0aeb88728
-- NOTE: this fix was itself ineffective -- `set search_path = 'public, extensions'`
-- quotes the whole list as a single identifier rather than two schemas.
-- Superseded four minutes later by 20260902021818.

alter function public.hv_embed_harvest() set search_path = 'public, extensions';
alter function public.hv_local_classify_gate(vector) set search_path = 'public, extensions';
alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = 'public, extensions';
