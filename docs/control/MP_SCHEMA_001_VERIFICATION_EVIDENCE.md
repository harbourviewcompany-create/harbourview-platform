# MP-SCHEMA-001 Verification Evidence

Status: HOLD pending clean runner evidence
Date opened: 2026-05-29
Branch: `docs/mp-schema-001-verification-evidence`
Source change under review: merged PR `#530` / MP-SCHEMA-001 unified marketplace listings schema
Runtime/schema code changed in this follow-up: none

## Objective

Capture a follow-up verification record for MP-SCHEMA-001 after PR `#530` merged the unified listings schema, DTO boundary, and DTO tests.

This follow-up is intentionally docs/control-only. It must not change schema, runtime code, marketplace routes, DTO implementation, tests, dependencies, auth, RLS, Vercel, Supabase settings, or production write behavior unless a fresh runner proves a concrete defect and an operator separately approves that patch.

## Source files already introduced by PR #530

- `supabase/migrations/20260528033000_unified_marketplace_listings.sql`
- `lib/marketplace/unifiedListings.ts`
- `tests/harbourview/unified-listings-dto.test.ts`

## Required verification commands

The MP-SCHEMA-001 verification is not GO until a runner captures exact output for:

```bash
npm ci
npm run check:migrations
npm run typecheck
npm run lint
npx vitest run tests/harbourview/unified-listings-dto.test.ts
npm run test:visibility
npm run build
```

Supabase migration dry-run/review is also required when a Supabase-capable runner is available.

## Current evidence state

| Check | Result | Evidence |
|---|---|---|
| PR #530 source files present on `main` | Observed before this docs/control follow-up | GitHub file inspection in connected review session |
| DTO allowlist/static leakage coverage | Static source and test review only | `tests/harbourview/unified-listings-dto.test.ts` includes DTO allowlist, invalid type, mismatched detail, and forbidden-key tests |
| Runtime `test:visibility` | Not yet proven in this follow-up | Pending runner output |
| Migration filename/static review | Not yet proven in this follow-up | Pending `npm run check:migrations` output |
| Supabase migration dry-run/review | Not yet proven | Pending Supabase-capable runner |
| Full build | Not yet proven in this follow-up | Pending `npm run build` output |

## Known prior blockers from PR #530 verification attempts

- Project Registry Discipline failure was caused by missing PR registry-impact metadata, not a confirmed schema/runtime defect.
- Low-Friction Branch Verification failed because the original schema PR changed `lib/`, `supabase/`, and `tests/`, which are outside a control-only profile. That result does not prove a schema/runtime defect.
- Branch Verification failed, but exact job logs were unavailable through the connected GitHub tool, so no concrete failing command or error line was available to patch.
- Vercel preview comments on PR #530 indicated a team-membership/permission issue for a stale or non-canonical Vercel context; that did not prove a marketplace schema defect.
- Cloudflare Pages preview for PR #530 reported deploy success for commit `7ca4b75`.

## GO criteria

MP-SCHEMA-001 can move to GO only when all of the following are recorded with exact outputs or artifacts:

1. `npm ci` passes.
2. `npm run check:migrations` passes.
3. `npm run typecheck` passes.
4. `npm run lint` passes or reports only accepted warnings.
5. `npx vitest run tests/harbourview/unified-listings-dto.test.ts` passes.
6. `npm run test:visibility` passes.
7. `npm run build` passes.
8. Supabase migration dry-run/review finds no blocking issue, or a Supabase-capable runner explicitly records why dry-run could not be completed.
9. No public DTO or public route leakage evidence appears for provenance, source, evidence, review, authorization, seller, confidence, monetization, or private fields.
10. No schema/runtime code is changed by this follow-up PR.

## HOLD conditions

Remain HOLD if any required command is missing, skipped without reason, fails, or lacks exact output. Remain HOLD if Supabase dry-run/review is unavailable and the migration has not been reviewed by a Supabase-capable runner. Remain HOLD if any route-level leakage check fails.

## Final status

HOLD pending clean verification evidence.
