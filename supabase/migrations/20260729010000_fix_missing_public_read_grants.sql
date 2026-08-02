-- Continuation of the audit started after PR #1178 / #1199. Every table
-- below already has a correct, deliberate RLS policy for public or
-- scoped read access (confirmed via pg_policy) but is missing the
-- corresponding GRANT -- the same gap as jurisdiction_playbooks (PR #1199).
-- Without the grant, the security_invoker=true enforcement on api-schema
-- views blocks every read regardless of the view's own grant, and RLS never
-- even gets evaluated (grant check happens first).
--
-- Confirmed each policy's intent before granting -- these are all genuine
-- "already designed to be public/scoped, missing the grant" cases, not new
-- access decisions:
--   - listings: RLS restricts to public_visibility=true AND status=approved
--     for anon/authenticated. Marketplace listings, meant to be public.
--   - local_authorities, local_evidence_coverage, local_intel_coverage,
--     local_open_questions, local_operating_notes, local_subdivisions_intel:
--     RLS policy is literally `true` for all six -- unconditional public
--     read already intended by design.
--   - operator_countries: RLS policy `true`, explicit public_select policy
--     name confirms intent.
--   - talent_jobs: RLS restricts to status='open' for public read (backs
--     the api.talent_jobs_public view, which also depends on workspaces).
--   - cc_watchlist_notifications, subscriptions, workspace_members: RLS
--     restricts to auth.uid()-owned rows. Granting anon SELECT here is
--     harmless (RLS still returns zero rows for anon, since auth.uid() is
--     null when unauthenticated) but included for consistency with the
--     view-level grant these already had.
--
-- NOT included in this migration: candidate_review_events,
-- cc_pathway_templates, marketplace_inquiries, signal_candidates,
-- stripe_webhook_events, regulatory_signals.* -- these are
-- authenticated-only gaps found by the same audit, but the "authenticated
-- should read this broadly" assumption needs individual verification
-- (stripe_webhook_events in particular looks like it should very likely
-- stay admin/service-role-only, and a missing grant there may be correct
-- lockdown, not a bug) -- flagged for follow-up rather than blanket-granted.

-- NOT included: local_evidence_coverage. Its view joins public.marketplace_inquiries,
-- which has only an INSERT policy ("Public can create marketplace inquiries") and
-- no SELECT policy at all -- it's write-only for the public (likely holds buyer
-- contact/inquiry details). Because security_invoker=true is enforced project-wide,
-- granting local_evidence_coverage to anon would require ALSO granting anon direct
-- SELECT on marketplace_inquiries for the join to resolve -- which would expose raw
-- inquiry rows directly via REST, not just whatever local_evidence_coverage curates.
-- This one needs a schema-level fix (e.g. a maintained aggregate table instead of a
-- live join, or restructuring the view to not need row-level marketplace_inquiries
-- access), not a grant. Flagged for follow-up, not fixed here.

-- NOT included: talent_jobs. api.talent_jobs_public also joins public.workspaces
-- (presumably for a company/workspace name), and workspaces has no anon-facing RLS
-- policy at all (only admin_operator_select and workspaces_member_select, both
-- auth.uid()-gated) -- so even after granting talent_jobs, the join to workspaces
-- would return zero rows for anon under RLS, or fail outright without a grant there
-- too. Granting workspaces to anon broadly is a bigger decision (that table likely
-- holds internal org data beyond just a display name) than this migration should
-- make unilaterally. Flagged for follow-up -- probably needs a narrow public-facing
-- workspaces view/column subset, not a blanket grant.

grant select on public.listings to anon, authenticated;
grant select on public.local_authorities to anon, authenticated;
grant select on public.local_intel_coverage to anon, authenticated;
grant select on public.local_open_questions to anon, authenticated;
grant select on public.local_operating_notes to anon, authenticated;
grant select on public.local_subdivisions_intel to anon, authenticated;
grant select on public.operator_countries to anon, authenticated;
grant select on public.cc_watchlist_notifications to anon;
grant select on public.subscriptions to anon;
grant select on public.workspace_members to anon;
