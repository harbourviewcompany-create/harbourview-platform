# NPM Install Environment HOLD

## Scope

This document records the current Harbourview production stabilization HOLD related to deterministic npm dependency installation.

Branch:

```text
stabilize/production-recovery-main
```

## First failing command

```bash
npm ci --verbose
```

## First failing package

```text
zustand
```

## Exact failing registry URL

```text
https://registry.npmjs.org/zustand/-/zustand-5.0.12.tgz
```

## Failure type

```text
HTTP 403 Forbidden
```

## Repo-local checks completed

Confirmed during install-surface audit:

- `package.json` and `package-lock.json` aligned at root dependency declarations.
- Lockfile tarball URLs use normal npmjs registry paths.
- No malformed package URLs found.
- No `.npmrc` file present in repo.
- No custom registry/auth override committed.
- GitHub Actions workflows use standard `actions/setup-node` + `npm ci`.
- No custom npm auth injection observed in sampled workflows.

## Classification

Current evidence indicates:

```text
Environment / proxy / registry access policy issue
```

NOT:

- repo-local manifest corruption
- invalid tarball URLs
- malformed lockfile entries
- private package resolution
- committed registry override configuration

## Required unblock

Before continuing stabilization:

- allow npmjs tarball GET access without HTTP 403
OR
- provide an approved reachable npm registry mirror and matching npm configuration

## Stabilization rule

Do not continue deeper stabilization steps until deterministic `npm ci` succeeds.

Specifically do not proceed to:

- `npm run typecheck`
- `npm run build`
- leakage verification
- production deploy verification

until install determinism is restored.
