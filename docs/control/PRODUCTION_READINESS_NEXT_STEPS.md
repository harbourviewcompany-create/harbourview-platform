# Production Readiness — Concrete Next Steps (post-optimization)

The control surface is now in place. Remaining work that moves the platform to production-ready:

## 1. Freeze and close the inventory (highest leverage)

1. Trigger `Production Governance Audit` on the remediation branch.
2. Commit the generated files under `docs/control/remediation-inventory/`.
3. Work the four lists to zero, risk-ordered:
   - Privileged untrusted checkout
   - PR production secrets
   - Unauthorized / PR `contents: write`
   - Mutable action refs

## 2. Main ruleset (external P0)

Follow `MAIN_RULESET_ADMIN_RUNBOOK.md`. Until the live ruleset exists and matches the canonical payload, governance stays FAIL.

## 3. Continuous enforcement

- The scheduled run of `production-governance-audit.yml` already exists.
- After merge, treat any non-zero inventory as a P0 regression.
- Prefer OIDC over long-lived secrets for any remaining production access.

## 4. Evidence in the PR

Keep the PR body Evidence section current with:
- Latest governance run URL
- `docs/control/remediation-inventory/SUMMARY.md` contents
- Confirmation that the live ruleset ID has been posted by the admin

## 5. Merge criteria (unchanged HOLD)

Only when inventory is empty, governance PASS, live ruleset verified, and applicable CI/QA green.
