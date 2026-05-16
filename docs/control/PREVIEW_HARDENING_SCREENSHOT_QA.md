# Harbourview Preview Hardening Screenshot QA

Status: HOLD pending CI/browser verification and Vercel environment confirmation.

Branch: `preview/hardening-screenshot-qa`

## Objective

Patch the preview issues visible in the supplied screenshots without changing Supabase schema, RLS, authentication architecture, API contracts, production environment settings, marketplace DTOs or public/private data boundaries.

## Screenshot-specific fixes applied

1. Home route `/`
   - Hardened WebGL/static globe placement so the globe is less oversized and less likely to dominate or crop awkwardly on desktop preview.
   - Preserved static SVG fallback, reduced-motion behavior and progressive WebGL enhancement.

2. Intelligence route `/intelligence`
   - Clarified map copy as a schematic public projection rather than a geographic or live-data claim.
   - Replaced `Clickable country map` with `Schematic country map` and updated the SVG accessible label.
   - Preserved public projection layer and country panel DTO usage.

3. Intake route `/intake`
   - Replaced the mismatched plain intake hero with premium Harbourview dark/gold styling.
   - Preserved the existing `ConfidentialIntakeForm` capture flow.
   - Removed nested `.card` styling inside the form so the page has a single clean form card.
   - Added route-positioning copy that public pages remain discovery-only and sensitive details remain inside reviewed workflows.

## Authorized files changed

- `components/harbourview/globe/HarbourviewGlobeClientLoader.module.css`
- `components/intelligence/CountryIntelligenceMap.tsx`
- `app/intake/page.tsx`
- `app/intake/ConfidentialIntakeForm.tsx`
- `docs/control/PREVIEW_HARDENING_SCREENSHOT_QA.md`

## Prohibited changes respected

- No Supabase migrations.
- No RLS policy changes.
- No production smoke writes.
- No environment variable changes.
- No admin-auth logic changes.
- No public DTO expansion.
- No sensitive provenance/evidence fields added to public routes.
- No dependency changes.

## Required verification commands

Run locally or in CI from the branch:

```bash
npm install
npm run typecheck
npm run build
npm run test:visibility
npm run test:intelligence-fixtures
npm run test:intelligence-globe-leakage
npm run test:signals-public-leakage
npm run test:regulatory-signals-public-leakage
npm run test:clinical-education
npm run test:admin-guard
```

Optional browser checks after Vercel preview deploy:

```bash
HARBOURVIEW_PUBLIC_BASE_URL=<preview-url> npm run probe:production-visibility
```

Do not run write-enabled marketplace smoke tests unless the controlled smoke gates are intentionally enabled.

## Manual browser QA matrix

| Page | Required result | Current branch status |
| --- | --- | --- |
| `/` | Hero remains premium; globe is a background brand signal, not a broken oversized object; CTAs visible above fold at desktop and mobile widths. | PATCHED / needs browser verification |
| `/network` | Header, CTA and Network sections render without layout regression. | UNCHANGED / needs regression check |
| `/intelligence` | Hero copy and country map do not imply live-data or geographic precision; country panels remain public-safe. | PATCHED / needs browser verification |
| `/network/clinical-education` | Clinical education route remains public-safe, non-prescriptive and visually aligned. | UNCHANGED / needs regression check |
| `/contact` | Direct email and confidential copy remain visible; no public exposure of submitted data. | UNCHANGED / needs regression check |
| `/intake` | Premium dark hero, clean white form section, capture form usable, no nested-card visual defect. | PATCHED / needs browser verification |
| `/admin` | Anonymous users are denied; viewer/analyst are denied; admin/operator only. | UNCHANGED / must verify |

## Public leakage gate

Public routes must not expose the following strings in HTML/client-visible output:

- `View source listing`
- `sourceUrl`
- `sourceName`
- `Evidence captured`
- `provenanceSummary`
- `sourceEvidence`
- `verificationStatus`
- `availabilityStatus`
- `sellerAuthorizationStatus`
- `internalReviewNotes`
- `reviewedBy`
- `lastReviewedAt`
- `nextReviewDueAt`

## Environment and capture gate

Vercel preview must have required read/capture environment variables configured before release review. Production smoke-write variables must remain absent/disabled unless explicitly running controlled production smoke tests.

Required server-only values must never be exposed as `NEXT_PUBLIC_*` values. Public Supabase browser keys must be limited to intended anonymous/publishable client use.

## Final GO/HOLD schema

```text
Decision: GO | HOLD
Branch:
Commit:
Preview URL:
Changed files:
Commands run:
- npm run typecheck: PASS | FAIL | NOT RUN
- npm run build: PASS | FAIL | NOT RUN
- npm run test:visibility: PASS | FAIL | NOT RUN
- npm run test:intelligence-fixtures: PASS | FAIL | NOT RUN
- npm run test:intelligence-globe-leakage: PASS | FAIL | NOT RUN
- npm run test:admin-guard: PASS | FAIL | NOT RUN
Public leakage result:
Admin-auth result:
Supabase capture result:
Mobile QA result:
Remaining blockers:
Release recommendation:
```

## Current decision

HOLD.

Rationale: code patch is applied, but this connector session cannot run repository commands or browser/Vercel preview verification. Merge only after CI/build/leakage/admin-auth/browser checks pass on the branch.
