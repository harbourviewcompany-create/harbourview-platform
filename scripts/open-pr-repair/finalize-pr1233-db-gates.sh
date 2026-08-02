#!/usr/bin/env bash
set -euo pipefail

target=codex/complete-elite-digest-deploy-verification
expected=847d2668398453a9ed94896faaad4a3da1c06c16

git fetch origin main "$target"
actual=$(git rev-parse "origin/$target")
[[ "$actual" == "$expected" ]] || { echo "PR 1233 head moved: $actual" >&2; exit 1; }
git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" "origin/$target"

python3 - <<'PY'
from pathlib import Path

p = Path('docs/ops/ELITE_DIGEST_DEPLOY.md')
s = p.read_text()
s = s.replace(
    '3. Mark one item **Useful** → row in `signal_relevance_feedback`\n4. `GET /api/admin/intelligence-health` includes `product_outcome`',
    '''3. Choose a designated release-verification signal and record its `signal_id`, the\n   authenticated verifier `user_id`, and the UTC start timestamp. Mark it **Useful**,\n   capture the exact inserted `signal_relevance_feedback.id`, verify the UI response,\n   then delete that exact row through the authorized admin path before ending the\n   smoke. Confirm the captured ID no longer exists so release verification cannot\n   bias digest ranking for 90 days.\n4. `GET /api/admin/intelligence-health` includes `product_outcome`''',
)
p.write_text(s)

p = Path('docs/ops/ELITE_DIGEST_PR1233_VERIFICATION.md')
s = p.read_text()
s += '''\n\n## Database-adjacent verification\n\nRenaming the HNSW restoration migration can cause the sanctioned migration\nworkflow to reconcile that version. Merge therefore requires the dedicated\nPostgreSQL 17 + pgvector fixture to compile the migration, inspect the installed\nfunction definition, and roll the fixture transaction back. The migration body\nremains a `CREATE OR REPLACE FUNCTION`; rollback in a live environment is a\nreviewed forward migration restoring the previous known-good body, not deletion\nof migration history.\n'''
p.write_text(s)

p = Path('docs/control/EVIDENCE_LOG.md')
s = p.read_text()
header = '| Date | Check | Command / source | Result | Link / artifact | Status |\n|---|---|---|---|---|---|\n'
row = '| 2026-08-02 | PR #1233 Elite Digest release-control and HNSW migration-version repair | PostgreSQL 17 + pgvector dry-run; lint; typecheck; tests; build; migration-version checks | Unique HNSW version `20260802073000`; migration compiles and preserves HNSW `ORDER BY <=> LIMIT`; smoke feedback requires exact-row cleanup; no live migration or alias action performed | PR #1233 and `PR 1233 HNSW Migration Dry Run` workflow | Current — merge gate |\n'
if row not in s:
    if header not in s:
        raise SystemExit('Build Evidence table header not found')
    s = s.replace(header, header + row, 1)
s += '''\n\n## 2026-08-02 — PR #1233 final database-adjacent gates\n\n- Classified the HNSW migration rename as database-adjacent because the\n  `supabase/migrations/**` workflow may reconcile its unique version.\n- Added a PostgreSQL 17 + pgvector fixture that creates representative signals\n  storage and HNSW index, applies the migration, verifies the installed function\n  retains `ORDER BY <=>` plus bounded-neighbour `LIMIT`, and rolls the fixture\n  transaction back.\n- Updated the product smoke to capture and delete its exact feedback row before\n  release verification ends, preventing a 90-day ranking bias.\n- No production migration, database write, secret read, deployment, or alias\n  mutation occurred during this PR repair.\n'''
p.write_text(s)
PY

cat >> docs/control/DATABASE_CONTROL.md <<'EOF'

## 2026-08-02 — PR #1233 HNSW deduplication migration version repair

- Migration: `20260802073000_hv_dedup_assign_restore_hnsw_knn.sql`.
- Purpose: preserve the production-verified HNSW k-nearest-neighbour form of
  `public.hv_dedup_assign(double precision, integer)` after the older timeout
  migration, while assigning a version unique from feedback ranking and signal
  role-family routing.
- Scope: `CREATE OR REPLACE FUNCTION` plus function comment only. No table,
  column, policy, grant, data backfill, or index creation is included.
- Validation: `tests/sql/pr1233_hnsw_migration_dry_run.sql` runs against
  PostgreSQL 17 with pgvector, creates representative `signals` columns and an
  HNSW cosine index, applies the migration, checks function ownership/security
  attributes and confirms the body contains the bounded `ORDER BY <=> LIMIT`
  index-probe shape, then rolls back the fixture transaction.
- Production application: only through the sanctioned migration workflow after
  remote-ledger reconciliation. The checklist remains HOLD until live function
  definition and execution evidence are recorded.
- Rollback: never delete an applied ledger version. Ship a reviewed forward
  migration restoring the previous known-good `hv_dedup_assign` body if the new
  definition fails production verification.
EOF

mkdir -p tests/sql
cat > tests/sql/pr1233_hnsw_migration_dry_run.sql <<'SQL'
\set ON_ERROR_STOP on
begin;
create extension if not exists vector;
create table public.signals (
  id text primary key,
  embedding_1024 vector(1024),
  created_at timestamptz not null default now(),
  quality_confidence numeric,
  cluster_rep_id text,
  is_representative boolean
);
create index idx_signals_embedding_1024_hnsw
  on public.signals using hnsw (embedding_1024 vector_cosine_ops);
\ir ../../supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql

do $verify$
declare
  definition text;
  proc_security boolean;
begin
  select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure),
         p.prosecdef
    into definition, proc_security
  from pg_proc p
  where p.oid = 'public.hv_dedup_assign(double precision,integer)'::regprocedure;

  if proc_security is distinct from true then
    raise exception 'hv_dedup_assign must remain SECURITY DEFINER';
  end if;
  if position('order by t.embedding_1024 <=> b.embedding_1024' in lower(definition)) = 0 then
    raise exception 'HNSW k-NN ORDER BY shape missing';
  end if;
  if position('limit c_neighbours' in lower(definition)) = 0 then
    raise exception 'bounded-neighbour LIMIT missing';
  end if;
  if position('where (1 - (a <=> b))' in lower(definition)) > 0 then
    raise exception 'superseded sequential-scan threshold form returned';
  end if;
end
$verify$;
rollback;
SQL

git diff --check
git add -A
git commit -m 'docs: add HNSW migration and smoke-cleanup gates'
git push --force-with-lease=refs/heads/$target:$expected origin HEAD:refs/heads/$target
