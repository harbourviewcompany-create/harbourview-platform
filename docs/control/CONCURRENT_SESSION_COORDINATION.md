# Concurrent-Session Coordination: MCP Schema Changes

Status: proposed convention, effective immediately. Filed after a real incident, 2026-07-26.

## What happened

At least two concurrent Claude sessions were working against this same Supabase project at
once. Both applied real, legitimate SQL directly via MCP (`execute_sql` / the equivalent
Supabase MCP tool) without committing a matching file to `supabase/migrations/` in the same
turn. Six migrations accumulated as drift -- live in the database, invisible in git -- over
roughly 36 hours, triggering `.github/workflows/migration-drift-check.yml` and blocking every
PR in the repo, including one from a completely unrelated task.

While reconciling that drift, a second collision happened: two sessions independently wrote the
*same* reconciliation migration files at the same time, causing a merge conflict on an otherwise
uncontroversial docs-only PR.

Neither collision was caused by bad intent or bad SQL -- both sessions did correct, well-reasoned
work. The failure mode is purely about sequencing: two agents touching the same live database
with no visibility into each other's in-flight changes.

## The convention

**Any session applying DDL or data changes via Supabase MCP commits a matching file to
`supabase/migrations/` in the same turn -- not "later," not "at the end of the session."**
A raw `execute_sql` call and its migration file should never be more than a few tool calls apart.
This isn't new policy -- `.github/workflows/migration-drift-check.yml` already enforces exactly
this -- but it's worth stating as an explicit rule rather than something a session only discovers
when the CI check fails.

Corollary: **before writing a new migration file, check `supabase/migrations/` for a filename
you're about to reuse or a timestamp very close to "now."** If something with a near-identical
name or purpose already exists, another session likely already did this work -- read it first
instead of duplicating it.

## If you hit drift anyway

Don't guess at reconstruction. `supabase_migrations.schema_migrations` stores the exact
`statements` that were applied (and `created_by`) -- pull the real SQL from there verbatim rather
than reconstructing from memory or intent. See `docs/control/DATA_INTEGRITY_JURISDICTION_FINDINGS.md`
for a worked example of doing this reconciliation.
