# Coordinator release review for Harbourview production-readiness checkpoint

Date: 2026-05-14 (UTC)
Coordinator branch: `codex/conduct-harbourview-release-review`
Repository: `harbourviewcompany-create/harbourview-platform`

## Reviewed PRs

1. PR #318 — `codex/enhance-backend/auth-workflows-for-harbourview`
2. PR #320 — `codex/enhance-public-ui-for-harbourview-readiness`
3. PR #319 — `codex/enhance-harbourview-verification-and-control`

The earlier coordinator pass reviewed placeholder branch names and is superseded by this document. This review uses the actual open PR refs #318, #319, and #320.

## Combined change ledger

### PR #318 — backend/auth/workflow lane

Files changed:
- `app/api/marketplace/capture/route.ts`
- `app/api/marketplace/listing-submission/route.ts`
- `app/api/marketplace/quote/route.ts`
- `lib/marketplace/clientCapture.ts`
- `lib/marketplace/intakeValidation.ts`

Scope classification: backend/API validation, marketplace intake contract hardening, client-safe diagnostic reduction. No migrations or public UI pages changed.

### PR #320 — product/UI lane

Files changed:
- `app/intake/page.tsx`
- `app/marketplace/quote/page.tsx`
- `components/Nav.tsx`

Scope classification: public navigation, intake presentation, quote page presentation. No API routes, auth helpers, migrations, workflows, or control docs changed.

### PR #319 — CI/tests/probes/docs/control lane

Files changed:
- `.github/workflows/branch-verification.yml`
- `docs/control/EVIDENCE_LOG.md`
- `docs/control/PROJECT_STATE.md`
- `docs/control/VERIFICATION_PLAN.md`
- `package.json`
- `scripts/probe-production-provenance-visibility.mjs`
- `scripts/probe-public-leakage.mjs`
- `scripts/smoke-marketplace.mjs`

Scope classification: branch verification, package command map, leakage/admin/marketplace verification probes, smoke status semantics, and control-plane evidence.

## Cross-PR overlap and conflict review

Direct file overlap between #318, #319, and #320: none.

Direct file overlap between #319 and #321 after this corrective patch: none. #321 now changes only this coordinator review document and intentionally leaves `docs/control/EVIDENCE_LOG.md` and `docs/control/PROJECT_STATE.md` to #319.

Semantic dependency review:
- #318 should land before #320 if quote/listing UI later consumes the structured validation error shape. #320 does not currently require #318 to build because it preserves existing form components.
- #319 should land after #318 and #320 so final verification commands and docs/control evidence cover the merged branch surfaces.
- #321 should land after #319 so this coordinator review remains the final control-plane checkpoint.

## Production visibility re-scope

The earlier #319 production visibility failure against `https://harbourview.vercel.app` is not treated as proof that the code branch is broken. It is treated as unresolved production/domain evidence.

Corrected policy:
- Branch verification must not silently default to a hardcoded production domain.
- `verify:production-visibility` is read-only and runs only when `HARBOURVIEW_PUBLIC_BASE_URL` or `VERCEL_PROJECT_PRODUCTION_URL` is explicitly provided.
- Without an explicit base URL, the script reports `BLOCKED` and exits without network probing or writes.
- Final release still requires a controlled production visibility run against the canonical deployed target.

## Registry discipline status

PR bodies were patched to satisfy Project Registry Discipline:
- #318: Harbourview Platform and Harbourview Marketplace Supabase affected; no registry row change required.
- #319: Harbourview Platform and Harbourview Vercel Target affected; no registry row change required.
- #320: Harbourview Platform affected; no registry row change required.
- #321: Harbourview Platform affected; no registry row change required.

## Merge order

Recommended order:
1. #318 backend/auth/workflow readiness
2. #320 product/UI readiness
3. #319 verification/control-plane readiness
4. #321 corrected coordinator review

Reason: backend contract hardening first, public UI second, verification/control plane third, coordinator release evidence last.

## Verification requirements before merge

Required before merging #318:
- Branch Verification: PASS
- Project Registry Discipline: PASS
- Review confirms no service-role key exposure and no migration side effects

Required before merging #320:
- Branch Verification: PASS
- Project Registry Discipline: PASS
- Review confirms no forbidden public provenance/admin strings in touched UI

Required before merging #319:
- Branch Verification: PASS after production visibility re-scope patch
- Project Registry Discipline: PASS
- Review confirms `verify:production-visibility` reports BLOCKED unless explicit URL is supplied
- Review confirms docs/control evidence does not claim full production readiness

Required before merging #321:
- Branch Verification: PASS
- Project Registry Discipline: PASS
- Coordinator docs must remain factual and must not claim production GO before explicit production visibility evidence exists

## Remaining blockers

1. GitHub checks must remain green after PR body edits and #319 commit `f07db0e4bf3736369e7dacdfb352535a2c225fc1`.
2. Netlify `harbourview-platform/deploy-preview` is still failing across #318/#319/#320/#321 while the other Netlify contexts pass.
3. Production/domain readiness remains HOLD until the canonical production target is explicitly supplied and the production visibility probe passes.

## Final release decision

HOLD for final release and production-readiness claim.

GO for corrective merge sequencing once #318/#320/#319 checks pass in order.

No final GO is authorized until explicit production visibility evidence passes against the canonical Harbourview deployment target and final docs/control evidence is reconciled after #319.