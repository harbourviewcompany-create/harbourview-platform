# Vercel Deployment Protection Authentication Contract

## Scope

This contract governs authentication for the exact-deployment release verifier.

Canonical targets:

- GitHub repository: `harbourviewcompany-create/harbourview-platform`
- Vercel team: `team_0rK4jTvMLlSufR0ZzX4LCKYi` (`harbourview`)
- Vercel project: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (`harbourview`)
- Workflow: `.github/workflows/production-browser-verification.yml`
- Runtime identity route: `/api/release-identity`
- Browser verifier: `scripts/verify-exact-deployment.mjs`

## Current authentication mode

The active verifier uses Vercel's documented Protection Bypass for Automation header with the existing GitHub Actions secret:

```text
x-vercel-protection-bypass: <VERCEL_AUTOMATION_BYPASS_SECRET>
```

This is the same existing project-scoped bypass credential already used by Harbourview production verification jobs. This repair does not create, rotate, revoke, or otherwise modify the Vercel bypass secret or Deployment Protection configuration.

The secret must remain in GitHub Actions secrets and must never be written to repository files, artifacts, logs, URLs, query strings, screenshots, or requests to third-party origins. The verifier injects the header only when the request origin exactly matches the immutable Harbourview deployment origin.

## Why GitHub OIDC Trusted Sources is not the active gate

The prior verifier requested a short-lived GitHub Actions OIDC token and sent it in:

```text
x-vercel-trusted-oidc-idp-token: <GitHub Actions OIDC token>
```

Vercel documents this as a valid Deployment Protection bypass only when the project is configured to trust the corresponding external OIDC source. The repository implementation was shipped before that external Trusted Sources configuration had been completed and proven. The result was a Vercel Authentication redirect (`HTTP 302`) from the immutable deployment URL before `/api/release-identity` could execute.

Repository code cannot safely infer or create that external trust relationship. Until Trusted Sources is explicitly configured and proven in Vercel, the release gate must use the already-provisioned Protection Bypass for Automation path rather than fail every exact-deployment verification.

OIDC remains the preferred future replacement for the reusable bypass secret because it is short-lived. Migration back to OIDC requires an explicit, separately controlled Vercel configuration change and positive/negative authentication proof before the bypass secret is removed from this workflow.

## Exact deployment event contract

Vercel repository-dispatch events must provide all of the following and the workflow must reject anything else:

- `client_payload.project.id == prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`
- `client_payload.id` is the immutable `dpl_...` deployment ID
- `client_payload.url` is the immutable generated deployment URL, not the mutable production or Git branch alias
- `client_payload.git.sha` is the full 40-character deployed Git SHA
- `client_payload.environment` is `preview` or `production`

The verifier checks those values again against `/api/release-identity`, which returns Vercel system runtime identity (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID`, `VERCEL_URL`, `VERCEL_PROJECT_ID`, `VERCEL_ENV`). Dispatch metadata alone is not release evidence.

## Fail-closed verification sequence

1. Validate project ID, deployment ID, immutable deployment hostname, Git SHA, and environment before any protected request.
2. Checkout the exact deployed Git SHA with reviewed immutable `actions/checkout` pin and no persisted credentials.
3. Install dependencies with `npm ci` under Node 22 and run `npm run verify:runtime`.
4. Require `VERCEL_AUTOMATION_BYPASS_SECRET` from GitHub Actions secrets.
5. Install Chromium from the lockfile-resolved Playwright package.
6. Send `x-vercel-protection-bypass` only to requests whose origin exactly equals the immutable deployment origin.
7. Require `/api/release-identity` to match deployment ID, deployment URL, project ID, Git SHA, and environment exactly.
8. Run the Chromium route/leakage/overflow probes with no `continue-on-error` path.
9. Persist `production-browser-verification-artifacts/release-evidence.json`, screenshots, and traces.
10. A missing bypass secret, protection rejection, identity mismatch, route failure, leakage failure, overflow failure, or missing evidence is a release HOLD.

## Acceptance proof

The repaired exact-deployment gate is considered proven when one immutable Preview deployment and one subsequent immutable Production deployment satisfy all of the following:

- A request without a valid protection credential remains protected where Deployment Protection applies.
- A request carrying `x-vercel-protection-bypass` reaches `/api/release-identity` successfully.
- The observed runtime identity exactly matches the Vercel dispatch deployment ID, immutable URL, Git SHA, project ID, and environment.
- The exact-deployment Chromium workflow completes successfully and uploads immutable release evidence.
- No mutable production alias is substituted for the immutable deployment URL.

A Preview verification is safe evidence for the authentication path. Production remains read-only verification only; this workflow does not deploy, promote, roll back, or mutate application data.
