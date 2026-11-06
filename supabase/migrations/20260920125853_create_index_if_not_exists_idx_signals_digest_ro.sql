-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920125853
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_signals_digest_route_candidates
  on public.signals (date desc)
  where reviewed
    and quality_label = 'signal'
    and content_type in ('story','research')
    and url is not null;

create index if not exists idx_signals_auto_promote_candidates
  on public.signals (quality_confidence desc, created_at desc)
  where quality_label = 'signal'
    and coalesce(is_representative, true) = true
    and reviewed is distinct from true
    and (reviewed_by is null or reviewed_by not like 'human:%');
