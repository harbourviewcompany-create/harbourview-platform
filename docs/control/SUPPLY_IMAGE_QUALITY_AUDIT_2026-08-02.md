# Supply Image Quality Audit — 2026-08-02

## Scope

Complete review of all 68 canonical Harbourview Supply SKUs and their deterministic `public/images/supply/<slug>.webp` assets.

Review dimensions:

- Legibility and product-format recognizability
- Factual appropriateness against the canonical title
- Category differentiation
- Current 3:2 catalog/detail crop behavior
- Title-derived alt-text accuracy
- File weight
- Perceptual visual repetition
- Commercial credibility

## Baseline finding

All 68 production images were objectively defective as catalog imagery. They were near-identical text-only placeholder cards containing small product labels, rather than visible product-format imagery. This created poor mobile legibility, weak category differentiation, high visual repetition and low commercial credibility.

## Corrective action

All 68 WebPs were replaced with deterministic, centered, unbranded product-format illustrations generated from canonical slug/title families. The illustrations intentionally avoid supplier logos, certification marks, inventory claims, exact-finish claims and depictions of a specific delivered unit.

No listing record, database object, migration, public Supply DTO, query projection, SKU, slug, price, availability field, route contract or commercial claim was changed.

## Quantitative result

| Measure | Result |
|---|---:|
| Canonical SKUs audited | 68 |
| Correct deterministic assets | 68 |
| Dimensions | 1200 × 800 WebP |
| Mean file weight | 10.44 KB |
| Maximum file weight | 19.94 KB |
| 3:2 crop failures | 0 |
| Alt-text failures | 0 |
| Missing assets | 0 |

## Visual-repetition interpretation

Perceptual hashing identifies similarity among 59 SKUs. Review confirmed that this is concentrated in legitimate physical-format families such as pouch sizes, jar sizes, tube lengths, machine tiers, label rolls and humidity packs. It is recorded in the complete row-level audit matrix rather than treated as an automatic defect. Category-level differentiation is present across packaging, consumables, processing equipment, vape hardware, cultivation, laboratory, shipping and retail-support formats.

## Evidence

The `Supply Image Quality Audit` workflow produces:

- Five contact sheets covering every canonical SKU
- `supply-image-audit-raw.csv`
- `summary.json`

The complete operator matrix is exported separately as `harbourview-supply-image-quality-audit-68-skus.xlsx` and includes every SKU, image path, dimensions, file weight, crop status, alt-text status, perceptual peers, rationale, patch action and final verdict.

## Registry review

Affected rows reviewed:

- Harbourview Platform
- Harbourview Vercel Target

Registry change required: No. This patch replaces static presentation assets and adds verification tooling without changing project identity, deployment ownership, database target, production domain or route ownership.

## Acceptance boundary

These are controlled product-format illustrations, not supplier photography. They communicate product class and physical form only. They must not be interpreted as proof of exact delivered appearance, brand, certification, stock condition or supplier authorization.
