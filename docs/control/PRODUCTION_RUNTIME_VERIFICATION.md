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
