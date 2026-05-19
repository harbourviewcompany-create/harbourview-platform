# Harbourview Platform Audit — 2026-05-19

## Scope
This audit assessed baseline code health and release readiness using local static checks and dependency-security probes.

## Commands executed
1. `npm run lint`
2. `npm run typecheck`
3. `npm audit --omit=dev`

## Findings summary
- **High priority**: TypeScript compile currently fails (`npm run typecheck` exits non-zero).
- **Medium priority**: Lint emits multiple warnings for unused symbols and non-optimized `<img>` tags.
- **Medium priority**: Security advisory feed could not be retrieved in this environment (`npm audit` 403), so dependency vulnerability status is **not verified**.

## Detailed findings

### 1) Type safety regression (build/release risk)
`npm run typecheck` returned seven errors:

- Missing module/type resolution for `@supabase/supabase-js` in these files:
  - `app/admin/(protected)/deal-dashboard/page.tsx`
  - `app/api/genetics-routing/actions/route.ts`
  - `app/api/genetics-routing/dealflow/route.ts`
  - `app/api/genetics-routing/operations/route.ts`
  - `app/api/genetics-routing/requests/route.ts`
- Type mismatch errors where `contactEmail` is provided but not declared in target types:
  - `lib/marketplace/liveOpportunities.ts`
  - `lib/server/usedSurplusIntake.ts`

**Risk**: CI/type-gated deploys may fail or permit drift if not enforced.

**Recommended remediation**:
- Confirm dependency installation / lockfile integrity for `@supabase/supabase-js` and ensure TS module resolution includes installed package types.
- Align `Listing` and `UsedSurplusListing` model definitions with current usage (either add `contactEmail` to types if intentional, or remove from object construction).

### 2) Lint quality warnings
`npm run lint` completed with warnings (non-blocking currently):

- Unused variables/imports in:
  - `app/api/genetics-routing/requests/route.ts`
  - `app/page.tsx`
  - `lib/marketplace/geneticsProfiles.ts`
  - `lib/marketplace/geneticsShowcase.ts`
- `@next/next/no-img-element` warnings in:
  - `app/marketplace/consumables/[id]/page.tsx`
  - `components/ListingCard.tsx`
  - `components/MarketplaceCard.tsx`

**Risk**: Noise in quality gates and potential page-performance regressions due to unoptimized images.

**Recommended remediation**:
- Remove dead declarations and unused variables.
- Evaluate migration to `next/image` where appropriate (or apply documented exceptions where dynamic/external sources require native `<img>`).

### 3) Dependency vulnerability audit incomplete
`npm audit --omit=dev` failed with `403 Forbidden` from npm advisory endpoint.

**Risk**: No authoritative vulnerability result was produced in this run.

**Recommended remediation**:
- Re-run `npm audit --omit=dev` in CI or a network context with npm advisory API access.
- Consider adding a secondary scanner (e.g., Snyk/GitHub Dependabot alerts) for defense-in-depth.

## Overall assessment
- **Current readiness**: **Not release-ready** if typecheck is required in release criteria.
- **Primary blocker**: TypeScript errors.
- **Secondary concerns**: Lint debt and unverified dependency advisory status.

## Suggested next actions (ordered)
1. Fix TypeScript errors and re-run `npm run typecheck` until clean.
2. Triage lint warnings into immediate fixes vs. accepted exceptions.
3. Re-run dependency vulnerability audit in CI and capture artifacts.
4. Add/confirm CI policy that fails on typecheck regressions.
