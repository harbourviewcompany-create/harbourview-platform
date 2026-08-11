# Transaction Workbook Import Contract

## Purpose

The completed Cannabis Counterparty & Transaction Closing workbook series is validated workflow evidence and a controlled fixture/import source. It is not automatically authoritative production data.

## Locked fixture universe

| Record family | Expected source count |
|---|---:|
| master records | 165 |
| execution packages | 69 |
| economic accounts | 64 |
| transaction networks | 10 |

These values are stored in `transaction_import_staging.fixture_expected_counts` and verified by repository tests. They are source-universe gates, not expected canonical entity counts.

## Staging flow

```text
XLSX / controlled export
  -> hash workbook
  -> normalize source rows externally
  -> transaction_import_staging
  -> schema/count validation
  -> deterministic identity matching
  -> unresolved/conflict queue
  -> operator review
  -> explicit canonical inserts
```

The migrations do not import the workbook and do not contain production fixture rows.

## Required staging fields

Every staged row carries:

- `import_batch_id`
- `record_kind`
- `source_workbook_hash`
- `source_sheet`
- `source_row_key`
- original normalized `payload`
- expected fixture counts
- validation status
- optional reviewed canonical resolution IDs
- validation errors
- restricted classification
- creator/time

## Record kinds

- `master_record`
- `execution_package`
- `economic_account`
- `transaction_network`

## Unknown preservation

`Unknown`, inaccessible, conflicting or unsupported source values remain unknown during staging. Staging/import code must not synthesize:

- transaction GTV
- close probability
- budget
- inventory
- parent ownership
- licence relationships
- facility relationships
- product/batch identity
- Harbourview revenue

unless evidence in the source or an explicitly linked reviewed source supports the value.

## Identity resolution

One source row does not imply one canonical entity.

A source master row can resolve to:

- an existing entity
- a newly reviewed entity
- unresolved
- conflicted
- rejected

Alias/name similarity alone is not sufficient to auto-merge verified identities when registry/licence/legal evidence conflicts.

## Economic-account rule

Individual entity, licence and facility records remain preserved when consolidated into an economic account. Economic-account membership is temporal and evidence-backed.

## Double-counting rule

The 10 source network records map to `transaction_networks.double_count_key` and do not book GTV by themselves. GTV becomes portfolio-recognizable only through validated non-scenario `transaction_economics_entries` with deterministic recognition keys.

## Import acceptance proof

A controlled import run must report at minimum:

```text
source master records                 165
source execution packages             69
source economic accounts              64
source transaction networks           10
dropped source rows                    0
unsupported inferred values inserted  0
silently collapsed licence rows       0
duplicate economic events booked      0
public leakage regressions             0
```

Canonical entity/product/facility counts are allowed to differ from source row counts because canonicalization is not one-row-in/one-row-out.

## Production gate

No import batch may advance from staging into production canonical tables merely because the schema migration is applied. Canonical import requires a separate reviewed execution/release decision and evidence report.
