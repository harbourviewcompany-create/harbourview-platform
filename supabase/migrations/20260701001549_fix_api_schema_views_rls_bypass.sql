-- SECURITY FIX: api-schema views were bypassing RLS on their underlying tables.
--
-- Every api.<name> view (the schema PostgREST is configured to expose --
-- see 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql for
-- the original diagnosis of why api.* views exist at all) is owned by
-- `postgres`, which has BYPASSRLS. In Postgres, a view's access to its
-- underlying table is checked against the VIEW OWNER's privileges, not the
-- querying role, unless the view explicitly sets security_invoker = true.
-- 46 of the 47 api.* views did not set this -- meaning any role granted
-- SELECT on the view (anon and/or authenticated, depending on the view)
-- got the FULL, UNFILTERED underlying table, regardless of what RLS policy
-- was defined on it.
--
-- Confirmed concretely on api.user_profiles: the real RLS policy is
-- auth.uid() = id (a user may only see their own row), but because the
-- view bypassed it, any authenticated user could read every user's email,
-- full name, company, and Stripe customer ID.
--
-- This was reachable in production as of PR #916 (merged 2026-06-30),
-- which fixed application code to correctly request the `api` schema on
-- every Supabase client -- before that, every api.* query 404'd (wrong
-- schema), which had been accidentally masking this bypass.
--
-- Fix: security_invoker = true on every api.* view so it enforces RLS
-- against the querying role. This requires the querying role to also hold
-- a direct GRANT SELECT on the underlying table (Postgres semantics: with
-- security_invoker, the invoker's own permissions are checked, not just
-- the view's) -- granted below, matching exactly the roles that already
-- had SELECT on the view, so no role gains broader endpoint access than
-- it already had; only the ROWS returned change to honor RLS.
--
-- Net behavior after this migration, for the tables that had NO
-- anon/authenticated-facing RLS policy at all (deal_rooms, genetics_*,
-- ia_* internal tables, marketplace_inquiries, marketplace_candidates,
-- network_*, opportunities, signal_candidates, source_registry,
-- source_snapshots, user_profiles, user_roles, hv_import_staging,
-- canadian_operator_*, candidate_review_events, cultivar_passports,
-- cultivar_country_opportunities, regulatory_signals.*): non-privileged
-- callers now get zero rows (not an error -- standard RLS/PostgREST
-- behavior) instead of the entire table. Admin/service-role access is
-- unaffected -- that path already uses the service-role key, which
-- bypasses RLS by design and was never relying on the owner-bypass views.
--
-- For tables that DO have a real public-facing RLS policy already defined
-- (cc_jurisdiction_briefings, countries, cannabis_operators,
-- hv_professionals, hv_public_feed, signals, supplier_profiles,
-- marketplace_public_listings_v1), this corrects behavior to match that
-- policy's filter (e.g. hv_professionals: verified+active only, instead
-- of every application including unreviewed/pending ones; supplier_profiles:
-- approved only, instead of every pending/rejected application too;
-- signals: reviewed=true only, instead of unreviewed internal drafts too).
--
-- Also fixes a separate, pre-existing bug found while auditing this:
-- api.user_roles already had security_invoker=true (someone had already
-- partially fixed it) but the companion GRANT SELECT on public.user_roles
-- was never added -- meaning every authenticated call to api.user_roles
-- has been failing with a permission-denied error, not just missing data.

-- Step 1: grant SELECT on each underlying table/view to whichever roles
-- already hold SELECT on the corresponding api.* view.
GRANT SELECT ON public.canadian_operator_conflicts TO authenticated;
GRANT SELECT ON public.canadian_operator_exclusions TO authenticated;
GRANT SELECT ON public.canadian_operator_individual_holds TO authenticated;
GRANT SELECT ON public.canadian_operator_licence_sites TO authenticated;
GRANT SELECT ON public.canadian_operator_outreach_queue TO authenticated;
GRANT SELECT ON public.candidate_review_events TO authenticated;
GRANT SELECT ON public.cannabis_operators TO authenticated;
GRANT SELECT ON public.cultivar_country_opportunities TO authenticated;
GRANT SELECT ON public.cultivar_passports TO authenticated;
GRANT SELECT ON public.deal_rooms TO authenticated;
GRANT SELECT ON public.genetics_routing_events TO authenticated;
GRANT SELECT ON public.genetics_routing_records TO authenticated;
GRANT SELECT ON public.hv_import_staging TO authenticated;
GRANT SELECT ON public.hv_professionals TO anon;
GRANT SELECT ON public.hv_professionals TO authenticated;
GRANT SELECT ON public.hv_public_feed TO anon;
GRANT SELECT ON public.hv_public_feed TO authenticated;
GRANT SELECT ON public.ia_agent_tasks TO authenticated;
GRANT SELECT ON public.ia_counterparties TO authenticated;
GRANT SELECT ON public.ia_evidence_vault TO authenticated;
GRANT SELECT ON public.ia_feedback_events TO authenticated;
GRANT SELECT ON public.ia_graph_edges TO authenticated;
GRANT SELECT ON public.ia_graph_entities TO authenticated;
GRANT SELECT ON public.ia_scoring_records TO authenticated;
GRANT SELECT ON public.ia_signals TO authenticated;
GRANT SELECT ON public.ia_sources TO authenticated;
GRANT SELECT ON public.marketplace_candidates TO authenticated;
GRANT SELECT ON public.marketplace_inquiries TO authenticated;
GRANT SELECT ON public.marketplace_public_listings_v1 TO anon;
GRANT SELECT ON public.marketplace_public_listings_v1 TO authenticated;
GRANT SELECT ON public.network_public_projections TO authenticated;
GRANT SELECT ON public.network_review_items TO authenticated;
GRANT SELECT ON public.opportunities TO authenticated;
GRANT SELECT ON public.signal_candidates TO authenticated;
GRANT SELECT ON public.signals TO anon;
GRANT SELECT ON public.signals TO authenticated;
GRANT SELECT ON public.source_registry TO anon;
GRANT SELECT ON public.source_registry TO authenticated;
GRANT SELECT ON public.source_snapshots TO authenticated;
GRANT SELECT ON public.supplier_profiles TO anon;
GRANT SELECT ON public.supplier_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Step 2: force every api.* view to check RLS against the querying role.
ALTER VIEW api.canadian_operator_conflicts SET (security_invoker = true);
ALTER VIEW api.canadian_operator_exclusions SET (security_invoker = true);
ALTER VIEW api.canadian_operator_individual_holds SET (security_invoker = true);
ALTER VIEW api.canadian_operator_licence_sites SET (security_invoker = true);
ALTER VIEW api.canadian_operator_outreach_queue SET (security_invoker = true);
ALTER VIEW api.candidate_review_events SET (security_invoker = true);
ALTER VIEW api.cannabis_operators SET (security_invoker = true);
ALTER VIEW api.cc_jurisdiction_briefings SET (security_invoker = true);
ALTER VIEW api.countries SET (security_invoker = true);
ALTER VIEW api.cultivar_country_opportunities SET (security_invoker = true);
ALTER VIEW api.cultivar_passports SET (security_invoker = true);
ALTER VIEW api.deal_rooms SET (security_invoker = true);
ALTER VIEW api.genetics_routing_events SET (security_invoker = true);
ALTER VIEW api.genetics_routing_records SET (security_invoker = true);
ALTER VIEW api.hv_import_staging SET (security_invoker = true);
ALTER VIEW api.hv_professionals SET (security_invoker = true);
ALTER VIEW api.hv_public_feed SET (security_invoker = true);
ALTER VIEW api.ia_agent_tasks SET (security_invoker = true);
ALTER VIEW api.ia_counterparties SET (security_invoker = true);
ALTER VIEW api.ia_evidence_vault SET (security_invoker = true);
ALTER VIEW api.ia_feedback_events SET (security_invoker = true);
ALTER VIEW api.ia_graph_edges SET (security_invoker = true);
ALTER VIEW api.ia_graph_entities SET (security_invoker = true);
ALTER VIEW api.ia_scoring_records SET (security_invoker = true);
ALTER VIEW api.ia_signals SET (security_invoker = true);
ALTER VIEW api.ia_sources SET (security_invoker = true);
ALTER VIEW api.marketplace_candidates SET (security_invoker = true);
ALTER VIEW api.marketplace_inquiries SET (security_invoker = true);
ALTER VIEW api.marketplace_public_listings_v1 SET (security_invoker = true);
ALTER VIEW api.network_public_projections SET (security_invoker = true);
ALTER VIEW api.network_review_items SET (security_invoker = true);
ALTER VIEW api.opportunities SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.evidence" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.publication_events" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.review_events" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.signal_evidence_links" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.signals" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.source_check_runs" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.source_snapshots" SET (security_invoker = true);
ALTER VIEW api."regulatory_signals.sources" SET (security_invoker = true);
ALTER VIEW api.signal_candidates SET (security_invoker = true);
ALTER VIEW api.signals SET (security_invoker = true);
ALTER VIEW api.source_registry SET (security_invoker = true);
ALTER VIEW api.source_snapshots SET (security_invoker = true);
ALTER VIEW api.supplier_profiles SET (security_invoker = true);
ALTER VIEW api.user_profiles SET (security_invoker = true);

NOTIFY pgrst, 'reload schema';
