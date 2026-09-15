# Approved `contents: write` Allowlist

Only the workflows / jobs listed below may request `contents: write`.

Any other workflow that requests `contents: write` is a governance failure and must be remediated (remove the permission or move the write into an allowlisted trusted job).

## Allowlist (canonical)

| Workflow file | Job (if restricted) | Rationale | Owner |
|---------------|---------------------|-----------|-------|
| *(populate from current approved set)* | | | |

## Exception process

1. Open a PR that adds the workflow to this file **and** justifies why write is required.
2. CODEOWNERS for `docs/control/` and security-sensitive paths must approve.
3. The change must still pass the governance audit (no untrusted code execution in the same privileged context).
4. After merge, the governance scanner treats the new entry as approved.

## Removal

When a write capability is no longer needed, remove the entry and the permission in the same PR. Prefer least privilege at all times.

This file is the authoritative allowlist referenced by the governance scanner and by remediation work on the 3 unauthorized `contents: write` findings.
