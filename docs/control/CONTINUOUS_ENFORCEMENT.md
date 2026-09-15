# Continuous Governance Enforcement (Post-Merge)

The HOLD gate ends only when every remediation item is closed. After merge, enforcement continues:

## Scheduled governance

- Keep `production-governance-audit.yml` (and related) on a trusted schedule / manual trigger on `main`.
- Fail closed on any reappearance of:
  - Mutable external action references
  - Production secrets on PR paths
  - Unauthorized `contents: write`
  - Privileged execution of untrusted PR-head code
  - Missing or drifted main ruleset

## Alerts

- Route governance failures to the security / platform on-call channel.
- Treat a live ruleset count of 0 or divergence from `MAIN_RULESET_PAYLOAD.json` as P0.

## Drift prevention

- New workflows must follow `WORKFLOW_ISOLATION_PATTERNS.md`.
- `contents: write` requires an entry in `CONTENTS_WRITE_ALLOWLIST.md` + CODEOWNERS approval.
- Action pins must remain full SHAs; the scanner never accepts tags/branches.

## OIDC preference

Wherever a cloud provider or service supports OIDC, prefer short-lived tokens over long-lived secrets. Document any remaining long-lived secrets and the plan to eliminate them.

## Secrets sweep (beyond the original 11)

Periodically re-scan:
- Repository and environment secrets used by any PR-triggered workflow
- `GITHUB_TOKEN` permission escalations
- Edge-function / deployment secret inventories already tracked in control docs

Any new finding is treated as a new remediation item under the same fail-closed rules.
