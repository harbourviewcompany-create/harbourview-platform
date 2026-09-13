#!/usr/bin/env bash
set -uo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
pass_count=0
fail_count=0

pass_check() { printf 'PASS: %s\n' "$1"; pass_count=$((pass_count+1)); }
fail_check() { printf 'FAIL: %s\n' "$1"; fail_count=$((fail_count+1)); fail=1; }

# Ruleset semantics are evaluated from the live GitHub API. The repository file
# below is the canonical allowlist of status-check contexts; an arbitrary
# non-empty check list is not sufficient protection.
if rulesets="$(curl --fail --silent --show-error --retry 3 --retry-delay 1 \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  'https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets')"; then
  if RULESETS="$rulesets" python3 - <<'PY'
import json, os, sys
from pathlib import Path

expected = [x.strip() for x in Path('docs/control/REQUIRED_MAIN_STATUS_CHECKS.txt').read_text().splitlines()
            if x.strip() and not x.lstrip().startswith('#')]
if not expected:
    raise SystemExit('required status-check allowlist is empty')

rulesets = json.loads(os.environ['RULESETS'])
main = []
for r in rulesets:
    if r.get('enforcement') != 'active':
        continue
    include = ((r.get('conditions') or {}).get('ref_name') or {}).get('include') or []
    if 'refs/heads/main' in include or 'main' in include:
        main.append(r)
if not main:
    raise SystemExit('no active main ruleset')

errors=[]
for r in main:
    name=r.get('name','<unnamed>')
    status=next((x for x in (r.get('rules') or []) if x.get('type')=='required_status_checks'),None)
    if status is None:
        errors.append(f'{name}: required_status_checks rule missing')
        continue
    params=status.get('parameters') or {}
    if not params.get('strict_required_status_checks_policy', False):
        errors.append(f'{name}: strict status-check policy is disabled')
    configured={x.get('context') for x in (params.get('required_status_checks') or []) if x.get('context')}
    missing=[x for x in expected if x not in configured]
    extra=sorted(configured-set(expected))
    if missing:
        errors.append(f'{name}: missing required contexts: {", ".join(missing)}')
    if extra:
        errors.append(f'{name}: unapproved required contexts: {", ".join(extra)}')
    for check in params.get('required_status_checks') or []:
        if not check.get('integration_id'):
            errors.append(f'{name}: status check {check.get("context")!r} has no pinned integration_id')

if errors:
    raise SystemExit('; '.join(errors))
print(f'validated {len(main)} active main ruleset(s) against {len(expected)} canonical checks')
PY
  then pass_check "main ruleset matches the canonical required status-check allowlist"
  else fail_check "main ruleset required status checks are missing, stale, or unauthorized"
  fi
else
  fail_check "GitHub ruleset API could not be queried"
fi

# No privileged trust boundary should be introduced through pull_request_target.
if grep -RInE '^[[:space:]]*pull_request_target[[:space:]]*:' .github/workflows >/tmp/governance-pull-target.txt 2>/dev/null; then
  cat /tmp/governance-pull-target.txt
  fail_check "pull_request_target is prohibited in repository workflows"
else
  pass_check "no pull_request_target workflow is present"
fi

if grep -RInE 'permissions:[[:space:]]*write-all|^[[:space:]]+permissions:[[:space:]]*write-all' .github/workflows >/tmp/governance-write-all.txt 2>/dev/null; then
  cat /tmp/governance-write-all.txt
  fail_check "permissions: write-all is prohibited"
else
  pass_check "no workflow grants permissions: write-all"
fi

# A privileged workflow must not checkout arbitrary PR code. This catches the
# classic pwn-request shape even if a future maintainer introduces a privileged
# trigger later.
if grep -RInE 'github\.event\.pull_request\.head\.(sha|repo\.full_name)|refs/pull/\$\{\{[^}]*pull_request[^}]*\}\}/(merge|head)' .github/workflows >/tmp/governance-untrusted-checkout.txt 2>/dev/null; then
  cat /tmp/governance-untrusted-checkout.txt
  fail_check "workflow contains a pull-request-head checkout/fetch trust-boundary pattern"
else
  pass_check "no untrusted pull-request checkout pattern detected"
fi

printf 'GOVERNANCE_POLICY_RESULT=%s PASS_COUNT=%s FAIL_COUNT=%s\n' \
  "$([ "$fail" -eq 0 ] && echo PASS || echo FAIL)" "$pass_count" "$fail_count"
exit "$fail"
