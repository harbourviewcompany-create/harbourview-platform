-- Migration: Extend hv_import_staging status lifecycle for extraction pipeline.
-- The intelligence-extract cron writes three new terminal statuses.
--
-- Lifecycle:
--   staged              ← written by IntelligenceOrchestrator (intelligence-ingest cron)
--   extracted           ← Gemini extraction succeeded; ia_signals row created
--   extraction_failed   ← Gemini returned null or ia_signals insert failed
--   extraction_skipped  ← raw_payload too short to extract meaningful signal

comment on table public.hv_import_staging is
  'Staging queue for AI intelligence extraction. '
  'Status lifecycle: staged → extracted | extraction_failed | extraction_skipped';

comment on column public.hv_import_staging.status is
  'staged | extracted | extraction_failed | extraction_skipped';

-- Index: extraction cron pulls rows in created_at order with status=staged.
create index if not exists idx_hv_import_staging_status_created
  on public.hv_import_staging (status, created_at asc)
  where status = 'staged';

-- Index: support retry queries for failed rows.
create index if not exists idx_hv_import_staging_failed
  on public.hv_import_staging (status, created_at asc)
  where status = 'extraction_failed';
