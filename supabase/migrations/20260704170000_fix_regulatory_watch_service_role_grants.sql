-- Applied directly to production via Supabase MCP (audit session, Jul 4 2026).
--
-- regulatory_watch_cron (service_role) has been getting a live 403 on every
-- run: "permission denied for table sources... GRANT SELECT ON
-- regulatory_signals.sources TO service_role" (confirmed via Vercel runtime
-- error logs, recurring through 2026-07-04). The `authenticated` role has
-- full SELECT/INSERT/UPDATE/DELETE across every table in this schema, but
-- service_role -- the role the cron worker actually authenticates as --
-- was never granted schema USAGE or any table privileges at all. Mirrors
-- authenticated's existing grant shape exactly (least-surprise, not
-- broader than what already works for the other server-side role).
GRANT USAGE ON SCHEMA regulatory_signals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA regulatory_signals TO service_role;

NOTIFY pgrst, 'reload schema';
