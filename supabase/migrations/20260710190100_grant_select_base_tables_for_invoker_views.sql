-- Companion to 20260710190000_fix_security_definer_view_bypass_18_views:
-- flipping those views to security_invoker = true means the CALLING role's
-- own privileges now apply, not the view owner's. These base tables had
-- zero grants to anon/authenticated at all (only the SECURITY DEFINER view
-- did) -- so without this, RLS never gets a chance to evaluate; the read
-- fails at the coarser GRANT check first with a hard permission-denied,
-- breaking legitimate signed-in users' access to their own data (e.g. a
-- user's own subscription row, their own org's watchlist).
--
-- SELECT only -- this does not widen which ROWS are visible. Every table
-- below already has a real, verified-restrictive RLS SELECT policy
-- (auth.uid() = user_id, workspace membership, deal-room participancy, or
-- hv_is_org_member()) that still applies underneath this grant. This just
-- lets that policy run instead of the request being rejected outright.
--
-- anon is intentionally granted on only 3 of these: trade_flows,
-- market_metrics, hv_public_profile_snapshots are the only ones whose RLS
-- policy is actually satisfiable by an unauthenticated caller (public
-- reference data / a data_type filter with roles = public). The other 8
-- are gated on auth.uid() (directly, or transitively via workspace_members
-- / hv_is_org_member()), which is NULL for anon and can never match --
-- granting anon SELECT there would add permission surface for zero
-- capability, so those stay authenticated-only.

grant select on public.trade_flows to anon, authenticated;
grant select on public.market_metrics to anon, authenticated;
grant select on public.hv_public_profile_snapshots to anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.deal_room_messages to authenticated;
grant select on public.hv_evidence_documents to authenticated;
grant select on public.cc_org_pathway_progress to authenticated;
grant select on public.cc_org_requirement_status to authenticated;
grant select on public.cc_watch_rules to authenticated;
grant select on public.cc_watchlist_items to authenticated;
grant select on public.cc_watchlist_notifications to authenticated;

-- Needed for the cc_* tables' RLS policies above: their USING clause
-- subqueries workspace_members (org_id IN (SELECT workspace_id FROM
-- workspace_members WHERE user_id = auth.uid())), which itself requires
-- SELECT on workspace_members to evaluate. workspace_members has its own
-- RLS (auth.uid() = user_id OR admin) so this grant does not let a caller
-- read any row but their own membership record.
grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';
