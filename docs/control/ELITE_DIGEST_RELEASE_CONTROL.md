# Elite Digest release control

Status: **HOLD until the fail-closed production preflight returns GO and the operator explicitly selects `APPLY_PRODUCTION_MIGRATIONS`.**

Source baseline: `d2e03cb13b61da12d37e0ed128032242570963fb`.

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

Each entry binds the version, exact filename and Git blob SHA. A filename reuse,
content change, missing file or duplicate pending version fails the activation
preflight.

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
- each approved filename and Git blob SHA matches the control file;
- no pending version has multiple migration files;
- no invalid migration filename exists.

Any unrelated pending migration causes HOLD. The manifest is emitted as JSON and
Markdown and retained as workflow evidence.

## Manual production workflow

`.github/workflows/supabase-migrate.yml` remains manual-dispatch only. The default
input is `HOLD`. The write job runs only when the operator explicitly selects
`APPLY_PRODUCTION_MIGRATIONS`, the workflow is dispatched from `main`, and the
read-only preflight succeeds.

The workflow intentionally has `contents: read`; it cannot auto-generate migration
stubs, commit reconciliation files or push to `main`.

Immediately before `supabase db push --include-all`, the workflow regenerates the
manifest against the live ledger. `--include-all` is required because the first
approved forward migration sorts before newer remote history. It is safe only
after the exact-set gate proves that no other repository migration is pending.

## Read-only evidence packet

Preflight evidence:

```text
tests/sql/elite_digest_production_preflight_read_only.sql
```

It verifies the first six Elite Digest migrations, confirms the approved three are
unapplied, checks PostgreSQL/pgvector/schema/function prerequisites, rejects
feedback duplicates and captures grants, policies, indexes, function definitions,
definition hashes, ACLs and the feedback-content fingerprint needed for a
rollback-forward review.

Postflight evidence:

```text
tests/sql/elite_digest_production_postflight_read_only.sql
```

It verifies exact ledger names, RPC existence and grants, direct-table denial,
service-role access, HNSW function shape, the unique current-verdict index and
feedback integrity. The workflow compares the preflight and postflight feedback
fingerprints and fails if any stored feedback changes.

Both SQL packets use read-only transactions. They do not invoke the Digest runner,
dedup assignment or feedback writer.

## Rollback-forward control

Do not delete migration ledger rows and do not rewrite an applied migration.
Preserve the preflight artifact containing:

- exact migration ledger;
- feedback row count and content fingerprint;
- table ACL, RLS state and policies;
- relevant indexes and constraints;
- function definitions, owners, search paths, ACLs and definition hashes.

If activation fails, create a new uniquely versioned forward repair that restores
only the reviewed prior contract. Do not restore the superseded sequential-scan
dedup implementation, reopen direct client feedback-table access or delete
operator feedback.

## Current production posture

The August 2, 2026 read-only preflight found the Elite Digest schema and data
prerequisites ready, with zero feedback rows and zero duplicate user/signal
groups. It also found unrelated repository migrations pending outside this
allowlist. Production activation therefore remains HOLD until the generated
manifest proves that the complete pending set is exactly the approved sequence.
