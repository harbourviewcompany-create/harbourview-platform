-- Follow-up to 20260727002735: that migration revoked SELECT on the api-schema
-- view (api.jurisdiction_briefings) but missed the underlying base table
-- (public.jurisdiction_briefings), which still had its own direct anon/authenticated
-- SELECT grant -- independently reachable via PostgREST at GET /rest/v1/jurisdiction_briefings
-- regardless of the view-level revoke, since this project exposes the public schema
-- directly (confirmed throughout this session via working /rest/v1/{table} calls
-- against other public-schema tables). Same rationale as before: legacy, superseded
-- by cc_jurisdiction_briefings, zero consuming application code. Revoke only, fully
-- reversible, touches no data.
revoke select on public.jurisdiction_briefings from anon, authenticated;
