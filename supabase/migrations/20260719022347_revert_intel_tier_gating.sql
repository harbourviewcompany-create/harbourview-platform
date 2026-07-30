-- Reverts the intel/operator tier gating added in 20260714192255 and
-- 20260718080340. Not a pause -- a correction.
--
-- Note on sequencing: a separate, concurrent session independently reached
-- the same conclusion at the application-code layer -- both
-- getCountryPathwayMatrix and getOperatorLicenceMatrix now have their tier
-- check commented out (not deleted, restorable) rather than removed. This
-- migration is the missing other half: the RLS policy itself, applied live
-- via execute_sql before that concurrent work was discovered, and only now
-- being committed to close the drift gap between what's live and what's in
-- the repo. Confirmed both changes are complementary, not conflicting,
-- before writing this file -- checked pg_policies directly and found the
-- policy names below already active.
--
-- Two things surfaced together that make user_profiles.tier ('free' /
-- 'intel' / 'operator') the wrong gate to keep, not just the wrong gate to
-- enable right now:
--
-- 1. North Star v1.4/v1.5 (docs/MARKET_ENTRY_OS_NORTH_STAR.md, decided the
--    same day as this revert): business model is per-report, one-time
--    payment. Tyler explicitly rejected subscription tiers. Neither tier
--    vocabulary in this codebase -- this one, or entitlements.ts's
--    free/starter/professional/enterprise -- is where entitlement checks
--    are actually headed. The real gate will be "did you pay for this
--    specific report," once a report/corridor-plan data model and its
--    one-time Stripe Checkout path exist (neither does yet).
-- 2. entitlements.ts + require-auth.ts is a second, separate,
--    already-built, Stripe-webhook-wired tier system (checked: webhook
--    writes user.app_metadata.subscription_tier on real events) that
--    FEATURE_TIER_MAP already lists 'compliance' under, at 'starter'
--    minimum -- but requireAuth(), the function that would enforce it, is
--    never called anywhere in app/. Fully dead. A one-shot backfill script
--    (app/api/admin/backfill-tier-metadata/route.ts) attempts to copy
--    user_profiles.tier values into that field, but 'intel'/'operator'
--    aren't valid SubscriptionTier values there -- silently broken if it
--    were ever run (getTierLevel('intel') returns -1, below free).
--
-- Net: keeping this gate active meant maintaining a tier system nobody's
-- enforcing consistently, in a vocabulary the real entitlements code
-- doesn't recognize, gating a business model that's already been turned
-- down. Reverting the RLS itself (not just bypassing it in application
-- code) because there's no coherent tier state here worth preserving for
-- an easy re-enable later -- the real gate, when it's built, will look
-- nothing like this one.

drop policy if exists regulatory_pathways_tier_read on public.regulatory_pathways;
create policy regulatory_pathways_public_read on public.regulatory_pathways for select using (true);
grant select on public.regulatory_pathways to anon, authenticated;

drop policy if exists pathway_format_rules_tier_read on public.pathway_format_rules;
create policy pathway_format_rules_public_read on public.pathway_format_rules for select using (true);
grant select on public.pathway_format_rules to anon, authenticated;

drop policy if exists operator_licences_tier_read on public.operator_licences;
drop policy if exists operator_licences_public_read on public.operator_licences;
create policy operator_licences_public_read on public.operator_licences for select using (true);
grant select on public.operator_licences to anon, authenticated;

grant select on api.regulatory_pathways to anon;
grant select on api.pathway_format_rules to anon;
grant select on api.operator_licences to anon;
