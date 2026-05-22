# Harbourview Deployment Targets

## Purpose

This file records Harbourview's deployment-provider authority so build agents, reviewers, and branch-gate decisions do not treat Vercel, Netlify, or Cloudflare/OpenNext checks as ambiguous noise.

> Source of truth note: When deployment/provider metadata conflicts across docs, CI status text, or PR comments, treat this file and `docs/control/PROJECT_REGISTRY.md` as canonical and update them first to prevent configuration drift.

Harbourview uses both Vercel and Netlify. This document does not change runtime code, deployment settings, provider configuration, branch protection, secrets, domains, or CI workflows. It is a control document for interpreting provider status checks and release evidence.

## Current authority

| Provider / target | Role | Status-check treatment | Production-launch treatment | Evidence basis | Notes |
| --- | --- | --- | --- | --- | --- |
| Vercel | Primary production target | Required when Vercel preview/production checks are present or configured in branch protection | Required for production GO | Repository has a `vercel-ignore-build` script and Harbourview has been operated as a Vercel-hosted platform | Vercel owns canonical production-readiness evidence unless superseded by a future control update. |
| Netlify | Secondary preview / alternate deployment target | Required only for the named Netlify project classified as required below; other Netlify checks are advisory until owner confirmation | Required only for the promoted Netlify target(s) | GitHub status checks are currently posted by Netlify for multiple projects | Netlify is intentional, not accidental. The project mapping below controls merge interpretation. |
| Cloudflare / OpenNext | Deferred / experimental deployment target | Advisory only; must not block merge unless promoted in this file | HOLD for production unless separately promoted and verified | `package.json` includes `preview`, `deploy`, `upload`, and `cf-typegen` scripts using OpenNext/Cloudflare, but no active provider-authority evidence or required check has been confirmed | Keep scripts available, but do not treat Cloudflare as an active release gate without a later owner decision. |

## Netlify project/status-check classification

| GitHub status check | Classification | Merge-gate meaning | Production-launch meaning | Rationale |
| --- | --- | --- | --- | --- |
| `netlify/harbourview-platform/deploy-preview` | Required Netlify preview mirror | Blocks merge if failing when the PR changes runtime, routing, build, package, deployment, public route, or smoke-test behavior. For docs-only/control-only PRs, failure may be treated as external/advisory only with explicit evidence. | Required only if the Netlify `harbourview-platform` site is being promoted as a launch target or public preview mirror for the release. | Name maps directly to the Harbourview platform and should be treated as the canonical Netlify project unless later superseded. |
| `netlify/harbourviewns/deploy-preview` | Pending owner confirmation | Advisory until mapped to a specific Harbourview product surface or branch-protection requirement. If branch protection requires it, merge is HOLD until it passes or branch protection is updated. | Not sufficient for production GO unless owner confirms its site purpose and production/public URL. | Status exists, but repository evidence does not prove whether it is canonical, namespace-specific, stale, or experimental. |
| `netlify/hv-network/deploy-preview` | Pending owner confirmation | Advisory until mapped to a specific Harbourview Network surface or branch-protection requirement. If branch protection requires it, merge is HOLD until it passes or branch protection is updated. | Not sufficient for production GO unless owner confirms its site purpose and production/public URL. | Status exists and may map to Harbourview Network work, but ownership and launch role are not documented in repo evidence. |

## Merge-gate policy

A PR may be Merge GO only when all of the following are true:

1. Required GitHub Actions checks pass.
2. Project Registry Discipline passes when sensitive/control/runtime files change.
3. Required deployment-provider checks pass according to this file and branch protection.
4. Route smoke and leakage checks pass when the PR changes public routes, build behavior, package scripts, smoke scripts, marketplace surfaces, signals/intelligence surfaces, or deployment behavior.
5. Any failing deployment check classified as advisory has a written reason in the PR body or review note explaining why it is non-blocking for that PR.

A Netlify or Vercel check must not be ignored merely because another provider passed. If both are active for the touched surface, both must be interpreted.

## Production-launch policy

Production GO requires evidence from the provider(s) promoted for the release:

1. Vercel production deployment evidence for the canonical Harbourview production domain.
2. Netlify deployment evidence for any Netlify site promoted as public, preview, mirror, or alternate launch surface.
3. Production-domain public/private leakage scan.
4. Anonymous admin denial evidence.
5. Public route smoke evidence for the release cutline.
6. Confirmation that no required provider preview/deploy check is failing.

If any provider target is still pending owner confirmation, production launch remains HOLD for that provider until its purpose, URL, environment, and branch-protection role are documented.

## Branch-protection interpretation

Branch protection is the source of enforcement, but this file is the source of intent. If GitHub requires a check that this file marks advisory or pending-owner-confirmation, reviewers must either:

- let the required check pass before merge;
- update branch protection to match this file; or
- update this file if the required check is actually intended to be blocking.

Do not bypass a required failing check by calling it noise without evidence.

## Agent instructions

When a build agent sees deployment-provider checks:

1. Inspect this file before classifying Vercel, Netlify, or Cloudflare status.
2. Do not remove Netlify; Harbourview uses Netlify intentionally.
3. Do not remove Vercel; Vercel is the primary production target unless this file is superseded.
4. Do not promote Cloudflare/OpenNext to an active merge or production gate unless this file is updated with owner confirmation.
5. For docs-only PRs touching this file, deployment checks may be advisory unless branch protection requires them.

## Current GO/HOLD defaults

| Decision | Default |
| --- | --- |
| Branch GO | Allowed with local/build/test evidence relevant to the changed files. |
| Merge GO | Requires required GitHub Actions, Project Registry Discipline when applicable, and required provider checks. |
| Production GO | HOLD unless Vercel production evidence and any promoted Netlify evidence are captured. |
| Cloudflare production GO | HOLD; deferred until promoted by owner decision. |
