# Marketplace Media Copy Control

Version: 1.0
Effective: 2026-08-10

Canonical trust-facing marketplace media disclosures are implemented in `MARKETPLACE_MEDIA_COPY` in `lib/dashboard/marketplaceMediaProjection.ts`.

- Representative badge: `Representative image`
- Catalogue fallback badge: `Manufacturer catalogue image`
- Representative caption: `Representative category image. Specifications, supplier fit and commercial terms are available upon inquiry.`

Approved image-specific `sourceDisplayLabel`, reviewed alt text and caption remain authoritative when supplied by the safe public DTO. `REAL_ITEM_EVIDENCE` is the only media class rendered without a provenance qualifier.


## Degraded media state

Canonical notice: `Marketplace images are temporarily degraded; representative images may be shown while approved media is reloaded.`

This notice is used only when approved-media retrieval fails or times out. A legitimate listing with no approved item image remains a representative-image state and must not be classified as a retrieval failure.
