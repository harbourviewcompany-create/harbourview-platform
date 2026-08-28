# Vercel Git Deployment Admission Verification Note

The quota boundary is `git.deploymentEnabled` in `vercel.json`, not the ignored-build command.

Expected result:
- `main` creates the automatic production deployment.
- `preview/*` creates deliberate preview deployments used by `.github/workflows/deploy-preview.yml`.
- Every other branch is denied before Vercel creates a deployment record, including `sync/*`, nested Dependabot branches, `feat/*`, `fix/*`, agent branches, and previously unseen branch prefixes.
- `scripts/vercel-ignore-wbcc-only.sh` remains a second-layer build control for deployments that were intentionally admitted; it is not relied on to protect the daily deployment quota.

The contract is covered by `tests/deployment/vercelDeploymentPolicy.test.ts` and mirrors Vercel's documented `git.deploymentEnabled` behavior: unmatched branches default to enabled, matching rules use minimatch patterns, and any matching `true` rule enables deployment. The fail-closed policy therefore uses a catch-all deny rule plus explicit `main` and `preview/*` allow rules.
