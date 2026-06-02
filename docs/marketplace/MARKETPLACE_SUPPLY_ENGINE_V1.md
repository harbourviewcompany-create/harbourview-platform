# Harbourview Marketplace Supply Engine V1

This branch implements the marketplace spine only. It does not add live marketplace records and it does not source sellers, suppliers, buyers, or assets.

## Scope

Implemented scope:

- Canonical marketplace taxonomy for supply, equipment, surplus, distressed opportunities, services, trade, wanted requests, qualified access, and education.
- Additive Supabase migration for marketplace listing reconciliation, public-safe view, source registry expansion, and marketplace candidate expansion.
- Public listing query patch so marketplace pages read from `marketplace_public_listings_v1`, not the raw `listings` table.
- Public DTO projection guard that removes source, seller, evidence, internal notes, private specs, scores, and operator-action fields.
- Dynamic seller/wanted intake fieldsets for consumables, equipment, distressed assets, service providers, and wanted requests.
- Admin marketplace overview page with private taxonomy coverage and queue lane entry points.
- Seed import schema guard that prevents direct publication and keeps restricted categories private by default.
- Targeted tests for public projection and seed import behavior.

## Public/private boundary

Public marketplace output must use only one of:

1. `public.marketplace_public_listings_v1`
2. `toPublicMarketplaceListing()`

Public pages must not query `marketplace_candidates`, `source_registry`, `source_snapshots`, `candidate_review_events`, `private_specs`, seller contact fields, source evidence, private evidence summaries, score fields, or operator notes.

## Canonical taxonomy

The TypeScript source of truth is `lib/marketplace/taxonomy.ts`. The migration mirrors the category keys for database-level candidate validation. Category keys are intentionally broad enough to cover consumables, packaging, new products, used and surplus equipment, cultivation equipment, processing equipment, labs, logistics, professional services, distressed inventory, distressed businesses, business opportunities, export-ready routes, import demand, inventory, genetics, wanted requests, qualified access, and education.

## Source ledger fields

The source ledger is expanded through `source_registry` with source owner, category keys, allowed record types, geography, reliability score, scrape policy, access method, refresh cadence, capture timestamps, status, and private notes. This is an operator ledger, not a public source list.

## Candidate review fields

`marketplace_candidates` now supports category key, subcategory key, listing type key, record type, private seller fields, authorization status, verification status, publication status, monetization path, pricing text, quantity text, private specs, high-level specs, required documents, private evidence summary, public summary draft, public payload, review due date, and expiry.

## Seed import format

Required seed import columns:

- import_batch_id
- record_type
- category_key
- listing_type_key
- title_internal
- title_public_draft
- public_summary_draft
- source_type
- country
- publication_status

Useful optional columns:

- source_url
- source_name
- seller_name_private
- seller_url_private
- seller_contact_private
- condition
- asking_price_text
- quantity_text
- country
- region
- high_level_specs_json
- private_specs_json
- evidence_summary_private
- required_documents_json
- review_due_at
- expires_at

Seed imports must not set `publication_status=published`. Restricted categories are normalized to `private_only`.

## Verification commands

Expected commands after checkout and install:

```bash
npm install
npm run typecheck
npm run test -- tests/marketplace/publicProjection.test.ts tests/marketplace/seedImportSchema.test.ts
npm run build
```

Database verification:

```sql
select * from public.marketplace_public_listings_v1 limit 1;
select column_name from information_schema.columns where table_schema='public' and table_name='marketplace_candidates' order by ordinal_position;
```

## GO criteria

GO requires:

- Supabase migration applies cleanly.
- Public marketplace pages read from `marketplace_public_listings_v1`.
- Public projection tests pass.
- Seed import tests pass.
- Build passes.
- No private seller, source, evidence, private specs, scores, or operator notes appear in public DTOs or public DOM.

## HOLD criteria

HOLD if any of the following occur:

- Migration fails against the current production schema.
- RLS or view grants expose private tables directly to anon.
- Public pages query raw private marketplace tables.
- Build or targeted tests fail.
- Any seed row can publish directly.
