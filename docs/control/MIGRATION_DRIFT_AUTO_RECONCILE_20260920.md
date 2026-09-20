# Migration drift auto-reconcile — 2026-09-20

## Problem

`.github/workflows/auto-reconcile-migration-drift.yml` invoked
`scripts/auto-reconcile-migration-drift.mjs`, but that script was missing from
the repository. Scheduled reconciliation could not run; applied-not-committed
versions only surfaced when a human noticed a red drift gate.

## Fix

Added `scripts/auto-reconcile-migration-drift.mjs`:

1. Parse linked `supabase migration list` output
2. Optionally filter historical attestations
3. Build ledger manifest (`applied_not_committed`)
4. Read verbatim `schema_migrations.statements` via `psql`
5. Write repository migration files (no production apply)
6. Emit `artifacts/summary.md` for the auto-PR body

Unit tests: `tests/scripts/auto-reconcile-migration-drift.test.mjs`
(wired into `migration-drift-check.yml`).

## Rules unchanged

- Never invent SQL from current schema state
- Only copy statements already recorded for applied versions
- Auto-PR still requires full CI + review before merge
