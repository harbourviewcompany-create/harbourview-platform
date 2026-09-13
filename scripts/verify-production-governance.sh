#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required for the production governance audit}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required for the GitHub ruleset audit}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

if ! grep -qE '^\* @harbourviewcompany-create$' .github/CODEOWNERS; then
  echo "FAIL: CODEOWNERS has no canonical owner"
  fail=1
else
  echo "PASS: CODEOWNERS has a canonical owner"
fi

rulesets="$(curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" -H 'Accept: application/vnd.github+json' \
  "https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets")"
rule_count="$(printf '%s' "$rulesets" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')"
if [ "$rule_count" -lt 1 ]; then
  echo "FAIL: no repository ruleset is configured"
  fail=1
else
  echo "PASS: $rule_count repository ruleset(s) configured"
fi

# Require immutable third-party action references. A full commit SHA is the
# only accepted reference shape; version tags are mutable even when they look
# semver-like. Local actions (./...) are not third-party downloads.
if grep -RInE '^[[:space:]]*uses:[[:space:]]+[^#[:space:]]+@([^[:space:]]+)[[:space:]]*(#.*)?$' .github/workflows | \
   grep -vE '@[0-9a-f]{40}([[:space:]]|$)'; then
  echo "FAIL: mutable GitHub Action reference detected"
  fail=1
else
  echo "PASS: workflow action references are immutable or local"
fi

# Every production migration version must either be represented by its exact
# repository filename or by an explicit content-bound reconciliation record.
# Unknown live versions fail closed; this audit never writes to Supabase.
python3 - <<'PY'
import json
import os
import re
import subprocess
import sys
from pathlib import Path

rows = subprocess.check_output(
    ["psql", os.environ["SUPABASE_DB_URL"], "-At", "-F", "|", "-c",
     "select version, coalesce(name,'') from supabase_migrations.schema_migrations order by version;"],
    text=True,
).splitlines()

local = {}
for p in Path("supabase/migrations").glob("*.sql"):
    m = re.match(r"^(\d{14})_(.+)\.sql$", p.name)
    if m:
        local[m.group(1)] = m.group(2)

reconciled = {}
for p in Path("supabase/release-controls").glob("*.json"):
    try:
        data = json.loads(p.read_text())
    except Exception:
        continue
    for entry in data.get("entries", []):
        v = entry.get("live_version")
        artifact = entry.get("repository_artifact")
        if v and artifact:
            reconciled[v] = artifact
    for entry in data.get("equivalences", []):
        v = entry.get("live_version")
        artifact = entry.get("file")
        if v and artifact:
            reconciled[v] = artifact

unknown = []
for row in rows:
    if not row:
        continue
    version, name = row.split("|", 1)
    if version not in local and version not in reconciled:
        unknown.append((version, name))

if unknown:
    print("FAIL: unattributed live migration versions detected")
    for version, name in unknown:
        print(f"  {version} {name}")
    sys.exit(1)

# Every explicit reconciliation must point at a repository artifact that
# exists. This prevents a governance record from becoming a paper exception.
missing_artifacts = []
for version, artifact in reconciled.items():
    if not Path(artifact).is_file():
        missing_artifacts.append((version, artifact))

if missing_artifacts:
    print("FAIL: migration reconciliation references missing repository artifacts")
    for version, artifact in missing_artifacts:
        print(f"  {version} -> {artifact}")
    sys.exit(1)

print(f"PASS: {len(rows)} live migration versions are repository-attributed")
print(f"PASS: {len(reconciled)} explicit migration reconciliation mappings resolve to repository artifacts")
PY

exit "$fail"
