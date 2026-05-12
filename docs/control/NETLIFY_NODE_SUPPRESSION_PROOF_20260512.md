# Netlify Node Suppression Proof 2026-05-12

This temporary proof branch intentionally uses the ordinary non-allowlisted branch family `fix/*`.

Expected behavior:

- Netlify should run `node scripts/netlify-ignore-branch-policy.mjs`.
- The script should return exit `0` for this `fix/*` branch.
- Netlify should cancel/ignore the preview build instead of publishing a deploy-preview URL.

Close this PR unmerged after evidence is captured.
