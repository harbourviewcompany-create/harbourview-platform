-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920110321
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

CREATE INDEX IF NOT EXISTS idx_source_snapshots_fetch_status_created_at
  ON public.source_snapshots (fetch_status, created_at DESC)
  WHERE fetch_status = 'success' AND captured_text IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_source_snapshots_source_url
  ON public.source_snapshots (source_id, captured_url);

CREATE INDEX IF NOT EXISTS idx_hv_import_normalized_hash
  ON public.hv_import_staging (normalized_hash);
