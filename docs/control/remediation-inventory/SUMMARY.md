# Bootstrap inventory summary (pre-audit)

Generated as a starting point on 2026-09-15. Replace with live output from `scripts/verify-governance-policy.sh` after the audit runs on a complete workflow tree.

| Category | Bootstrap status | Target |
|----------|------------------|--------|
| Mutable action refs | Many known (see mutable-action-refs.txt) | 0 |
| PR production secrets | Pending full scan | 0 |
| PR contents:write | Pending full scan | 0 |
| Unauthorized contents:write | Pending full scan | 0 |
| Privileged untrusted checkout | Pending full scan | 0 |
| Live main ruleset | 0 (absent) | ≥1 matching canonical |

**Next:** Rebase this control-surface branch onto a full workflow tree, run Production Governance Audit, commit the regenerated inventory files, then work the lists to zero.
