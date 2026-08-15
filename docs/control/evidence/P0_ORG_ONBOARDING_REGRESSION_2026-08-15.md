# P0 Organization Onboarding Regression — 2026-08-15

## Scope

Focused repair for the reproduced mobile organization-onboarding regression. Canonical identity and authorization architecture remains Supabase Auth + `workspaces` + `workspace_members` + `user_dashboard_preferences`.

Starting source tree: `3f3631d4533bcf633e80fac86b9f1fe11e9c99ef`.

Current `main` subsequently advanced to `fd2ba6fb0f3bfca94cee573789409c74cd598552` through no-op/restoration commits while retaining the same Git tree (`ca5982f8fbe6921677ab81c9fe844beb4fecb474`), so the application source inspected before editing remains current by tree content.

## Reproduced root causes

1. Command generated a no-organization action with `page=organization&section=overview`, which kept mobile users in Command rather than entering the existing organization workflow.
2. Mobile Command renders only the first two attention rows. A create/join pair must be promoted together when organization onboarding is the active P0 state or Join is hidden behind the full queue.
3. `/organization` and `/organization/*` were not application-shell routes, so the public marketing navigation wrapped organization onboarding on mobile.
4. Market Routing preserved selected-market return context for Create organization but not for signed-in Join organization.
5. Join organization returned to hard-coded `/dashboard` after acceptance instead of the initiating Command context.
6. Existing P0 Playwright coverage asserted link visibility/hrefs but did not click through real authenticated create/join workflows.

## Repair

- Command now converts the no-organization state into explicit `Create an organization profile` and `Join an organization` priority actions that route to the existing canonical `/organization/new` and `/organization/join` workflows.
- Command return context is allowlisted and preserved through country, role, page, section, market view, tool/listing, search and cultivar parameters where present.
- `/organization` is now an application/no-public-shell prefix.
- Market Routing signed-in Join preserves the selected market return path.
- Organization Context Create/Join/Manage actions preserve the initiating Command URL.
- Join acceptance returns to a validated internal `returnTo` path after the existing API/RPC succeeds.
- Dedicated isolated-Supabase E2E coverage exercises real authentication, organization creation, active membership, active workspace persistence, attention-state clearance, selected-market click-through, invitation failure/retry, successful join, Personal mode and multi-organization switching at the required mobile viewports.

## Production database disposition

Read-only inspection of the live Harbourview Platform Supabase project found that migration `20260814122000_p0_identity_org_context` is absent from the production migration ledger. Direct read-only schema checks also found all four P0 objects absent:

- `public.user_dashboard_preferences.active_workspace_id`
- `api.user_dashboard_preferences.active_workspace_id`
- `public.workspace_invitations`
- `api.accept_workspace_invitation(text,uuid,text)`

No production migration or database mutation was performed.

Controlled-production organization onboarding remains **HOLD** until the existing migration is separately authorized/applied under migration controls and post-migration authenticated verification passes.
