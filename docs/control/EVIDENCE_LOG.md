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

## 2026-05-31: Production globe hardening verification attempt

**Evidence ID:** `HV-GLOBE-PRODUCTION-HARDENING-20260531`

**Branch:** Current working branch

**Scope:** Public Harbourview globe rendering layers, globe material tokens, human-readable state/province labels, search shell contrast, role bottom-sheet contrast, and route-flow UI styling.

**Commands and results (UTC):**
- `npm install` — WARNING/BLOCKED: registry/network policy caused the install to hang; the attempt was stopped and the prior `node_modules` tree was restored before verification continued.
- `npm run lint` — PASS with pre-existing warnings in unrelated files.
- `npm run typecheck` — FAIL: existing dashboard implicit-any errors and missing Supabase package/type errors block repository-wide typecheck.
- `npm run test:globe-router` — FAIL: existing Natural Earth/search-universe assertions fail; `globe-foundation` and `globe-polygon-rendering` pass after this patch.
- `npm run test` — FAIL: stops on the same `test:globe-router` failures.
- `node scripts/test-globe-router-scope.mjs && node scripts/test-globe-router-mounted.mjs` — PASS.
- `npm run build` — FAIL: production build compiles but fails validity checks on existing `components/dashboard/HarbourviewDashboard.tsx` implicit-any errors.
- `npm run test:secret-scan` — PASS.
- `npm start` — FAIL: no production `.next` build is available because `npm run build` fails.
- `npm run test:e2e` — WARNING/BLOCKED: registry policy blocks `npx -p @playwright/test@1.54.0`.
- `npm run capture:browser` — WARNING/BLOCKED: no script named `capture:browser` exists in `package.json`.
- `npm run dev` plus `curl -I http://127.0.0.1:3000/` — PASS: local development server returned HTTP 200 for `/`.

**Evidence artifacts:**
- Browser screenshots were not captured because no browser/Playwright runtime is installed and registry policy blocked fetching Playwright.
- No secrets or private operational data were printed or committed.

**Operational conclusion:**
- Globe-layer, material, label, search, and role-sheet changes are implemented locally.
- Production GO remains HOLD until repository-wide typecheck/build blockers are resolved and browser smoke/screenshot verification can run.

## 2026-05-31: Globe hardening blocker resolution follow-up

**Evidence ID:** `HV-GLOBE-BLOCKER-RESOLUTION-20260531`

**Branch:** Current working branch

**Scope:** Follow-up to unblock the prior production globe hardening PR validation by resolving repository-wide typecheck/build blockers and stale globe test expectations.

**Commands and results (UTC):**
- `npm run typecheck` — PASS.
- `npm run test:globe-router` — PASS (54/54 tests).
- `npm run test` — PASS (64/64 tests across the configured test bundle).
- `npm run lint` — PASS with pre-existing warnings.
- `npm run build` — PASS.
- `npm run test:secret-scan` — PASS.
- `timeout 10s npm start` — WARNING: server reached Ready, then the timeout intentionally terminated the long-running process; Next reported standalone output should use `node .next/standalone/server.js`.
- `PORT=3001 timeout 10s node .next/standalone/server.js` — WARNING: standalone server reached Ready, then the timeout intentionally terminated the long-running process.
- `npm run test:e2e` — WARNING/BLOCKED: registry policy still blocks fetching `@playwright/test@1.54.0` with HTTP 403.

**Evidence artifacts:**
- No browser screenshots were captured in this follow-up because Playwright remains unavailable under registry policy.
- No secrets or private operational data were printed or committed.

**Operational conclusion:**
- Build/typecheck/configured unit test blockers from the prior globe hardening pass are resolved locally.
- Browser e2e/screenshot verification remains environment-blocked until Playwright or an equivalent browser runner is available.

- Added a Signal Engine-only hardening migration that moves the admin RLS helper into a non-exposed `private` schema, pins `search_path`, forces RLS on the 14 canonical Signal Engine tables, rewrites policies to the private helper, and drops the exposed public helper functions.
- Included a live Supabase Management API evidence collector for security advisors and Signal Engine-filtered logs with redaction.
- Included a local static verifier for the hardening workspace.
- Documented an execution plan covering evidence capture, migration execution, post-change advisor verification, rollback, and acceptance criteria.

**Commands and results (UTC):**

- `node scripts/signal-engine/verify-signal-engine-hardening.mjs` — PASS
- `node scripts/signal-engine/fetch-live-supabase-signal-security.mjs --skip-logs --out /tmp/should-not-write.json` — BLOCKED as expected without `SUPABASE_ACCESS_TOKEN`; no live advisor/log evidence was written.
- `npm run lint` — PASS
- `npm run check:migrations` — FAIL on pre-existing duplicate migration prefix `20260601000000` for marketplace supply engine and dashboard preferences migrations; not introduced by this workspace.
- `npm run test -- --passWithNoTests` — FAIL on pre-existing globe foundation expectations for camera defaults and azimuth limits; not introduced by this workspace.
- `npm run typecheck` — FAIL on current dashboard `CommandCentre` export/prop mismatch; not introduced by this workspace.
- `npm run build` — FAIL on the same current dashboard `CommandCentre` export mismatch after successful compilation; not introduced by this workspace.
- `node scripts/secret-scan.mjs` — PASS

**Not run / blocked:**

- Live Supabase advisor/log capture: BLOCKED because `SUPABASE_ACCESS_TOKEN` is not present in the agent environment.
- Supabase migration push: NOT RUN from this environment; apply through the team-approved Supabase workflow after pre-change evidence capture.

**Compliance & data handling:** No secrets, raw Supabase logs, JWTs, API keys, or private user data were committed. The live capture script redacts token-like and project REST path content before writing evidence files.

## 2026-06-06 — Supabase + Airtable Integration Foundation

**Scope:** Added Harbourview integration contract migrations, public/private DTO allowlists, server/browser Supabase client helpers, and a dry-run-first Airtable sync Edge Function foundation. No production Airtable sync was run and no Airtable writeback was attempted.

**Commands and results (UTC):**

- `npm run typecheck` — PASS after excluding Deno Edge Function sources from the Next.js `tsc` project.
- `npm run lint` — PASS with pre-existing warnings in `app/vault/page.tsx`.
- `npm run test -- --passWithNoTests` — FAIL on pre-existing globe foundation expectations for camera defaults and azimuth limits; unrelated to this integration foundation.
- `npm run build` — FAIL on pre-existing Next.js `app/login/page.tsx` `searchParams` type mismatch after successful compilation; unrelated to this integration foundation.
- `npx supabase --version` — PASS (`2.105.0`).
- `npx supabase status` — BLOCKED because Docker daemon is unavailable.
- `npx supabase db reset` — BLOCKED because Docker daemon is unavailable.
- `npx supabase migration list` — BLOCKED because the project is not linked to a Supabase project ref in this workspace.
- `npx supabase db lint` — BLOCKED because local Postgres at `127.0.0.1:54322` is unavailable.
- `grep -R "SUPABASE_SERVICE_ROLE_KEY\|service_role" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.vercel .` — REVIEWED; matches are server/admin/test/docs/migration references, with new application helper isolated in `lib/harbourview/supabase/service-role.ts` using `server-only`.
- `deno --version` and local `deno run supabase/functions/airtable-sync/index.ts` — BLOCKED because Deno is not installed in the workspace.

**Evidence notes:**

- RLS enablement is installed in `supabase/migrations/20260606090300_hv_integration_rls_policies.sql` for all 18 Harbourview base tables.
- Public DTO views are allowlisted in `supabase/migrations/20260606090200_hv_integration_indexes_views.sql` and the TypeScript allowlist is in `lib/harbourview/dto/allowlists.ts`.
- Static DTO leakage check reported no forbidden fields in public view select lists.
- Airtable writeback remained disabled and was not run.

**Operational conclusion:** CONFIG_HOLD. Code and static checks are complete, but local Supabase/Docker and Deno runtime are unavailable, so migration apply, database lint, RLS runtime queries, and dry-run function invocation could not be completed in this environment.

## 2026-06-06 — Hostile security audit

**Scope:** Hostile source audit of Harbourview application routes, admin guardrails, service-role usage, dependency posture, and public/private data exposure risks. No production traffic, live Supabase writes, brute force, or destructive testing was performed.

**Commands and results (UTC):**

- `git status --short && git remote -v && cat .git/config` — PASS; clean pre-audit working tree and no configured Git remote URL in the local checkout.
- `find . -maxdepth 2 -type f | sed 's#^./##' | sort | head -200` — PASS; top-level repository structure reviewed without recursive large-tree listing.
- `find app -maxdepth 4 -type f | sort` and `find lib -maxdepth 3 -type f | sort` — PASS; application/API/security-relevant files mapped.
- `python - <<'PY' ... Path('app/api').rglob('route.ts') ... PY` — PASS; identified service-role API routes without admin guard calls.
- `rg -n "SUPABASE_SERVICE_ROLE_KEY|createClient\(|requireAdminAuth|getAdminAuthCheck|csrf|rateLimit|Authorization|x-cron|CRON|secret" app lib scripts --glob '!node_modules'` — PASS; auth, service-role, rate-limit, and secret-touching paths reviewed.
- `npm run test:secret-scan` — PASS; no high-confidence secret literals found.
- `npm audit --omit=dev` — FAIL; moderate PostCSS advisory inherited through Next.
- `npm run lint:docs` — FAIL; no `lint:docs` script exists in `package.json`.
- `npm run test -- --passWithNoTests` — FAIL; pre-existing globe foundation expectations fail for camera defaults and azimuth limits.

**Evidence artifacts:**

- Audit report: `docs/control/HOSTILE_AUDIT_2026-06-06.md`.

**Compliance & data handling:** No secrets, private Supabase logs, JWTs, customer data, credentials, or production payloads were used or committed. The audit relied on local source review, package metadata, static scans, and local command output.

**Operational conclusion:** RELEASE HOLD until unauthenticated service-role-backed genetics mutation routes are patched, public genetics intake returns a narrow DTO, fail-open operational routes are hardened, dependency audit is resolved or risk-accepted, and test drift is cleared.

## 2026-06-07 — Cannabis Data Contract v1.0 P0/P1 Backend Foundation

**Scope:** Added the additive `cannabis_intelligence` schema foundation for Harbourview Global Cannabis Data Contract v1.0 P0/P1 raw intelligence tables, stable system enums, taxonomy/coverage-matrix seed, coverage-gap generation, RLS deny-by-default posture, and TypeScript public DTO allowlists. No production database push was attempted and no fake country/legal/regulator/licence/licensee facts were seeded.

**Commands and results (UTC):**

- `npx vitest run tests/cannabis-data-contract/migration.test.ts tests/cannabis-data-contract/dto.test.ts` — PASS; verifies required enums/tables, confidence/FK/RLS/static anon-deny patterns, provenance/contradiction structures, licence separation, seed taxonomy-only constraints, gap-generation SQL, and public DTO privacy boundaries.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS with pre-existing warnings in Stripe webhook, vault, dashboard, and consumables files.
- `npm run test` — FAIL on pre-existing globe foundation expectations for camera defaults and azimuth limits; unrelated to this data-contract change.
- `npm run build` — PASS with pre-existing lint warnings.
- `npm run check:migrations` — FAIL on pre-existing duplicate migration prefix `20260601000000`; not introduced by this workspace.
- `npx supabase --version && npx supabase db reset --local` — BLOCKED after Supabase CLI version `2.105.0` reported because Docker daemon is unavailable in this workspace.

**Evidence notes:**

- Migration file: `supabase/migrations/20260607120000_cannabis_data_contract_v1_p0_p1.sql`.
- Seed file: `supabase/seeds/cannabis_data_contract_v1_taxonomy.sql`.
- DTO allowlist: `lib/intelligence/cannabisDataContract.ts`.
- QA tests: `tests/cannabis-data-contract/migration.test.ts` and `tests/cannabis-data-contract/dto.test.ts`.

**Compliance & data handling:** No secrets, private user data, real customer payloads, or production legal facts were committed. The seed is limited to taxonomy and coverage matrix setup. Raw source paths, extraction logs, reviewer notes, contradiction internals, and private contact data remain excluded from public DTO projections.

**Operational conclusion:** HOLD for production release until local/staging Supabase migration application, runtime RLS/anon-select verification, and pre-existing repository test/migration-check failures are resolved or formally risk-accepted.
