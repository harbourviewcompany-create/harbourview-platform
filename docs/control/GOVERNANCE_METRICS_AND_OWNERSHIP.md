# Governance Remediation — Ownership, Metrics, Rollback

## Named ownership

| Gap category | Primary owner | Backup | Target |
|--------------|---------------|--------|--------|
| Mutable action references | Platform / CI maintainers | Security | Eliminate all |
| PR credential exposures | Platform / Security | — | Eliminate or isolate |
| Unauthorized contents:write | Platform / CI maintainers | Security | Align to allowlist |
| Privileged untrusted-code paths | Security + Platform | — | Eliminate or isolate |
| Main ruleset creation (external) | GitHub Organization Admin | Repository admin with ruleset privileges | Live + verified |
| Evidence & PR updates | Author of remediation PR | — | Continuous |

Fill concrete GitHub handles / team slugs when assigning.

## Success metrics (tracked in PR body / this file)

- Remaining mutable external references (must reach 0)
- Remaining PR credential exposures (must reach 0)
- Remaining unauthorized contents:write (must reach 0)
- Remaining privileged untrusted-code paths (must reach 0)
- Live main rulesets count (must be ≥ 1 and match canonical)
- Governance audit conclusion (must be PASS)
- Time from inventory freeze to all gates green

## Rollback criteria

Immediately revert remediation commits and/or disable the ruleset if any of the following occur after a change:

- Governance scanner is weakened or bypassed
- Production credentials become reachable from a PR path
- Untrusted PR-head code reaches a privileged job
- Required status checks are removed or unbound
- Bypass actors other than OrganizationAdmin appear on the main ruleset
- Any production DDL is replayed without explicit authorization

## Communication

- Notify repository maintainers, security, and the designated GitHub administrator when the inventory is frozen and when the ruleset is ready for creation.
- Keep the PR body Evidence section current with every push (run URLs + reduced lists).
