# Market Tier A UI — open commercial surface

Consumables, packaging, cultivation/processing equipment, and used/surplus are **Tier A** (public listings, Contact seller). Licensed cannabis inventory, export-ready, genetics, and distressed assets stay **Tier B** (review-gated).

Components live in `components/dashboard/market/`. Styles: `Market.css` (imported from CommandCentre). Tokens: `--cc-*` only.

Wire `MarketFeed` / `MarketDetailSheet` into CommandCentre MarketplacePage and mobile MarketplaceSection when ready.

## Auto-publish (Tier A)

Self-serve submissions via `POST /api/marketplace/submit`:

- **Tier A** (`public_allowed` + `requiresLicenseReview=false` + not restricted): light safety checks, then `status = approved_draft` and public draft fields set.
- **Fails light checks** (excluded terms, regulated product language, unsafe equipment claims): stays `needs_review` with hold reasons in `raw_payload`.
- **Tier B** (licensed inventory, export, genetics, distressed, etc.): always `needs_review`.

Logic: `lib/marketplace/tierAAutoPublish.ts` → `decideTierAAutoPublish()`.

## Live market data path

1. Auto-publish writes `marketplace_candidates.status = approved_draft`.
2. `promoteTierACandidateToListing` inserts `public.listings` with `status=approved` + `public_visibility=true`.
3. `marketplace_public_listings_v1` exposes those rows to the Market UI.
4. `getDashboardMarketplaceProjection` also merges live `approved_draft` candidates into equipment / consumables / services / new-products tabs as a fallback.
