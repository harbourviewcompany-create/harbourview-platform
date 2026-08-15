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
-- version 20260722203608.
--
-- Rewriting this file cannot affect production: 20260722203608 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Found 2026-07-22 while auditing the hv_* pipeline (see
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Stage B): six tables had RLS
-- disabled AND full INSERT/SELECT/UPDATE/DELETE/TRUNCATE granted to
-- `anon` -- the public key shipped in the browser bundle. Whether or not
-- these are currently reachable via PostgREST (this project's convention
-- is that only the `api` schema is exposed, per ADR #9 in HANDOFF.md),
-- there is no legitimate reason for an unauthenticated caller to have
-- write access to internal async-job-tracking tables or the promotion
-- domain blocklist. service_role has BYPASSRLS on this platform by
-- default, so enabling RLS with zero policies here is the same
-- "locked to service_role only" pattern already used elsewhere in this
-- codebase (e.g. the deal_* tables) -- it does not affect the pipeline's
-- own SECURITY DEFINER functions or edge-function service-role callers.
-- Revoking the grants directly, on top of RLS, is defense in depth.
--
-- ia_graph_entities is deliberately left untouched: it already has RLS on
-- with a real authenticated-read policy, which looks intentional (a
-- public-facing entity graph feature), not an oversight.

ALTER TABLE public.excluded_source_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_classify_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_embed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_entity_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hv_translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_entities ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.excluded_source_domains FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_classify_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_embed_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_entity_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.hv_translation_jobs FROM anon, authenticated;
REVOKE INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.signal_entities FROM anon, authenticated;

REVOKE ALL ON public.excluded_source_domains FROM PUBLIC;
REVOKE ALL ON public.hv_classify_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_embed_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_entity_jobs FROM PUBLIC;
REVOKE ALL ON public.hv_translation_jobs FROM PUBLIC;
REVOKE ALL ON public.signal_entities FROM PUBLIC;
