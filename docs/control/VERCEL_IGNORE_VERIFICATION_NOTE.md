# Vercel Ignored Build Step Verification Note

This documentation-only commit exists to verify that ordinary non-deploy branches skip Vercel preview deployments while GitHub Actions still run.

Expected result:
- Branch: `verify/vercel-ignore-nondeploy-branch`
- No deploy-intent marker in branch name or commit message
- Vercel preview build should be skipped by `scripts/vercel-ignore-wbcc-only.sh`
- GitHub Actions should still run normally
