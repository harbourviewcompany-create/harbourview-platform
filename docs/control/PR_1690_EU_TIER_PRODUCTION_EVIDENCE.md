# PR #1690 — Europe Regulatory Tier Production Evidence

## Scope

This evidence records the current accepted production state for the Europe-focused regulatory-tier reconciliation represented by `supabase/migrations/20260829160000_fix_europe_regulatory_tiers.sql`.

Production project: `zvxdgdkukjrrwamdpqrg`

Original Europe correction actor: `ops-eu`

Original Europe correction timestamp: `2026-08-29 16:07:01.537396+00`

Current accepted production state source: PR #1690 production application and follow-up ledger reconciliation after `20260829120000_live_tier_pipeline_hardening.sql` and `20260829130000_tier_optimization_batch2.sql` were applied.

## Production audit evidence

`public.regulatory_tier_audit` contains one contiguous 30-row `ops-eu` batch with audit IDs **76 through 105**, inclusive. That batch is preserved as historical evidence that the Europe correction was performed before `20260829160000_fix_europe_regulatory_tiers.sql` was registered in the repository.

A later PR #1690 production application updated some rationales and the Luxembourg tier through the approved audited setter path. The repository migration now represents the **current accepted production state**, not the superseded raw `ops-eu` text values.

## Current accepted Europe state

The current accepted production grouping represented by `20260829160000_fix_europe_regulatory_tiers.sql` is:

- Domestic only: NL, ES, MT
- Legal commercial access: LU, PT, IL
- Medical limited trade: DE, FR, IT, GB, IE, AT, BE, CH, DK, SE, NO, FI, PL, CZ, GR, HR, SI, SK, HU, BG, RS
- CBD/hemp only: TR, UA, RO

The Luxembourg state is intentionally `legal_commercial_access` with rationale `Legend: lawful cross-border commercial pathway in operation` because that is the current accepted production state after the PR #1690 hardening and batch application.

## Replay / idempotency contract

The repository migration is intentionally release-safe against the current accepted production state. For each accepted jurisdiction it skips the call to `api.set_regulatory_tier` when all of the following already match:

1. accepted `regulatory_tier`;
2. `regulatory_tier_origin = 'override'`;
3. `regulatory_tier_needs_review = false`;
4. accepted production rationale text.

The required preflight for ledger registration is:

```text
expected_rows = 30
exact_skip_rows = 30
non_matching_rows = 0
tier_mismatch_rows = 0
rationale_only_mismatch_rows = 0
```

This prevents a later repository replay against the accepted production database from adding duplicate `ops-eu` audit rows or changing operational tier data, while still repairing a missing or drifted approved override on a fresh or divergent environment.

## Future reclassification safety

`api.reclassify_auto_tiers` is defined by `20260829120000_live_tier_pipeline_hardening.sql` to iterate only rows where `regulatory_tier_origin = 'auto'` or the origin is null. The Europe reconciliation writes through `api.set_regulatory_tier`, which sets the origin to `override`.

Therefore the accepted Europe overrides are excluded from subsequent automatic reclassification unless an operator explicitly changes their origin or performs another reviewed override.

## Production ledger handling

The first two PR #1690 migrations are now represented in production with canonical versions:

- `20260829120000` / `live_tier_pipeline_hardening`
- `20260829130000` / `tier_optimization_batch2`

`20260829160000_fix_europe_regulatory_tiers.sql` must not be registered or executed until read-only preflight proves the 30-row skip contract above. When the skip contract is green, controlled activation may register/apply the exact version without changing operational tier data.
