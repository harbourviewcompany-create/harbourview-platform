# Command Centre Integration Verification Evidence

Date: 2026-08-02  
Draft PR: #1257  
Canonical feature branch: `agent/command-centre-integration-rule`  
Verified head: `5f98668e069b3b436576529d061e1dc398324f58`

## Current execution state

The wait-on-PR-#1249 workflow was removed. The mobile navigation work from PR #1249 and the Command Centre integration work from PR #1257 were consolidated into one branch derived from current `main` plus the verified PR #1249 merge tree.

PR #1249 is closed without merge as superseded. PR #1257 is the only active implementation path and remains draft and unmerged.

## Implemented surfaces

- shared canonical module registry;
- responsive desktop/mobile integration gateway;
- Personal Briefings API and shared loader;
- Market, Supply, Financing, Directories, Personal Briefings, Search and Talent modules;
- legacy dashboard-route redirects;
- authenticated product-root redirects after authentication and tier checks;
- country-aware navigation and compatibility routes from PR #1249;
- responsive route-contract and Playwright coverage.

## Verification matrix

| Check | Status | Evidence |
|---|---|---|
| Dependency installation | PASS | CI run `30769273819` |
| Lint | PASS | Command Centre run `30769273839` |
| Typecheck | PASS | Command Centre and CI runs |
| Command Centre unit and route-contract tests | PASS | Run `30769273839` |
| Security and public-leakage partitions | PASS | CI run `30769273819` |
| Domain logic | PASS | CI run `30769273819` |
| Intake and listings | PASS | CI run `30769273819` |
| Signal-engine runtime | PASS | CI run `30769273819` |
| Marketplace smoke tests | PASS | CI run `30769273819` |
| Production build | PASS | Command Centre and CI runs |
| Branch verification | PASS | Run `30769273855`; build, route probes, Chromium and no-write production probes passed |
| Project Registry Discipline | PASS | Run `30769273862` |
| Fresh Vercel preview | PASS | `dpl_BdozoH9RjpomXYkJzM6qerhEz7ma`, READY, target preview |
| Authenticated 320 screenshot | BLOCKED | Requires isolated non-production auth environment |
| Authenticated 375 screenshot | BLOCKED | Requires isolated non-production auth environment |
| Authenticated 390 screenshot | BLOCKED | Requires isolated non-production auth environment |
| Authenticated 430 screenshot | BLOCKED | Requires isolated non-production auth environment |
| Authenticated 768 screenshot | BLOCKED | Requires isolated non-production auth environment |
| Authenticated 1440 screenshot | BLOCKED | Requires isolated non-production auth environment |

## Vercel preview

- URL: `https://harbourview-bu8bdxqaj-harbourview.vercel.app`
- Deployment: `dpl_BdozoH9RjpomXYkJzM6qerhEz7ma`
- State: READY
- Target: preview
- Runtime commit: `4c6bbee3035b2fd17ca94136adf45644ec02305a`

The commits after the preview runtime head modify only three middleware test files. `GitHub.compare` reports no application-runtime file changes between the previewed commit and verified head `5f98668e069b3b436576529d061e1dc398324f58`.

An unauthenticated request to the preview Command Centre correctly resolves to `/login?next=/dashboard` with no production write.

## Authenticated screenshot boundary

The repository has production-oriented Supabase environment secrets and E2E account secret names, but using them would authenticate against the production project and update production Auth state. That is excluded by the release boundary.

The safe path is an ephemeral Supabase development branch with no production data. Current quoted branch cost is `$0.01344` per hour. Creating that branch requires explicit cost confirmation. After approval, the branch will be used to create the isolated test account, run the six authenticated viewport tests, commit the screenshots and then be deleted.

## Expected screenshot paths

- `docs/control/evidence/command-centre-integration/command-centre-320.png`
- `docs/control/evidence/command-centre-integration/command-centre-375.png`
- `docs/control/evidence/command-centre-integration/command-centre-390.png`
- `docs/control/evidence/command-centre-integration/command-centre-430.png`
- `docs/control/evidence/command-centre-integration/command-centre-768.png`
- `docs/control/evidence/command-centre-integration/command-centre-1440.png`

## Release boundary

- PR #1257 remains draft and unmerged.
- No production deployment or alias movement occurred.
- No database migration, secret change or production data write occurred.
- The READY Vercel deployment is preview-only.

## Status

**HOLD — one explicit external approval remains:** approve the ephemeral Supabase branch cost of `$0.01344/hour` so authenticated screenshots and visual remediation can run without touching production data.
