-- Enables postgres_changes realtime for the globe feature.
-- NOT YET APPLIED — review and apply via the normal migration protocol
-- (apply_migration + commit the .sql file in the same session, per HANDOFF.md).
--
-- Without this, `.channel().subscribe()` will report SUBSCRIBED but silently
-- never deliver a single event for these tables. Confirmed via
-- `pg_publication_tables` on 2026-07-05: none of these three tables are
-- currently in the supabase_realtime publication.

alter publication supabase_realtime add table public.countries;
alter publication supabase_realtime add table public.signals;
alter publication supabase_realtime add table public.market_metrics;

-- Existing RLS policies already scope what anon/authenticated can see
-- (confirmed: countries_public_read, signals_public_reviewed_select,
-- signals_anon_high_quality, market_metrics_public_read) — Realtime respects
-- these automatically, so no new policies are needed for read access.
