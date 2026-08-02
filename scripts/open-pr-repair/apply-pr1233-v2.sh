#!/usr/bin/env bash
set -euo pipefail
repo=harbourviewcompany-create/harbourview-platform
target=codex/complete-elite-digest-deploy-verification
original=e532ca49c254c3e16202a69e545125dffe841731

git fetch origin main "$target"
git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" origin/main
if ! git cherry-pick "$original"; then
  conflicts=$(git diff --name-only --diff-filter=U)
  if [[ "$conflicts" != "docs/control/EVIDENCE_LOG.md" ]]; then
    echo "Unexpected cherry-pick conflicts: $conflicts" >&2
    exit 1
  fi
  git checkout --ours docs/control/EVIDENCE_LOG.md
  git add docs/control/EVIDENCE_LOG.md
  git cherry-pick --continue
fi

if [[ -f supabase/migrations/20260731090000_hv_dedup_assign_restore_hnsw_knn.sql ]]; then
  git mv supabase/migrations/20260731090000_hv_dedup_assign_restore_hnsw_knn.sql \
    supabase/migrations/20260731120000_hv_dedup_assign_restore_hnsw_knn.sql
fi

python3 - <<'PY'
from pathlib import Path
p = Path('docs/ops/ELITE_DIGEST_DEPLOY.md')
s = p.read_text()
s = s.replace('20260731090000_hv_dedup_assign_restore_hnsw_knn.sql', '20260731120000_hv_dedup_assign_restore_hnsw_knn.sql')
start = s.index('```text\n', s.index('## 1. Apply migrations')) + len('```text\n')
end = s.index('```', start)
list_text = '''20260730230000_elite_digest_from_pipeline_b.sql
20260730233000_intelligence_self_improve_loop.sql
20260731090000_digest_rank_includes_feedback.sql
20260731100000_run_daily_digest_uses_feedback_rank.sql
20260731110000_feedback_service_aggregates.sql
20260731120000_hv_dedup_assign_restore_hnsw_knn.sql
20260731130000_elite_digest_release_hardening.sql
'''
s = s[:start] + list_text + s[end:]
needle = '- [ ] `SUPABASE_SERVICE_ROLE_KEY` present for feedback aggregates + health RPC (live value not verified)\n'
if '`NEXT_PUBLIC_SUPABASE_URL`' not in s:
    s = s.replace(needle, '- [ ] `NEXT_PUBLIC_SUPABASE_URL` for server-side Supabase client construction (live value not verified)\n' + needle)
s = s.replace('After deploy, Vercel cron hits `/api/cron/intelligence-health` every 6h',
              'After deploy, Vercel cron hits `/api/cron/intelligence-health` on the configured daily schedule')
s = s.replace('The repository config schedules `/api/cron/intelligence-health` at\n  `15 */6 * * *`;',
              'The repository config schedules `/api/cron/intelligence-health` at\n  `15 10 * * *`;')
marker = '### Remaining release actions\n\n'
pos = s.index(marker) + len(marker)
new_actions = '''1. Reconcile the seven migration files in section 1 against the target Supabase
   migration ledger. Apply every missing migration through the sanctioned
   migration path in the listed dependency order, and verify the exact function,
   view, grant, and index definitions before any production alias change.
2. Verify the live Vault and Vercel values in section 2 by name only. Do not
   copy secret values into logs, commits, issues, or PRs.
3. Repair or replace the Vercel deployment credential/integration used by the
   release workflow, then create an immutable deployment for a `main` commit
   containing at least `4227d70`. Keep it unaliased until the database and
   environment prerequisites above are verified and the deployment reaches
   `READY`.
4. Run the smoke SQL and authenticated product smoke checks in sections 3 and
   4 against the unaliased deployment. Record sanitized outputs and timestamps
   in the release PR/evidence log.
5. Alias the verified immutable deployment to production only after steps 1-4
   pass, then observe at least one successful Vercel cron invocation of
   `/api/cron/intelligence-health`.
'''
s = s[:pos] + new_actions
s = s.replace('Verify the five migrations in section 1', 'Verify the seven migrations in section 1')
p.write_text(s)
PY

cat >> docs/control/EVIDENCE_LOG.md <<'EOF'

## 2026-08-02 — PR #1233 Elite Digest deployment HOLD reconciliation

- Rebased `codex/complete-elite-digest-deploy-verification` onto current `main`.
- Corrected the deployment prerequisite order: database migrations and live
  environment names must be verified before a production alias is moved.
- Added the release-hardening migration and the HNSW restoration migration to
  the controlled list.
- Renamed the duplicate HNSW migration version from
  `20260731090000_hv_dedup_assign_restore_hnsw_knn.sql` to
  `20260731120000_hv_dedup_assign_restore_hnsw_knn.sql`, preserving its SQL body
  while making both migration bodies independently auditable.
- Added `NEXT_PUBLIC_SUPABASE_URL` to the required environment-name checklist.
- Corrected the health-cron configuration record to the current daily schedule.
- Validation: targeted migration version check, `git diff --check`, and
  repository CI. No migration was applied and no deployment alias changed.
- Rollback: revert this documentation/filename commit. If the newly versioned
  HNSW migration has already been applied, retain the applied ledger entry and
  use a forward migration rather than deleting migration history.
EOF

python3 - <<'CHECK'
from pathlib import Path
files = sorted(p.name for p in Path('supabase/migrations').glob('20260731090000_*.sql'))
assert files == ['20260731090000_digest_rank_includes_feedback.sql'], files
assert Path('supabase/migrations/20260731120000_hv_dedup_assign_restore_hnsw_knn.sql').is_file()
print('PR 1233 targeted migration version check passed')
CHECK
git diff --check
git add -A
git commit -m 'docs: reconcile Elite Digest release prerequisites'
git push --force-with-lease=refs/heads/$target:$(git rev-parse origin/$target) origin HEAD:refs/heads/$target
