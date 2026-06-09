# Harbourview Public / Private DTO Allowlist

## Public DTO Principle

Public DTOs are explicit allowlists. They are not passthroughs of Airtable rows or Supabase base tables. Public DTOs must never expose operator notes, private summaries, raw import internals, raw source files, sensitivity fields, rejected-record data, unsupported claims, internal commercial scores, or private evidence notes.

## Required Public Views

- `hv_public.jurisdictions_public`
- `hv_public.sources_public`
- `hv_public.market_signals_public`
- `hv_public.marketplace_listings_public`
- `hv_public.offers_public`
- `hv_public.claim_evidence_public`
- `hv_public.education_resources_public`

## Forbidden Public DTO Fields

These fields are disallowed in `hv_public` views and typed public DTOs:

- `private_notes`
- `notes_private`
- `summary_private`
- `description_private`
- `raw_row_id`
- `raw_source_file`
- `import_batch_id`
- `sensitivity`
- `operator_comments`
- `review_notes_private`
- `internal_score`

## Public Eligibility Rules

### Sources

Public source DTO rows require:

- `verification_status='verified'`
- `public_visibility=true`
- `sensitivity='public'`

### Marketplace Listings

Public marketplace listing DTO rows require:

- `verification_status='verified'`
- `review_status='approved'`
- `public_visibility=true`
- `sensitivity='public'`

### Offers

Public offer DTO rows require:

- `ready_to_sell='YES'`
- `public_visibility=true`
- `verification_status='verified'`
- `review_status='approved'`
- `sensitivity='public'`

### Education / Claims Evidence

Public claim evidence and education-resource DTO rows require:

- verified evidence
- approved claim review
- public sensitivity
- public visibility
- verified and public source record

## TypeScript Allowlist Module

The application allowlist is defined in `lib/harbourview/dto/allowlists.ts`. Public DTO types are defined in `lib/harbourview/dto/public.ts`; private operator DTO types are defined separately in `lib/harbourview/dto/private.ts`.
