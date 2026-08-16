# Vercel Trusted Sources + GitHub OIDC Release Contract

## Scope

This contract replaces long-lived `VERCEL_AUTOMATION_BYPASS_SECRET` authentication for the exact-deployment release verifier. It does not change deployment protection settings by itself.

Canonical targets:

- GitHub repository: `harbourviewcompany-create/harbourview-platform`
- Vercel team: `team_0rK4jTvMLlSufR0ZzX4LCKYi` (`harbourview`)
- Vercel project: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (`harbourview`)
- Workflow: `.github/workflows/production-browser-verification.yml`
- Runtime identity route: `/api/release-identity`
- Browser verifier: `scripts/verify-exact-deployment.mjs`

## External Vercel configuration required

The connected Vercel tool available during this remediation can inspect the project but does not expose a safe Trusted Sources mutation. Vercel's public project schema confirms `trustedSources.oidcProviders` exists, but the public documentation retrieved for this change does not define a stable provider-write payload. Do not invent or replay an undocumented PATCH body.

Configure the `harbourview` project in Vercel Deployment Protection / Trusted Sources to trust GitHub Actions OIDC for this repository. Keep the trust as narrow as Vercel's UI permits: this repository and the release-verification workflow/context only. Do not disable Deployment Protection and do not create a new long-lived bypass secret as part of this change.

GitHub Actions obtains a short-lived ID token using the workflow's `id-token: write` permission and sends it only to the immutable Harbourview deployment origin using Vercel's documented header:

```text
x-vercel-trusted-oidc-idp-token: <GitHub Actions OIDC token>
```

The token must never be placed in repository secrets, artifacts, logs, URLs, query strings, screenshots, or requests to third-party origins.

## Exact deployment event contract

Vercel repository-dispatch events must provide all of the following and the workflow must reject anything else:

- `client_payload.project.id == prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`
- `client_payload.id` is the immutable `dpl_...` deployment ID
- `client_payload.url` is the immutable generated deployment URL, not the mutable production or Git branch alias
- `client_payload.git.sha` is the full 40-character deployed Git SHA
- `client_payload.environment` is `preview` or `production`

The verifier checks those values again against `/api/release-identity`, which returns Vercel system runtime identity (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID`, `VERCEL_URL`, `VERCEL_PROJECT_ID`, `VERCEL_ENV`). Dispatch metadata alone is not release evidence.

## Fail-closed verification sequence

1. Validate project ID, deployment ID, immutable deployment hostname, Git SHA, and environment before obtaining an OIDC token.
2. Checkout the exact deployed Git SHA with reviewed immutable `actions/checkout` pin and no persisted credentials.
3. Install dependencies with `npm ci` under Node 22 and run `npm run verify:runtime`.
4. Request a short-lived GitHub OIDC token only inside the verification job.
5. Install Chromium from the lockfile-resolved Playwright package.
6. Send the OIDC header only to requests whose origin exactly equals the immutable deployment origin.
7. Require `/api/release-identity` to match deployment ID, deployment URL, project ID, Git SHA, and environment exactly.
8. Run the Chromium route/leakage/overflow probes with no `continue-on-error` path.
9. Persist `production-browser-verification-artifacts/release-evidence.json`, screenshots, and traces.
10. A mismatch, authentication failure, route failure, leakage failure, overflow failure, missing evidence, or missing Trusted Sources configuration is a release HOLD.

## Trusted Sources acceptance proof

The migration from `VERCEL_AUTOMATION_BYPASS_SECRET` is complete only when one real immutable deployment satisfies all of these checks:

- A protected request without any bypass credential remains denied/protected.
- A request carrying the GitHub Actions OIDC token in `x-vercel-trusted-oidc-idp-token` reaches `/api/release-identity` successfully.
- A request with a missing/invalid OIDC token does not reach the application route.
- The observed runtime identity exactly matches the Vercel dispatch deployment ID, immutable URL, Git SHA, project ID, and environment.
- The exact-deployment Chromium workflow completes successfully and uploads immutable release evidence.
- No `VERCEL_AUTOMATION_BYPASS_SECRET` is required by that workflow.

After this positive/negative proof is captured, legacy verification jobs that still use `VERCEL_AUTOMATION_BYPASS_SECRET` can be migrated to the same OIDC pattern and the reusable bypass secret can be retired through the normal secret-removal control path.

## Current release status

Repository implementation is present, but Trusted Sources is not considered configured or proven until the external Vercel setting and one live positive/negative authentication test are completed. Until then this gate remains `HOLD`.
