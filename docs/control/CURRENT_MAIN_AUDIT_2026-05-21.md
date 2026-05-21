# Harbourview Current Main Audit — 2026-05-21

## Source gate

Repository: `harbourviewcompany-create/harbourview-platform`

Audit branch: `audit/current-main-2026-05-21`

Base branch: `main`

Base SHA at branch creation: `e7bcf002cbc7a8b5ab7ab022329638ea92641970`

Audit scope: evidence-only current-main verification. This document exists only to create an audit-only draft PR so GitHub Actions can attach typecheck, build, public visibility, leakage, admin authorization, regulatory signals, and marketplace smoke evidence to source derived from current `main`.

## Scope control

Allowed change in this PR:

- `docs/control/CURRENT_MAIN_AUDIT_2026-05-21.md`

Explicitly out of scope:

- Runtime code changes
- Package or lockfile changes
- Supabase changes
- Vercel changes
- Secret changes
- Branch protection changes
- Production data changes

## Current known checks before PR CI

Prior stale-branch audit PR #360 showed `contactEmail` type errors on old source. Direct current-main file inspection before this audit branch found those projection objects no longer include `contactEmail`, so those stale errors are not expected to reproduce on current `main`.

This document should be updated only if needed to record final current-main audit evidence after CI completes. Until then, this audit remains evidence-pending.

## Required CI evidence

The current-main audit requires these gates to be captured from GitHub Actions or equivalent current-main-derived PR checks:

- Dependency install
- Typecheck
- Build
- Public visibility
- Public leakage
- Admin authorization
- Regulatory signals contract
- Regulatory signals public leakage
- Marketplace smoke
- Dependency vulnerability advisory capture or explicit limitation

## GO / HOLD

Initial status: **HOLD — evidence pending**.

This PR should remain draft until the current-main verification evidence is available and reviewed.
