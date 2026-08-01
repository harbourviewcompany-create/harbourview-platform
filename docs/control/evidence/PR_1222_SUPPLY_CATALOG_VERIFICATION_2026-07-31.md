# PR #1222 — Harbourview Supply Catalog Verification

Date: 2026-08-01
Branch: `feature/supply-catalog`
Merge status: not merged
Verified application deployment commit: `954ee65e41851a897168d076f2717be3618bfeba`
Protected-route verification workflow head: `79c5771fd6d8df7a24870e5a48bf1f39b192a967`

## Scope

Verification and hardening of `/supply`, `/supply/[slug]`, the dedicated public supply DTO, production migration history, natural-key protections, TypeScript compatibility, public leakage controls, production build, responsive browser rendering, Vercel preview deployment identity, and authenticated access through Vercel Preview Deployment Protection.

No application code was changed during the final protected-route verification pass. The only executable change was the evidence-only GitHub Actions verification step in `.github/workflows/pr1222-supply-visual-verification.yml`.

## Vercel deployment

- Deployment ID: `dpl_CvdajKpEAUBUgXfeUNVKwp2RXRUv`
- Immutable URL: `https://harbourview-7gq72hysc-harbourview.vercel.app`
- Stable branch alias: `harbourview-git-feature-supply-catalog-harbourview.vercel.app`
- State: `READY`
- Source: Git
- Branch: `feature/supply-catalog`
- `githubCommitSha`: `954ee65e41851a897168d076f2717be3618bfeba`
- Alias error: none

The commits after the deployed application head contain only workflow and evidence updates. They do not alter supply routes, DTOs, SQL, dependencies, or runtime application behavior.

## Protected immutable-route verification

Workflow: `PR 1222 Supply Visual Verification`
Run ID: `30721698176`
Conclusion: `success`
Verification time: `2026-08-01T22:40:23.191188+00:00`

The workflow used the existing `VERCEL_AUTOMATION_BYPASS_SECRET` through the `x-vercel-protection-bypass` header and requested the exact immutable deployment without following redirects.

### `/supply`

- HTTP status: `200`
- Requested URL: `https://harbourview-7gq72hysc-harbourview.vercel.app/supply`
- Effective URL: `https://harbourview-7gq72hysc-harbourview.vercel.app/supply`
- Page title: `Supply Catalog | Harbourview | Harbourview`
- Required visible text:
  - `Harbourview Supply`: present
  - `Browse the catalog`: present
  - `Request a Quote`: present

### `/supply/cr-mylar-pouch-3-5g-matte-black`

- HTTP status: `200`
- Requested URL: `https://harbourview-7gq72hysc-harbourview.vercel.app/supply/cr-mylar-pouch-3-5g-matte-black`
- Effective URL: `https://harbourview-7gq72hysc-harbourview.vercel.app/supply/cr-mylar-pouch-3-5g-matte-black`
- Page title: `Child-Resistant Mylar Pouch — 3.5g (Matte Black) | Harbourview Supply | Harbourview`
- Required visible text:
  - `Harbourview Supply`: present
  - `Child-Resistant Mylar Pouch — 3.5g (Matte Black)`: present
  - `Commercial review`: present

No request was redirected to Vercel SSO, and the effective URLs remained the exact immutable route URLs.

## Protected-route artifact

- Artifact name: `pr1222-vercel-protected-route-verification`
- Artifact ID: `8825076280`
- Source run: `30721698176`
- Source head: `79c5771fd6d8df7a24870e5a48bf1f39b192a967`
- Archive SHA-256: `6b5feef3728332caf4f9eda467606ee5b17f6dd47e71942d53da945680c0a8e3`
- Retention expiry: 2026-08-31

Artifact contents include:

- `route-verification.json`
- `route-verification.md`
- route-specific JSON and Markdown reports
- response headers
- response HTML
- curl status/effective-URL metadata

## Responsive screenshot evidence

- Artifact name: `pr1222-supply-responsive-screenshots`
- Artifact ID: `8825076123`
- Source run: `30721698176`
- Source head: `79c5771fd6d8df7a24870e5a48bf1f39b192a967`
- Archive SHA-256: `4f7b74ae9f567be4aadc54ba2e83de295828e1c04c8247030ee3d3ceb48e892a`
- Retention expiry: 2026-08-31

Artifact paths:

- `verification-results/pr1222-supply/catalog-375.png`
- `verification-results/pr1222-supply/catalog-1440.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-375.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-1440.png`
- `verification-results/pr1222-supply/manifest.json`

Both routes returned HTTP 200 at both viewports, and no horizontal overflow was detected.

## Database and public-boundary verification

Production supply catalog counts after hardening:

- Rows: 68
- Distinct slugs: 68
- Distinct SKUs: 68
- Duplicate slugs: 0
- Duplicate SKUs: 0

An anonymous-role query against `api.supply_catalog_public_v1` succeeded and returned only allowlisted fields. Exact stock, raw compliance JSON, supplier identity, brand/model, private review fields, and provenance were not returned.

The dedicated DTO remains `api.supply_catalog_public_v1`; the PR does not expand `marketplace_public_listings_v1`.

## Current verification workflow results

All workflows completed successfully against `79c5771fd6d8df7a24870e5a48bf1f39b192a967`:

| Workflow | Run ID | Conclusion |
|---|---:|---|
| Install Only Verification | `30721698165` | success |
| Project Registry Discipline | `30721698180` | success |
| Type check | `30721698179` | success |
| Migration Drift Check | `30721698175` | success |
| HAR-39 HAR-40 Public Surfaces | `30721698156` | success |
| PR 166 New Products Equipment Verification | `30721698162` | success |
| Regulatory Signals Verify | `30721698149` | success |
| Branch Verification | `30721698199` | success |
| CI | `30721698172` | success |
| PR 1222 Supply Visual Verification | `30721698176` | success |

## Checklist

- [x] Typecheck
- [x] Tests
- [x] Production build
- [x] Public-surface and leakage checks
- [x] Migration drift check
- [x] Duplicate slug/SKU queries
- [x] Anonymous query against `api.supply_catalog_public_v1`
- [x] Mobile and desktop route screenshots
- [x] Current-head/content-equivalent READY Vercel preview with matching application commit
- [x] Exact immutable deployment application responses through the authorized automation bypass
- [x] Final HTTP status, effective URL, page title and required visible text recorded for both routes
- [x] Protected-route evidence artifact uploaded
- [ ] Dedicated standalone lint command — no separate working lint gate was evidenced
- [ ] Clean isolated Supabase replay — production migration reconciliation and live-state verification were used instead

The two unchecked items are documented repository limitations and are not new defects introduced by PR #1222. The requested release gates for code, database state, public DTO boundaries, deployment identity, responsive rendering, and protected-preview route operation are complete.

## Decision

**GO.**

PR #1222 is verified for review and merge authorization. It remains open and unmerged. Merge or deployment to production still requires explicit operator authorization.
