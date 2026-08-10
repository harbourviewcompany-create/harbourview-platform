# Production database GitHub environment evidence — 2026-08-02

Status: **HOLD — Administration-authorized configuration evidence remains unavailable.**

## Authoritative machine-readable record

The activation control now reads:

`supabase/release-controls/production-database-environment-evidence.json`

That record has an explicit state machine:

- `unverified`: no Administration-authorized export is present; activation remains HOLD.
- `verified`: a redacted Administration-read export proves every required protection and passes the release-control validator.

The earlier `environment_verification` object embedded in `pending-production-migration-decisions.json` is retained as historical evidence of the original probe. It is no longer the authoritative transition field.

## Current Administration path result

The connected GitHub identity reports repository administrator authority. The available connected GitHub action surface does not expose repository environment or deployment-branch-policy reads, so it cannot produce an Administration-authorized environment export.

The earlier Actions probe used a repository-issued token with `actions: read`, `contents: read`, and `deployments: read` and requested:

```text
GET /repos/harbourviewcompany-create/harbourview-platform/environments/production-database
```

The response was:

```text
HTTP 404 Not Found
```

This remains **inconclusive**. It is not evidence that the environment is absent or correctly configured.

## Required verified export

A future redacted export must prove all of the following:

1. Authorization source is an Administration-read identity or an administrator UI export.
2. Environment name is exactly `production-database`.
3. At least one required reviewer is configured.
4. Reviewer identities are represented only by unique SHA-256 proofs in committed evidence.
5. `prevent_self_review` is enabled.
6. Custom deployment branch policies are enabled.
7. Protected-branches mode is disabled for this environment policy.
8. The exact permitted branch list is `main` only.
9. No tag pattern is permitted.
10. Secret values, tokens, passwords, private keys, credentials, and authorization headers are absent.

The validator accepts a transition to `verified` only when every requirement is present. It rejects reviewer-free, self-review-enabled, multi-branch, tag-enabled, or credential-bearing exports.

## No live changes

This repair does not create or modify the environment, reviewer rules, branch policies, secrets, deployments, migrations, aliases, or production rows.
