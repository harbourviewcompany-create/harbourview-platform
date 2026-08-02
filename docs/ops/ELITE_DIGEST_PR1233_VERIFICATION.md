# Elite Digest PR #1233 verification scope

This documentation-only release-control change was rebuilt from current `main`.
It does not apply a migration, read or write a secret, create a deployment, or
move a production alias.

Merge verification requires:

- unique local versions for the seven listed Elite Digest migrations;
- migration and environment-name verification before deployment aliasing;
- an immutable unaliased deployment through smoke verification;
- production alias movement only after the database, environment, deployment,
  and authenticated smoke gates pass;
- the repository CI, typecheck, migration-drift, public-surface, regulatory
  signal, branch-verification, and registry-discipline workflows to pass.


## Database-adjacent verification

Renaming the HNSW restoration migration can cause the sanctioned migration
workflow to reconcile that version. Merge therefore requires the dedicated
PostgreSQL 17 + pgvector fixture to compile the migration, inspect the installed
function definition, and roll the fixture transaction back. The migration body
remains a `CREATE OR REPLACE FUNCTION`; rollback in a live environment is a
reviewed forward migration restoring the previous known-good body, not deletion
of migration history.
