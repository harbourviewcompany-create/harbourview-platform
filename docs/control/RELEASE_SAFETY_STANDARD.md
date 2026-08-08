# Harbourview Production Release-Safety Standard

Status: Stage 0/1 shadow adoption

## Objective

Add an evidence-driven release-safety layer around the existing Harbourview Next.js + Supabase + Vercel + GitHub Actions + Playwright delivery path without changing current production deployment behavior until the new controls are proven.

## Current repository evidence

- Existing `.github/workflows/ci.yml` already runs typecheck, critical-env validation, security/leakage tests, domain tests, marketplace smoke, Next.js build, and main-branch Playwright.
- `vercel.json` has Git deployment enabled and existing cron/ignore configuration. Stage 0/1 does not change it.
- `playwright.config.js` targets `HARBOURVIEW_PUBLIC_BASE_URL`, supports a Vercel automation bypass header, captures traces/screenshots/video on failures, and includes desktop plus mobile projects.
- Supabase already separates `supabase/migrations` from `supabase/migrations_pending_review`, so the release-safety model preserves that boundary rather than creating a competing migration-control system.
- Existing public leakage, Supabase environment/admin-client, middleware/auth-boundary and production security tests remain authoritative during Stage 0/1.

## Release state model

CANDIDATE -> EXISTING_CI_VERIFIED -> RELEASE_SAFETY_SHADOW_OBSERVED -> PREVIEW_VERIFIED -> PRODUCTION_STAGED -> PRODUCTION_VERIFIED

Only the first three states are introduced by this PR. Preview promotion, staged production, branch protection changes, Vercel production-domain changes, and production-write smoke are explicitly deferred.

## Stage 0/1 controls

1. Run a shadow repository audit on pull requests.
2. Produce machine-readable evidence under `artifacts/release-safety/`.
3. Inventory mutable GitHub Action references; report them without failing existing releases.
4. Inventory release-critical migration categories while preserving the existing pending-review directory.
5. Re-run existing typecheck and `test:security` in the shadow workflow to prove integration against Harbourview's real test surface.
6. Upload shadow evidence for 30 days.
7. Keep the workflow `continue-on-error: true`; it is not a required merge gate in this stage.

## Future promotion gates

A later PR may promote individual controls only after representative shadow runs prove low false-positive rates. Promotion candidates include exact action SHA pinning, changed-migration review evidence, Vercel dry-run deployment manifests, deployed Preview Playwright/Auth/RLS verification, release identity/SHA proof, staged production promotion, and post-promotion smoke.

## Non-disruption guarantee for this stage

This stage does not modify `vercel.json`, current `ci.yml`, Supabase migrations or policies, production secrets, GitHub branch protections, required checks, production domains, production deployment triggers, or production write behavior.
