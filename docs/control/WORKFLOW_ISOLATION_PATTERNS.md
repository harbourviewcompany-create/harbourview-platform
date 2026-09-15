# Preferred Workflow Isolation Patterns

These patterns are mandatory for any new or remediated workflow. Superficial `if:` conditions that still allow attacker-controlled code to reach privileged execution are insufficient.

## 1. Production credentials / secrets

**Preferred**
- Production secrets and long-lived credentials exist only on trusted events:
  - `push` to `main`
  - `workflow_dispatch` (with required reviewers / environment protection where possible)
  - `schedule`
- PR-triggered jobs never receive production secrets.
- Prefer OIDC + short-lived, audience-scoped tokens over long-lived repository/environment secrets whenever the target system supports it.

**Allowed isolation**
- Separate jobs:
  - Job A (PR / untrusted): checkout PR head, run pure validation, no secrets, minimal permissions.
  - Job B (trusted event only): receives secrets, never checks out untrusted PR head.

**Forbidden**
- `secrets.*` or environment secrets on any job that runs on `pull_request` / `pull_request_target` and checks out the PR head.
- Passing production credentials into a matrix or reusable workflow that can be invoked from a PR context.

## 2. Untrusted PR-head checkout / fetch / execute

**Preferred**
- Untrusted code (PR head) is only checked out in jobs that have:
  - `contents: read` (or none)
  - no `id-token: write`
  - no production secrets
  - no ability to push, create releases, or modify protected branches
- Privileged actions (write to main, deploy, mutate production, create rulesets, etc.) run only on trusted events and never execute code from the PR head.

**Structural split (required pattern)**
```yaml
jobs:
  validate-pr:                    # untrusted
    if: github.event_name == 'pull_request'
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<full-sha>
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      # pure checks only

  apply-trusted:                  # trusted
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: write             # only if on allowlist
    steps:
      - uses: actions/checkout@<full-sha>
        # defaults to the trusted ref; never the PR head
```

**Forbidden**
- Checking out PR head (or `pull_request_target` + head ref) in the same job that has elevated permissions or secrets.
- Using `pull_request_target` with a checkout of the untrusted head and then running any script from that tree.

## 3. Action / reusable-workflow pinning

- Every external `uses:` must be a full 40-character commit SHA.
- Recommended form: `uses: org/action@<40-char-sha>  # vX.Y.Z`
- Prefer a thin internal reusable workflow (itself pinned once) when the same action is used repeatedly; callers then reference the internal workflow by SHA.

## 4. Review checklist for any workflow change

- [ ] No mutable tags/branches in `uses:`
- [ ] No production secrets on PR paths
- [ ] No privileged permissions on jobs that execute untrusted code
- [ ] `contents: write` only if the workflow is on the approved allowlist
- [ ] OIDC preferred over long-lived secrets where feasible

Reference: original HOLD decision (14 Sep 2026) and `docs/control/REMEDIATION_INVENTORY.md`.
