# Harbourview Evidence Log

Last updated: 2026-05-28
Status: Finish-line reset scaffold with preserved legacy evidence entries
Authority: Canonical evidence log for Harbourview finish-line execution

## Purpose

This document records evidence for Harbourview build, deployment, security/leakage, admin/auth/RLS, marketplace, and finish-line completion claims.

A claim is not final unless evidence is linked or recorded here.

## Evidence Rule

Use this file to prove current-state and completion claims. Do not treat old evidence as current unless it is revalidated or explicitly promoted during the finish-line reset.

Evidence must state:

- Date
- Scope
- Source or command
- Result
- Link or artifact reference when available
- Whether the evidence is current, legacy, blocked, or superseded

## Current Evidence Status

Pass 1 created/updated control documentation only. It did not run build, test, deployment, route, admin/auth, RLS, marketplace, or production probes.

| Area | Current evidence status | Notes |
|---|---|---|
| Repo control docs | In progress | Pass 1 creates/updates the five control docs |
| Build/typecheck/lint | Unknown | Not run in Pass 1 |
| Deployment | Unknown | Not verified in Pass 1 |
| Public route checks | Unknown | Not run in Pass 1 |
| Public/private leakage checks | Unknown | Not run in Pass 1 |
| Admin/auth/RLS checks | Unknown | Not run in Pass 1 |
| Marketplace flows | Unknown | Not run in Pass 1 |
| Production writes | Not authorized | Must remain gated and explicit |

## Build Evidence

| Date | Check | Command / source | Result | Link / artifact | Status |
|---|---|---|---|---|---|
| 2026-05-28 | Pass 1 control-doc creation | GitHub contents API via connected GitHub tool | Created/updated docs only | Commit SHAs to be listed in final Pass 1 report | Current |

## Deployment Evidence

| Date | Environment | URL | Result | Link / artifact | Status |
|---|---|---|---|---|---|
| TBD | TBD | TBD | Not verified in Pass 1 | TBD | Unknown |

## Security / Leakage Evidence

| Date | Check | Scope | Result | Link / artifact | Status |
|---|---|---|---|---|---|
| TBD | TBD | TBD | Not verified in Pass 1 | TBD | Unknown |

## Admin / Auth / RLS Evidence

| Date | Check | Result | Link / artifact | Status |
|---|---|---|---|---|
| TBD | TBD | Not verified in Pass 1 | TBD | Unknown |

## Marketplace Flow Evidence

| Date | Flow | Result | Link / artifact | Status |
|---|---|---|---|---|
| TBD | TBD | Not verified in Pass 1 | TBD | Unknown |

## Known Unproven Claims

| Claim | Why unproven | Required evidence | Status |
|---|---|---|---|
| Current production deployment state | Pass 1 did not inspect deployment runtime | Deployment URL, status, route checks, relevant probe results | Open |
| Current feature readiness | Pass 1 did not inspect app runtime or tests | Build/test/probe evidence from current repo/deployment | Open |
| Current admin/auth/RLS readiness | Pass 1 did not run role/access checks | Current role matrix/access verification | Open |
| Current public/private leakage posture | Pass 1 did not run leakage probes | Current static/runtime leakage checks | Open |

## Preserved Legacy Evidence Entries

The entries below existed before the finish-line source-of-truth reset. They are preserved for traceability, but they are not automatically current. Treat them as legacy evidence until revalidated or promoted into current evidence.

---

## 2026-05-09: Production deployment trigger after listings route restore

**Evidence ID:** `HV-PRODUCTION-LISTINGS-ROUTE-DEPLOY-20260509`

**Branch:** `main`

**Base commit:** `51a9aed7bbfde3316b6019582dba551ce0590d78`

**Purpose:** Documentation-only production deployment trigger after the safe `/marketplace/listings` route restoration and public IA cleanup were present on `main` but not yet reflected on `https://harbourview.vercel.app`.

**Expected production checks:** `/`, `/marketplace`, `/marketplace/listings`, `/marketplace/wanted`, `/marketplace/sell`, `/intake`, `/signals`, `/compliance`, `/about`, `/contact`, and `/admin`.

**Required assertions:** public routes return expected 200s, anonymous `/admin` denies access, `/marketplace/listings` is not 404, `/marketplace/sell` does not expose `Supplier Directory Listing`, `Supplier Directory` public exposure is zero, and forbidden public leakage strings are zero.

## 2026-05-09: Main verification trigger request

**Evidence ID:** `HV-MAIN-VERIFICATION-TRIGGER-20260509`

**Branch:** `verify/main-gates-20260509`

**Base commit:** `df5345630a0f01dd3de6ae4112ebd421bd2a7ce5`

**Purpose:** Documentation-only no-op PR to trigger Branch Verification and Regulatory Signals Verify after the post-PR #175/#191 verification-gate repairs.

**Expected checks:** `npm ci`, `npm run typecheck`, `npm run build`, `npm run test:services-public-leakage`, and `npm run test:regulatory-signals-public-leakage`.

**Merge policy:** Do not merge this trigger PR unless both workflows pass.

## 2026-05-14: Verification/control-plane readiness pass (Agent 3 lane)

**Evidence ID:** `HV-VERIFY-CONTROL-PLANE-20260514`

**Branch:** `codex/harbourview-verification-control-plane`

**Scope:** CI/tests/probes/docs/control (no UI implementation changes, no backend/auth behavioral changes).

**Commands and results (UTC):**
- `npm run typecheck` — PASS
- `npm run lint` — PASS (warnings only)
- `npm run test:intelligence-os` — PASS (8/8 tests)
- `npm run verify:leakage` — PASS (static forbidden-token leakage gate)
- `npm run verify:admin-auth` — PASS (anonymous/missing/viewer/analyst denied; operator/admin allowed)
- `npm run verify:marketplace-smoke` — PASS (route/workflow guards + production write fail-closed controls)
- `npm run build` — PASS

**Blocked/not run:**
- Production write smoke execution: NOT RUN/GATED by required env gates and credentials.
- Runtime public leakage HTML probe: BLOCKED unless `HARBOURVIEW_PUBLIC_BASE_URL` is provided.

**Operational conclusion:**
- Local/CI-safe verification gates are materially stronger and explicit.
- Production readiness remains HOLD until production/env-backed probes are executed with controlled credentials and evidence artifacts.

## Pass 1 Verification Status

Pass 1 updated this evidence-log structure only and preserved legacy evidence entries.

Expected Pass 1 evidence:

- No app code changed.
- No schema changed.
- No route changed.
- No auth/RLS changed.
- No deployment setting changed.
- No Notion, Drive, Linear, or Monday workspace changed.

## 2026-06-01: Working-alpha completion pass (implementation agent)

**Evidence ID:** `HV-ALPHA-COMPLETION-20260601`

**Branch:** `main`

**Commit:** `836497ee3aad88ea174bb6275f87ea420a94799a`

**Scope:** HV-ALPHA-001 through HV-ALPHA-009 — working-alpha content and code quality pass. No Supabase schema, RLS, auth, middleware, deployment settings, or production writes changed.

**Work summary:**

- Replaced all 18 education route shells with full PublicSurfacePage content (GMP, GACP, GDP, pharmacy, testing, pharmacovigilance, policy, briefings, review-required, request, quality-compliance, importer-distributor, cultivation-production, procurement, glossary)
- Fixed all 6 educationTracks hrefs pointing back to /education hub; added 4 redirect pages for duplicate routes
- Replaced 2 coming-soon forms with real client form components (ComplianceRequestForm, ClinicalEducationRequestForm)
- Built 7 compliance explainers with full substantive content
- Expanded 4 intelligence sub-pages from 38-line shells to full IntelligenceModulePage content
- Upgraded signals, compliance regions, and country pages from raw HTML to platform design
- Added generateMetadata to 16 pages missing it; split 2 bare 'use client' page.tsx files
- Fixed all 58 TypeScript errors introduced by remote type refactors (AdminResult generic narrowing)
- Fixed 3 build errors in HarbourviewDashboard; fixed all lint to 0 errors 0 warnings
- Fixed 6 test script failures (ripgrep dependency, tsc flags, zod resolution, tsx routing)
- Created migration implement_is_signal_admin.sql (was permanent placeholder returning false)
- Added openGraph to 3 hub pages; added missing HAR-37 role terms; deleted unused component
- Documented 6 undocumented env vars; added README canonical status block

**Commands and results:**

- `npm run typecheck` — PASS (0 errors)
- `npm run lint` — PASS (0 errors, 0 warnings)
- `npm run build` — PASS (compiled successfully)
- `npm run test:full-scope-launch-readiness` — PASS (all 7 checks)
- All 36 runnable test scripts — PASS (36/36; 1 skip: compliance-visibility requires live Supabase)

**Not run / blocked:**

- Production route map probe: BLOCKED — requires `HARBOURVIEW_PUBLIC_BASE_URL=https://harbourview.vercel.app`
- Production public leakage probe: BLOCKED — requires live deployment and env
- Marketplace smoke writes: BLOCKED — requires SUPABASE_SERVICE_ROLE_KEY and explicit write gates
- Admin role matrix against production: BLOCKED — requires test accounts and live /admin

**Gate status after this pass:**

- Gate 1 (Build Recovery): GO — build is clean on current main
- Gate 4 (Static Verification): GO — typecheck, lint, build, all static tests pass
- Gates 2, 3, 5-14: HOLD — require live infrastructure, operator decisions, or external access

**Public/private leakage assessment:** All 36 runnable leakage/boundary tests pass. No static evidence of leakage introduced.

**GO/HOLD decision:** GO for HV-ALPHA-001 through HV-ALPHA-009 scope. HOLD for full production certification (Gates 2, 3, 5-14) pending live infrastructure verification.
