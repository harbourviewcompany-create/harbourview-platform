-- Adds api.* views for 10 tables referenced by live application code that
-- never had one at all -- confirmed via information_schema (base table
-- exists in public, no matching view in api). Without these, every query
-- to these tables 404s at the PostgREST layer regardless of role,
-- including service_role (schema exposure is enforced before role-based
-- permission checks). Affects: worker_heartbeats/crawl_domain_circuit_state
-- (v2 distributed worker hardening), the 6 genetics evidence-access tables
-- (lib/genetics/queries.ts#getGranteeAccessGrants + the granted-access
-- page), and country_intel/jurisdiction_briefings (Briefing Room /
-- dashboard live data).
--
-- Unlike the 46 views fixed in 20260630110000_fix_api_schema_views_rls_bypass,
-- these are built correctly from the start: security_invoker = true set at
-- creation time, with GRANTs matching each table's actual RLS policy
-- (queried directly from pg_policy, not guessed) -- least-privilege, no
-- broader access than the table's own RLS already intends.

CREATE VIEW api.worker_heartbeats AS SELECT * FROM public.worker_heartbeats;
ALTER VIEW api.worker_heartbeats SET (security_invoker = true);
GRANT SELECT ON public.worker_heartbeats TO authenticated;
GRANT SELECT ON api.worker_heartbeats TO authenticated;

CREATE VIEW api.crawl_domain_circuit_state AS SELECT * FROM public.crawl_domain_circuit_state;
ALTER VIEW api.crawl_domain_circuit_state SET (security_invoker = true);
GRANT SELECT ON public.crawl_domain_circuit_state TO authenticated;
GRANT SELECT ON api.crawl_domain_circuit_state TO authenticated;

CREATE VIEW api.genetics_profiles AS SELECT * FROM public.genetics_profiles;
ALTER VIEW api.genetics_profiles SET (security_invoker = true);
GRANT SELECT ON public.genetics_profiles TO authenticated;
GRANT SELECT ON api.genetics_profiles TO authenticated;

CREATE VIEW api.genetics_access_grants AS SELECT * FROM public.genetics_access_grants;
ALTER VIEW api.genetics_access_grants SET (security_invoker = true);
GRANT SELECT ON public.genetics_access_grants TO authenticated;
GRANT SELECT ON api.genetics_access_grants TO authenticated;

CREATE VIEW api.genetics_access_requests AS SELECT * FROM public.genetics_access_requests;
ALTER VIEW api.genetics_access_requests SET (security_invoker = true);
GRANT SELECT ON public.genetics_access_requests TO authenticated;
GRANT SELECT ON api.genetics_access_requests TO authenticated;

CREATE VIEW api.genetics_evidence_items AS SELECT * FROM public.genetics_evidence_items;
ALTER VIEW api.genetics_evidence_items SET (security_invoker = true);
GRANT SELECT ON public.genetics_evidence_items TO authenticated;
GRANT SELECT ON api.genetics_evidence_items TO authenticated;

CREATE VIEW api.genetics_claim_reviews AS SELECT * FROM public.genetics_claim_reviews;
ALTER VIEW api.genetics_claim_reviews SET (security_invoker = true);
GRANT SELECT ON public.genetics_claim_reviews TO authenticated;
GRANT SELECT ON api.genetics_claim_reviews TO authenticated;

CREATE VIEW api.genetics_audit_events AS SELECT * FROM public.genetics_audit_events;
ALTER VIEW api.genetics_audit_events SET (security_invoker = true);
GRANT SELECT ON public.genetics_audit_events TO authenticated;
GRANT SELECT ON api.genetics_audit_events TO authenticated;

-- country_intel: public_active_select policy applies to anon+authenticated
-- (filtered to review_status='active'), plus a separate admin/operator/
-- analyst policy for authenticated staff -- so both anon and authenticated
-- need the grant; RLS does the filtering.
CREATE VIEW api.country_intel AS SELECT * FROM public.country_intel;
ALTER VIEW api.country_intel SET (security_invoker = true);
GRANT SELECT ON public.country_intel TO anon, authenticated;
GRANT SELECT ON api.country_intel TO anon, authenticated;

-- jurisdiction_briefings: public_read_published policy has an empty
-- polroles array, which in pg_policy means PUBLIC (applies to every role,
-- not restricted) -- so both anon and authenticated, filtered to
-- status='published'.
CREATE VIEW api.jurisdiction_briefings AS SELECT * FROM public.jurisdiction_briefings;
ALTER VIEW api.jurisdiction_briefings SET (security_invoker = true);
GRANT SELECT ON public.jurisdiction_briefings TO anon, authenticated;
GRANT SELECT ON api.jurisdiction_briefings TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
