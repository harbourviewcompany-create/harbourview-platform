# PR #1222 — Harbourview Supply Catalog Verification

Date: 2026-08-01
Branch: `feature/supply-catalog`
Merge status: not merged
Verified application and Vercel head: `c3d9a43b7ddac697061d3a87079ee6ca77490b07`
Current evidence-only descendant: `04d69ce74220bbc536def0cb865a3eeaf0c78bdd`

## Scope

Verification and hardening of `/supply`, `/supply/[slug]`, the dedicated public supply DTO, production migration history, natural-key protections, TypeScript compatibility, public leakage controls, production build, responsive browser rendering, and Vercel preview deployment identity.

## Vercel deployment diagnosis and repair

Vercel Git integration is enabled in `vercel.json`, and the branch ignore command explicitly allows `feature/supply-catalog` builds.

The prior branch deployment `dpl_GLpfoy6G198UCudGtX42udVbro2k` failed during `npm run build` because `app/supply/[slug]/page.tsx` referenced `compliance_flags` after the public `SupplyListing` DTO had removed that private field. That TypeScript failure was already repaired in subsequent PR commits.

After the TypeScript repair, later branch pushes did not create usable previews because the branch still contained this Hobby-plan-incompatible cron schedule:

- `/api/cron/intelligence-health`: `15 */6 * * *`

The project permits one scheduled execution per day on its current plan. The branch configuration was changed to:

- `/api/cron/intelligence-health`: `15 6 * * *`

This single configuration repair created deployment `dpl_2NMCqCKyPbrrv5ykMgqWWuU4kHVW` automatically through the existing Git integration.

## Vercel preview identity

- Deployment ID: `dpl_2NMCqCKyPbrrv5ykMgqWWuU4kHVW`
- Deployment URL: `harbourview-1ttctqk93-harbourview.vercel.app`
- Stable branch alias: `harbourview-git-feature-supply-catalog-harbourview.vercel.app`
- State: `READY`
- Source: Git
- Branch: `feature/supply-catalog`
- `githubCommitSha`: `c3d9a43b7ddac697061d3a87079ee6ca77490b07`
- Alias error: none

Build logs confirmed that Vercel cloned the expected branch and commit, the ignore command returned `build allowed`, dependencies installed, and the Next.js production build completed.

## Exact-deployment route requests

Requests were issued to the exact immutable deployment URL for:

- `/supply`
- `/supply/cr-mylar-pouch-3-5g-matte-black`

Both requests reached the READY deployment but returned HTTP `302` to Vercel SSO because preview deployment protection is enabled. A temporary Vercel share URL was generated, but the connected fetch client did not retain the SSO cookie and continued receiving the protection redirect. Therefore the exact deployment identity is verified, but an authenticated application-level HTTP 200 response from those two immutable URLs is not evidenced in this pass.

The same routes remain independently verified at HTTP 200 through the current-content GitHub visual workflow, including 375px and 1440px browser captures and horizontal-overflow checks.

## Database and public-boundary verification

Production supply catalog counts after hardening:

- Rows: 68
- Distinct slugs: 68
- Distinct SKUs: 68
- Duplicate slugs: 0
- Duplicate SKUs: 0

An anonymous-role query against `api.supply_catalog_public_v1` succeeded and returned only allowlisted fields. Exact stock, raw compliance JSON, supplier identity, brand/model, private review fields, and provenance were not returned.

The dedicated DTO remains `api.supply_catalog_public_v1`; the PR does not expand `marketplace_public_listings_v1`.

## Current-content GitHub checks

All workflows completed successfully against `c3d9a43b7ddac697061d3a87079ee6ca77490b07`:

| Workflow | Run ID | Conclusion |
|---|---:|---|
| Install Only Verification | `30704676736` | success |
| Project Registry Discipline | `30704676703` | success |
| Type check | `30704676741` | success |
| Migration Drift Check | `30704676696` | success |
| HAR-39 HAR-40 Public Surfaces | `30704676720` | success |
| PR 166 New Products Equipment Verification | `30704676730` | success |
| Regulatory Signals Verify | `30704676693` | success |
| Branch Verification | `30704676708` | success |
| CI | `30704676700` | success |
| PR 1222 Supply Visual Verification | `30704676695` | success |

## Responsive screenshot evidence

- Artifact name: `pr1222-supply-responsive-screenshots`
- Artifact ID: `8819959475`
- Source run: `30704676695`
- Source head: `c3d9a43b7ddac697061d3a87079ee6ca77490b07`
- Archive SHA-256: `830a2271b205c6e5413e6ba628a863c5d4343b9fc5fca77d78cfba15e21972f7`
- Retention expiry: 2026-08-31

Artifact paths:

- `verification-results/pr1222-supply/catalog-375.png`
- `verification-results/pr1222-supply/catalog-1440.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-375.png`
- `verification-results/pr1222-supply/detail-cr-mylar-pouch-3-5g-matte-black-1440.png`
- `verification-results/pr1222-supply/manifest.json`

Both routes returned HTTP 200 at both viewports, and no horizontal overflow was detected.

## Checklist

- [x] Typecheck
- [x] Tests
- [x] Production build
- [x] Public-surface and leakage checks
- [x] Migration drift check
- [x] Duplicate slug/SKU queries
- [x] Anonymous query against `api.supply_catalog_public_v1`
- [x] Mobile and desktop route screenshots
- [x] Current-content READY Vercel preview with matching `githubCommitSha`
- [ ] Exact immutable deployment application responses — blocked by Vercel preview protection redirect in the connected fetch client
- [ ] Dedicated standalone lint command — no separate lint script was evidenced
- [ ] Clean isolated Supabase replay — production migration reconciliation and live-state verification were used instead

## Decision

**HOLD.**

The Vercel deployment-generation problem is repaired, the preview is READY and tied to the verified application head, and all GitHub checks are green. Do not merge until the two exact immutable preview URLs are observed returning application-level HTTP 200 through an authenticated browser/session or preview protection is temporarily bypassed through an authorized verification mechanism.
