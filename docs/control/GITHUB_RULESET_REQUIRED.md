# Required GitHub `main` ruleset

This repository requires an active branch ruleset on `refs/heads/main`.
The connected integration can **read** rulesets but cannot create them.
An organization administrator must apply the payload in
`docs/control/MAIN_RULESET_PAYLOAD.json`.

## Policy summary

- Target: `refs/heads/main`
- Require a pull request before merging
- Require at least 1 approving review
- Require review from Code Owners where configured
- Dismiss stale pull request approvals when new commits are pushed
- Require conversation resolution before merging
- Require the status checks listed in `REQUIRED_MAIN_STATUS_CHECKS.txt`
- Block force pushes
- Block branch deletion
- Restrict bypass to organization admins only
- Do not allow ordinary workflows to bypass the ruleset

## Apply

1. Open GitHub → Settings → Rules → Rulesets
2. Create ruleset from `MAIN_RULESET_PAYLOAD.json` (or map fields manually)
3. Confirm `governance-gate` and the other required checks are selected
4. Re-run the governance verification workflow

## Fail-closed

`scripts/verify-governance-policy.sh` intentionally fails when no active
`main` ruleset is present. Do not weaken that check to green-wash the gap.
