# Command Centre Integration Verification Evidence

Date: 2026-08-02  
Draft PR: #1257  
Canonical feature branch: `agent/command-centre-integration-rule`

## Current execution state

PR #1257 is the only active implementation path and remains draft and unmerged.

The authenticated customer architecture is now shell-only:

- desktop capabilities render inside `CommandCentre` and its `.cc-main` region;
- mobile capabilities render inside `MobileCommandCentre` and its `.hvm-main` region;
- custom modules no longer replace the canonical shell with a separate `ccig-shell` frame;
- authenticated feature roots and descendants resolve into `/dashboard` with `page`, `module`, `action` and `focus` state after authentication and tier checks.

No paid Supabase development branch is required for verification. The repository workflow starts an isolated local Supabase stack inside GitHub Actions, creates a disposable local test user, runs the authenticated browser pass, and destroys the local services afterward. This does not create a billable Supabase cloud branch and does not touch production Auth or production data.

## Implemented surfaces

- shared canonical module registry;
- responsive desktop/mobile integration gateway;
- in-shell portal rendering for Market, Supply, Financing, Directories, Personal Briefings, Search and Talent;
- Personal Briefings API and shared loader;
- built-in Briefing, Digest, Intel, Compliance, Marketplace, Genetics, Clinical, Watchlist and Pathways pages preserved in both shells;
- authenticated route-family redirects after authentication and tier checks;
- marketplace sell, intake, financing and my-listings entry routes resolved into Marketplace shell state;
- country-aware navigation and compatibility routes from PR #1249;
- responsive route-contract and Playwright coverage.

## Verification matrix

| Check | Status | Evidence |
|---|---|---|
| Dependency installation | PASS | Repository CI and Command Centre workflows |
| Lint | PASS | Command Centre Integration Verify |
| Typecheck | PASS | Command Centre and CI workflows |
| Command Centre unit and route-contract tests | PASS before latest shell-only patch | Fresh run triggered by the latest branch commits |
| Security and public-leakage partitions | PASS before latest shell-only patch | Repository CI |
| Domain logic | PASS before latest shell-only patch | Repository CI |
| Intake and listings | PASS before latest shell-only patch | Repository CI |
| Signal-engine runtime | PASS before latest shell-only patch | Repository CI |
| Marketplace smoke tests | PASS before latest shell-only patch | Repository CI |
| Production build | PASS before latest shell-only patch | Command Centre and CI workflows |
| Branch verification | PASS before latest shell-only patch | Build, route probes, Chromium and no-write production probes passed |
| Project Registry Discipline | PASS | Repository workflow |
| Authenticated 320 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |
| Authenticated 375 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |
| Authenticated 390 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |
| Authenticated 430 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |
| Authenticated 768 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |
| Authenticated 1440 screenshot | RUNNING | Isolated local Supabase workflow; no cloud branch charge |

## Authenticated verification boundary

The workflow `.github/workflows/command-centre-authenticated-visual.yml`:

1. installs and verifies the branch;
2. temporarily moves production migrations out of the runner workspace;
3. starts a minimal local Supabase stack;
4. creates a disposable local user;
5. builds the application against local Supabase;
6. writes an authenticated Playwright storage state;
7. exercises every canonical module at 320, 375, 390, 430, 768 and 1440 widths;
8. commits screenshots and JSON evidence only after success;
9. restores the repository migration tree; and
10. stops and removes the local services.

No Supabase cloud branch, production database write, production Auth user or paid branch-hour is involved.

## Expected screenshot paths

- `docs/control/evidence/command-centre-integration/command-centre-320.png`
- `docs/control/evidence/command-centre-integration/command-centre-375.png`
- `docs/control/evidence/command-centre-integration/command-centre-390.png`
- `docs/control/evidence/command-centre-integration/command-centre-430.png`
- `docs/control/evidence/command-centre-integration/command-centre-768.png`
- `docs/control/evidence/command-centre-integration/command-centre-1440.png`

## Release boundary

- PR #1257 remains draft and unmerged.
- No production deployment or production alias movement is authorized.
- No database migration, secret change or production data write is authorized.
- Authenticated verification uses isolated local services only.

## Status

**HOLD — fresh CI, build and authenticated six-width evidence must pass on the shell-only implementation before merge consideration.**
