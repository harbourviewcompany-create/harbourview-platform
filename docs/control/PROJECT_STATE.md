# Harbourview Project State

This file tracks durable project readiness state for Harbourview Marketplace.

Status: **SUPERSEDED — historical record only, not current authority**

> ⚠️ **Do not use this file as current readiness/HOLD-gate authority.** Its dated
> entries run mid-May through 2026-05-16 and reference a superseded PR (#314);
> nothing here has been updated since. The live, actively-maintained operating
> handoff is the repo-root `HANDOFF.md` — read that first for current OPEN ITEMS
> / P0-P3 status, not this one.
>
> This file, `docs/control/SOURCE_OF_TRUTH.md`, and `docs/control/CURRENT_STATE.md`
> all predate root `HANDOFF.md`'s 2026-08-11 state. `docs/control/AGENT_HANDOFF.md`
> was flagged on this same basis 2026-07-21 (see `docs/control/EVIDENCE_LOG.md`,
> PR #1112) but this file itself was never updated at that time — this pass
> closes that gap.
>
> Flagged during a docs-review session, 2026-08-15 — see
> `docs/control/EVIDENCE_LOG.md` for the entry.

---

## Current production recovery state

**Status:** HOLD — canonical production verification and source-of-truth recovery in progress.

**Canonical source of truth:** `docs/control/PROJECT_REGISTRY.md`

**Canonical repo:** `harbourviewcompany-create/harbourview-platform`

**Canonical production domain:** `https://harbourview.vercel.app`

**Canonical Vercel project:** `harbourview` under Vercel team `harbourviewnetwork`

**Current replacement recovery scope:** align production verification defaults with the canonical production domain, expand public production leakage probe coverage to all current marketplace category routes, and supersede stale May 2026 evidence tied to older Harbourview production domains without changing runtime code, Supabase, RLS, auth, marketplace DTOs, Vercel, Netlify, secrets, branch protection, or deployment settings.

**Current HOLD gates after this replacement recovery PR:**

- Fresh canonical Vercel production deployment proof from current `main` is still required after merge.
- Production public leakage probe must pass against `https://harbourview.vercel.app`.
- Anonymous `/admin` and nested `/admin/*` denial must be re-proven against canonical production.
- Marketplace browser smoke must be run against the canonical production domain with explicit write/cleanup gates.
- GitHub secret mapping for the canonical Vercel project remains unresolved.
- Exact `main` branch-protection required checks remain unresolved; stale Vercel/Netlify contexts must not be treated as canonical until proven.
- PR #314 is superseded by the replacement PR that excludes `next.config.ts` because current `main` already contains the build fix from merged PR #310.

<!-- Trigger commit: Branch Verification re-run -->

## Source-of-truth verification pass — 2026-05-16

**Status:** HOLD for complete source-of-truth closure. GO only for this documentation-only record.

**Scope:** Read-only repository/control verification using the locked Harbourview control frame. No runtime code, Supabase schema, migrations, RLS, auth logic, middleware, marketplace DTOs, routes, UI, workflows, dependencies, package files, Vercel config or deployment settings were changed.

**Verified facts recorded from the read-only inspection:**

- `docs/control/DESIGN_SYSTEM.md` is the documented Harbourview design-system authority.
- Tailwind/global CSS evidence supports the Harbourview navy/gold/off-white institutional design direction.
- Playfair Display is not verified as an implemented/imported runtime font. Treat it as design direction only until repo evidence proves implementation.
- Next.js App Router structure is present through `app/layout.tsx`, app route files, protected admin route groups and API route files.
- Admin roles are `admin`, `operator`, `analyst` and `viewer`.
- Admin authorization evidence supports database-backed `user_roles` lookup and a custom `hv-admin-session` cookie path. Custom JWT claims remain unverified.
- Protected admin pages use server-side `requireAdminAuth()` before rendering private admin surfaces.
- Public marketplace DTO allowlisting exists in `lib/marketplace/publicListings.ts`.
- Production leakage probe and marketplace smoke scripts exist, but script existence is not current production pass evidence.
- Smoke-write gates exist for write-based verification paths.

**Contradictions / drift:**

- Current canonical production domain is `https://harbourview.vercel.app`.
- Earlier durable marketplace smoke and environment-hygiene evidence in this file used `https://harbourview-platform.vercel.app`.
- Earlier canonical-domain recovery text is aligned with the 2026-05-17 registry state for `https://harbourview.vercel.app`.

**Remaining HOLD items:**

- GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
- Branch protection and stale status contexts.
- Preview/staging safety and Supabase environment separation.
- Live Supabase RLS verification.
- Current production public leakage pass against `https://harbourview.vercel.app`.
- Current anonymous admin denial proof and full role matrix.
- Current canonical-domain route map and smoke evidence.

**Completion rule:** Do not convert these HOLD items into GO until verified from repo, GitHub, Vercel or Supabase evidence and recorded with commands, workflow runs, logs or equivalent artifacts.

## Marketplace buy/sell conversion

**Status:** BRANCH — `marketplace-buy-sell-conversion-v1`

Marketplace buy/sell conversion added to clarify seller listing, buyer inquiry and wanted-request flows. Default marketplace fees are seller-side and disclosed during seller intake. Buyers do not see fee language for normal listing inquiries. Buyer-side commercial terms are reserved for active sourcing mandates or confidential sourcing support. Harbourview remains a controlled introduction marketplace. No public seller contact exposure.

New routes: `/marketplace/consumables/[id]` (8 static listing detail pages).

Nav updated: "Submit Supply" → "List for Sale". Quote page repositioned as "Inquire to Buy".

No schema, RLS, admin auth, adminGuard or capture route changes.

## Marketplace capture verification

**Status:** SUPERSEDED BY CURRENT PRODUCTION RECOVERY HOLD

**Last verified:** 2026-05-03

**Verification method:** Automated production browser smoke through GitHub Actions and Playwright.

**Primary source of truth**

- Workflow run ID: `25268527754`
- Workflow: `.github/workflows/marketplace-browser-smoke.yml`
- Branch: `smoke/marketplace-browser-20260502-envhygiene`
- Deployed production commit: `b740c4486615c18dd73b50ad1ca21b3119d68140`
- Production URL: `https://harbourview-platform.vercel.app`
- Job conclusion: `success`

**Current domain-drift note:** The production URL above is historical evidence for `https://harbourview-platform.vercel.app`. The canonical production domain is now `https://harbourview.vercel.app`; do not reuse this historical pass as current canonical-domain proof without rerunning and recording verification against the canonical domain.

**Inquiry types verified**

- `quote_routing`
- `listing_submission`
- `wanted_request_submission`

**Cleanup confirmation**

All three smoke rows were marked `closed` after verification.

**Operational impact**

This evidence is retained as historical proof only. Current production verification must target `https://harbourview.vercel.app`.

## Vercel/Supabase environment hygiene

**Status:** SUPERSEDED BY CURRENT PRODUCTION RECOVERY HOLD

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

**Current domain-drift note:** The production URL above predates the canonical domain `https://harbourview.vercel.app`. Treat the environment-hygiene result as durable historical evidence only for the recorded workflow, branch, commit and URL.

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
- Migration `20260301000000_user_roles_admin_gate.sql` applied to production Supabase.
- PR #44 added a direct page-level `requireAdminAuth()` guard to `/admin/listings` after production verification found denied anonymous HTML still contained admin-only provenance labels.
- This update exists only to trigger production deployment of the PR #44 main-branch closure commit.

## Marketplace commercial polish

**Status:** BRANCH — `marketplace-commercial-polish-v1`

**Purpose:** Marketplace commercial polish added to improve supplier acquisition, wanted-request conversion and inquiry-first category framing. No schema, RLS or admin authorization changes.

**Pages updated:** `/marketplace`, `/marketplace/consumables`, `/marketplace/wanted`, `/marketplace/sell`

**Fixtures updated:** `lib/fixtures/consumables.ts` — 8 listing titles replaced with commercial opportunity framing.

## Current readiness label

`PRODUCTION_CANONICAL_VERIFICATION_RECOVERY_HOLD`

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

**Migration:** `supabase/migrations/20260305000000_live_source_intake_v0_consumables.sql`

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
5. `docs/control/VERIFICATION_PLAN.md` for evidence requirements
6. Existing repository code, tests and production evidence

**Operating rule:** Use the control pack as a guardrail, not bureaucracy. Minor docs or copy changes should not require every control file to be updated. State-changing work must update this file and `docs/control/EVIDENCE_LOG.md`.

## Verification and control plane readiness (Agent 3)

**Status:** IMPLEMENTED (local/CI-safe), PRODUCTION HOLD (env-dependent probes pending)

**Date:** 2026-05-14

### Added control gates
- Package verification command map (`verify:leakage`, `verify:admin-auth`, `verify:marketplace-smoke`, `verify:production-visibility`, `verify:all-safe`).
- Public leakage probe includes required forbidden token set and optional runtime HTML route checks via `HARBOURVIEW_PUBLIC_BASE_URL`.
- Marketplace smoke script emits explicit operational states: `NOT RUN`, `GATED`, `BLOCKED`, `RUN`, `PASS`, `FAIL`.
- Branch verification workflow runs leakage, admin authorization, and marketplace guard gates in CI.

### GO/HOLD
- GO for branch-level safe verification repeatability.
- HOLD for production-write smoke and env-backed runtime probes until protected secrets and base URL are supplied in controlled workflow execution.
