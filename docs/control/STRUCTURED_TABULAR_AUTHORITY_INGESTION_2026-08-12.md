# Structured Tabular Authority Ingestion — 2026-08-12

**Status:** repository implementation pending merge; source-registry migration was applied to production out of sequence and has been reconciled below  
**Reconciliation baseline:** `2bcced07dbc07636bb7363649418703fbc0b90fa`  
**Mission:** close the record-level evidence gap for authoritative HTML-table/CSV registries without creating a parallel intelligence pipeline.

## Production reconciliation

At 2026-08-12 14:37:33 UTC, production Supabase project `zvxdgdkukjrrwamdpqrg` recorded migration version `20260812143733` with name `structured_tabular_authority_sources` before PR #1351 had merged. Read-only inspection of `supabase_migrations.schema_migrations` confirmed that the recorded statement is the same source-registry migration carried in repository file `supabase/migrations/20260812090000_structured_tabular_authority_sources.sql` (Git blob `b6d993f6201135c20442bd8fdbbaa0fc1a3f2c7d`).

The production migration configured four `source_registry` rows only. It did not deploy the structured-tabular parser or `source-engine-fetch` implementation, promote evidence, publish DTOs, import workbook data, or alter marketplace routes. Repository/live version reconciliation is therefore recorded through the existing content-pinned migration-equivalence control rather than by renaming historical migration artifacts or attesting an unknown mutation.

Until the parser/fetcher code is merged and separately deployed, the four source rows must not be described as operational record-level ingestion.

## Why this exists

The canonical source-engine already supported RSS/Atom, generic HTML snapshots, and record-level structured JSON. Generic HTML pages were captured as one opaque snapshot. That is inadequate for regulator licence registers, product/sponsor tables, and other authority datasets where each row is an independently meaningful commercial or regulatory record.

This change extends the existing canonical path only:

`public.source_registry`
→ `source-engine-fetch`
→ `source_snapshots`
→ `hv-extract`
→ `hv_import_staging`
→ `hv_artifacts + hv_evidence`
→ downstream classification/search/intelligence.

It does not introduce another entity model, transaction model, public DTO, marketplace surface, or evidence store.

## Capability added

`supabase/functions/_shared/structured-tabular.ts` supports:

- RFC-style quoted CSV fields, embedded commas, escaped quotes, and multiline fields;
- HTML table extraction;
- complex government tables through explicit canonical `columns` metadata;
- multi-table authority pages: absent a pinned `table_index`, all tables are parsed;
- nearest `<h2>`–`<h4>` heading captured as `_table_label` plus `_table_index` for category/role provenance;
- mandatory `identity_columns` so source row order can never become identity;
- fail-closed behavior when a configured identity disappears during upstream schema drift;
- deterministic per-record URLs;
- `record_offset` / `max_records` chunk controls with a 2,500-record hard safety cap;
- JSON object `captured_text` so downstream extraction receives field-labelled evidence rather than flattened page text.

## Fetcher performance correction

The previous fetcher performed one duplicate lookup and potentially one insert per snapshot candidate. That N+1 behavior was tolerable for 12-item feeds and 100-record APIs but unsuitable for large authority registers.

`source-engine-fetch` v2.3 now:

1. hashes candidate records once;
2. de-duplicates captured URLs in memory;
3. checks prior `captured_url + raw_html_hash` pairs in bounded lookup batches;
4. inserts fresh snapshots in batches of 100;
5. retains the existing record-level hash semantics and source health updates.

No public route or public DTO changes are introduced.

## Authority sources configured

### Health Canada — licensed cultivators, processors and sellers

Authoritative page:
`https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensed-cultivators-processors-sellers.html`

Verified source claim on 2026-08-12: Health Canada states that the table lists all cultivators, processors and sellers holding licences under the Cannabis Regulations and records licence classes plus cannabis classes authorized for provincial/territorial and registered-patient sale.

Record identity:
`licence_holder + province_territory + initial_licensing_date`

Critical interpretation control:
`export_capability_inference_allowed = false`.

A federal cannabis licence is not evidence that a company has an import/export permit or has exported cannabis. Export capability stays Unknown until separate permit/transaction evidence exists.

### Australia ODC — cultivators and producers

Authoritative page:
`https://www.odc.gov.au/medicinal-cannabis/list-approved-medicinal-cannabis-cultivators-and-producers-australia`

Verified source limitation: publication is consent-based and ODC explicitly notes that some licence holders may remain anonymous. Metadata therefore records `full_licence_universe = false` and `coverage_claim = consent_based_public_subset_only`.

### Australia ODC — manufacturers and importers

Authoritative page:
`https://www.odc.gov.au/medicinal-cannabis/list-approved-manufacturers-and-suppliers-medicinal-cannabis-products`

The page contains separate Manufacturers and Importers tables. Multi-table ingestion preserves the nearest heading as `_table_label`, allowing the same legal entity to have both roles without conflating them. The same consent-based completeness limitation is carried into source metadata.

### Australia TGA — SAS/AP medicinal-cannabis product and sponsor list

Authoritative page:
`https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list`

The page contains five cannabinoid-category tables. Each row retains category heading, dosage form, active ingredients, quantity per dosage unit, and sponsor.

Verified source limitation on 2026-08-12: the list covers products supplied through SAS/AP from 2025-07-01 through 2025-12-31 and reported within the required sponsor reporting window. TGA states that inclusion does not guarantee product availability. Metadata therefore records the reporting window and `availability_guaranteed = false`.

## Preserved boundaries

- Existing Health Canada canonical/operator tables and their import workflow remain authoritative for that dedicated operator registry. This source-engine work supplies automated evidence; it does not fork that canonical model.
- PR #1329 remains the transaction/entity/evidence foundation. This change does not duplicate its schema.
- PR #1309/#1337 remain the Decision Intelligence/jurisdiction path. This change does not create a parallel decision layer.
- ODC non-consenting licence holders remain source-limited; no public completeness claim is manufactured.
- Canadian import/export capability remains evidence-gated.
- TGA product-list inclusion remains reporting-window evidence, not a current-availability assertion.
- The out-of-sequence production migration configured registry metadata only; parser/fetcher deployment remains separate and must be verified before operational claims.

## Verification contract

```bash
deno test supabase/functions/_shared/structured-json.test.ts
deno test supabase/functions/_shared/structured-tabular.test.ts
deno check --node-modules-dir=auto supabase/functions/source-engine-fetch/index.ts
```

Migration assertions require exactly four active configured authority source URLs with structured HTML-table fetch and stable identity metadata.

### Production-safe proof before operational GO

A source is not considered operational merely because its registry row exists. For each of the four configured sources verify:

1. source row is active and carries the intended scope metadata;
2. deployed fetcher dry-run returns record-level candidates rather than one page snapshot;
3. candidate count is plausible against the authority page;
4. a second unchanged run produces duplicate skips rather than duplicate snapshots;
5. sampled records retain the correct per-row fields and `_table_label` where relevant;
6. relevant rows progress through `hv-extract` / staging or are truthfully rejected;
7. promoted records create canonical private evidence with source URL, source ID, capture time, and content hash;
8. no evidence/provenance fields appear on public marketplace or public intelligence DTOs;
9. Health Canada records do not gain export capability without separate evidence;
10. ODC/TGA scope limitations survive downstream interpretation.

## Rollback

Code rollback: revert the parser/fetcher commits.  
Registry rollback: deactivate the four configured source rows or restore their prior metadata from migration evidence. Do not delete source snapshots/evidence as a rollback shortcut; preserve audit history.
