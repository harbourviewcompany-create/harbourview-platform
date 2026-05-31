# Harbourview Evidence Log


## 2026-05-31T21:10:54Z: PR #596 rebase/verification attempt

**Evidence ID:** `HV-PR596-REBASE-VERIFY-20260531T211054Z`

**PR / branch:** PR #596, `codex/fix-vercel-deploy-log-issue-tm5u8u`

**Scope guard:** Intended verification scope remained dependency-focused: `package.json`, `package-lock.json`, `components/dashboard/HarbourviewDashboard.tsx`, and `docs/control/EVIDENCE_LOG.md`.

**Rebase / checkout result:** HOLD. `gh` is not installed in this container, and direct GitHub fetch/push is blocked from the shell environment. `git fetch origin` and `git push --force-with-lease origin HEAD:codex/fix-vercel-deploy-log-issue-tm5u8u` failed with `ssh: Could not resolve hostname github.com: Temporary failure in name resolution`; the earlier HTTPS fetch attempt failed with `CONNECT tunnel failed, response 403`. `git rebase origin/main` therefore failed with `fatal: invalid upstream 'origin/main'`. The PR was not merged.

**Commands and results (UTC):**
- `npm install` — FAIL/BLOCKED in this container: registry/proxy policy returned `403 Forbidden` while fetching `@react-three/drei`.
- `npm run lint` — PASS with warnings only; no blocking lint errors after the file-local dashboard lint override.
- `npm run build` — FAIL/BLOCKED locally because the container cannot install newly declared packages; Next reported missing modules for `three`, `@react-three/drei`, and `@react-three/fiber`, which are now declared in `package.json` and the root dependency section of `package-lock.json` for Vercel to install.
- Dependency declaration check — PASS: `three`, `postprocessing`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@supabase/ssr`, and `@supabase/supabase-js` are present in `package.json`.
- Package-lock root dependency check — PASS: the same restored dependency names are present in the root package section of `package-lock.json`.
- Supabase SDK/SSR import preservation check — PASS: `lib/supabase.ts` imports from `@supabase/supabase-js`; `lib/supabase/client.ts` imports `createBrowserClient` from `@supabase/ssr`; `lib/supabase/server.ts` imports `createServerClient` from `@supabase/ssr`; no `supabaseRestClient` replacement was found in the checked Supabase/client/scraper/admin candidate paths.
- `git diff --name-only origin/main...HEAD` and `git diff --stat origin/main...HEAD` — NOT RUN successfully because `origin/main` is unavailable after the blocked fetch.

**Vercel / preview status:** HOLD. The public GitHub PR page showed PR #596 remains Draft. It also showed Vercel reporting skipped/ignored deployments for `harbourview` and `harbourview-platform` at May 31, 2026 20:46 UTC, including preview URL `https://harbourview-platform-git-ea5d34-tylercampbellott-4320s-projects.vercel.app`, and a separate Vercel bot failure for preview `https://harbourview-mmm9z1xi3-harbourview2.vercel.app` at May 31, 2026 20:46 UTC. A real Vercel preview build could not be forced from this container because pushing the rebased branch is blocked.

**Verdict:** HOLD. Dependency/import declarations are correct locally, and #594 REST-only replacement is absent from the checked paths, but required GO criteria are not met because checkout/rebase/push, `npm install`, local `npm run build`, and a successful real Vercel preview build could not be completed from this environment.


## 2026-05-31: Vercel deployment dependency declaration repair

**Evidence ID:** `HV-VERCEL-MISSING-DEPS-REPAIR-20260531`

**Branch:** current working branch

**Scope:** Reverted the broad dependency-removal approach and restored the Supabase SDK/SSR pattern. Added the missing runtime dependencies used by the globe and Supabase SSR modules so Vercel can install packages that are imported by the application build.

**Commands and results (UTC):**
- `npm run lint` — PASS (warnings only; no blocking lint errors)
- `npm run build` — NOT FULLY RUN LOCALLY after dependency declaration repair because this container cannot fetch newly declared registry packages; the previous local build log identified missing module declarations for `three`, `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing`.
- `npm install --package-lock-only --ignore-scripts` — BLOCKED in this environment by registry/proxy policy; Vercel should resolve the newly declared dependency graph during its install step.

**Evidence notes:** The repair is package-declaration scoped and preserves the official Supabase packages instead of replacing them with a custom REST-only implementation.

**Compliance/data handling:** Public/internal dependency metadata and deployment evidence only. No secrets, credentials, customer data, private logs, or production payloads were added.

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
