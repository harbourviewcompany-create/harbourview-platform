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
-- version 20260709215701.
--
-- Rewriting this file cannot affect production: 20260709215701 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- All 7 tables confirmed via real application code (not just migration history)
-- to be actively queried, with RLS SELECT policies already in place for these
-- roles, but the base-table GRANT was never applied — same missing-grant root
-- cause as the earlier form-submission fixes, this time on the read side.

GRANT SELECT ON public.cannabis_operators TO anon;
GRANT SELECT ON public.cc_pathway_step_requirements TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_steps TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_templates TO anon;
GRANT SELECT ON public.clinical_education_country_readiness TO anon, authenticated;
GRANT SELECT ON public.clinical_education_modules TO anon, authenticated;
GRANT SELECT ON public.regulatory_calendar TO anon, authenticated;
