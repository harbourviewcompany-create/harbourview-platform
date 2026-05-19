# Harbourview Platform Audit — 2026-05-19

## Source gate

Audit PR: `#360`

PR title: `docs: add 2026-05-19 codebase audit report`

PR base: `codex/conduct-audit`

PR base SHA: `b6b55886841e6e554ddf39fa952c644787a6b0cc`

PR head: `codex/conduct-audit-sdw8jb`

PR head SHA inspected: `fa6340cc2b5a0ad85d127ee65ce475b3c8d83ee8`

Current `main` SHA observed during audit-integrity review: `c0fa7cab814a22a47699dd553e48c686efb0a576`

Comparison against current `main`: `codex/conduct-audit-sdw8jb` is diverged from `main`, 1 commit ahead and 239 commits behind. The merge base with `main` is `b6b55886841e6e554ddf39fa952c644787a6b0cc`.

Source-gate result: **HOLD — stale PR base / not current-main evidence**. This report must not be treated as a current-main audit unless the branch is recreated or retargeted from current `main` and checks are rerun.

## Scope

This audit assessed baseline code health and release readiness using Codex-local static checks and dependency-security probes, then cross-checked the findings against GitHub Actions evidence available for PR `#360` head SHA `fa6340cc2b5a0ad85d127ee65ce475b3c8d83ee8`.

No runtime code, package files, Supabase configuration, Vercel configuration, secrets, branch protection, or production data were modified by this audit document.

## Commands / evidence reviewed

### Codex-local commands originally reported

1. `npm run lint`
2. `npm run typecheck`
3. `npm audit --omit=dev`

### GitHub CI evidence reviewed

- Workflow: `Regulatory Signals Verify`
- Run ID: `26120564812`
- Job: `verify`
- Head SHA: `fa6340cc2b5a0ad85d127ee65ce475b3c8d83ee8`
- Checked-out PR merge SHA in CI: `c17b5b547996b906890d18b008f8a883c6f25c4b`
- Node: `v22.22.2`
- npm: `10.9.7`

CI step results:

1. `npm ci` — completed successfully.
2. `npm run typecheck` — failed.
3. `npm run build` — skipped because typecheck failed.
4. Public visibility test — skipped because typecheck failed.
5. Listing quality test — skipped because typecheck failed.
6. Live source intake test — skipped because typecheck failed.
7. Regulatory Signals contract test — skipped because typecheck failed.
8. Start built app for public route checks — skipped because typecheck failed.
9. Regulatory Signals public leakage test — skipped because typecheck failed.
10. Marketplace smoke test — skipped because typecheck failed.

## Findings summary

- **High priority**: TypeScript compile fails in CI. Release/build verification did not proceed beyond typecheck.
- **High priority**: This audit branch is stale relative to current `main`; it is 239 commits behind and therefore is not authoritative current-main audit evidence.
- **Medium priority**: Codex-local lint reportedly completed with warnings for unused symbols and non-optimized `<img>` tags. CI evidence reviewed here did not reach a lint step in the inspected workflow.
- **Medium priority**: Dependency vulnerability status is incomplete. Codex-local `npm audit --omit=dev` reportedly failed with `403 Forbidden`, while CI `npm ci` reported `8 vulnerabilities (7 moderate, 1 high)` without a full advisory artifact.

## Detailed findings

### 1) Source environment / stale base problem

PR `#360` targets `codex/conduct-audit`, not `main`. Its head branch `codex/conduct-audit-sdw8jb` is diverged from current `main`: 1 commit ahead and 239 commits behind.

**Risk**: The audit can misrepresent current repository health. Findings may describe an old base branch rather than the actual release branch.

**Required remediation**:

- Recreate or retarget the audit branch from current `main`.
- Rerun all audit checks from that current-main source.
- Preserve source-gate evidence in the audit report before making release-readiness claims.

### 2) Type safety regression (CI-confirmed build/release blocker)

GitHub Actions run `26120564812` failed at the `Typecheck` step. The CI-confirmed errors are:

```text
lib/marketplace/liveOpportunities.ts(243,5): error TS2353: Object literal may only specify known properties, and 'contactEmail' does not exist in type 'Listing'.
lib/server/usedSurplusIntake.ts(162,5): error TS2353: Object literal may only specify known properties, and 'contactEmail' does not exist in type 'UsedSurplusListing'.
```

Because typecheck failed, CI skipped build, public visibility, listing quality, live source intake, regulatory contract, public route startup, regulatory signals public leakage, and marketplace smoke verification.

**Risk**: The PR is not release-ready. Build and leakage/smoke evidence are absent for this head SHA because downstream verification never ran.

**Recommended remediation**:

- Align `Listing` and `UsedSurplusListing` model definitions with current usage, or remove `contactEmail` from object construction if it is not intended to be part of those types.
- Rerun `npm run typecheck` and the downstream verification suite after fixing the type mismatch.

### 3) Codex-local typecheck result differed from CI

The original Codex-local audit reported seven typecheck errors, including missing module/type resolution for `@supabase/supabase-js` in these files:

- `app/admin/(protected)/deal-dashboard/page.tsx`
- `app/api/genetics-routing/actions/route.ts`
- `app/api/genetics-routing/dealflow/route.ts`
- `app/api/genetics-routing/operations/route.ts`
- `app/api/genetics-routing/requests/route.ts`

Those `@supabase/supabase-js` module-resolution errors were **not reproduced** in the inspected GitHub Actions run after `npm ci`. CI-confirmed typecheck failure is currently limited to the two `contactEmail` type errors listed above.

**Risk**: Treating Codex-local dependency-resolution failures as CI-confirmed errors could send remediation work in the wrong direction.

**Recommended remediation**:

- Treat the `@supabase/supabase-js` errors as Codex-local environment findings unless reproduced on current-main CI.
- Do not prioritize Supabase dependency remediation from this PR alone without fresh current-main evidence.

### 4) Lint quality warnings — Codex-local only in this audit packet

Codex-local `npm run lint` reportedly completed with warnings for:

- Unused variables/imports in:
  - `app/api/genetics-routing/requests/route.ts`
  - `app/page.tsx`
  - `lib/marketplace/geneticsProfiles.ts`
  - `lib/marketplace/geneticsShowcase.ts`
- `@next/next/no-img-element` warnings in:
  - `app/marketplace/consumables/[id]/page.tsx`
  - `components/ListingCard.tsx`
  - `components/MarketplaceCard.tsx`

The inspected GitHub Actions workflow for PR `#360` did not reach or expose a lint step. These lint findings remain useful but are not CI-confirmed in the inspected run.

**Risk**: Lint debt can create quality-gate noise, but this PR does not provide current-main CI lint evidence.

**Recommended remediation**:

- Re-run lint on a branch based on current `main`.
- Remove dead declarations and unused variables if still present.
- Evaluate migration to `next/image` or document narrow exceptions for native `<img>` usage.

### 5) Dependency vulnerability audit incomplete / partially contradicted by CI install output

Codex-local `npm audit --omit=dev` reportedly failed with `403 Forbidden` from the npm advisory endpoint, so no full local advisory report was produced.

GitHub Actions `npm ci` completed successfully and reported:

```text
8 vulnerabilities (7 moderate, 1 high)
```

No full advisory detail artifact was captured in the inspected CI evidence.

**Risk**: The repository has at least a CI-observed vulnerability count, but the affected packages, advisory IDs, exploitability, fix ranges, and breaking-change implications are not documented in this audit.

**Recommended remediation**:

- Run `npm audit --omit=dev --json` in a network context with advisory API access.
- Capture the JSON artifact and classify advisories by package, severity, reachable runtime surface, fix type, and breaking-change risk.
- Do not run `npm audit fix` or `npm audit fix --force` without a separate dependency-change PR and review.

## Overall assessment

- **Current readiness**: **HOLD / not release-ready**.
- **Primary blocker**: CI-confirmed TypeScript errors in `liveOpportunities.ts` and `usedSurplusIntake.ts`.
- **Source blocker**: Audit PR is stale versus current `main` and targets `codex/conduct-audit`, not `main`.
- **Verification blocker**: Build, public visibility, leakage, contract, and marketplace smoke checks were skipped because typecheck failed.
- **Dependency blocker**: CI observed 8 vulnerabilities, but full advisory details were not captured; Codex-local `npm audit --omit=dev` failed with 403.

## Suggested next actions (ordered)

1. Recreate or rebase the audit branch from current `main` so the audit source is valid.
2. Fix the two CI-confirmed `contactEmail` type errors or open a separate implementation PR for them.
3. Rerun `npm run typecheck` until clean.
4. Rerun build, public visibility, leakage, contract, live source intake, and marketplace smoke checks after typecheck passes.
5. Re-run dependency vulnerability audit in CI or another environment with npm advisory API access and capture the advisory artifact.
6. Re-run lint on current-main source and distinguish blocking lint errors from non-blocking warnings.

## GO / HOLD

**HOLD**.

This audit report is useful as an integrity correction, but PR `#360` should not be merged or treated as release-readiness evidence until the branch is current-main based and CI verification reaches typecheck, build, leakage, and smoke checks successfully.
