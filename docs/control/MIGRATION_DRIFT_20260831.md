# Migration Drift — Full Current State, 2026-08-31

Source SHA: `6b84da34dd3e04fdce783858623882f4cdac045b` (includes the 3-file
rename in this same PR)

Supersedes `docs/control/MIGRATION_DRIFT_20260830.md`, which flagged 2
versions and is now stale — 20 more have appeared since. Not deleting that
doc; its findings for `20260830140000` and `20260830141000` are still
accurate and still open. This doc is the current full picture.

## What's been reconciled since 2026-08-30

Three versions, via pure filename rename (git mv, 0 content changes, no
live mutation), same pattern as PR #1701:

```text
20260830203038  fix_daily_digest_provider_health_durability
20260831021320  daily_digest_manual_fallback
20260831021633  daily_digest_manual_fallback_content_quality
```

`fix_daily_digest_provider_health_durability` was spot-verified against
live schema before renaming (confirmed the exact durability-fix line
present in `run_daily_digest()`'s live definition). The other two were
not independently schema-verified the same way — included on the strength
of detailed, internally consistent migration content (references a real
Aug 28–30 digest outage, coherent bug/fix narrative across the pair), which
is a lower confidence bar than a direct schema check. Noting the
difference rather than presenting all three as equally certain.

## What remains open

18 live-only versions, in three loose clusters by apparent subject. Naming
suggests three separate bodies of work, none with any git trace:

**Regulatory tier / market access (6 versions, 2026-08-30 18:44–19:30)**
```text
20260830184434  resync_market_access_status_from_regulatory_tier
20260830185137  fix_regulatory_tier_rationale_mismatches
20260830191900  fix_market_access_status_trigger_type_resolution
20260830192000  regulatory_tier_authority_write_guard
20260830193000  fix_regulatory_tier_guard_transaction_timestamp
20260831001235  sync_legacy_status_after_medical_reclass
```

**RLS policy consolidation (6 versions, 2026-08-31 01:14–01:26)**
```text
20260831011430  fix_dashboard_prefs_update_policy_initplan
20260831011731  merge_signals_public_select_policies
20260831011752  drop_redundant_signals_admin_operator_policy
20260831012629  consolidate_redundant_rls_policies_batch1
20260831020104  resolve_supply_view_conflict_decouple_from_marketplace_contract_v2
20260831021727  daily_digest_use_smart_truncate
```

**Second RLS consolidation pass (6 versions, 2026-08-31 11:52–11:59)**
```text
20260831115225  split_transaction_role_all_policies_into_percommand
20260831115343  split_hv_staff_org_all_policies_into_percommand
20260831115509  split_genetics_cultivar_all_policies_into_percommand
20260831115538  merge_genetics_cultivar_owner_public_policies
20260831115604  merge_remaining_genetics_ia_hv_policies
20260831115940  final_rls_consolidation_pass
```

Plus the 2 already flagged in the 2026-08-30 doc, still open:

```text
20260830140000  full_regulatory_tier_coverage
20260830141000  subnational_regulatory_tier_evidence_alignment
```

## What was checked, and what wasn't

- `pg_stat_statements` (enabled on this project): searched for text
  matching the RLS-consolidation batch (`split_transaction_role`,
  `final_rls_consolidation`, and generic `create/alter/drop policy`
  patterns). Found nothing matching this batch specifically — either the
  buffer has rotated past these (queries ran hours before the check), or
  they were executed via dynamic SQL (a `DO` block building `CREATE
  POLICY`/`DROP POLICY` statements as strings and `EXECUTE`-ing them,
  plausible given the naming pattern — "split ... into per-command",
  "merge ... policies" reads like a templated/programmatic rewrite, not
  hand-written DDL), which `pg_stat_statements` would record as the outer
  `EXECUTE`/`DO` text rather than the generated statements themselves.
- Column-level schema diff was not performed for the regulatory-tier or
  second-RLS-pass clusters (was done, and found no new columns, for the
  two versions already covered by the 2026-08-30 doc). Not repeated here
  for all 18 given the volume; would need to be done per-version by
  whoever picks this up.
- No repository migration file, `migration-live-version-equivalences.json`
  entry, or `historical-remote-migration-attestations.json` entry has been
  written for any of these 18. Per the same disposition rule as the
  2026-08-30 doc ("never manufacture SQL from current schema state" —
  `MIGRATION_DRIFT_RECONCILIATION_20260810.md` rule 1), none of them have
  recoverable provenance from this session.

## Why this keeps growing

Directly observed, not inferred: between the 2026-08-30 doc (2 versions)
and this one (20 versions total, 18 still open), live drift grew roughly
10x in about 24 hours, continuing to accumulate during the same session
that was investigating it. `scripts/notify-new-migration-drift.mjs` /
`.github/workflows/migration-drift-check.yml` (added in #1705, fixed in
#1722) exists specifically so this stops requiring a human or agent to
notice and manually compile a doc like this one each time — but it can
only notify going forward from whatever the baseline is set to. It cannot
retroactively cover this backlog without the same "no fabrication" limit
this doc is already respecting, and `migration-drift-watch-baseline.json`
has deliberately not been bumped past any of this backlog (see the commit
that added the 3 renames above) — bumping it would silence drift-watch
for these 18 without reconciling anything.

## Disposition needed

Same three options as the 2026-08-30 doc, per version or per cluster:

1. Exact live provenance recovered (who/what applied it, from Supabase
   project activity logs or the operator's own record) → write the
   canonical repository migration file at the matching version, or
2. If provenance is unrecoverable but content can be confirmed safe via a
   full schema/data diff → add a reviewed
   `migration-live-version-equivalences.json` or
   `historical-remote-migration-attestations.json` entry with a real
   `statement_sha256`, or
3. Explicit owner decision to accept as an unattributed historical gap.

This document does not authorize applying, reverting, repairing,
stamping, deleting, renaming, or otherwise changing the live migration
ledger for any of the 18 open versions, and performs none of those
actions itself.

## Status: 3 reconciled, 18 open, growing faster than manual sweeps close it

The "Compare repository and live migration ledgers" required check will
remain red until every one of the 18 is resolved via one of the three
options above — there is no partial-credit or baseline mechanism in that
check itself. This is a known, current, and accurately-represented state,
not a gap in this investigation.
