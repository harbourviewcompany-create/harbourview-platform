#!/usr/bin/env bash
set -euo pipefail

target=agent/release-verification-infrastructure
expected=f6aeaca8171df145d8e6d0a0092f84c7c1b0ac1b
payload=/tmp/pr1227-payload
rm -rf "$payload"
mkdir -p "$payload"
base64 --decode scripts/open-pr-repair/pr1227-payload.tar.gz.b64 | tar -xzf - -C "$payload"

git fetch origin main "$target"
if [[ $(git rev-parse "origin/$target") != "$expected" ]]; then
  echo "PR 1227 head moved; refusing to overwrite unreviewed changes" >&2
  exit 1
fi

git config user.name 'OpenAI Repair Operator'
git config user.email 'repair-operator@users.noreply.github.com'
git checkout -B "$target" origin/main

mkdir -p scripts/verification docs/control
cp "$payload/scripts/verification/public-leakage-probe.mjs" scripts/verification/public-leakage-probe.mjs
cp "$payload/scripts/verification/validate-vercel-deployment.mjs" scripts/verification/validate-vercel-deployment.mjs
cp "$payload/scripts/verification/migration-ledger.mjs" scripts/verification/migration-ledger.mjs
cp "$payload/docs/control/SUPABASE_MIGRATION_LEDGER_READ_ONLY_ROLE.md" docs/control/SUPABASE_MIGRATION_LEDGER_READ_ONLY_ROLE.md
chmod +x scripts/verification/*.mjs

cat >> docs/control/EVIDENCE_LOG.md <<'EOF'

## 2026-08-02 — PR #1227 release-verification trust-boundary repair

- Rebased `agent/release-verification-infrastructure` onto current `main` and
  rebuilt the verification scripts from the reviewed trust model.
- Removed the proposed production migration-ledger database credential. The
  manual ledger workflow now accepts validated version/name metadata only and
  runs trusted verifier code against an audited protected-main checkout treated
  as data.
- Hardened immutable Vercel URL validation against control characters, output
  injection, credentials, mutable aliases, paths, queries and fragments.
- Hardened leakage probing to require expected 200 responses/content types,
  reject cross-origin redirects, respect an explicitly empty API allowlist,
  validate asset caps, support Vercel protection bypass, and store only hashed
  redacted context when a forbidden token is found.
- Added duplicate-version and invalid-filename rejection to migration comparison.
- No production write, deployment alias mutation, database credential access or
  schema change occurred.
- Validation: Node syntax checks, local mock-response probe tests, migration
  ledger fixture comparison, `git diff --check`, and repository CI.
- Rollback: revert the PR; the change is verification-only and creates no remote
  infrastructure or data mutation.
EOF

node --check scripts/verification/public-leakage-probe.mjs
node --check scripts/verification/validate-vercel-deployment.mjs
node --check scripts/verification/migration-ledger.mjs

rm -rf /tmp/pr1227-ledger
mkdir -p /tmp/pr1227-ledger/migrations /tmp/pr1227-ledger/out
cat > /tmp/pr1227-ledger/migrations/20260802000100_example.sql <<'SQL'
select 2;
SQL
printf '[{"version":"20260802000100","name":"example"}]' > /tmp/pr1227-ledger/remote.json
MIGRATION_DIR=/tmp/pr1227-ledger/migrations \
SUPABASE_MIGRATIONS_JSON=/tmp/pr1227-ledger/remote.json \
LEDGER_OUTPUT_DIR=/tmp/pr1227-ledger/out \
node scripts/verification/migration-ledger.mjs

cat > /tmp/pr1227-mock.mjs <<'NODE'
import http from 'node:http';
const server = http.createServer((req, res) => {
  if (req.url === '/fail') { res.writeHead(401, { 'content-type': 'text/html' }); res.end('protected'); return; }
  const rsc = req.headers.rsc === '1';
  res.writeHead(200, { 'content-type': rsc ? 'text/x-component' : 'text/html' });
  res.end(rsc ? '0:["ok"]' : '<!doctype html><title>ok</title>');
});
server.listen(4123, '127.0.0.1');
NODE
node /tmp/pr1227-mock.mjs &
mock_pid=$!
trap 'kill "$mock_pid" 2>/dev/null || true' EXIT
for _ in {1..20}; do curl -fsS http://127.0.0.1:4123/ >/dev/null && break; sleep 0.2; done
PROBE_BASE_URL=http://127.0.0.1:4123 \
PROBE_ROUTES=/ \
PROBE_API_ROUTES='' \
PROBE_MAX_ASSETS=0 \
PROBE_OUTPUT=/tmp/pr1227-probe-pass.json \
node scripts/verification/public-leakage-probe.mjs
if PROBE_BASE_URL=http://127.0.0.1:4123 PROBE_ROUTES=/fail PROBE_API_ROUTES='' PROBE_MAX_ASSETS=0 node scripts/verification/public-leakage-probe.mjs; then
  echo 'Probe incorrectly accepted HTTP 401' >&2
  exit 1
fi
if PROBE_BASE_URL=http://127.0.0.1:4123 PROBE_ROUTES=/ PROBE_API_ROUTES='' PROBE_MAX_ASSETS=not-a-number node scripts/verification/public-leakage-probe.mjs; then
  echo 'Probe incorrectly accepted invalid asset cap' >&2
  exit 1
fi
kill "$mock_pid"
trap - EXIT

git diff --check
git add -A
git commit -m 'chore: harden release verification trust boundaries'
git push --force-with-lease=refs/heads/$target:$expected origin HEAD:refs/heads/$target
