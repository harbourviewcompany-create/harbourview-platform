-- cc_jurisdiction_briefings lives in public but PostgREST is configured to
-- expose only the api schema. Every browser query from MarketOverviewSheet
-- returned PGRST205 "table not found in schema cache", causing all markets
-- to display "No regulatory briefing on file".
--
-- Fix: expose as a passthrough view in api + grant SELECT.

CREATE OR REPLACE VIEW api.cc_jurisdiction_briefings AS
SELECT * FROM public.cc_jurisdiction_briefings;

GRANT SELECT ON api.cc_jurisdiction_briefings TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
