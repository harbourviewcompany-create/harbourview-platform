-- Same bug class as 20260711160935_fix_security_definer_view_regression_15_views:
-- api.regulatory_tier_review_queue was flagged by get_advisors (security, ERROR)
-- with security_invoker missing, moments after that fix was applied -- confirms
-- this is an actively live, actively recurring pattern, not a one-time cleanup.
--
-- Lower severity than the prior 15: both underlying tables (countries,
-- cc_jurisdiction_briefings) already have a fully public RLS read policy
-- (`true` for anon+authenticated) and already have base-table SELECT grants,
-- so this view wasn't leaking anything beyond what's already public data.
-- Fixed anyway for consistency with the ERROR-level advisor finding and to
-- stop this specific instance from being mistaken for a real leak later.
-- No companion grant needed -- both base tables already grant anon+authenticated
-- SELECT.

alter view api.regulatory_tier_review_queue set (security_invoker = true);
