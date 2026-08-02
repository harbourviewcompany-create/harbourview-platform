#!/usr/bin/env bash
set -euo pipefail

target=codex/review-harbourview-platform
old=20260731100000_harden_eval_labels_and_alert_delivery
new=20260802080000_harden_eval_labels_and_alert_delivery

git fetch origin main "$target"
git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" "origin/$target"

if [[ -f "supabase/migrations/${old}.sql" ]]; then
  git mv "supabase/migrations/${old}.sql" "supabase/migrations/${new}.sql"
fi

python3 - <<PY
from pathlib import Path
old = '${old}'
new = '${new}'
for root in ['docs', 'tests']:
    for p in Path(root).rglob('*'):
        if p.is_file():
            try:
                s = p.read_text()
            except UnicodeDecodeError:
                continue
            if old in s:
                p.write_text(s.replace(old, new))
p = Path('tests/signals/pipeline-hardening.test.ts')
s = p.read_text()
s = s.replace(
    "expect(migration).toContain(\"v_alert_ids bigint[] := '{}'::bigint[]\")",
    r"expect(migration).toMatch(/v_alert_ids\s+bigint\[\]\s*:=\s*'\{\}'::bigint\[\]/)",
)
p.write_text(s)
PY

cat >> docs/control/EVIDENCE_LOG.md <<'EOF'

### 2026-08-02 — PR #1224 unique migration version follow-up

- Renamed `20260731100000_harden_eval_labels_and_alert_delivery.sql` to
  `20260802080000_harden_eval_labels_and_alert_delivery.sql` because the former
  version was already assigned to the Elite Digest feedback-ranking migration.
- Updated migration-contract, PostgreSQL dry-run, database-control and evidence
  references to the unique version.
- Made the locked-alert-ID declaration assertion whitespace-insensitive.
- Validation required: targeted migration-version uniqueness, signal-quality
  tests, PostgreSQL 17 dry run and the complete PR check set.
EOF

python3 - <<'CHECK'
from pathlib import Path
matches = sorted(p.name for p in Path('supabase/migrations').glob('20260802080000_*.sql'))
assert matches == ['20260802080000_harden_eval_labels_and_alert_delivery.sql'], matches
assert not Path('supabase/migrations/20260731100000_harden_eval_labels_and_alert_delivery.sql').exists()
print('PR 1224 unique migration version check passed')
CHECK

git diff --check
git add -A
git commit -m 'fix: assign pipeline hardening a unique migration version'
git push --force-with-lease=refs/heads/$target:$(git rev-parse origin/$target) origin HEAD:refs/heads/$target
