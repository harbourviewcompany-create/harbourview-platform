# Harbourview Source Expansion — Wave 1

Date: 2026-08-10  
Branch baseline: `4533c9223377eb2e60c0fc8d3be48bd522d15806`  
Control workbook: `Harbourview_Source_Expansion_Audit_2026-08-10.xlsx`  
Workbook SHA-256: `8a3e2df8c9c6fc7a8afc593229c3ec3e2b3299fcae7e63f813ea13de3d17b000`

## Scope

The 518-record workbook remains the complete expansion universe. Wave 1 changes only three audit records and does not delete, suppress, or redefine any other source candidate:

| Audit ID | Source | Audit state | Live reconciliation before patch | Wave 1 code state |
|---|---|---|---|---|
| SX-0005 | ClinicalTrials.gov API | NEW | PARTIALLY COVERED — API endpoint existed but was treated as `html_snapshot` | configured structured API |
| SX-0056 | Federal Register API | NEW | PARTIALLY COVERED — HTML search row existed but was inactive and not crawlable | configured structured API |
| SX-0054 | FDA recalls / enforcement | NEW | NEW — no matching openFDA enforcement endpoint in production registry | two structured API child feeds: drug + food |

Projected workbook view after deployment and successful end-to-end proof: CURRENTLY INGESTED 16, PARTIALLY COVERED 8, NEW 488, INACCESSIBLE/REQUEST-REQUIRED 6. This is a projected coverage view only; production remains unchanged until the migration/function deployment and live verification are explicitly executed.

## Architecture reconciliation

### Canonical source capture

`public.source_registry` is the active global source registry. Production had 1,736 rows / 1,432 active at audit time, with live source snapshots through 2026-08-10.

The active source-engine path is:

`source_registry`
→ `source-engine-fetch`
→ `source_snapshots(fetch_status='success')`
→ `hv-extract`
→ `hv_import_staging(status='pending', source_system='source_engine')`
→ `hv_promote_staging_to_artifacts(...)`
→ `hv_artifacts` + `hv_evidence`
→ downstream scoring/classification/embedding/promotion.

Read-only production proof at audit time:

- `public.hv_evidence`: 75 rows.
- 63 evidence rows used `source_system='source_engine'` and were current through 2026-08-10.
- `hv_import_staging`: 1,009 promoted `source_engine` rows, plus review/rejected rows.
- `regulatory_signals.evidence`: 0 rows. It is not treated as the canonical live evidence store.
- The Postgres `hv_promote_staging_to_artifacts` function inserts the canonical artifact and linked private evidence in the same database function before queueing embedding work.

### Parallel path retained but not expanded in Wave 1

The Vercel `intelligence-ingest` / `intelligence-extract` route is a separate compatibility path. It can write `hv_artifacts` directly and does not currently create `hv_evidence` in the same operation. Wave 1 does not route new sources through that artifact-only behavior and does not remove or rewrite it because its consumers require a separate reconciliation and regression gate.

### Why the fetcher changed

Before Wave 1, `source-engine-fetch` treated a JSON API response like generic text/HTML. Large API responses therefore became one opaque snapshot and were truncated to the page-text cap. That is not acceptable evidence capture for registry, enforcement, clinical, tender, customs, corporate, or other structured datasets.

Wave 1 adds a reusable structured JSON parser. Registry metadata defines:

- `records_path`
- `identity_path`
- `title_path`
- optional `url_path`
- optional `record_url_template`
- `max_records`

Each API record becomes a stable independent `source_snapshot`. Hash/dedup therefore operates at record level, and the existing `hv-extract → hv_import_staging → hv_artifacts + hv_evidence` chain remains unchanged.

## Wave 1 sources

### SX-0005 — ClinicalTrials.gov API

Existing production row ID: `f1eba08c-6704-484c-b6c4-d9d6a452e9c3`.

Change:

- use `/api/v2/studies` instead of treating JSON as HTML;
- query cannabis/cannabidiol/cannabinoid/marijuana;
- daily cadence;
- one snapshot per `NCTId`;
- canonical record URL uses `https://clinicaltrials.gov/study/{NCTId}`;
- source class changes from generic trade/market metadata to scientific registry metadata.

Events: trial start, trial status change, trial completion, trial results.

### SX-0056 — Federal Register API

Existing production row ID: `ea49c5e6-5bb0-4080-a66e-fe42d1f7034f`.

Change:

- replace inactive HTML search with `api/v1/documents.json`;
- activate as crawlable structured source;
- one snapshot per `document_number`;
- preserve record-specific FederalRegister.gov URL;
- tag downstream evidence to verify legal reliance against the official govinfo edition.

Events: proposed rule, final rule, notice, hearing, effective-date change.

### SX-0054 — FDA recall / enforcement

Adds two child feeds under one workbook source:

1. openFDA drug enforcement records;
2. openFDA food enforcement records.

Both use FDA Recall Enterprise System data and produce stable per-recall snapshots keyed by `recall_number`.

Events: recall, market withdrawal, quality defect, enforcement.

## Deferred high-priority sources

Wave 1 intentionally does not implement the other P0/P1 records yet. Examples include SEC EDGAR entity feeds, TED procurement, customs datasets, GMP/GDP registries and licence systems that require issuer/entity resolution, POST/search APIs, pagination/backfill strategy, JS/browser interaction, downloadable-file handling, or specific legal/access treatment. They remain in the 518-record universe and implementation backlog.

## Verification contract

### Static / CI

`Source Expansion Wave 1` must pass:

```bash
deno test supabase/functions/_shared/structured-json.test.ts
deno check supabase/functions/source-engine-fetch/index.ts
```

The workflow also asserts that all three workbook control IDs are present in the migration and that four structured API rows are configured.

### Migration assertions

The migration fails if it does not produce exactly four active, crawlable, `adapter='api'`, `structured_fetch=true` source rows tied to SX-0005 / SX-0054 / SX-0056.

### Production-safe post-deployment proof

Do not count a source as CURRENTLY INGESTED until all of the following are observed:

1. registry row active with intended URL/metadata;
2. successful source check;
3. independent record-level `source_snapshots` created;
4. duplicate run does not reinsert unchanged records;
5. at least one relevant record progresses through `hv-extract` into `hv_import_staging`, or is truthfully rejected/skipped by relevance logic;
6. a promoted relevant record creates both `hv_artifacts` and linked `hv_evidence`;
7. evidence retains source URL, source ID, capture time and content hash;
8. no private evidence/provenance is exposed on public routes.

## Production state

No production database row, Edge Function, cron, secret, deployment, source configuration, evidence row, artifact, or signal was changed while preparing this branch.
