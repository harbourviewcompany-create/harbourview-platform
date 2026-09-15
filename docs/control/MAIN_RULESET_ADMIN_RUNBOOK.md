# Main Ruleset — Administrator Runbook

**Status:** External P0. The connected GitHub integration can read rulesets but cannot create or update them. An authorized GitHub administrator (OrganizationAdmin or repository admin with ruleset privileges) must perform this step.

## Canonical artifacts

- Payload: `docs/control/MAIN_RULESET_PAYLOAD.json`
- Requirements: `docs/control/GITHUB_RULESET_REQUIRED.md`
- Required checks: `docs/control/REQUIRED_MAIN_STATUS_CHECKS.txt`

## Steps for the administrator

1. Confirm you have permission to create repository rulesets on `harbourviewcompany-create/harbourview-platform`.
2. Apply the exact payload from `MAIN_RULESET_PAYLOAD.json` via the GitHub UI (Settings → Rules → Rulesets) or the REST/GraphQL API.
3. Ensure:
   - Target: `main`
   - Enforcement: `active`
   - Rules match the payload (PR requirements, required status checks bound to the GitHub Actions integration, non-fast-forward, deletion protection)
   - Bypass actors: only `OrganizationAdmin`
4. Verify live state:

```bash
gh api repos/harbourviewcompany-create/harbourview-platform/rulesets
# or
curl -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/harbourviewcompany-create/harbourview-platform/rulesets
```

5. Confirm the live ruleset ID, name (`harbourview-main-protection`), enforcement `active`, and that the required status-check contexts exactly match `REQUIRED_MAIN_STATUS_CHECKS.txt`.
6. Post evidence into PR #1823 (or the current governance remediation PR):
   - Live ruleset ID
   - Redacted API response (or screenshot of the ruleset settings)
   - Confirmation that bypass is limited to OrganizationAdmin

## Governance assertion

The production governance audit fails closed while:
- Live main rulesets count == 0, or
- The live ruleset diverges from the canonical payload / required checks, or
- Any bypass actor other than OrganizationAdmin is present.

Repository intent or the presence of the JSON payload is **not** proof that the ruleset exists.

## After creation

- Re-run the governance audit.
- Only when the audit passes **and** all other remediation gates are closed may PR #1823 (or successor) be merged.
