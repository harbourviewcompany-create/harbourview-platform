# Reconstructed-migration idempotency audit, 2026-08-31

**Status: three confirmed defects, all three now fixed and verified; a
repo-wide heuristic scan flags six more DDL candidates, unverified, plus an
open question about how many other files had a documented manual fix
silently clobbered by a reconstruction re-run (see instance 3). Nothing in
this document has been applied to production.**

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
get further. **Fixed** in PR #1703, but this one is not a fresh idempotency
bug like the first two — it's a **regression**. The companion file,
`20260714120000_create_intel_eval_set_stage0.sql`, already documents the
whole situation in its own header: on 2026-08-05 (commit `3d4041a6 fix(db):
restore intel eval set creator at its replay-correct version`) it was
deliberately edited to hold the real `CREATE TABLE`, with `20260714224152`
intentionally left as a `SELECT 1;` no-op, specifically so replay would find
the table already created before reaching `20260714224152`. A later,
unrelated re-run of `scripts/reconstruct-stub-migrations.mjs` mechanically
reconstructed every remaining `SELECT 1;` placeholder from production's
statement history — including this one — with no awareness that it had been
deliberately left that way for a documented reason, and silently overwrote
the fix with a second, duplicate `CREATE TABLE`. Restored to the no-op, with
a comment pointing back at both the 2026-08-05 fix and this document.
Verified by replaying both files in order against a minimal `signals`-table
fixture: table created once by `20260714120000`, `20260714224152` a true
no-op.

**This changes what the audit is actually for.** It's not only "find files
whose DDL isn't guarded against replay order" — it's also "find files whose
placeholder status was deliberately chosen for a documented reason, and check
whether a later reconstruction re-run silently undid that choice." A `git log
--oneline --all -- <file>` on any reconstructed file showing a `restore ...
for replay` / `restore ... at replay-correct version` commit *older* than the
most recent `reconstruct N placeholder migrations` bulk commit is a candidate
for exactly this regression, independent of whether the current DDL happens
to match one of the three heuristic shapes below. A non-exhaustive scan of
commit history for this pattern turned up several more `restore ... for
replay`-style commits worth checking the same way:
`54407a72 fix(migrations): restore corridor replay seed fidelity`,
`f10a9d37 fix(migrations): restore corridor tables at original replay
version`, `1eedb485 Restore corridor stats functions for replay`,
`f031b255 Restore trajectory and entity foundation for replay`, and
`0cd9af8b fix(migrations): restore production-faithful historical replay
(#1458)` — none of these have been checked against the current file state as
part of this pass; listed here so the next person doesn't have to
re-discover the pattern from scratch.

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

Two separate things need doing, and they don't substitute for each other:

1. **The DDL heuristic candidates.** Full `supabase db reset --local` (or
   equivalent from-scratch replay) is the only check that actually answers
   this — the same tool PR #1423/#1430 used to find the original
   167-placeholder problem. Short of that: work the six-row table above,
   verify each against the actual creating/guarding migration nearby (same
   technique used for the three confirmed fixes — reproduce the specific
   statements against a throwaway local Postgres, not just read the SQL), and
   extend the heuristic script if a fourth non-idempotent shape turns up.

2. **The clobbering question.** For each of the five `restore ... for
   replay`-style commits listed under instance 3, `git log --oneline --all --
   <file>` the file(s) that commit touched and check whether a later
   `reconstruct N placeholder migrations` bulk commit (or a bare re-run of
   `scripts/reconstruct-stub-migrations.mjs` with no distinguishing commit
   message) touched the same file afterward. If so, diff the current content
   against what the restore commit left behind — same shape of check that
   caught instance 3. Structurally, this points at a gap in
   `scripts/reconstruct-stub-migrations.mjs` itself: it has no way to know a
   given placeholder was intentionally left as `SELECT 1;` for a replay
   reason rather than simply not-yet-reconstructed, so it will keep
   re-clobbering any such file every time it's re-run, including the two
   files fixed by this document's own instances 1 and 2 above if that script
   is ever re-run again. Worth a follow-up decision on the script itself
   (e.g., skip files with a leading `-- DO NOT RECONSTRUCT` marker, or check
   for one before overwriting) rather than relying on every future session
   noticing the diff by hand.

## Evidence

See `EVIDENCE_LOG.md` 2026-08-31 entry for the pointer into this file, and
2026-08-14 `HV-PR1430-STUB-RECONSTRUCTION-20260814` for where the underlying
risk was first named.
