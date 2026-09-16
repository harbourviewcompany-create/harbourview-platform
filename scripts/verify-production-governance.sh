#!/usr/bin/env bash
set -uo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required for the production governance audit}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required for the GitHub governance audit}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
pass_count=0
fail_count=0
warn_count=0

pass_check() {
  printf 'PASS: %s\n' "$1"
  pass_count=$((pass_count + 1))
}

fail_check() {
  printf 'FAIL: %s\n' "$1"
  fail_count=$((fail_count + 1))
  fail=1
}

warn_check() {
  printf 'WARN: %s\n' "$1"
  warn_count=$((warn_count + 1))
}

# 1. Canonical ownership must exist exactly once and every non-comment CODEOWNERS
#    rule must have an owner. This prevents a stray unmatched path from silently
#    escaping review coverage.
if [ ! -f .github/CODEOWNERS ]; then
  fail_check "CODEOWNERS file is missing"
else
  owner_lines="$(grep -Ec '^\* @harbourviewcompany-create$' .github/CODEOWNERS || true)"
  if [ "$owner_lines" -eq 1 ]; then
    pass_check "CODEOWNERS has exactly one canonical repository owner"
  else
    fail_check "CODEOWNERS must contain exactly one '* @harbourviewcompany-create' rule (found $owner_lines)"
  fi

  invalid_owner_lines="$(awk '!/^[[:space:]]*($|#)/ && NF < 2 {print NR ":" $0}' .github/CODEOWNERS || true)"
  if [ -n "$invalid_owner_lines" ]; then
    printf '%s\n' "$invalid_owner_lines"
    fail_check "CODEOWNERS contains non-comment rules without an owner"
  else
    pass_check "all CODEOWNERS rules contain an explicit owner"
  fi
fi

# 2. Main must have an active ruleset with the controls required for protected
#    production delivery. Any missing control is a hard failure. A read failure
#    is also a hard failure; the gate never converts inability to verify into PASS.
if rulesets="$(curl --fail --silent --show-error --retry 3 --retry-delay 1 \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets")"; then
  if RULESETS="$rulesets" python3 <<'PY'
import json, os, sys
rulesets = json.loads(os.environ["RULESETS"])
main_rulesets = []
for rule in rulesets:
    if rule.get("enforcement") != "active":
        continue
    refs = ((rule.get("conditions") or {}).get("ref_name") or {}).get("include") or []
    if "refs/heads/main" in refs or "main" in refs:
        main_rulesets.append(rule)

if not main_rulesets:
    raise SystemExit("no active ruleset targets main")

errors = []
for rule in main_rulesets:
    name = rule.get("name", "<unnamed>")
    rules = rule.get("rules") or []
    types = {r.get("type") for r in rules}
    required_types = {"pull_request", "required_status_checks", "non_fast_forward", "deletion"}
    missing = sorted(required_types - types)
    if missing:
        errors.append(f"{name}: missing rules {', '.join(missing)}")
        continue

    pr = next(r for r in rules if r.get("type") == "pull_request")
    params = pr.get("parameters") or {}
    if params.get("required_approving_review_count", 0) < 1:
        errors.append(f"{name}: fewer than 1 required approval")
    if not params.get("require_code_owner_review", False):
        errors.append(f"{name}: CODEOWNERS review not required")
    if not params.get("dismiss_stale_reviews_on_push", False):
        errors.append(f"{name}: stale approvals are not dismissed")
    if not params.get("required_review_thread_resolution", False):
        errors.append(f"{name}: unresolved review threads are permitted")

    checks = next(r for r in rules if r.get("type") == "required_status_checks")
    if not (checks.get("parameters") or {}).get("required_status_checks"):
        errors.append(f"{name}: no required status checks configured")

    # Bypass must not silently permit arbitrary users/teams/integrations to skip
    # production controls. Organization-admin bypass is the only accepted class.
    for actor in rule.get("bypass_actors") or []:
        actor_type = actor.get("actor_type")
        if actor_type not in ("OrganizationAdmin",):
            errors.append(f"{name}: unauthorized bypass actor type {actor_type!r}")

if errors:
    raise SystemExit("; ".join(errors))
print(f"validated {len(main_rulesets)} active main ruleset(s)")
PY
  then
    pass_check "active main ruleset enforces review, status, deletion, and non-fast-forward controls"
  else
    fail_check "active main ruleset is missing or does not enforce the required controls"
  fi
else
  fail_check "GitHub ruleset API could not be queried"
fi

# 3. Every external GitHub Action reference must be immutable. Local actions are
#    allowed. This is an allow-by-construction check rather than a deny-list of
#    known mutable names. It also catches reusable workflows referenced with tags.
mutable_refs="$(grep -RInE '^[[:space:]]*uses:[[:space:]]+[^[:space:]#]+@[^[:space:]#]+' .github/workflows \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*uses:[[:space:]]+\./' \
  | grep -vE '@[0-9a-fA-F]{40}([[:space:]]+#.*)?$' || true)"
if [ -n "$mutable_refs" ]; then
  printf '%s\n' "$mutable_refs"
  fail_check "all external workflow action and reusable-workflow references must use 40-hex immutable commit SHAs"
else
  pass_check "all external workflow action and reusable-workflow references are pinned to immutable commit SHAs"
fi

# 4. Production migration attribution is exact. Every live migration must map to
#    a repository artifact with the same version/name or an explicit reconciliation
#    record with an existing artifact and matching SHA-256. Repository migrations
#    not yet applied are reported as pending rather than treated as drift.
if ! command -v psql >/dev/null 2>&1; then
  fail_check "psql is required for the production migration audit"
else
  if migration_rows="$(psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -F $'\t' \
    -c 'select version, name from supabase_migrations.schema_migrations order by version;' \
    2>/dev/null)"; then
    if MIGRATION_ROWS="$migration_rows" python3 <<'PY'
import hashlib, json, os, re, sys
from pathlib import Path

errors = []
rows = []
for line in os.environ["MIGRATION_ROWS"].splitlines():
    if not line.strip():
        continue
    parts = line.split("\t", 1)
    if len(parts) != 2:
        errors.append(f"malformed production migration row: {line!r}")
        continue
    rows.append((parts[0], parts[1]))

local = {}
for path in sorted(Path("supabase/migrations").glob("*.sql")):
    match = re.fullmatch(r"(\d{14})_(.+)\.sql", path.name)
    if not match:
        errors.append(f"malformed repository migration filename: {path}")
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
    if not isinstance(data, dict):
        errors.append(f"reconciliation file is not an object: {path}")
        continue
    entries = data.get("entries", [])
    if not isinstance(entries, list):
        errors.append(f"reconciliation entries must be an array: {path}")
        continue
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append(f"reconciliation entry is not an object: {path}")
            continue
        version = entry.get("live_version")
        if not isinstance(version, str) or not re.fullmatch(r"\d{14}", version):
            errors.append(f"invalid live_version in {path}")
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
        repo_name, _ = local[version]
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
    if not isinstance(artifact_rel, str) or not isinstance(expected_sha, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected_sha):
        errors.append(f"{version}: reconciliation is missing a valid repository artifact path or SHA-256")
        continue
    artifact = Path(artifact_rel)
    if not artifact.is_file():
        errors.append(f"{version}: repository artifact missing: {artifact_rel}")
        continue
    actual_sha = hashlib.sha256(artifact.read_bytes()).hexdigest()
    if actual_sha.lower() != expected_sha.lower():
        errors.append(f"{version}: SHA-256 mismatch (expected {expected_sha}, got {actual_sha})")

# A reconciliation record is authoritative evidence only when it corresponds to
# a live row. Orphan records are errors, not harmless warnings, because they can
# conceal stale or fabricated provenance.
for version in records:
    if version not in seen:
        errors.append(f"reconciliation record {version} is not present in the live migration ledger")

if errors:
    print("FAIL: production migration attribution is not exact")
    for error in errors:
        print(f"  {error}")
    sys.exit(1)

pending = sorted(set(local) - seen)
print(f"PASS: {len(rows)} live migration versions have exact repository attribution")
if pending:
    print(f"INFO: {len(pending)} repository migration(s) are pending in production")
PY
    then
      pass_check "production migration ledger is exactly attributed to repository artifacts"
    else
      fail_check "production migration attribution is not exact"
    fi
  else
    fail_check "production migration ledger could not be queried read-only"
  fi
fi

# 5. Emit machine-readable evidence. Any failure, including inability to verify a
#    required control, makes the process exit non-zero.
result="PASS"
if [ "$fail" -ne 0 ]; then result="FAIL"; fi
printf 'GOVERNANCE_RESULT=%s PASS_COUNT=%s FAIL_COUNT=%s WARN_COUNT=%s\n' "$result" "$pass_count" "$fail_count" "$warn_count"
exit "$fail"
