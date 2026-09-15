# Approved `contents: write` Allowlist

Only the workflows listed below may request `contents: write`.

Any other workflow that requests `contents: write` is a governance failure and must be remediated (remove the permission or move the write into an allowlisted trusted job).

This list is synchronized with the explicit allowlist inside `scripts/verify-governance-policy.sh`. When adding or removing an entry, update **both** this file and the scanner in the same PR.

## Allowlist (canonical)

| Workflow file | Rationale |
|---------------|-----------|
| `.github/workflows/deploy-preview.yml` | Preview environment deployment |
| `.github/workflows/cleanup-preview-branches.yml` | Stale preview branch cleanup |
| `.github/workflows/marketplace-browser-smoke.yml` | Marketplace smoke verification |
| `.github/workflows/sync-figma-tokens.yml` | Design-token sync PR creation |
| `.github/workflows/reconstruct-stub-migrations.yml` | Migration ledger reconstruction (trusted) |
| `.github/workflows/apply-command-centre-repair.yml` | Controlled repair path |
| `.github/workflows/production-admin-security-probe.yml` | Admin security probe (trusted execution) |

## Exception process

1. Open a PR that adds the workflow to this file **and** to the `grep -vE` allowlist in `scripts/verify-governance-policy.sh`, and justifies why write is required.
2. CODEOWNERS for `docs/control/` and security-sensitive paths must approve.
3. The change must still pass the governance audit (no untrusted code execution in the same privileged context).
4. After merge, the governance scanner treats the new entry as approved.

## Removal

When a write capability is no longer needed, remove the entry from both this file and the scanner in the same PR. Prefer least privilege at all times.

This file is the authoritative human-readable allowlist referenced by remediation work on unauthorized `contents: write` findings.
