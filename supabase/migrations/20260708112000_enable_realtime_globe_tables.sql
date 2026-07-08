-- Adds countries, signals, and market_metrics to the supabase_realtime
-- publication. Without this, useGlobeRealtime.ts's postgres_changes
-- subscriptions connect and report SUBSCRIBED, but never receive any
-- INSERT/UPDATE/DELETE events - realtime globe updates were silently a
-- no-op. Referenced by a code comment (enable_realtime_globe_tables.sql)
-- since PR #969 but never actually created or applied.

ALTER PUBLICATION supabase_realtime ADD TABLE public.countries, public.signals, public.market_metrics;
