-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920111137
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_signals_pending_analysis
on public.signals (date desc)
where reviewed = true and analysis is null and headline is not null;

create index if not exists idx_hv_translation_jobs_pending_signal
on public.hv_translation_jobs (signal_id)
where not harvested;

create index if not exists idx_hv_embed_jobs_pending_signal_ids
on public.hv_embed_jobs using gin (signal_ids);

create index if not exists idx_hv_alert_log_delivery_queue
on public.hv_alert_log (delivery_status, next_delivery_attempt_at, delivery_queued_at)
where resolved_at is null;
