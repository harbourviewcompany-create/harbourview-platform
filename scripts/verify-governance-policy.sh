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

INVENTORY_DIR="$ROOT/docs/control/remediation-inventory"
mkdir -p "$INVENTORY_DIR"
: > "$INVENTORY_DIR/mutable-action-refs.txt"
: > "$INVENTORY_DIR/pr-production-secrets.txt"
: > "$INVENTORY_DIR/pr-contents-write.txt"
: > "$INVENTORY_DIR/unauthorized-contents-write.txt"
: > "$INVENTORY_DIR/privileged-untrusted-checkout.txt"

if rulesets="$(curl --fail --silent --show-error --retry 3 --retry-delay 1 -H "Authorization: Bearer ${GITHUB_TOKEN}" -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' 'https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets')"; then
  if RULESETS="$rulesets" python3 - <<'PY'
import json, os
from pathlib import Path
expected=[x.strip() for x in Path('docs/control/REQUIRED_MAIN_STATUS_CHECKS.txt').read_text().splitlines() if x.strip() and not x.lstrip().startswith('#')]
if not expected: raise SystemExit('required status-check allowlist is empty')
rulesets=json.loads(os.environ['RULESETS']); main=[]
for r in rulesets:
    if r.get('enforcement')!='active': continue
    include=((r.get('conditions') or {}).get('ref_name') or {}).get('include') or []
    if 'refs/heads/main' in include or 'main' in include: main.append(r)
if not main: raise SystemExit('no active main ruleset')
errors=[]
for r in main:
    name=r.get('name','<unnamed>'); rules=r.get('rules') or []; types={x.get('type') for x in rules}
    for required in ('pull_request','required_status_checks','non_fast_forward','deletion'):
        if required not in types: errors.append(f'{name}: required rule type {required} missing')
    status=next((x for x in rules if x.get('type')=='required_status_checks'),None)
    if status is not None:
        p=status.get('parameters') or {}
        if not p.get('strict_required_status_checks_policy',False): errors.append(f'{name}: strict status-check policy is disabled')
        configured={x.get('context') for x in (p.get('required_status_checks') or []) if x.get('context')}
        missing=[x for x in expected if x not in configured]; extra=sorted(configured-set(expected))
        if missing: errors.append(f'{name}: missing required contexts: {", ".join(missing)}')
        if extra: errors.append(f'{name}: unapproved required contexts: {", ".join(extra)}')
        for check in p.get('required_status_checks') or []:
            if not check.get('integration_id'): errors.append(f'{name}: status check {check.get("context")!r} has no integration_id')
    pr=next((x for x in rules if x.get('type')=='pull_request'),None)
    if pr is not None:
        p=pr.get('parameters') or {}
        if int(p.get('required_approving_review_count',0))<1: errors.append(f'{name}: fewer than one approving review required')
        if not p.get('require_code_owner_review',False): errors.append(f'{name}: CODEOWNERS review is disabled')
        if not p.get('dismiss_stale_reviews_on_push',False): errors.append(f'{name}: stale approvals are not dismissed')
        if not p.get('required_review_thread_resolution',False): errors.append(f'{name}: review-thread resolution is disabled')
    for actor in r.get('bypass_actors') or []:
        if actor.get('actor_type') != 'OrganizationAdmin': errors.append(f'{name}: unauthorized bypass actor {actor!r}')
if errors: raise SystemExit('; '.join(errors))
print(f'validated {len(main)} active main ruleset(s) against {len(expected)} canonical checks')
PY
  then pass_check "active main ruleset matches the canonical governance policy"; else fail_check "main ruleset is missing, incomplete, or unauthorized"; fi
else
  fail_check "GitHub ruleset API could not be queried"
fi

workflow_dir="$ROOT/.github/workflows"
mutable_refs=0
while IFS= read -r line; do
  if [[ "$line" =~ uses:[[:space:]]*([^[:space:]#]+)@([^[:space:]#]+) ]]; then
    action_ref="${BASH_REMATCH[2]}"
    if [[ ! "$action_ref" =~ ^[0-9a-fA-F]{40}$ && ! "$line" =~ uses:[[:space:]]*\./ ]]; then
      printf 'MUTABLE ACTION: %s\n' "$line"
      printf '%s\n' "$line" >> "$INVENTORY_DIR/mutable-action-refs.txt"
      mutable_refs=$((mutable_refs+1))
    fi
  fi
done < <(grep -RInE '^[[:space:]-]*uses:[[:space:]]*[^#[:space:]]+@[^#[:space:]]+' "$workflow_dir" 2>/dev/null || true)
if [ "$mutable_refs" -eq 0 ]; then pass_check "all external workflow actions and reusable workflows are pinned to immutable commit SHAs"; else fail_check "$mutable_refs external workflow action/reusable-workflow reference(s) are mutable"; fi

if grep -RInE '^[[:space:]]*pull_request_target[[:space:]]*:' "$workflow_dir" >/tmp/governance-pull-target.txt 2>/dev/null; then cat /tmp/governance-pull-target.txt; fail_check "pull_request_target is prohibited in repository workflows"; else pass_check "no pull_request_target workflow is present"; fi
if grep -RInE 'permissions:[[:space:]]*write-all|^[[:space:]]+permissions:[[:space:]]*write-all' "$workflow_dir" >/tmp/governance-write-all.txt 2>/dev/null; then cat /tmp/governance-write-all.txt; fail_check "permissions: write-all is prohibited"; else pass_check "no workflow grants permissions: write-all"; fi

pr_contents_write=0
while IFS= read -r file; do
  if grep -Eq '^[[:space:]]*pull_request([[:space:]]*:|[[:space:]]*$)' "$file" && grep -Eq '^[[:space:]]+contents:[[:space:]]+write[[:space:]]*$' "$file"; then
    printf 'PR CONTENTS WRITE: %s\n' "$file"
    printf '%s\n' "$file" >> "$INVENTORY_DIR/pr-contents-write.txt"
    pr_contents_write=$((pr_contents_write+1))
  fi
done < <(find "$workflow_dir" -type f \( -name '*.yml' -o -name '*.yaml' \) -print)
if [ "$pr_contents_write" -eq 0 ]; then pass_check "no pull-request workflow grants repository contents write access"; else fail_check "$pr_contents_write pull-request workflow(s) grant repository contents write access"; fi

production_secret_refs=0
while IFS= read -r file; do
  if grep -Eq '^[[:space:]]*pull_request([[:space:]]*:|[[:space:]]*$)' "$file" && grep -Eq 'SUPABASE_DB_URL|SUPABASE_DB_PASSWORD|SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY|VERCEL_AUTOMATION_BYPASS_SECRET' "$file"; then
    printf 'PR PRODUCTION SECRET: %s\n' "$file"
    printf '%s\n' "$file" >> "$INVENTORY_DIR/pr-production-secrets.txt"
    production_secret_refs=$((production_secret_refs+1))
  fi
done < <(find "$workflow_dir" -type f \( -name '*.yml' -o -name '*.yaml' \) -print)
if [ "$production_secret_refs" -eq 0 ]; then pass_check "no pull-request workflow references production database/deployment credentials"; else fail_check "$production_secret_refs pull-request workflow(s) reference production credentials"; fi

if grep -RInE '^[[:space:]]+contents:[[:space:]]+write[[:space:]]*$' "$workflow_dir" >/tmp/governance-contents-write.txt 2>/dev/null; then
  unexpected=$(grep -RlE '^[[:space:]]+contents:[[:space:]]+write[[:space:]]*$' "$workflow_dir" | grep -vE '/deploy-preview\.yml$|/cleanup-preview-branches\.yml$|/marketplace-browser-smoke\.yml$|/sync-figma-tokens\.yml$|/reconstruct-stub-migrations\.yml$|/apply-command-centre-repair\.yml$|/production-admin-security-probe\.yml$' || true)
  if [ -n "$unexpected" ]; then
    printf '%s\n' "$unexpected"
    printf '%s\n' "$unexpected" >> "$INVENTORY_DIR/unauthorized-contents-write.txt"
    fail_check "contents: write exists outside the explicitly approved controlled workflows"
  else
    pass_check "contents: write is limited to explicitly approved controlled workflows"
  fi
else
  pass_check "no workflow grants contents: write"
fi

if grep -RInE 'github\.event\.(pull_request|issue)\.(body|title)' "$workflow_dir" >/tmp/governance-body-title.txt 2>/dev/null; then cat /tmp/governance-body-title.txt; fail_check "workflow directly interpolates attacker-controlled issue/PR body or title data"; else pass_check "no direct issue/PR body or title interpolation detected"; fi

privileged_untrusted_checkout=0
while IFS= read -r file; do
  if grep -Eq 'github\.event\.pull_request\.head\.(sha|repo\.full_name)|refs/pull/\$\{\{[^}]*pull_request[^}]*\}\}/(merge|head)' "$file"; then
    if grep -Eq '^[[:space:]]+contents:[[:space:]]+write[[:space:]]*$|SUPABASE_DB_URL|SUPABASE_DB_PASSWORD|SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY|VERCEL_AUTOMATION_BYPASS_SECRET' "$file"; then
      printf 'PR TRUST-BOUNDARY: %s\n' "$file"
      printf '%s\n' "$file" >> "$INVENTORY_DIR/privileged-untrusted-checkout.txt"
      privileged_untrusted_checkout=$((privileged_untrusted_checkout+1))
    fi
  fi
done < <(find "$workflow_dir" -type f \( -name '*.yml' -o -name '*.yaml' \) -print)
if [ "$privileged_untrusted_checkout" -eq 0 ]; then pass_check "no privileged workflow checks out untrusted pull-request code"; else fail_check "$privileged_untrusted_checkout privileged workflow(s) contain an untrusted pull-request checkout/fetch pattern"; fi

# Summarize inventory for humans / PR evidence
{
  echo "# Auto-generated by scripts/verify-governance-policy.sh at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "## Mutable action refs: $mutable_refs"
  echo "## PR production secret refs: $production_secret_refs"
  echo "## PR contents:write: $pr_contents_write"
  echo "## Unauthorized contents:write: $(wc -l < "$INVENTORY_DIR/unauthorized-contents-write.txt" | tr -d ' ')"
  echo "## Privileged untrusted checkout: $privileged_untrusted_checkout"
} > "$INVENTORY_DIR/SUMMARY.md"

printf 'GOVERNANCE_POLICY_RESULT=%s PASS_COUNT=%s FAIL_COUNT=%s\n' "$([ "$fail" -eq 0 ] && echo PASS || echo FAIL)" "$pass_count" "$fail_count"
printf 'Inventory written to docs/control/remediation-inventory/\n'
exit "$fail"
