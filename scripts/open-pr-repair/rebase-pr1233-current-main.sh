#!/usr/bin/env bash
set -euo pipefail

target=codex/complete-elite-digest-deploy-verification
new_hnsw=20260802073000_hv_dedup_assign_restore_hnsw_knn.sql

git fetch origin main "$target"
expected=$(git rev-parse "origin/$target")
git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" origin/main

# Preserve the reviewed deployment-control documents from the repaired branch.
git show "origin/$target:docs/ops/ELITE_DIGEST_DEPLOY.md" > docs/ops/ELITE_DIGEST_DEPLOY.md
git show "origin/$target:docs/ops/ELITE_DIGEST_PR1233_VERIFICATION.md" > docs/ops/ELITE_DIGEST_PR1233_VERIFICATION.md

# The HNSW body existed under a colliding version in main. Preserve the body and
# assign a version unique from both Elite Digest and the merged routing spine.
source_path='supabase/migrations/20260731090000_hv_dedup_assign_restore_hnsw_knn.sql'
if git cat-file -e "origin/main:${source_path}" 2>/dev/null; then
  git show "origin/main:${source_path}" > "supabase/migrations/${new_hnsw}"
elif git cat-file -e "origin/$target:supabase/migrations/20260731120000_hv_dedup_assign_restore_hnsw_knn.sql" 2>/dev/null; then
  git show "origin/$target:supabase/migrations/20260731120000_hv_dedup_assign_restore_hnsw_knn.sql" > "supabase/migrations/${new_hnsw}"
else
  echo 'Unable to locate reviewed HNSW migration body' >&2
  exit 1
fi
rm -f supabase/migrations/20260731090000_hv_dedup_assign_restore_hnsw_knn.sql
rm -f supabase/migrations/20260731120000_hv_dedup_assign_restore_hnsw_knn.sql

python3 - <<'PY'
from pathlib import Path
p = Path('docs/ops/ELITE_DIGEST_DEPLOY.md')
s = p.read_text()
for old in [
    '20260731090000_hv_dedup_assign_restore_hnsw_knn.sql',
    '20260731120000_hv_dedup_assign_restore_hnsw_knn.sql',
]:
    s = s.replace(old, '20260802073000_hv_dedup_assign_restore_hnsw_knn.sql')
p.write_text(s)
PY

cat >> docs/control/EVIDENCE_LOG.md <<'EOF'

## 2026-08-02 — PR #1233 current-main rebuild and final migration version

- Rebuilt `codex/complete-elite-digest-deploy-verification` from the latest
  protected `main` after the concurrent #1231 and #1242 merges.
- Preserved the reviewed HNSW migration SQL body and assigned the unique version
  `20260802073000_hv_dedup_assign_restore_hnsw_knn.sql`; removed the colliding
  `20260731090000` and intermediate `20260731120000` filenames.
- Retained the seven-migration prerequisite list, environment-name checks,
  immutable unaliased deployment gate, smoke-verification gate and alias-last
  release order.
- No migration was applied, no secret was read and no deployment alias changed.
- Validation required: migration filename discipline, repository CI, typecheck,
  public-surface checks, regulatory-signal checks and branch verification.
EOF

python3 - <<'CHECK'
from pathlib import Path
migrations = list(Path('supabase/migrations').glob('*.sql'))
versions = {}
for p in migrations:
    version = p.name.split('_', 1)[0]
    versions.setdefault(version, []).append(p.name)
for version in ('20260731090000', '20260731120000', '20260802073000'):
    print(version, versions.get(version, []))
assert versions.get('20260731090000') == ['20260731090000_digest_rank_includes_feedback.sql']
assert versions.get('20260731120000') == ['20260731120000_signal_role_family_routing.sql']
assert versions.get('20260802073000') == ['20260802073000_hv_dedup_assign_restore_hnsw_knn.sql']
CHECK

git diff --check
git add -A
git commit -m 'docs: finalize Elite Digest release prerequisites on current main'
git push --force-with-lease=refs/heads/$target:$expected origin HEAD:refs/heads/$target
