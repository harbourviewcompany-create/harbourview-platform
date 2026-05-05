# Harbourview Project State

This file tracks durable project readiness state for Harbourview Marketplace.

## Marketplace buy/sell conversion

**Status:** BRANCH — `marketplace-buy-sell-conversion-v1`

Marketplace buy/sell conversion added to clarify seller listing, buyer inquiry and wanted-request flows. Default marketplace fees are seller-side and disclosed during seller intake. Buyers do not see fee language for normal listing inquiries. Buyer-side commercial terms are reserved for active sourcing mandates or confidential sourcing support. Harbourview remains a controlled introduction marketplace. No public seller contact exposure.

New routes: `/marketplace/consumables/[id]` (8 static listing detail pages).

Nav updated: "Submit Supply" → "List for Sale". Quote page repositioned as "Inquire to Buy".

No schema, RLS, admin auth, adminGuard or capture route changes.

## Marketplace capture verification

**Status:** PASS

**Last verified:** 2026-05-03

**Verification method:** Automated production browser smoke through GitHub Actions and Playwright.

**Primary source of truth**

- Workflow run ID: `25268527754`
- Workflow: `.github/workflows/marketplace-browser-smoke.yml`
- Branch: `smoke/marketplace-browser-20260502-envhygiene`
- Deployed production commit: `b740c4486615c18dd73b50ad1ca21b3119d68140`
- Production URL: `https://harbourview-platform.vercel.app`
- Job conclusion: `success`

**Inquiry types verified**

- `quote_routing`
- `listing_submission`
- `wanted_request_submission`

**Cleanup confirmation**

All three smoke rows were marked `closed` after verification.

**Operational impact**

Manual browser testing by Tyler is no longer required for the marketplace quote, standard listing submission or wanted request submission capture path. The automated production smoke workflow verifies browser submission, database row creation and smoke-row cleanup.

## Vercel/Supabase environment hygiene

**Status:** PASS

**Last verified:** 2026-05-03

**Verification method:** Post-cleanup automated production browser smoke against current main.

**Source of truth**

- GitHub Issue: `#37`
- Workflow run ID: `25268527754`
- Smoke branch: `smoke/marketplace-browser-20260502-envhygiene`
- Tested commit: `b740c4486615c18dd73b50ad1ca21b3119d68140`
- Production URL: `https://harbourview-platform.vercel.app`
- Result artifact status: `passed`
- Result artifact exit code: `0`

**Canonical environment conclusion**

- `NEXT_PUBLIC_SUPABASE_URL` remains required for production and preview public Supabase access.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains required and is the primary public client key used by marketplace capture and smoke verification.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` remains optional fallback only.
- `SUPABASE_SERVICE_ROLE_KEY` is not required by the production marketplace browser smoke loop. Current main includes admin role gating from PR #36 that may use `SUPABASE_SERVICE_ROLE_KEY` as a server-only helper for admin role lookup, so it should be treated as intentionally retained only if supporting deployed admin routes.

**Post-cleanup smoke result**

- `quote_routing`: PASS
- `listing_submission`: PASS
- `wanted_request_submission`: PASS
- Smoke cleanup to `closed`: PASS

## Admin access and provenance visibility closure

**Status:** DEPLOYMENT_TRIGGERED

**Last updated:** 2026-05-03

**Source of truth**

- PR #36 merged admin/operator role gate and production public provenance visibility probe.
- Migration `005_user_roles_admin_gate.sql` applied to production Supabase.
- PR #44 added a direct page-level `requireAdminAuth()` guard to `/admin/listings` after production verification found denied anonymous HTML still contained admin-only provenance labels.
- This update exists only to trigger production deployment of the PR #44 main-branch closure commit.

## Marketplace commercial polish

**Status:** BRANCH — `marketplace-commercial-polish-v1`

**Purpose:** Marketplace commercial polish added to improve supplier acquisition, wanted-request conversion and inquiry-first category framing. No schema, RLS or admin authorization changes.

**Pages updated:** `/marketplace`, `/marketplace/consumables`, `/marketplace/wanted`, `/marketplace/sell`

**Fixtures updated:** `lib/fixtures/consumables.ts` — 8 listing titles replaced with commercial opportunity framing.

## Current readiness label

`MARKETPLACE_CAPTURE_AND_ENV_HYGIENE_PASSING`

## Marketplace Commercial Polish V1

**Status:** IMPLEMENTATION BRANCH

**Branch:** `marketplace-commercial-polish-v1`

Marketplace commercial polish was added to improve supplier acquisition, wanted-request conversion and inquiry-first category framing. No schema, RLS, admin authorization, admin guard logic, protected admin routes, Supabase helpers or capture architecture changes are included.

**Public scope**

- `/marketplace` now leads with supplier and buyer conversion CTAs above the category grid.
- `/marketplace` documents the inquiry handling model: submit, screen and route.
- `/marketplace` includes supplier acquisition copy for marketplace visibility review.
- `/marketplace/consumables` uses inquiry-first sourcing language and public-safe consumables opportunity cards.
- `/marketplace/wanted` and `/marketplace/sell?type=wanted` reduce wanted-request friction with direct buyer-demand instructions.

## Live Source Intake V0 and consumables foundation

**Status:** IMPLEMENTATION BRANCH

**Branch:** `feature/live-source-intake-v0-consumables`

**Migration:** `supabase/migrations/007_live_source_intake_v0_consumables.sql`

**Purpose:** Add private admin/operator-only live source intake and candidate review foundations while keeping public publication manual, controlled and out of scope for V0.

**Private tables added**

- `source_registry`
- `source_snapshots`
- `marketplace_candidates`
- `candidate_review_events`

**Controls**

- RLS is enabled on all new private tables.
- Anonymous access is revoked.
- Authenticated access is limited to existing `admin` and `operator` roles through `public.user_roles`.
- Automatic URL fetch is deferred; V0 uses manual URL, title and text capture only.
- Candidate `approved_draft` does not publish publicly.
- Restricted/excluded consumables and licence-review candidates are blocked from `approved_draft`.

**Public category**

`Consumables & Operating Supplies` is the public category label. Public copy must remain inquiry-first and avoid supplier verification, availability, certification, COA, licence or guaranteed-supply claims.

## Harbourview Project Control Pack V1

**Status:** PR review lane

**Control PR:** `#27`

**Branch:** `docs/harbourview-control-pack-v1`

**Purpose:** Add durable project-control documents under `docs/control/` so future agent, coding, database, deployment and PR-review work has explicit scope, safety gates and evidence rules.

**Documentation-only rule:** Control-pack work must not modify application code, database migrations, workflows, package files or environment files.

**Authority order for future work**

1. Latest explicit user instruction in the active workstream
2. `docs/control/BUILD_CONTROL.md`
3. `docs/control/AGENT_PERMISSIONS.md`
4. Surface-specific controls:
   - `docs/control/DESIGN_SYSTEM.md` for UI/design/globe work
   - `docs/control/DATABASE_CONTROL.md` for database, RLS, Supabase and service-role work
   - `docs/control/DEPLOYMENT_RUNBOOK.md` for deployment, env and workflow work
   - `docs/control/VERIFICATION_PLAN.md` for evidence requirements
5. Existing repository code, tests and production evidence

**Operating rule:** Use the control pack as a guardrail, not bureaucracy. Minor docs or copy changes should not require every control file to be updated. State-changing work must update this file and `docs/control/EVIDENCE_LOG.md`.
