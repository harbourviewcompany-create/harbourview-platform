-- Harden SECURITY DEFINER grants on signal-review RPCs: the internal
-- is_genetics_admin_or_reviewer() checks added in
-- 20260721063000_fix_signal_review_rpcs_missing_authz.sql and
-- 20260721073000_fix_readonly_review_queue_rpcs_missing_authz.sql correctly
-- block unauthorized callers, but the underlying PostgREST EXECUTE grant on
-- these 11 functions is still held by the PUBLIC pseudo-role (not
-- individually by anon/authenticated) -- exactly the trap
-- docs/INTELLIGENCE_ARCHITECTURE_SPEC.md guardrail #6 names ("watch the
-- PUBLIC pseudo-role -- revoking from anon/authenticated does nothing if
-- PUBLIC holds the grant"). Confirmed via pg_proc.proacl before this change:
-- all 11 functions below show `=X/postgres` (PUBLIC) plus postgres/service_role;
-- none show a distinct anon or authenticated grant.
--
-- This is defense-in-depth, not a live-vuln fix -- the internal check already
-- returns 42501 for anon/unprivileged callers. Revoking the PUBLIC grant and
-- replacing it with an explicit `authenticated` grant removes anon's ability
-- to even attempt the call, and matches the access pattern the internal
-- checks already assume (admin/operator/analyst authenticated users, plus
-- service_role for the hv-classify-called functions, which already carry
-- their own explicit service_role grant unaffected by this change).
--
-- Verified via grep before applying: the only real caller of the plain
-- admin/operator/analyst-gated functions is lib/signals-engine/admin.ts
-- (authenticated browser session); apply_editorial_title,
-- rows_needing_titles and pool_rows_needing_classification are also called
-- by supabase/functions/hv-classify/index.ts via service_role, which is
-- unaffected by this migration.
--
-- Deliberately NOT touched: api.accept_classifier_tier and
-- api.set_regulatory_tier -- confirmed via pg_proc.proacl these are already
-- granted only to `authenticated` (no PUBLIC grant), which combined with
-- their existing is_regulatory_tier_admin() check is the correct pattern
-- already. No PUBLIC-grant defect exists there.
--
-- Rollback: `grant execute on function <fn> to public;` for each function
-- below restores the prior (over-broad) grant. Not recommended.

revoke execute on function api.apply_editorial_title(text, text, text) from public;
grant execute on function api.apply_editorial_title(text, text, text) to authenticated;

revoke execute on function api.approve_engine_signal(text, text) from public;
grant execute on function api.approve_engine_signal(text, text) to authenticated;

revoke execute on function api.bulk_approve_engine_queue(text, integer, text) from public;
grant execute on function api.bulk_approve_engine_queue(text, integer, text) to authenticated;

revoke execute on function api.count_engine_review_queue(text, integer) from public;
grant execute on function api.count_engine_review_queue(text, integer) to authenticated;

revoke execute on function api.get_signals_pending_analysis(integer, text) from public;
grant execute on function api.get_signals_pending_analysis(integer, text) to authenticated;

revoke execute on function api.list_engine_review_countries() from public;
grant execute on function api.list_engine_review_countries() to authenticated;

revoke execute on function api.list_engine_review_queue(text, integer, integer) from public;
grant execute on function api.list_engine_review_queue(text, integer, integer) to authenticated;

revoke execute on function api.pool_rows_needing_classification(integer) from public;
grant execute on function api.pool_rows_needing_classification(integer) to authenticated;

revoke execute on function api.reject_engine_signal(text, text) from public;
grant execute on function api.reject_engine_signal(text, text) to authenticated;

revoke execute on function api.rows_needing_titles(integer) from public;
grant execute on function api.rows_needing_titles(integer) to authenticated;

revoke execute on function api.save_signal_analysis(text, jsonb, text) from public;
grant execute on function api.save_signal_analysis(text, jsonb, text) to authenticated;
