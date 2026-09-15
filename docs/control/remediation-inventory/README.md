# Remediation Inventory (auto-generated)

This directory is populated by `scripts/verify-governance-policy.sh` on every governance run.

| File | Meaning |
|------|---------|
| `mutable-action-refs.txt` | External `uses:` lines that are not full 40-char SHAs |
| `pr-production-secrets.txt` | PR-triggered workflows that reference production credentials |
| `pr-contents-write.txt` | PR-triggered workflows that request `contents: write` |
| `unauthorized-contents-write.txt` | Workflows with `contents: write` outside the approved allowlist |
| `privileged-untrusted-checkout.txt` | Privileged workflows that also reference untrusted PR-head code |
| `SUMMARY.md` | Counts for the PR evidence section |

After every remediation push, re-run the governance workflow and commit the updated inventory files (or let a follow-up bot do so). The lists are the authoritative remediation backlog.

Do **not** edit these files by hand to force a green result. Fix the underlying workflows.
