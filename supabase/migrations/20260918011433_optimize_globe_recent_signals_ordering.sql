-- Align the globe's 30-day recent-signal query with its ORDER BY.
-- The existing (cat, pri, created_at) index could satisfy the date predicate,
-- but forced a large sort/scan. This index lets Postgres stop after the first
-- 500 matching rows in created_at DESC order.
create index if not exists idx_signals_created_at_desc
  on public.signals (created_at desc);
create index if not exists idx_signals_created_at_desc on public.signals (created_at desc);