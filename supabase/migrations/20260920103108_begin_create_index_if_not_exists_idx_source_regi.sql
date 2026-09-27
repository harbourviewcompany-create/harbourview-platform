-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920103108
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

begin;

create index if not exists idx_source_registry_active_relevance_last_checked
  on public.source_registry (is_active, relevance_status, last_checked_at asc nulls first);

create index if not exists idx_source_registry_active_relevance_adapter_tier_last_checked
  on public.source_registry (is_active, relevance_status, adapter, tier, last_checked_at asc nulls first);

create index if not exists idx_hv_entity_jobs_pending_signal
  on public.hv_entity_jobs (signal_id)
  where not harvested;

create index if not exists idx_hv_entity_jobs_pending_provider_request
  on public.hv_entity_jobs (provider, request_id desc)
  where request_id is not null;

commit;
