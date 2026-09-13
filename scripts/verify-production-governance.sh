#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required for the production governance audit}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required for the GitHub governance audit}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
pass_count=0
fail_count=0

pass_check() {
  printf 'PASS: %s\n' "$1"
  pass_count=$((pass_count + 1))
}

fail_check() {
  printf 'FAIL: %s\n' "$1"
  fail_count=$((fail_count + 1))
  fail=1
}

# 1. Canonical ownership must exist exactly once and must cover the repository.
owner_lines="$(grep -Ec '^\* @harbourviewcompany-create$' .github/CODEOWNERS || true)"
if [ "$owner_lines" -eq 1 ]; then
  pass_check "CODEOWNERS has exactly one canonical repository owner"
else
  fail_check "CODEOWNERS must contain exactly one '* @harbourviewcompany-create' rule (found $owner_lines)"
fi

# 2. Repository protection must be an active ruleset targeting main. Merely having
#    an unrelated/inactive ruleset is not sufficient to clear the governance gate.
rulesets="$(curl --fail --silent --show-error --retry 3 --retry-delay 1 \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets")"

if ! python3 - "$rulesets" <<'PY'
import json, sys
rulesets = json.loads(sys.argv[1])
required = []
for rule in rulesets:
    if rule.get("enforcement") != "active":
        continue
    conditions = rule.get("conditions") or {}
    refs = ((conditions.get("ref_name") or {}).get("include") or [])
    if "refs/heads/main" not in refs and "main" not in refs:
        continue
    required.append(rule)

if not required:
    raise SystemExit("no active ruleset targets main")

errors = []
for rule in required:
    rules = rule.get("rules") or []
    types = {r.get("type") for r in rules}
    if "pull_request" not in types:
        errors.append(f"{rule.get('name','<unnamed>')}: missing pull_request rule")
        continue
    pr = next(r for r in rules if r.get("type") == "pull_request")
    params = pr.get("parameters") or {}
    if params.get("required_approving_review_count", 0) < 1:
        errors.append(f"{rule.get('name','<unnamed>')}: fewer than 1 required approval")
    if not params.get("require_code_owner_review", False):
        errors.append(f"{rule.get('name','<unnamed>')}: CODEOWNERS review not required")
    if not params.get("dismiss_stale_reviews_on_push", False):
        errors.append(f"{rule.get('name','<unnamed>')}: stale approvals are not dismissed")
    if not params.get("required_review_thread_resolution", False):
        errors.append(f"{rule.get('name','<unnamed>')}: unresolved review threads are permitted")

if errors:
    raise SystemExit("; ".join(errors))
print(f"validated {len(required)} active main ruleset(s)")
PY
then
  pass_check "active main ruleset contains required pull-request governance controls"
else
  fail_check "active main ruleset is missing or does not enforce the required pull-request controls"
fi

# 3. Every external GitHub Action/workflow reference must be immutable. Local
#    actions (./...) are allowed. This closes the mutable-ref supply-chain gap
#    instead of maintaining a fragile deny-list of names such as main/latest.
mutable_refs="$(grep -RInE '^[[:space:]]*uses:[[:space:]]+[^[:space:]#]+@[^[:space:]#]+' .github/workflows \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*uses:[[:space:]]+\./' \
  | grep -vE '@[0-9a-fA-F]{40}([[:space:]]+#.*)?$' || true)"
if [ -n "$mutable_refs" ]; then
  printf '%s\n' "$mutable_refs"
  fail_check "all external workflow action references must use a 40-hex immutable commit SHA"
else
  pass_check "all external workflow action references are pinned to immutable commit SHAs"
fi

# 4. Production migration attribution is exact, not merely version-based:
#    live version + live name must map to a repository artifact whose SHA-256
#    matches the recorded artifact hash. This is read-only against production.
if ! command -v psql >/dev/null 2>&1; then
  fail_check "psql is required for the production migration audit"
else
  migration_rows="$(psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -F $'\t' \
    -c 'select version, name from supabase_migrations.schema_migrations order by version;' \
    2>/dev/null)" || {
      fail_check "production migration ledger could not be queried read-only"
      migration_rows=""
    }

  if [ -n "$migration_rows" ]; then
    MIGRATION_ROWS="$migration_rows" python3 <<'PY'
import hashlib, json, os, re, sys
from pathlib import Path

rows = []
for line in os.environ["MIGRATION_ROWS"].splitlines():
    if not line.strip():
        continue
    version, name = line.split("\t", 1)
    rows.append((version, name))

local = {}
errors = []
for path in sorted(Path("supabase/migrations").glob("*.sql")):
    match = re.fullmatch(r"(\d{14})_(.+)\.sql", path.name)
    if not match:
        continue
    version, name = match.groups()
    if version in local:
        errors.append(f"duplicate repository migration version {version}")
    local[version] = (name, path)

records = {}
for path in sorted(Path("supabase/release-controls").glob("*.json")):
    try:
        data = json.loads(path.read_text())
    except Exception as exc:
        errors.append(f"invalid reconciliation JSON {path}: {exc}")
        continue
    for entry in data.get("entries", []):
        version = entry.get("live_version")
        if not version:
            errors.append(f"missing live_version in {path}")
            continue
        if version in records:
            errors.append(f"duplicate reconciliation for live version {version}")
        records[version] = (entry, path)

seen = set()
for version, live_name in rows:
    if version in seen:
        errors.append(f"duplicate live migration version {version}")
        continue
    seen.add(version)

    if version in local:
        repo_name, artifact = local[version]
        if repo_name != live_name:
            errors.append(f"{version}: live name '{live_name}' != repository name '{repo_name}'")
        continue

    record = records.get(version)
    if not record:
        errors.append(f"{version} {live_name}: no repository artifact or reconciliation record")
        continue

    entry, record_path = record
    if entry.get("live_name") != live_name:
        errors.append(f"{version}: reconciliation live_name does not match production")
    artifact_rel = entry.get("repository_artifact")
    expected_sha = entry.get("repository_artifact_sha256")
    if not artifact_rel or not expected_sha:
        errors.append(f"{version}: reconciliation is missing repository artifact or SHA-256")
        continue
    artifact = Path(artifact_rel)
    if not artifact.is_file():
        errors.append(f"{version}: repository artifact missing: {artifact_rel}")
        continue
    actual_sha = hashlib.sha256(artifact.read_bytes()).hexdigest()
    if actual_sha != expected_sha:
        errors.append(f"{version}: SHA-256 mismatch (expected {expected_sha}, got {actual_sha})")

for version in records:
    if version not in seen:
        # Historical attestations are permitted, but stale records must not be
        # mistaken for current production state. They are reported, not failed.
        print(f"WARN: reconciliation record {version} is not present in the live ledger")

if errors:
    print("FAIL: production migration attribution is not exact")
    for error in errors:
        print(f"  {error}")
    sys.exit(1)

print(f"PASS: {len(rows)} live migration versions have exact repository attribution")
PY
    if [ "$?" -eq 0 ]; then
      pass_check "production migration ledger is exactly attributed to repository artifacts"
    else
      fail=1
      fail_count=$((fail_count + 1))
    fi
  fi
fi

printf 'GOVERNANCE_RESULT=%s PASS_COUNT=%s FAIL_COUNT=%s\n' "$([ "$fail" -eq 0 ] && echo PASS || echo FAIL)" "$pass_count" "$fail_count"
exit "$fail"
