# Reconstructed-migration idempotency audit, 2026-08-31

**Status: three confirmed defects, two fixed and verified; a repo-wide heuristic
scan flags six more candidates, unverified. Nothing in this document has been
applied to production.**

## Background

`scripts/reconstruct-stub-migrations.mjs` (added in PR #1430, see
`EVIDENCE_LOG.md` 2026-08-14 `HV-PR1430-STUB-RECONSTRUCTION-20260814`) rewrites
placeholder migrations (`SELECT 1;` stubs, 167 of them at the time) into the
verbatim SQL statements production actually ran, recovered from
`supabase_migrations.schema_migrations`. That entry already flagged the risk in
principle: reconstructed statements are copied from what ran *against
production's state at that historical moment*, not written to be safe against a
from-scratch replay. **165 of the original placeholders have since been
reconstructed** (2 remaining: `20260724000000`, which has no recoverable
statements). This document is the first pass at checking whether that
principled risk has actually manifested, and where.

## Three confirmed instances

All three follow the same shape: a reconstructed file's statement assumes an
object already exists (because it did, in production, at that point in
history), but a clean replay reaches that statement before the object has been
created — either because the creating migration sorts later by filename, or
because the object was already created by an earlier migration and the
reconstructed statement re-creates it unconditionally.

**1. `20260701180751_remote_applied_repair.sql`** — `get_corridor_stats()`
references `public.corridor_processing_times`, which is only created by
`20260701230000_corridor_intelligence_tables_stub.sql` — a **later** filename
that a from-scratch replay applies **after** this one. Postgres validates
referenced relations for `LANGUAGE sql` functions at `CREATE` time, so replay
failed with `relation "public.corridor_processing_times" does not exist`
(42P01). **Fixed** in PR #1703: the repair migration now creates the table
itself, idempotently (`CREATE TABLE IF NOT EXISTS`, schema copied verbatim
from the stub, no seed rows), so it no longer depends on which file runs
first. Verified by replaying both files in filename order against a clean
Postgres 16 database — succeeds, and the stub's own fidelity check (59
processing-time rows, 15 alert rows) still passes.

**2. `20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql`**
— the "Restore missing constraints" section bare-adds four `CHECK`
constraints (`regulatory_signals_slug_not_empty` and three others) that
`20260312000000_regulatory_signals_v1.sql` already defines inline at table
creation. Production genuinely lacked them at the time this file's original
statements ran (hence "restore"); a clean replay starting from v1 already has
them, so `ADD CONSTRAINT` fails with `constraint ... already exists` (42710).
**Fixed** in PR #1703: each of the four now has a `DROP CONSTRAINT IF EXISTS`
guard directly above it, matching the idiom the same file already uses for
the constraints above this section. Verified by replaying v1's table
definition followed by both `..._orphaned_constraint_drift` files — all
statements succeed.

**3. `20260714224152_create_intel_eval_set_stage0.sql`** — bare
`CREATE TABLE public.intel_eval_set`, which a later migration also creates.
Surfaced by PR #1703's Supabase Preview check *after* fixes 1 and 2 let replay
get further. **Not yet fixed** — this is where the fixing stopped, once it
became clear the first two were instances of a repo-wide pattern rather than
isolated bugs, and continuing to patch one-by-one without a scoped survey
risked missing siblings while looking authoritative.

## Repo-wide heuristic scan

A regex sweep of all 165 reconstructed files for the three DDL shapes that
produced the defects above:

- `CREATE TABLE <name>` without `IF NOT EXISTS`
- `ADD CONSTRAINT <name>` with no matching `DROP CONSTRAINT IF EXISTS <name>`
  earlier in the same file
- `CREATE POLICY <name>` with no matching `DROP POLICY IF EXISTS <name>`
  earlier in the same file (same failure class — `duplicate object`, 42710 —
  if a same-named policy already exists)

This is a heuristic over file text, not a replay — it does not know whether
the referenced object is actually created elsewhere before this point, only
that the file itself doesn't guard against that. It will both under- and
over-report. Six files flagged, beyond the three confirmed above:

| File | Flagged pattern |
|---|---|
| `20260702190045_fix_overbroad_public_rls_policies.sql` | 2 unguarded `CREATE POLICY` |
| `20260704171507_fix_genetics_public_visibility.sql` | 5 unguarded `CREATE POLICY` |
| `20260705101423_fix_source_snapshots_missing_columns.sql` | 1 unguarded `ADD CONSTRAINT` |
| `20260716200328_add_capital_markets_deal_tracker.sql` | 5+ unguarded `CREATE POLICY` |
| `20260720090637_jurisdiction_playbooks_timeline_positive_check.sql` | 1 unguarded `ADD CONSTRAINT` |
| `20260720093632_create_education_content_citations.sql` | bare `CREATE TABLE` + 2 unguarded `CREATE POLICY` |

`20260723084446_baseline_hv_intelligence_pipeline.sql` also matched the
`CREATE TABLE` regex but on inspection the match was a `CREATE TABLE IF
NOT EXISTS` split across a line break that the heuristic mis-parsed — false
positive, excluded from the table above. This is a reminder that every row
above needs a human or a real replay to confirm, not just the regex.

## What this is not

This is not a claim that these six are broken, and not a claim that these
165 files are the complete risk surface (the heuristic only catches the three
shapes already seen; a fourth shape — e.g. an unguarded `CREATE INDEX`,
`CREATE TYPE`, or `INSERT` violating a unique constraint added elsewhere —
would not be caught here). It's a scoped starting list for whoever picks this
up next, built from patterns that have already caused three real replay
failures rather than a fresh guess.

## Recommended next step

Full `supabase db reset --local` (or equivalent from-scratch replay) is the
only check that actually answers this — the same tool PR #1423/#1430 used to
find the original 167-placeholder problem. Short of that: work the six-row
table above, verify each against the actual creating/guarding migration nearby
(same technique used for the three confirmed fixes — reproduce the specific
statements against a throwaway local Postgres, not just read the SQL), and
extend the heuristic script if a fourth non-idempotent shape turns up.

## Evidence

See `EVIDENCE_LOG.md` 2026-08-31 entry for the pointer into this file, and
2026-08-14 `HV-PR1430-STUB-RECONSTRUCTION-20260814` for where the underlying
risk was first named.
