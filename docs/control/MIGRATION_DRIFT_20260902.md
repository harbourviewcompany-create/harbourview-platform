# Migration Drift — 2026-09-02

## Summary

This report records recovery of four production-applied migration versions that had no repository file and were not claimed by open PRs #1739/#1740/#1742/#1743. Files are repository records of already-applied production SQL (byte-identical to `supabase_migrations.schema_migrations.statements`). Nothing in this change set is applied to production.

## Versions recovered

| Version | Name |
|---|---|
| 20260901022725 | pin_search_path_on_mutable_functions |
| 20260901024429 | fix_embed_harvest_silent_failure_and_dispatch_starvation |
| 20260902021703 | fix_search_path_regression_missing_extensions_schema |
| 20260902021818 | fix_search_path_quoting_regression |

Each was verified with `md5(statements[1])` against live ledger before write.

## Drift generator

Most drifted versions were applied via Supabase MCP `apply_migration`, which writes production and does not create a repository file. Agent skill guidance previously recommended that path without requiring a paired repo commit. Guidance updated: applying is half the change; repository file required in the same change set.

## Recoverability

`schema_migrations.statements` holds full SQL. Prior claim that applied SQL was "not recoverable" was incorrect. No-fabrication rule is unchanged: reading recorded statements is not fabrication.

## Status after rebase (2026-09-02)

These four version files are already present on `main` via #1740 reconstruction. This PR retains documentation, skill/AGENTS discipline updates, and this control report so the drift generator lesson and verification trail remain in-tree.
