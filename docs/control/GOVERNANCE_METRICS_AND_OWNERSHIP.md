# Governance Remediation — Ownership, Metrics, Rollback

## Named ownership (fill with actual GitHub handles / team)

| Gap category | Primary owner | Backup | Target |
|--------------|---------------|--------|--------|
| 27 mutable action references | *TBD* | *TBD* | Eliminate all |
| 11 PR credential exposures | *TBD* | *TBD* | Eliminate or isolate |
| 3 unauthorized contents:write | *TBD* | *TBD* | Align to allowlist |
| 9 privileged untrusted-code paths | *TBD* | *TBD* | Eliminate or isolate |
| Main ruleset creation (external) | *GitHub Org Admin* | *TBD* | Live + verified |
| Evidence & PR updates | *TBD* | *TBD* | Continuous |

Update this table in the same PR that performs the work.

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
