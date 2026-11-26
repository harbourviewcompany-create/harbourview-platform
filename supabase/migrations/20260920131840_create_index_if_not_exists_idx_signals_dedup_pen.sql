-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920131840
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_signals_dedup_pending_created
on public.signals (created_at desc)
where embedding_1024 is not null and cluster_rep_id is null;
