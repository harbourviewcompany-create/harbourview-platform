-- Two SECURITY DEFINER views were exposing internal ops data to anon:
--   local_intel_next_batch     -> internal crawl/research queue
--   platform_coverage_summary  -> per-country source_count + internal review tiers
-- Revoke anon (and authenticated, for the pure-ops queue). service_role unaffected.
-- Applied to prod via Supabase MCP; backfilled for parity.

revoke select on public.local_intel_next_batch   from anon, authenticated;
revoke select on public.platform_coverage_summary from anon;
