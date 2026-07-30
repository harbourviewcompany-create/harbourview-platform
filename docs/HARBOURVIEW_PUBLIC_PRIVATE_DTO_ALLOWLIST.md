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

### Regulatory Signals (`PublicRegulatorySignal`)

Public regulatory-signal DTO rows require `reviewed=true` **and** a
`quality_label` outside `('spam','boilerplate','nav','duplicate')`. The label
filter is applied at read time in `lib/regulatory-signals/public.ts` and
`lib/signals/quality.ts#EXCLUDED_QUALITY_LABELS`, because a pre-gate promotion
batch left classifier-rejected rows flagged `reviewed=true` in the live feed.
Rows with a NULL `quality_label` (classified before Pipeline B existed) remain
eligible — they passed the earlier human-review pass.

**Quality-brain fields cleared for public exposure.** These are Pipeline B
classifier/translator/dedup outputs. Each describes the signal's own quality or
provenance; none exposes counterparty, marketplace, analyst, or internal-review
material, so all are public-safe:

| Field | Source column | Notes |
|---|---|---|
| `content_type` | `signals.content_type` | Route taxonomy (spec §4.3); `noise` is mapped to null and never surfaced |
| `confidence_score` | `signals.quality_confidence` | 0–100. **The only permitted confidence instrument.** |
| `corroboration_count` | `signals.cluster_rep_id` | Count of same-cluster rows in the current feed window; a lower bound |
| `original_language` / `original_language_label` | `signals.lang_detected` | Source-document language when not English |
| `translated` | derived | True when the shown headline/summary is machine-translated |
| `country_slug` | derived | Canonical country slug for cross-linking |

**Never public, and never a confidence instrument:** `signals.score`. It is the
legacy keyword-density scorer, known inverted (see
`docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` §2.5 and
`docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md` §1.5). It must not be selected
into, ordered by, or rendered on any user-facing path. `lib/signals/quality.ts`
is the single approved read path for signal quality; `tests/signals/quality.test.ts`
asserts the scorer cannot leak through it.

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

`lib/harbourview/dto/allowlists.ts` defines a table-scoped field allowlist (`assertPublicDtoAllowlist`, `assertNoForbiddenFields`), but as of 2026-07 it is exercised only by its own unit test (`lib/harbourview/dto/__tests__/serializers.test.ts`) — no production route calls it. Public DTO types are defined in `lib/harbourview/dto/public.ts`; private operator DTO types are defined separately in `lib/harbourview/dto/private.ts`.

**The runtime guard actually enforcing this contract in production** is `assertPublicSafe()` in `lib/intelligence-os/publicSafety.ts` — a recursive forbidden-field/pattern scan called from public projection functions repo-wide (e.g. `lib/marketplace/publicProjection.ts:61`, `lib/intelligence-os/projections.ts`, `lib/signals/safety.ts`). Its forbidden-field list is maintained independently of `HV_FORBIDDEN_PUBLIC_DTO_FIELDS` above and should be kept in sync when adding a new private field name.
