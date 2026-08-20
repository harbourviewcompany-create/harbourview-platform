# Harbourview Evidence Log

Last updated: 2026-08-20
Status: Gate 4 GO (2026-06-25); country/role white-screen defect + MOBILE_CSS class-collision defect fixed and verified 2026-07-07; branch-protection gap on `main` found and open; Intelligence Stage 2 classifier validation partially blocked (LLM provider billing + `hv-classify` schema bug, both open — see 2026-07-19 entry)
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
| Build/typecheck/lint | Unknown | MP-SCHEMA-001 follow-up PR requests clean verification; exact command outputs are pending |
| Deployment | Unknown | Not verified in Pass 1; PR #530 Cloudflare preview succeeded, but canonical Vercel production proof remains separate |
| Public route checks | Unknown | Not run in Pass 1 |
| Public/private leakage checks | Partial static coverage | MP-SCHEMA-001 DTO tests exist; runtime `test:visibility` output remains pending |
| Admin/auth/RLS checks | Unknown | Not run in Pass 1 |
| Marketplace flows | Unknown | Not run in Pass 1 |
| Production writes | Not authorized | Must remain gated and explicit |

## Build Evidence

| Date | Check | Command / source | Result | Link / artifact | Status |
|---|---|---|---|---|---|
| 2026-08-20 | Squash-merged open PR batch: CI cache fallback, Clinical Prescriber OS migration workflow harden, marketplace/genetics test reconcile, clinical publication-gate admin APIs | GitHub merge API on open PRs against `main`; review of each PR body + changed-file patches before merge | **MERGED** four open PRs into `main`. **#1579** `fix(ci): add npm-ci fallback when node_modules cache restore misses` → `9108501` — names `actions/cache/restore` steps and runs `npm ci` when `cache-hit != true` across nine CI jobs (typecheck, env-check, domain-logic, etc.); prevents silent required-check failure when cache restore misses. CI/workflow only; no app or schema change. **#1577** `chore(ci): harden Clinical Prescriber OS production migration workflow` → `2a2f797` — dry-run input, patient-core dependency guards for `prescriber-os`/`full-prescriber`, verification step always runs with `to_regclass` hard assertions + ledger dump, `PGCONNECT_TIMEOUT=10`, recovery notes; still requires `confirm=APPLY` and `production-database` environment. **#1580** `test: reconcile stale marketplace and Genetics assertions` → `f89a9f4` — marketplace media no-image contract → category preview labels; legacy `/genetics/cultivars/[slug]` → `/marketplace/genetics/[slug]`; Command deep-link contract preserved. Test-only. **#1573** `feat(clinical): open the publication gate to the application` → `a38ac4c` — admin credentials + evidence-review APIs, `reviewGovernance.ts`, migration `20260819170000` integrity constraints (already applied to production on prior owner instruction); does not create credentials, record reviews, or publish records. Open PR list empty after batch. **Post-merge still open:** production deploy smoke of Clinical Command embed + admin routes; #1573 checklist item "Post-merge verification"; abandoned branch `fix/clinical-workspace-embed-mobile-layout` (bad CSS rewrite — do not merge); publication governance decisions (reviewer identity, sourcing bar). | PRs #1579, #1577, #1580, #1573; merge SHAs `9108501`, `2a2f797`, `f89a9f4`, `a38ac4c` | **Current — merged; production smoke pending** |
| 2026-08-15 | Reconciled stale control-doc authority notices -- `SOURCE_OF_TRUTH.md` (frozen 2026-05-28), `CURRENT_STATE.md` (frozen 2026-06-29), `PROJECT_STATE.md` (frozen mid-May, references superseded PR #314), `FINISH_LINE_BACKLOG.md` (frozen 2026-05-28) vs. root `HANDOFF.md`'s 2026-08-11 state | Docs-only, no command | Added the same superseded/redirect banner pattern already used on `docs/control/AGENT_HANDOFF.md` (PR #1112, 2026-07-21) directly to all four files it named but never itself updated -- no content deleted, all four kept as historical record pointing to root `HANDOFF.md` as current authority | PR #1440 | Current |
