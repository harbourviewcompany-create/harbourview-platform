# PR #1222 — Harbourview Supply Catalog Verification

Date: 2026-07-31
Branch: `feature/supply-catalog`
Merge status: not merged

## Scope

Verification and hardening of `/supply`, `/supply/[slug]`, the dedicated public supply DTO, production migration history, natural-key protections, and current-main TypeScript failures inherited when the branch was synchronized with `main`.

## Code repairs

- `lib/signals/feedbackScores.ts` now accepts Supabase clients whose exposed schema is `api` or `public`; this removes the schema-generic mismatch reported from `app/api/dashboard/digest/route.ts` and the feedback loader.
- No runtime change was required in `app/api/dashboard/digest/route.ts` after the shared helper type was corrected.
- The latest Type check workflow passed after the repair.

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

The repository repair migration filename was aligned to the applied production version.

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

Confirmed on the repaired branch during this pass:

- Type check: passed on the post-helper-repair head.
- Migration Drift Check: passed before the final migration filename reconciliation; a final run was triggered after reconciliation.
- HAR-39 HAR-40 Public Surfaces: passed before the final migration filename reconciliation; a final run was triggered after reconciliation.
- Install Only Verification: passed before the final migration filename reconciliation; a final run was triggered after reconciliation.

Final workflow conclusions must be read from the latest branch head before merge.

## Screenshots

Required browser captures:

- `/supply` at 375px
- `/supply` at 1440px
- one `/supply/[slug]` route at 375px
- one `/supply/[slug]` route at 1440px

Screenshot capture was not available through the connected GitHub and Supabase execution tools used for this pass. This remains a release evidence blocker rather than an inferred pass.

## Decision

HOLD until the final latest-head workflow set completes and the four required browser screenshots are captured and reviewed. Do not merge PR #1222 before those gates are closed.
