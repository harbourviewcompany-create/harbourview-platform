# NPM Install Environment HOLD

> **SUPERSEDED 2026-09-02 — verified live. The hold described below is not current.**
> `npm ci` completes in this repository in ~25 seconds (674 packages), and the exact
> tarball recorded below as the first failure now returns HTTP 200:
>
> ```
> $ curl -sS -o /dev/null -w "%{http_code}" https://registry.npmjs.org/zustand/-/zustand-5.0.12.tgz
> 200
> $ npm ci --no-audit --no-fund
> added 674 packages in 25s
> ```
>
> This matters because the document below has been cited to skip the `AGENTS.md` QA gate —
> lint, typecheck, test and build were reported as "unavailable" on the strength of it,
> without anyone re-testing. The classification below ("environment / proxy / registry
> access policy issue") was accurate when written and is kept as history. **Re-verify
> before citing it again**; do not use it as standing justification for an unrun QA suite.
>
> Full QA run on 2026-09-02 under this correction: lint 0 errors / 209 warnings,
> typecheck exit 0, 1,169 tests passed across 142 files, production build 0 errors.


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
