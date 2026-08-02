-- Continuation of the missing-grant audit (see 20260729000000, 20260729010000).
-- Checked all remaining `authenticated`-only gaps individually rather than
-- blanket-granting -- three of the five were correctly locked down by
-- design and are NOT touched here:
--   - marketplace_inquiries: only an INSERT policy exists, no SELECT policy
--     at all. Write-only for the public by design (buyer contact data).
--   - signal_candidates: RLS policy is `service_role_all`, restricted to
--     auth.role() = 'service_role'. No authenticated-facing intent exists.
--   - stripe_webhook_events: RLS policy restricted to service_role only,
--     explicitly named "Service role manages webhook events". Should stay
--     locked down -- granting authenticated here would be against the
--     table's own clear design intent, not a bug fix.
--
-- The other two ARE genuine missing-grant bugs, same shape as every prior
-- fix in this series -- RLS already correctly scopes access, the grant was
-- just never added:
--   - candidate_review_events: RLS policy `admin_operator_select` restricts
--     to users with role admin/operator via a user_roles lookup. Currently
--     even admins/operators can't read this table at all. Confirmed no
--     risky cross-table view dependency (single base table, ignoring
--     pg_toast noise).
--   - cc_pathway_templates: RLS policy `cc_pathway_templates_auth_read`
--     (name itself signals intent) restricts to `is_active = true`.
--     Confirmed single base table dependency.
--
-- regulatory_signals.* views flagged in the original audit were not
-- re-checked in this pass -- flagged for further follow-up, not fixed here.

grant select on public.candidate_review_events to authenticated;
grant select on public.cc_pathway_templates to authenticated;
