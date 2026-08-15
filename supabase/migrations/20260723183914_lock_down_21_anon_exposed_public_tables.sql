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
-- version 20260723183914.
--
-- Rewriting this file cannot affect production: 20260723183914 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Closes anon/authenticated grant + RLS-disabled exposure on 21 public-schema
-- tables. Verified before writing this: none are consumed by application/client
-- code (repo-wide grep across app code, migrations, and supabase/functions);
-- country_name_aliases/signal_geo_labels are read only by the SECURITY DEFINER
-- trigger trg_signals_resolve_geo, not by any client path. PostgREST on this
-- project exposes only the `api` schema (see lib/supabase/client.ts), and none
-- of these 21 are in the supabase_realtime publication or reachable via
-- pg_graphql (extension not installed) -- so this was not reachable via the
-- standard client-facing surface today. It was, however, a defense-in-depth
-- gap: broad anon/authenticated grants (126 non-SELECT grants alone across
-- these tables) plus RLS disabled, protected by a single control (schema
-- exposure config) rather than two independent ones. service_role bypasses
-- RLS regardless, so no pipeline/admin/cron/edge-function access is affected.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    '_claude_push_staging', '_claude_scratch', '_counterparty_enrich_jobs',
    '_counterparty_jobs', '_country_enrich_jobs', '_digest_jobs',
    '_editorial_digest_jobs', '_education_gen_jobs', '_education_regen_jobs',
    '_hv_branch_audit', '_hv_file_stage', '_hv_file_stage2', '_hv_push_stage',
    '_sig_extract_jobs', 'country_name_aliases',
    'education_module_sections_backup_20260705', 'hv_reclassify_jobs',
    'jurisdiction_playbooks_research_queue', 'legislative_bills',
    'schema_drift_allowlist', 'signal_geo_labels'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- Allowlist the 11 that the schema-drift-monitor has been alerting on,
-- unresolved, since as early as 2026-07-08 (the other 10 of the 21 were
-- already allowlisted -- they just still needed RLS+grants closed).
INSERT INTO public.schema_drift_allowlist (table_name, reason) VALUES
  ('_claude_push_staging', 'internal staging table for github-bridge, RLS+grants locked 2026-07-23'),
  ('_hv_file_stage', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_file_stage2', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_push_stage', 'internal staging table, RLS+grants locked 2026-07-23'),
  ('_hv_branch_audit', 'internal audit trail, RLS+grants locked 2026-07-23'),
  ('country_name_aliases', 'read only by trg_signals_resolve_geo (SECURITY DEFINER trigger); no client read path; RLS+grants locked 2026-07-23'),
  ('signal_geo_labels', 'read only by trg_signals_resolve_geo (SECURITY DEFINER trigger); no client read path; RLS+grants locked 2026-07-23'),
  ('hv_reclassify_jobs', 'internal job queue, RLS+grants locked 2026-07-23'),
  ('jurisdiction_playbooks_research_queue', 'internal pipeline queue populated by migrations only, no client read path; RLS+grants locked 2026-07-23'),
  ('legislative_bills', 'no client read path yet, not wired into any feature; RLS+grants locked 2026-07-23'),
  ('schema_drift_allowlist', 'internal monitoring config table, RLS+grants locked 2026-07-23')
ON CONFLICT (table_name) DO NOTHING;

-- Resolve the standing drift alerts now that these are both allowlisted and
-- actually locked down.
UPDATE public.schema_drift_alerts
SET resolved = true, resolved_at = now()
WHERE object_name IN (
  '_claude_push_staging', '_hv_file_stage', '_hv_file_stage2', '_hv_push_stage',
  '_hv_branch_audit', 'country_name_aliases', 'signal_geo_labels',
  'hv_reclassify_jobs', 'jurisdiction_playbooks_research_queue',
  'legislative_bills', 'schema_drift_allowlist'
) AND resolved = false;

NOTIFY pgrst, 'reload schema';
