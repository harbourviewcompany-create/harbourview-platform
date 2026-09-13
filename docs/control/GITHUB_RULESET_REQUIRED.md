# Required GitHub repository ruleset

The production branch must have at least one active ruleset protecting `main`.

Required controls:

- target branch: `main`
- block force pushes
- block branch deletion
- require pull request before merge
- require at least 1 approving review
- dismiss stale approvals on new commits
- require CODEOWNERS review
- require all configured production CI checks to pass
- require conversation resolution
- restrict bypass to the repository owner/administrators only
- do not permit ordinary workflow identities to bypass the ruleset

The production governance audit queries the GitHub ruleset API and fails closed when no ruleset is present.

The connected GitHub integration used by the remediation tooling exposes rulesets as read-only. Creating this ruleset therefore requires a repository administrator through GitHub repository settings/API administration access.
