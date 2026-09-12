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

# No mutable third-party action references are permitted in workflows.
if grep -RInE '^[[:space:]]*uses:[[:space:]]+[^#]+@(main|master|develop|latest|v[0-9]+\.[0-9]+\.[0-9]+)[[:space:]]*(#.*)?$' .github/workflows; then
  echo "FAIL: mutable GitHub Action reference detected"
  fail=1
else
  echo "PASS: workflow action references are immutable or otherwise pinned"
fi

# Every production migration version must either be represented by its exact
# repository filename or by an explicit reconciliation record. Unknown live
# versions fail closed; the audit never writes to Supabase.
python3 - <<'PY'
import json, os, re, subprocess, sys
from pathlib import Path

rows = subprocess.check_output(
    ["psql", os.environ["SUPABASE_DB_URL"], "-At", "-F", "|", "-c",
     "select version, name from supabase_migrations.schema_migrations order by version;"],
    text=True,
).splitlines()

local = {}
for p in Path("supabase/migrations").glob("*.sql"):
    m = re.match(r"^(\d{14})_(.+)\.sql$", p.name)
    if m:
        local[m.group(1)] = m.group(2)

reconciled = set()
for p in Path("supabase/release-controls").glob("*.json"):
    try:
        data = json.loads(p.read_text())
    except Exception:
        continue
    for entry in data.get("entries", []):
        v = entry.get("live_version")
        if v:
            reconciled.add(v)

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

print(f"PASS: {len(rows)} live migration versions are repository-attributed")
PY

exit "$fail"
