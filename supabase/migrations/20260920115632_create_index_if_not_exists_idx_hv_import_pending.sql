-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920115632
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_hv_import_pending_workspace_created
on public.hv_import_staging (workspace_id, created_at asc)
where status = 'pending';

create index if not exists idx_hv_artifacts_workspace_content_hash
on public.hv_artifacts (workspace_id, content_hash);
