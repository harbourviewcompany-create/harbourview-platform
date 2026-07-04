-- corridor_processing_times / corridor_regulatory_alerts: close functional +
-- security gap found while reviewing supabase-migrate CI health.
--
-- Context: 8df8a97 (same-day commit) wired
-- app/intelligence/logistics-trade-routes/page.tsx to query these two tables
-- via NEXT_PUBLIC_SUPABASE_ANON_KEY against the `api` schema -- but no
-- api.* view existed for either table, so the queries silently fail
-- (PostgREST "table not found in schema cache", the same root cause PR #916
-- fixed everywhere else) and the page's new "Permit Processing Benchmarks"
-- and "Corridor Regulatory Alerts" sections render empty. The code's own
-- `?? []` fallback means this fails silently, not with a crash.
--
-- Separately and more seriously: RLS was not enabled at all on either base
-- table (relrowsecurity = false, zero policies) -- a different, more basic
-- gap than the security_invoker-only issue fixed earlier today on 46 other
-- views. anon and authenticated both held unrestricted
-- INSERT/UPDATE/DELETE/TRUNCATE/SELECT with no RLS to constrain any of it.
--
-- Fix: enable RLS with a single public-read policy -- matching exactly what
-- the already-shipped page code assumes, and the same pattern already used
-- for other genuinely-public reference tables (cc_jurisdiction_briefings).
-- This also has the side effect of blocking anon/authenticated
-- INSERT/UPDATE/DELETE going forward (RLS requires a matching policy to
-- exist for an operation to succeed even when the role holds the GRANT;
-- none is defined here), EXCEPT TRUNCATE, which Postgres RLS does not
-- govern under any circumstance regardless of policies -- explicitly
-- revoked below for that reason, since no design has a legitimate reason
-- for an anonymous or merely-authenticated role to hold table-truncate
-- capability. INSERT/UPDATE/DELETE grants themselves are left untouched:
-- the intended write model for this "crowdsourced" data (per its own
-- column/comment naming) is undocumented, and deciding it is a product
-- call, not one to make unilaterally while fixing an unrelated CI/read gap.

ALTER TABLE public.corridor_processing_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_regulatory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS corridor_processing_times_public_read ON public.corridor_processing_times;
CREATE POLICY corridor_processing_times_public_read ON public.corridor_processing_times
  FOR SELECT USING (true);

DROP POLICY IF EXISTS corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts;
CREATE POLICY corridor_regulatory_alerts_public_read ON public.corridor_regulatory_alerts
  FOR SELECT USING (true);

REVOKE TRUNCATE ON public.corridor_processing_times FROM anon, authenticated;
REVOKE TRUNCATE ON public.corridor_regulatory_alerts FROM anon, authenticated;

CREATE VIEW api.corridor_processing_times AS SELECT * FROM public.corridor_processing_times;
ALTER VIEW api.corridor_processing_times SET (security_invoker = true);
GRANT SELECT ON api.corridor_processing_times TO anon, authenticated;

CREATE VIEW api.corridor_regulatory_alerts AS SELECT * FROM public.corridor_regulatory_alerts;
ALTER VIEW api.corridor_regulatory_alerts SET (security_invoker = true);
GRANT SELECT ON api.corridor_regulatory_alerts TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
