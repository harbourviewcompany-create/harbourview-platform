# Action Pinning Reference (production-ready defaults)

Prefer full 40-character commit SHAs. When updating, keep the human-readable tag in a trailing comment.

## Common actions (resolve to latest trusted SHA before use)

| Action | Example pinned form |
|--------|---------------------|
| `actions/checkout` | `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2` |
| `actions/setup-node` | Resolve current SHA from the action's releases |
| `actions/cache` | Resolve current SHA |
| `actions/upload-artifact` | Resolve current SHA |
| `actions/github-script` | Resolve current SHA |
| `supabase/setup-cli` | Resolve current SHA |
| `denoland/setup-deno` | Resolve current SHA |
| `actions/setup-python` | Resolve current SHA |

## Internal reusable workflow pattern

When the same external action appears in many places:

1. Create `.github/workflows/reusable-checkout.yml` (or similar) that pins the external action once.
2. Callers use `uses: ./.github/workflows/reusable-checkout.yml@<sha-of-this-repo-commit>` or the full commit SHA of the reusable file after it is merged.

This reduces the number of places that must be re-pinned on upstream updates.

## Scanner rule

Any `uses: org/action@vX` or `@main` / `@branch` fails the governance gate. Only full 40-char SHAs (or local `./` paths) pass.
