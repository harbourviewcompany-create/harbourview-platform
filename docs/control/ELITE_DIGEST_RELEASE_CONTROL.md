# Elite Digest release control

Status: **HOLD until the fail-closed production preflight returns GO, the operator explicitly selects `APPLY_PRODUCTION_MIGRATIONS`, and the protected `production-database` environment receives its independent approval.**

Source baseline for this release-control review: `d2e03cb13b61da12d37e0ed128032242570963fb`. This is audit metadata, not an activation-SHA lock; production activation must run from the then-current reviewed `main` commit.

## Approved production migration allowlist

Only this exact ordered sequence is approved by this release control:

```text
20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
20260802152500_signal_feedback_api_rpcs.sql
20260802163000_elite_digest_rpc_boundary_hardening.sql
```

The allowlist is machine-readable in:

```text
supabase/release-controls/elite-digest-production-activation.json
```

Each entry must bind the version, exact filename and Git blob SHA. A missing hash,
filename reuse, content change, missing file or duplicate pending version fails the
activation preflight.

## Fail-closed repository-versus-live manifest

`scripts/migration-ledger-manifest.mjs` reads:

1. the complete repository migration directory;
2. the linked Supabase migration-list output;
3. the approved release-control file.

It accepts both ASCII `|` and box-drawing `│` Supabase CLI tables. A nonempty
linked-project result that parses to zero migration rows or zero remote versions
is an error rather than a false green.

The activation preflight returns GO only when all conditions are true:

- no live migration version is missing from the repository;
- the complete repository-only pending set is exactly the three approved versions;
- none of the approved versions is already applied;
- the approved versions are in the documented order;
- each approved filename and mandatory Git blob SHA matches the control file;
- no pending version has multiple migration files;
- no invalid migration filename exists.

Any unrelated pending migration causes HOLD. The manifest is emitted as JSON and
Markdown and retained as workflow evidence.

## Manual production workflow

`.github/workflows/supabase-migrate.yml` remains manual-dispatch only. The default
input is `HOLD`. The write job runs only when the operator explicitly selects
`APPLY_PRODUCTION_MIGRATIONS`, the workflow is dispatched from `main`, the
read-only preflight succeeds, and the `production-database` GitHub environment is
approved.

Configure `production-database` with required reviewers and a `main` deployment
branch restriction before activation. The environment approval is a separate
control from the dispatcher's input. Until that repository setting is verified,
production activation remains HOLD.

The workflow intentionally has `contents: read`; it cannot auto-generate migration
stubs, commit reconciliation files or push to `main`. Both migration workflows use
the same explicit project reference, `zvxdgdkukjrrwamdpqrg`.

Immediately before `supabase db push --include-all`, the workflow regenerates the
manifest against the live ledger. `--include-all` is required because the first
approved forward migration sorts before newer remote history. It is safe only
after the exact-set gate proves that no other repository migration is pending.

## Read-only evidence packet

Preflight evidence:

```text
tests/sql/elite_digest_production_preflight_read_only.sql
```

It verifies the exact names of the first six Elite Digest migrations, confirms the
approved three are unapplied, checks PostgreSQL/pgvector/schema/function
prerequisites, rejects feedback duplicates and captures grants, policies, indexes,
function definitions, definition hashes, ACLs and the feedback-content fingerprint
needed for a rollback-forward review.

Postflight evidence:

```text
tests/sql/elite_digest_production_postflight_read_only.sql
```

It verifies exact ledger names, RPC and internal-function existence, RPC grants,
direct-table denial, RLS, service-role access, HNSW function shape, the unique
current-verdict index and feedback integrity. The workflow compares the preflight
and postflight feedback fingerprints and fails if any stored feedback changes.

Run activation in a controlled window with feedback submissions paused. The
fingerprint is intentionally strict: a concurrent legitimate feedback write also
causes HOLD rather than allowing ambiguous data-preservation evidence after the
migration push.

Both SQL packets use read-only transactions. They do not invoke the Digest runner,
dedup assignment or feedback writer. CI executes both packets against a disposable
PostgreSQL 17 + pgvector fixture.

## Rollback-forward control

Do not delete migration ledger rows and do not rewrite an applied migration.
Preflight and activation artifacts are retained for 90 days. Preserve the
preflight artifact containing:

- exact migration ledger;
- feedback row count and content fingerprint;
- table ACL, RLS state and policies;
- relevant indexes and constraints;
- function definitions, owners, search paths, ACLs and definition hashes.

If activation fails after a successful migration push, create a new uniquely
versioned forward repair that restores only the reviewed prior contract. Do not
restore the superseded sequential-scan dedup implementation, reopen direct client
feedback-table access or delete operator feedback. A failure before a successful
push does not itself require a rollback-forward migration.

## Current production posture

The August 2, 2026 read-only preflight found the Elite Digest schema and data
prerequisites ready, with zero feedback rows and zero duplicate user/signal
groups. It also found unrelated repository migrations pending outside this
allowlist. Production activation therefore remains HOLD until the generated
manifest proves that the complete pending set is exactly the approved sequence.
