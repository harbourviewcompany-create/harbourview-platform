# Netlify Suppression Proof 2026-05-12

This branch intentionally uses the ordinary non-allowlisted branch family `fix/*`.

Expected deployment-control behavior:

- GitHub workflows may run if configured for pull requests.
- Netlify deploy-preview integrations should cancel/ignore rather than run full preview builds.
- Vercel Git deployments should remain suppressed by `git.deploymentEnabled=false` and the Vercel ignore policy.

This file is control-only and exists only to create a fresh branch/PR proof point after `netlify.toml` was normalized to:

```toml
[build]
  ignore = "scripts/netlify-ignore-branch-policy.sh"
```
