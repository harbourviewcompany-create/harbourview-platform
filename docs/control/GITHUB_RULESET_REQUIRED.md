# Required GitHub repository ruleset

The production branch must have at least one active ruleset protecting `main`.

Required controls:

- target branch: `main`
- enforcement: `active`
- block force pushes
- block branch deletion
- require pull request before merge
- require at least 1 approving review
- dismiss stale approvals on new commits
- require CODEOWNERS review
- require conversation resolution
- require the latest base commit / strict required-status-check policy
- restrict bypass to repository administrators only
- do not permit ordinary workflow identities, users, teams, or integrations to bypass the ruleset

Canonical required status-check contexts are defined in `docs/control/REQUIRED_MAIN_STATUS_CHECKS.txt` and must be configured exactly. Each required check should be bound to its GitHub App/integration source rather than accepting an arbitrary status writer.

The governance policy gate fails closed when the active `main` ruleset is absent, inactive, missing a canonical check, contains an unapproved check, or leaves a required check source unbound.

The production governance audit also verifies repository CODEOWNERS, immutable workflow action references, and production migration attribution. The live database portion is read-only.

The connected GitHub integration used by the remediation tooling exposes rulesets as read-only. Creating or editing this ruleset therefore requires a repository administrator through GitHub repository settings/API administration access.
