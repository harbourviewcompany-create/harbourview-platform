# Consumables Page Handoff

Status: HOLD pending CI/browser verification and final product assets.

## Scope applied

- Converted the standalone consumables HTML concept into the existing Next.js App Router route at `app/marketplace/consumables/page.tsx`.
- Preserved existing public marketplace conventions: public copy only, no source/provenance fields, no contact details exposed, no pricing or availability guarantee.
- Added explicit image manifest at `app/marketplace/consumables/image-manifest.ts`.
- Added consumables product-slot scaffold and asset-manifest panel at `app/marketplace/consumables/ConsumablesProductSlots.tsx`.
- Added request form at `app/marketplace/consumables/ConsumablesRequestForm.tsx`.
- Wired the form only to the existing safe marketplace capture pattern: `submitMarketplaceInquiryDirect()` -> `/api/marketplace/capture` -> `marketplace_inquiries` service-role server insert.

## Existing intake pattern inspected

The existing safe path is:

- `app/intake/ConfidentialIntakeForm.tsx`
- `app/intake/IntakeForm.tsx`
- `lib/marketplace/clientCapture.ts`
- `app/api/marketplace/capture/route.ts`
- `lib/marketplace/intakeValidation.ts`

The consumables request form uses `inquiry_type: 'quote_request'`, which is already accepted by the existing capture validation schema.

## Missing final assets

The route remains usable because missing product assets render as explicit placeholder slots. Final WebP assets still needed:

- `public/images/consumables/pre-roll-cones-king-size.webp`
- `public/images/consumables/matte-child-resistant-pouches.webp`
- `public/images/consumables/premium-glass-jars.webp`
- `public/images/consumables/roll-labels-tamper-seals.webp`
- `public/images/consumables/custom-retail-cartons.webp`
- `public/images/consumables/opaque-flower-jars.webp`

Existing representative assets reused from the current marketplace image set:

- `public/marketplace/images/packaging-pouches.webp`
- `public/marketplace/images/lab-qa-consumables.webp`
- `public/marketplace/images/cultivation-inputs.webp`
- `public/marketplace/images/facility-supplies.webp`
- `public/marketplace/images/warehouse-logistics.webp`

## Required verification commands

Run before merge:

```bash
npm ci
npm run typecheck
npm run lint
npm run test:public-images
npm run test:visibility
npm run build
```

Browser route smoke checks required after build:

- `/marketplace/consumables` at 390px
- `/marketplace/consumables` at 768px
- `/marketplace/consumables` at 1440px

Check that:

- Page renders without horizontal overflow.
- Hero, category cards, product slots, live-listings/empty state, request form, manifest and final CTA are reachable.
- Request form validates required fields.
- No public source/provenance/private-contact fields appear.
- Missing final assets are visible as placeholder slots, not broken images.

## GO/HOLD

HOLD until branch CI and browser smoke evidence are attached.
