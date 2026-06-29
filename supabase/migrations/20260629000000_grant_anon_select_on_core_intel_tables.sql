-- Grant SELECT to anon and authenticated on the three tables used by
-- getCountryIntelProfile (REST/anon-key path) and MarketOverviewSheet.
-- RLS policies already exist with qual=true on all three tables;
-- the missing TABLE-level grants were preventing any rows from being read,
-- causing the entire dashboard to show blank/null data for all countries.

GRANT SELECT ON public.countries               TO anon, authenticated;
GRANT SELECT ON public.country_intel           TO anon, authenticated;
GRANT SELECT ON public.cc_jurisdiction_briefings TO anon, authenticated;
