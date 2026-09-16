# Production Migration Ownership — 2026-09-16

## Canonical owner

Production schema changes are owned by the repository migration pipeline:

- Migration source of truth: `supabase/migrations/`
- Live ledger: `supabase_migrations.schema_migrations`
- Drift gate: `.github/workflows/migration-drift-check.yml`
- Production activation path: `.github/workflows/supabase-migrate.yml`
- Production deployment must use the protected `production-database` environment and a reviewed `main` commit.

Supabase's current guidance is consistent with this boundary: remote schema changes should go through version-controlled migration files, and production deployment should be coordinated so only one actor runs the migration push at a time. See the Supabase migration documentation.

## Non-canonical paths

Legacy one-off workflows and runbooks that invoke `psql` directly against the production project or manually insert rows into `supabase_migrations.schema_migrations` are not production migration owners. They are historical operational artifacts and must not be used for new schema changes.

Before a legacy activation workflow is re-enabled, its migration must first exist in `supabase/migrations/`, pass the drift gate, and be applied through the canonical production migration workflow.

## Reconciliation rule

When a live version is absent from git:

1. Stop new production migration activity.
2. Recover the authoritative production SQL from `supabase_migrations.schema_migrations`.
3. Restore the exact migration artifact when possible.
4. If the migration is data-specific and cannot safely be reconstructed as a replayable migration, record the limitation explicitly and require an owner decision before treating the repository as fully replayable.
5. Only after the live/repository version sets are reconciled may the production migration pipeline resume.

## Current reconciliation

The 2026-09-13 through 2026-09-16 live migration versions were recovered into this branch from the production migration ledger. The large `20260914192712_market_access_evidence_complete_127` data backfill is intentionally represented as a guarded production-state reconciliation artifact rather than fabricated SQL; its original statements remain authoritative in the production migration ledger. That artifact is therefore **not** considered a complete fresh-environment replay source until its full evidence payload is reconstructed and reviewed.

## Hard rule going forward

**No production DDL/DML through ad-hoc SQL, direct Supabase MCP execution, one-off psql workflows, or direct migration-history edits.** Create and review the migration file first, then apply it through the canonical production migration pipeline.
