# Pending production migration control repair — 2026-08-03

Status: **HOLD**

Base commit: `f7a28c0e78b0ce693eded1dd7284731b7c3b3d43`

## Root causes repaired

1. The migration-diff workflow checked a PR head object that was absent from the shallow checkout. The resulting `git diff` fatal error was masked by a pipeline without `pipefail`.
2. Environment verification was hardcoded to accept only the historical HTTP 404 state, preventing a valid administrator export from being recorded.
3. The validator compared decision records to counts stored in the same JSON instead of independently rebuilding the repository and live migration universes.
4. Source commit, tree, workflow run, artifact ID, and artifact digest were metadata rather than enforced bindings.
5. Negative tests did not cover coordinated count edits, source-binding drift, evidence drift, duplicate-prefix drift, false environment verification, or credential leakage.
6. Evidence wording did not clearly distinguish automatic preview integrations from manual production deployment actions.
7. Security-sensitive GitHub Actions used mutable major-version tags.

## Repair design

The repair keeps the three-file Elite Digest allowlist unchanged and adds a deterministic evidence chain:

- the exact read-only artifact manifest;
- the exact linked Supabase migration-list output;
- all 784 repository migration filenames, versions, and Git blob hashes;
- all 798 normalized remote versions;
- SHA-256 bindings for the evidence files and canonical snapshots;
- fixed source commit, tree, run, artifact ID, and artifact digest bindings.

The validator uses the existing production manifest implementation to rebuild repository-only, live-only, duplicate, invalid-filename, approved-pending, and mismatch results. Decision records must exactly equal those derived sets.

## Environment transition

Environment evidence is now stored separately in `production-database-environment-evidence.json`.

`unverified` remains valid only as HOLD. A transition to `verified` requires a redacted Administration-read export proving required reviewers, self-review prevention, custom branch policies, `main` as the only branch, no tag policy, and absence of credential material.

The currently available GitHub connector confirms repository administrator authority but does not expose the environment-administration endpoint. No verified export is claimed.

## Workflow hardening

- `actions/checkout` and `actions/setup-node` are pinned to immutable commit SHAs.
- Checkout uses full history and does not persist credentials.
- The diff gate enables `set -euo pipefail`.
- Both base and head objects must exist before diffing.
- Any `supabase/migrations/*.sql` change fails the repair gate.

## Authorization boundary

This repair PR is documentation, evidence, validation, tests, and CI only. It does not authorize production migration application, data writes, deployment approval, alias movement, allowlist expansion, or secret access.

## Current-main reconciliation — 2026-08-10

This repair was reconstructed on main `c1fa8bb9952154c584e8ed0be628df6842c63fbb` after #1310. Immutable migration evidence is validated in an isolated worktree at the bound control base `f7a28c0e78b0ce693eded1dd7284731b7c3b3d43`, while the current PR diff separately proves that no `supabase/migrations/*.sql` file changes. Release Safety Shadow remains observational and non-required; it does not replace, weaken, or become a prerequisite for this specialized fail-closed verification.
