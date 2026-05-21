# Harbourview Production Runtime Verification

## Purpose

Continuously verify that Harbourview production routes render safely after deployment and do not expose forbidden internal marketplace or intelligence fields.

## Trigger

- Push to `main`
- Manual `workflow_dispatch`

## Verified routes

- `/`
- `/signals`
- `/intelligence`
- `/marketplace`
- `/marketplace/listings`
- `/marketplace/wanted`
- `/marketplace/sell`
- `/contact`
- `/intake`
- `/admin`

## Runtime gates

Public routes must:

- return HTTP 200
- render a valid HTML document
- avoid runtime/hydration error markers
- avoid forbidden provenance/admin leakage strings

`/admin` must:

- return 401/403
- redirect to auth
- or render recognized Harbourview admin denial content

## Forbidden leakage strings

- `sourceUrl`
- `sourceName`
- `sourceEvidence`
- `provenanceSummary`
- `verificationStatus`
- `sellerAuthorizationStatus`
- `internalReviewNotes`
- `reviewedBy`
- `lastReviewedAt`
- `nextReviewDueAt`
- `contactEmail`

## Runtime-error markers

- `Hydration failed`
- `Application error`
- `ChunkLoadError`
- `Minified React error`
- `Unhandled Runtime Error`
- `Text content does not match`
- `ReferenceError`
- `TypeError`

## Artifacts

The workflow uploads:

- `report.json`
- `report.md`
- raw HTML snapshots
- screenshot placeholder directory for future Playwright capture expansion

## Failure behavior

The workflow exits non-zero and fails CI if any route:

- returns unexpected HTTP status
- exposes forbidden strings
- renders runtime error markers
- exposes public admin access

## Globe route visual spec (desktop/mobile)

For PR evidence of globe route-state rendering, run:

- `npx -y -p playwright node scripts/verify-globe-route-visual-spec.mjs`

Default artifact root (stable path):

- `verification-results/globe-route-visual-spec/`

Generated files:

- `verification-results/globe-route-visual-spec/globe-route-visual-spec.json`
- `verification-results/globe-route-visual-spec/globe-route-visual-spec.md`
- `verification-results/globe-route-visual-spec/screenshots/default__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/default__mobile.png`
- `verification-results/globe-route-visual-spec/screenshots/selected-market__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/selected-market__mobile.png`
- `verification-results/globe-route-visual-spec/screenshots/role-sheet__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/role-sheet__mobile.png`
- `verification-results/globe-route-visual-spec/screenshots/intent-sheet__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/intent-sheet__mobile.png`
- `verification-results/globe-route-visual-spec/screenshots/multi-market__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/multi-market__mobile.png`
- `verification-results/globe-route-visual-spec/screenshots/fallback__desktop.png`
- `verification-results/globe-route-visual-spec/screenshots/fallback__mobile.png`

The script prints one `[capture] ... -> ...` line per screenshot and then a `Generated artifacts:` list so command output is PR-readable.
