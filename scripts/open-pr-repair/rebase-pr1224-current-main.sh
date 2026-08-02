#!/usr/bin/env bash
set -euo pipefail

target=codex/review-harbourview-platform
expected=0009270640093e9cf29521c25b08d578a4051a88

git fetch origin main "$target"
actual=$(git rev-parse "origin/$target")
[[ "$actual" == "$expected" ]] || { echo "PR 1224 head moved: $actual" >&2; exit 1; }
git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" origin/main

# Preserve only the reviewed runtime, migration and test artifacts; rebuild
# package metadata and control records on the current main tree.
for path in \
  scripts/audit-edge-functions.js \
  supabase/migrations/20260802080000_harden_eval_labels_and_alert_delivery.sql \
  tests/signals/pipeline-hardening.test.ts \
  tests/sql/pr1224_pipeline_hardening_dry_run.sql; do
  mkdir -p "$(dirname "$path")"
  git show "origin/$target:$path" > "$path"
done

node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.devDependencies ??= {};
pkg.devDependencies.eslint = '9.39.5';
const routing = 'vitest run tests/signals/routing.test.ts';
if (pkg.scripts?.['test:signal-routing'] && !pkg.scripts.test.includes('test:signal-routing')) {
  pkg.scripts.test = `${pkg.scripts.test} && npm run test:signal-routing`;
}
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
NODE
npm install --package-lock-only --ignore-scripts

cat >> docs/control/DATABASE_CONTROL.md <<'EOF'

## 2026-08-02 — PR #1224 pipeline hardening forward migration

- Migration: `20260802080000_harden_eval_labels_and_alert_delivery.sql`.
- Authorization: direct `api.add_signal_to_eval_set` execution is service-role
  only; signed-in review uses `api.admin_add_signal_to_eval_set`, which requires
  an `admin` or `operator` row in `public.user_roles` and derives audit identity
  from `auth.uid()`.
- Alert delivery: `public.hv_alert_tick()` harvests asynchronous `pg_net`
  responses, marks delivery only after 2xx, stores fixed-category sanitized
  failure metadata, caps retries, and reuses one locked alert-ID set for body
  construction and queuing.
- Validation: PostgreSQL 17 fixture applies the forward migration against
  representative prerequisite objects and asserts grants, role checks,
  delivery success/failure, sanitization, retry state and locked-ID reuse.
- Rollback: use a reviewed forward migration. Do not delete an applied migration
  ledger entry or restore broad authenticated execution.
EOF

cat >> docs/control/EVIDENCE_LOG.md <<'EOF'

## 2026-08-02 — PR #1224 current-main rebuild

- Rebuilt `codex/review-harbourview-platform` from current protected `main` after
  the concurrent routing and grant merges.
- Preserved the reviewed unique migration
  `20260802080000_harden_eval_labels_and_alert_delivery.sql`, PostgreSQL 17
  fixture, contract tests and audit-script main-branch guard.
- Reapplied only the canonical ESLint 9 pin to current package metadata and
  regenerated `package-lock.json`, preserving all scripts and dependencies
  added by intervening merges.
- No production migration or write occurred during branch repair.
- Required evidence: lint, typecheck, tests, build, PostgreSQL 17 migration dry
  run, migration drift, public-surface and regulatory-signal checks.
EOF

python3 - <<'PY'
from pathlib import Path
versions = {}
for p in Path('supabase/migrations').glob('*.sql'):
    versions.setdefault(p.name.split('_', 1)[0], []).append(p.name)
assert versions.get('20260802080000') == ['20260802080000_harden_eval_labels_and_alert_delivery.sql']
assert versions.get('20260731120000') == ['20260731120000_signal_role_family_routing.sql']
PY
node --check scripts/audit-edge-functions.js
git diff --check
git add -A
git commit -m 'fix: rebuild pipeline hardening on current main'
git push --force-with-lease=refs/heads/$target:$expected origin HEAD:refs/heads/$target
