-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920102919
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

begin;

create index if not exists idx_digest_event_lineage_latest_signal
  on public.digest_event_lineage (latest_signal_id);

create index if not exists idx_digest_presentation_history_signal
  on public.digest_presentation_history (signal_id);

commit;
