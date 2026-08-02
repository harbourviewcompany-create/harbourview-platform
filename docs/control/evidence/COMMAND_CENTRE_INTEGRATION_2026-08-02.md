# Command Centre Integration Verification Evidence

Date: 2026-08-02  
Draft PR: #1257  
Canonical feature branch: `agent/command-centre-integration-rule`

## Current execution state

The previous wait-on-PR-#1249 workflow was removed. The mobile navigation changes from PR #1249 and the Command Centre integration changes from PR #1257 have been consolidated into one branch derived from current `main` plus the verified PR #1249 merge tree.

PR #1249 is closed without merge as superseded. PR #1257 now points to the consolidated branch and is the only active implementation path.

## Implemented surfaces

- shared module registry;
- responsive desktop/mobile integration gateway;
- Personal Briefings API and shared loader;
- Market, Supply, Financing, Directories, Personal Briefings, Search and Talent modules;
- legacy dashboard-route redirects;
- authenticated product-root redirects after auth and tier checks;
- country-aware navigation changes from PR #1249;
- responsive route-contract and Playwright coverage.

## Verification matrix

| Check | Status |
|---|---|
| Dependency installation | RUNNING on consolidated head |
| Lint | PENDING |
| Typecheck | PENDING |
| Command Centre unit and route-contract tests | PENDING |
| Full repository test partitions | PENDING |
| Production build | PENDING |
| Fresh Vercel preview | PENDING |
| Authenticated 320 screenshot | PENDING |
| Authenticated 375 screenshot | PENDING |
| Authenticated 390 screenshot | PENDING |
| Authenticated 430 screenshot | PENDING |
| Authenticated 768 screenshot | PENDING |
| Authenticated 1440 screenshot | PENDING |

## Expected screenshot paths

- `docs/control/evidence/command-centre-integration/command-centre-320.png`
- `docs/control/evidence/command-centre-integration/command-centre-375.png`
- `docs/control/evidence/command-centre-integration/command-centre-390.png`
- `docs/control/evidence/command-centre-integration/command-centre-430.png`
- `docs/control/evidence/command-centre-integration/command-centre-768.png`
- `docs/control/evidence/command-centre-integration/command-centre-1440.png`

## Authentication boundary

The screenshot suite requires an authenticated non-production storage state or dedicated non-production test user. Production credentials, production data writes and production-user impersonation are not permitted.

## Release boundary

- PR #1257 remains draft.
- No PR merge is authorized.
- No production deployment or alias movement is authorized.
- No migration, secret change or production data write is authorized.

## Status

**HOLD** until the consolidated verification matrix and authenticated screenshot evidence are complete.
