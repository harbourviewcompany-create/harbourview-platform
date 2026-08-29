# PR #1690 — Europe Regulatory Tier Production Evidence

## Scope

This evidence records the already-applied production correction for the Europe-focused regulatory-tier batch reconciled by `supabase/migrations/20260829160000_fix_europe_regulatory_tiers.sql`.

Production project: `zvxdgdkukjrrwamdpqrg`

Execution actor: `ops-eu`

Execution timestamp: `2026-08-29 16:07:01.537396+00`

## Production audit evidence

`public.regulatory_tier_audit` contains one contiguous 30-row `ops-eu` batch with audit IDs **76 through 105**, inclusive.

The batch covers the exact approved jurisdictions and tier assignments represented in `20260829160000_fix_europe_regulatory_tiers.sql`:

- Domestic only: NL, ES, MT, LU
- Medical limited trade: DE, FR, IT, GB, IE, AT, BE, CH, DK, SE, NO, FI, PL, CZ, GR, HR, SI, SK, HU, BG, RS
- Legal commercial access: PT, IL
- CBD/hemp only: TR, UA, RO

Post-write production verification returned **30 expected / 30 passing**. Each row was `regulatory_tier_origin = 'override'` and `regulatory_tier_needs_review = false` after the correction.

## Replay / idempotency contract

The repository migration is intentionally release-safe against the already-applied production state. For each approved jurisdiction it skips the call to `api.set_regulatory_tier` when all of the following already match:

1. approved `regulatory_tier`;
2. `regulatory_tier_origin = 'override'`;
3. `regulatory_tier_needs_review = false`;
4. approved rationale text.

This prevents a later repository replay against the corrected production database from adding duplicate `ops-eu` audit rows while still repairing a missing or drifted approved override on a fresh or divergent environment.

## Future reclassification safety

`api.reclassify_auto_tiers` is defined by `20260829120000_live_tier_pipeline_hardening.sql` to iterate only rows where `regulatory_tier_origin = 'auto'` or the origin is null. The Europe correction writes through `api.set_regulatory_tier`, which sets the origin to `override`.

Therefore the approved Europe overrides are excluded from subsequent automatic reclassification unless an operator explicitly changes their origin or performs another reviewed override.

## Production ledger handling

The `ops-eu` correction was applied before this repository migration existed, so the production data and audit evidence predate repository registration of migration version `20260829160000`.

Do not blindly execute this migration in production merely to create a ledger entry. The controlled activation path should first verify the exact 30-row approved state and audit evidence, then register the migration version only through the repository's canonical exact-version reconciliation/activation mechanism. The migration body itself is safe to replay because it is idempotent, but ledger reconciliation must preserve canonical migration history rather than manufacturing an alternate timestamp.
