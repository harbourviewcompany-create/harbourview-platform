-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920103012
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

begin;

create index if not exists idx_signals_top_lane_trgm
  on public.signals using gin (top_lane extensions.gin_trgm_ops);

create index if not exists idx_signals_cat_trgm
  on public.signals using gin (cat extensions.gin_trgm_ops);

create index if not exists idx_signals_reviewed_date
  on public.signals (date desc)
  where reviewed = true;

commit;
