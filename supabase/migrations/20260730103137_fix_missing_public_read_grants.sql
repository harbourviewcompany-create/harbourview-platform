-- Canonical migration (applied 2026-07-30 10:31:37 UTC). Continuation of the
-- missing-grant audit series (20260729095416, 20260729021338, and earlier).
-- Every table below already has a correct, deliberate RLS policy for public
-- or scoped read access (confirmed via pg_policy) but was missing the grant
-- -- the same gap as jurisdiction_playbooks. Without the grant, the
-- security_invoker=true enforcement on api-schema views blocks every read
-- regardless of the view's own grant, and RLS never even gets evaluated
-- (the grant check happens first).
--
-- Confirmed each policy's intent before granting -- these are all genuine
-- "already designed to be public/scoped, missing the grant" cases, not new
-- access decisions:
--   - listings: RLS restricts to public_visibility=true AND status=approved
--     for anon/authenticated. Marketplace listings, meant to be public.
--   - local_authorities, local_intel_coverage, local_open_questions,
--     local_operating_notes, local_subdivisions_intel: RLS policy is
--     literally `true` for all five -- unconditional public read already
--     intended by design.
--   - operator_countries: RLS policy `true`, explicit public_select policy
--     name confirms intent.
--   - cc_watchlist_notifications, subscriptions, workspace_members: RLS
--     restricts to auth.uid()-owned rows. Granting anon SELECT here is
--     harmless (RLS still returns zero rows for anon, since auth.uid() is
--     null when unauthenticated) but included for consistency with the
--     view-level grant these already had.
--
-- Deliberately NOT included (need individual judgment, not a blanket
-- grant): local_evidence_coverage (its view joins public.marketplace_inquiries,
-- which has only an INSERT policy -- write-only for the public, holds buyer
-- contact data; granting the joined view would expose raw inquiry rows) and
-- talent_jobs / talent_jobs_public (joins public.workspaces, which has no
-- anon-facing policy either). Both flagged for follow-up, not fixed here.

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
