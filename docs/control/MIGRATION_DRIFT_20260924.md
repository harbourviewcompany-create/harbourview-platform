# Migration Drift — 2026-09-24

Source: live read of `supabase_migrations.schema_migrations` on `zvxdgdkukjrrwamdpqrg`
via Supabase MCP, diffed against `supabase/migrations/` on `main` (HEAD `41a444d3`,
"Reconcile live migration drift through 20260918202608").

## How this was scoped

Requested task: "find and fix the migration drift." Before writing or applying
anything, this session read `docs/control/PRODUCTION_MIGRATION_OWNERSHIP_20260916.md`
first. Its hard rule governs this doc:

> No production DDL/DML through ad-hoc SQL, direct Supabase MCP execution, one-off
> psql workflows, or direct migration-history edits. Create and review the migration
> file first, then apply it through the canonical production migration pipeline.

So this pass is read-only against production (one `select get_github_pat()` to clone
the repo, plus `list_migrations`; no `apply_migration` / `execute_sql` DDL or DML was
run). It also did not rename, edit, or restructure any file under `supabase/migrations/`.
An earlier draft of this session renamed the 70 `remote_applied_repair` stub files to
their true live-ledger names and made a handful of related content fixes; that was
reverted (`git checkout -- supabase/migrations/`) once
`supabase/release-controls/migration-live-version-equivalences.json` turned up as the
actual canonical mechanism for exactly that problem (content-bound, git-blob-SHA-pinned
equivalence records — not filename matching). Renaming on top of a system that already
tracks this by blob SHA would have been redundant at best and would have desynced the
equivalences file's `file` fields at worst.

## Method

1. `mcp__Supabase__list_migrations` → 984 live versions.
2. `supabase/migrations/*.sql` on disk → 1093 files, 1093 unique version prefixes.
3. Straight version-set diff: 121 versions in the repo not in the live ledger
   ("committed, not applied"); 12 live versions with no matching repo file.
4. Every `.json` file under `supabase/release-controls/` was scanned for 14-digit
   version references (1017 distinct versions total across 15 files: the decisions
   file, the committed-not-applied baseline, the live-version equivalences registry,
   the historical attestations, the per-release activation files, etc.).
5. Cross-referenced (3) against (4).

## Result: the existing backlog is already tracked; only 4 versions were not

Of the 121 committed-not-applied versions, **117 already appear in one or more
existing control files** — `committed-not-applied-baseline.json` (the pre-gate
backlog freeze), `pending-production-migration-decisions.json` (67 of these are
still open as `requiring_forward_reconciliation`, 8 `separately_authorized`, 5
`obsolete`, 3 `approved`), or `migration-live-version-equivalences.json`. This is
consistent with `PRODUCTION_MIGRATION_OWNERSHIP_20260916.md` and the decisions
file's own `status: "HOLD"` — this is known, open, actively-owned work, not silent
drift, and re-triaging any of those 67 ambiguous items from scratch in this session
(without the original business context) would risk overwriting a considered judgment
with a guess. None of that backlog was touched.

All 12 live-only versions are also already accounted for in existing control files.

**Four repo versions are not referenced anywhere in `supabase/release-controls/`.**
These are new since whatever snapshot last touched those files and are the actual,
previously-unflagged drift this pass found:

| Version | File | What it does |
|---|---|---|
| `20260915050000` | `primary_source_market_access_hardening_registry.sql` | Creates `public.regulatory_market_access_primary_sources` (`create table if not exists`) — additive, idempotent. |
| `20260916220000` | `command_last_viewed_at.sql` | Adds a per-user "last viewed Command" timestamp column to `user_dashboard_preferences` (COMMAND-SURFACE-001). |
| `20260919120000` | `expose_cannabinoid_compounds_api.sql` | `create or replace view api.cannabinoid_compounds` — read-only PostgREST exposure of a table added 2026-09-19. |
| `20260919160000` | `marketplace_inquiry_commercial_outcome.sql` | Adds `commercial_outcome` / `commercial_outcome_reason` columns to `marketplace_inquiries`, guarded by `if to_regclass(...) is null then return`. |

All four are small, additive, idempotent (`if not exists` / `create or replace` /
guarded `do` block), and match code already merged to `main` (e.g. the commercial
outcome column pairs with `feat(marketplace): commercial_outcome won/lost/withdrawn
on inquiries`, commit `78ab25f6`). None drops or alters existing data. This is the
same shape of problem `MIGRATION_DRIFT_2026-08-08.md` and the 2026-09-02 doc both
describe: code merged to `main` whose migration was never pushed through
`supabase-migrate.yml`, which is exactly the precondition that caused the PR #1727
globe outage recorded in `committed-not-applied-baseline.json`.

## What this doc is not

It is not an application of these four migrations. `supabase-migrate.yml` ("Elite
Digest production migration activation") only runs on manual `workflow_dispatch`
with an explicit `APPLY_PRODUCTION_MIGRATIONS` choice, and only against the
migrations listed in `elite-digest-production-activation.json`'s own three-file
allowlist — there is no generic "apply everything pending" path, by design. Adding
these four to that allowlist unilaterally would be scope creep on a control file
that says explicitly "exact three-file allowlist; no expansion." They need their own
reviewed activation, the same way `p0-identity-org-context-activation.json` and
`pr1690-regulatory-tier-activation.json` each cover one release.

## Recommended next step

Human- (or explicitly separately-authorized-agent-) reviewed `workflow_dispatch` of
the production migration path for these four versions specifically, following the
same per-release activation-file pattern as the existing ones — not a bulk pass over
the 67-item open backlog, which needs the original authors' context, not a guess.
