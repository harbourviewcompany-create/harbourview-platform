-- This exact class of bug has now regressed at least 4 times:
-- 20260622151411_fix_security_definer_views_to_invoker,
-- 20260701001549_fix_api_schema_views_rls_bypass,
-- 20260709092127_fix_security_definer_views_api_schema,
-- 20260710190000_fix_security_definer_view_bypass_18_views. It keeps
-- coming back because api.* views are created with plain
-- `CREATE OR REPLACE VIEW api.x AS SELECT * FROM public.x`, and
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to
-- its default (security_invoker = false) -- so a later, unrelated edit
-- to a view silently reopens every RLS policy on the underlying table.
--
-- Found via get_advisors (security, ERROR level) flagging 15 api.* views
-- with this property. Confirmed live (pg_class.reloptions, pg_policy,
-- information_schema.role_table_grants) immediately before this
-- migration: view owner is `postgres`, which has BYPASSRLS, so every one
-- of these views was returning ALL rows to any caller with view-level
-- SELECT, regardless of the real RLS policy on the underlying table.
--
-- Currently exploitable (authenticated/anon already had view-level
-- SELECT; base table has a real, restrictive RLS policy underneath):
--   dossiers            -- confidential dossier metadata incl. file_path/
--                           drive_file_id; real policy is admin/operator
--                           only, any authenticated user could read all
--   hv_claims, hv_facilities, hv_licences, hv_passports,
--   hv_passport_scores   -- cross-org compliance/verification/licensing
--                           data; real policy is org-member-or-staff only,
--                           any authenticated user could read every org's
--   matches              -- includes internal_notes; real policy is
--                           admin/operator only, any authenticated user
--                           could read every match on the platform
--   workspaces           -- legal_name/verification_status/etc; real
--                           policy is admin/operator only, any
--                           authenticated user could read every workspace
--   user_dashboard_preferences -- real policy is auth.uid() = user_id;
--                           any authenticated user could read/write any
--                           other user's dashboard preferences
--   buyer_requests, marketplace_item_images -- real policy restricts to
--                           approved/public rows; anon+authenticated
--                           could read unapproved/unmoderated rows too
--
-- Not currently exploitable, fixed for consistency (RLS policy already
-- `true` / fully public by design):
--   clinical_education_country_readiness, clinical_education_modules,
--   watchlist_collections, watchlist_collection_signals

alter view api.hv_claims set (security_invoker = true);
alter view api.clinical_education_country_readiness set (security_invoker = true);
alter view api.clinical_education_modules set (security_invoker = true);
alter view api.watchlist_collections set (security_invoker = true);
alter view api.watchlist_collection_signals set (security_invoker = true);
alter view api.dossiers set (security_invoker = true);
alter view api.user_dashboard_preferences set (security_invoker = true);
alter view api.buyer_requests set (security_invoker = true);
alter view api.marketplace_item_images set (security_invoker = true);
alter view api.matches set (security_invoker = true);
alter view api.workspaces set (security_invoker = true);
alter view api.hv_passports set (security_invoker = true);
alter view api.hv_facilities set (security_invoker = true);
alter view api.hv_licences set (security_invoker = true);
alter view api.hv_passport_scores set (security_invoker = true);

-- Companion grants so RLS gets a chance to evaluate instead of a hard
-- permission-denied at the coarser GRANT check. Every grant below
-- mirrors a privilege the view itself already exposed to that role --
-- this does not widen which rows are visible or add a new capability,
-- it makes the pre-existing, nominal grant enforceable through RLS
-- instead of bypassed entirely. The real restriction (org membership via
-- hv_is_org_member(), admin/operator role, auth.uid() = user_id, or
-- approved/public status) still applies underneath every grant here.
grant insert, select, update on public.hv_claims to authenticated;
grant insert, select, update on public.hv_facilities to authenticated;
grant insert, select, update on public.hv_licences to authenticated;
grant insert, select, update on public.hv_passports to authenticated;
grant insert, select, update on public.hv_passport_scores to authenticated;
grant select on public.dossiers to authenticated;
grant select on public.matches to authenticated;
grant insert, select, update on public.workspaces to authenticated;
grant insert, select, update, delete on public.user_dashboard_preferences to authenticated;
grant select on public.marketplace_item_images to anon, authenticated;
grant insert on public.buyer_requests to authenticated;

-- Known follow-up, not addressed here: INSERT/UPDATE/DELETE grants above
-- were mirrored 1:1 from each view's existing grant set without auditing
-- whether the app actually writes through these api.* views (vs. a
-- service-role path). Worth a direct check before assuming this is the
-- live write path for any of these tables.
