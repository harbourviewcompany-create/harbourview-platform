-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920114307
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_source_snapshots_error_source_created
on public.source_snapshots (source_id, created_at desc)
where fetch_status = 'error' and source_id is not null;
