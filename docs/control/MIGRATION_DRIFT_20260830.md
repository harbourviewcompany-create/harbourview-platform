# Migration Drift — 2 New Live Versions, 2026-08-30

Source SHA: `56c83fcc3fb1cdd14a0c4a36c21803dee6d67e3e`

## How this was found

Discovered mid-session while investigating and confirming PR #1701 (which correctly
resolved a separate, single-version drift instance: live `20260829181346` vs.
repository `20260830000000`, both `fix_regulatory_signals_missing_grants` — fixed by
renaming the repository file to the live version, no live mutation). While verifying
that fix against a live read of `supabase_migrations.schema_migrations`, two
**additional** versions appeared in the live ledger between one query and the next,
a few minutes apart, with no corresponding repository migration on `main` at
`56c83fc` (current HEAD at time of writing):

```text
20260830140000  full_regulatory_tier_coverage
20260830141000  subnational_regulatory_tier_evidence_alignment
```

This is offered as direct, timestamped evidence of the pattern the 2026-08-10 and
2026-08-08 drift docs already describe: drift is not a fixed backlog, it re-accumulates
continuously because live schema/data changes are still being applied outside the
repository while reconciliation work is in progress.

## What was checked, and what was not

- `information_schema.columns` for `public.countries`, `public.regulatory_tiers`,
  `public.jurisdictions` — no new columns found. Consistent with (but not proof of)
  these being data-only UPDATE/seed migrations, matching the naming pattern of
  numerous already-committed `classify_*` / `seed_*` / `tier_classify_*` migrations
  elsewhere in this ledger.
- `pg_class` / `pg_policies` — not checked for these two specifically (out of scope
  for a read confined to the columns above); no claim is made about RLS or grant
  impact of either version.
- The actual applied SQL/statement text for either version — **not recoverable**.
  `supabase_migrations.schema_migrations` stores `version` and `name` only, not
  statement payloads. Per the existing disposition rule 1 in
  `MIGRATION_DRIFT_RECONCILIATION_20260810.md` ("Never manufacture SQL from current
  schema state"), no repository migration file or `statement_sha256` attestation has
  been written for either version. Both would require either exact provenance from
  whoever/whatever applied them, or a full schema/data diff sufficient to
  reconstruct exact intent — neither was available in this session.

## Disposition needed

Per the same rule set as the 2026-08-10 doc, each version needs one of:

1. Exact live provenance recovered (who/what applied it, from Supabase project
   activity logs or the operator's own record) → write the canonical repository
   migration file at the matching version, or
2. If provenance is unrecoverable but content can be confirmed safe/idempotent via
   full schema diff → add a reviewed `migration-live-version-equivalences.json` or
   `historical-remote-migration-attestations.json` entry with a real
   `statement_sha256` computed from the actual statement text, or
3. If neither is achievable → explicit owner decision to accept as an unattributed
   historical gap (matching the existing 20260730112526 / 20260731090302 pattern
   already attested in `historical-remote-migration-attestations.json` for
   unrelated reasons).

This document does not authorize applying, reverting, repairing, stamping,
deleting, renaming, or otherwise changing the live migration ledger, and performs
none of those actions itself — flag only.

## Status: open, not resolved

No repository or live-ledger change has been made for these two versions. This
document exists so they are not lost track of, given at least one prior drift
episode in this ledger's history reached 52 concurrently-unaccounted versions
before reconciliation.
