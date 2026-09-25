-- Reconstructed from production.
--
-- Repository-only replay-fidelity repair. Production already records version
-- 20260723183914, so changing this file cannot re-apply it to production.

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
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

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

UPDATE public.schema_drift_alerts
SET resolved = true, resolved_at = now()
WHERE object_name IN (
  '_claude_push_staging', '_hv_file_stage', '_hv_file_stage2', '_hv_push_stage',
  '_hv_branch_audit', 'country_name_aliases', 'signal_geo_labels',
  'hv_reclassify_jobs', 'jurisdiction_playbooks_research_queue',
  'legislative_bills', 'schema_drift_allowlist'
) AND resolved = false;

NOTIFY pgrst, 'reload schema';