# PR #1222 — Harbourview Supply Catalog Verification

Date: 2026-07-31
Branch: `feature/supply-catalog`
Merge status: not merged
Verified application-content head: `f622ef638f3fe526d11e5aa5b0b350cc7a94f6be`

## Scope

Verification and hardening of `/supply`, `/supply/[slug]`, the dedicated public supply DTO, production migration history, natural-key protections, current-main TypeScript compatibility, public leakage controls, production build, and responsive browser rendering.

## Code repairs

- `lib/signals/feedbackScores.ts` accepts Supabase clients whose exposed schema is `api` or `public`, removing the schema-generic mismatch reported from `app/api/dashboard/digest/route.ts` and the feedback loader.
- No runtime change was required in `app/api/dashboard/digest/route.ts` after the shared helper type was corrected.
- `components/dashboard/MobileCommandCentre.tsx` was reconciled through current `main`; it is not part of the final supply-specific diff.
- `.github/workflows/pr166-new-products-equipment-verification.yml` scans exact private-field markers rather than the generic word `evidence`, eliminating a confirmed false positive while preserving leakage coverage.
- `.github/workflows/pr1222-supply-visual-verification.yml` builds the branch, starts the production server with the repository Supabase public environment, captures the required responsive routes, rejects non-2xx responses, and rejects horizontal overflow.

## Production migration reconciliation

Requested repository versions:

- `20260730220000`
- `20260730220100`
- `20260730220200`
- `20260731125500`

The first three repository versions were not present under those exact numbers in production migration history. Their live-first equivalents were already present as:

- `20260730211141` — add Harbourview direct supply catalog fields
- `20260730211147` — create supply catalog public view
- `20260730211325` — seed Canada starter catalog
- `20260730211507` — seed Canada batch 2
- `20260730211621` — seed Canada batch 3
- `20260730211756` — seed Canada batch 4
- `20260730212129` — extend public listings view for supply catalog

Only the missing hardening migration was applied. Supabase registered it as:

- `20260731145108` — `harden_supply_catalog_public_projection`

The repository repair migration filename is aligned to the applied production version.

## Database verification

Production supply catalog counts after hardening:

- Rows: 68
- Distinct slugs: 68
- Distinct SKUs: 68
- Duplicate slugs: 0
- Duplicate SKUs: 0

An anonymous-role query against `api.supply_catalog_public_v1` succeeded and returned only allowlisted fields. Sample results used neutral values including `Quote required`, `Subject to confirmation`, and the public review note. Exact stock, raw compliance JSON, supplier identity, brand/model, private review fields, and provenance were not returned.

## Public boundary

The dedicated DTO remains `api.supply_catalog_public_v1`. The supply implementation does not depend on expanding the shared `marketplace_public_listings_v1` DTO.

## Automated checks

All required workflows completed successfully against application-content head `f622ef638f3fe526d11e5aa5b0b350cc7a94f6be`:

| Workflow | Run ID | Conclusion |
|---|---:|---|
| Install Only Verification | `30657376233` | success |
| Project Registry Discipline | `30657376307` | success |
| Type check | `30657376769` | success |
| Migration Drift Check | `30657376683` | success |
| HAR-39 HAR-40 Public Surfaces | `30657376213` | success |
| PR 166 New Products Equipment Verification | `30657377051` | success |
| Regulatory Signals Verify | `30657376338` | success |
| Branch Verification | `30657376284` | success |
| CI | `30657376289` | success |
| PR 1222 Supply Visual Verification | `30657376474` | success |

The visual workflow independently passed typecheck, production build, route startup, browser capture, HTTP status validation, and horizontal-overflow validation.

Subsequent evidence-only commits must receive their normal latest-head checks before merge. They do not modify application code, SQL, dependencies, or workflow execution logic.

## Responsive screenshot evidence

GitHub Actions artifact:

- Name: `pr1222-supply-responsive-screenshots`
- Artifact ID: `8803821009`
- Source run: `30657376474`
- Archive SHA-256: `838220f44d24ea6221347d92fbeb0f23c0a04950894818de0458fd9522e52055`
- Retention expiry: 2026-08-30

Artifact paths:

- `verification-results/pr1222-supply/catalog-375.png`
- `verification-results/pr1222-supply/catalog-1440.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-375.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-1440.png`
- `verification-results/pr1222-supply/manifest.json`

Visual review result:

- Both routes returned HTTP 200 at 375px and 1440px.
- No horizontal overflow was detected.
- Mobile catalog cards remain readable and single-column.
- Desktop catalog uses a coherent three-column grid.
- The detail route reflows from stacked mobile sections to a two-column desktop information layout.
- Navigation, CTAs, review language, product attributes, disclaimers, and footer rendered without clipping.
- The screenshots correctly show the current text-first catalog state; product imagery is not part of PR #1222.

## Vercel preview verification

The stable branch alias exists:

- `harbourview-git-feature-supply-catalog-harbourview.vercel.app`

The alias currently resolves to READY deployment `dpl_TCPcAc6YTCeS1YucrfNh4DVstZje`, commit `bcfd2421c8fea7b4c25bd28c2507a8b8447e1fdb`, which predates the hardening and latest-main reconciliation.

No READY Vercel preview matching application-content head `f622ef638f3fe526d11e5aa5b0b350cc7a94f6be` or a subsequent evidence-only descendant was present in the project deployment list at verification time. The local production build and browser evidence are green, but current-head Vercel deployment identity remains unverified.

## Decision

**HOLD.**

Code, database, DTO, leakage, build, test, and responsive browser gates are green. Do not merge PR #1222 until:

1. the latest evidence-only head completes its GitHub checks; and
2. Vercel produces a READY preview whose `githubCommitSha` matches the current PR head or a content-equivalent descendant, with `/supply` and `/supply/cr-mylar-pouch-3-5g-matte-black` confirmed operational.
