# Harbourview Deployment Targets

## Purpose

This file records Harbourview's deployment-provider authority so build agents, reviewers, and branch-gate decisions do not treat Vercel, Netlify, or Cloudflare checks as interchangeable.

> Source of truth note: When deployment/provider metadata conflicts across docs, CI status text, or PR comments, treat this file and `docs/control/PROJECT_REGISTRY.md` as canonical and update them before changing provider behavior.

## Current authority

| Provider / target | Role | Status-check treatment | Production-launch treatment | Repository contract |
| --- | --- | --- | --- | --- |
| Vercel | Primary production web target | Required when Vercel preview/production checks are present or configured in branch protection | Required for production GO | Existing exact-SHA production promotion workflow, canonical production alias, runtime/leakage verification and Vercel-specific release evidence remain authoritative. |
| Netlify | Secondary preview / alternate deployment target | Required only for the named Netlify project classified below; other Netlify checks remain advisory until mapped | Required only for promoted Netlify target(s) | Netlify remains intentional and independent of the Cloudflare work described here. |
| Cloudflare Worker `harbourview` | Standalone intelligence/health utility | Its architecture contract is required when Cloudflare files change; it is not a substitute for the Vercel web release gate | Not a web-production target | Root `wrangler.toml` points to `scripts/engine/cloudflare-worker.ts`; `/healthz` is the active HTTP surface; there are no Cron Triggers. |
| Cloudflare/OpenNext web target | Reserved future preview target | Design-only until explicitly activated | **HOLD for production** | Current `package.json` does not install `@opennextjs/cloudflare` or expose OpenNext deploy scripts. Exact proposed configuration is documented in `docs/deployment/CLOUDFLARE.md` and `config/cloudflare/wrangler.web-preview.example.toml`. |

## Cloudflare target separation

Cloudflare has two distinct architectural concepts and they must never share one Worker identity:

1. `harbourview` — the existing standalone intelligence/health Worker. Its root configuration is `wrangler.toml`. It must stay free of Cron Triggers while Supabase Edge Functions + `pg_cron` remain the ingestion authority.
2. `harbourview-platform-web-preview` — the reserved name for a future full Next.js/OpenNext preview Worker. It is not active, has no production route/custom domain, and must use a separate Wrangler configuration if activated.

`harbourview-platform` is not an authorized Worker name in repository configuration. If an object with that name still exists in the Cloudflare dashboard, treat it as legacy/ambiguous until its deployment history, repository connection and routes are inspected. Do not repoint root `wrangler.toml` to that object and do not rename the active `harbourview` Worker merely to match a stale dashboard object.

The previous version of this document incorrectly said current `package.json` contained OpenNext `preview`, `deploy`, `upload` and `cf-typegen` scripts. It does not. That stale claim is removed here rather than manufacturing a deployment configuration that the repository does not yet support.

## Ingestion authority

Supabase Edge Functions + `pg_cron` remain the production intelligence-ingestion authority. The Cloudflare health Worker contains a dormant `scheduled()` implementation for recoverability, but root `wrangler.toml` deliberately declares no Cron Triggers. Adding a Cloudflare ingestion trigger while the Supabase pipeline is active would create a duplicate writer against shared intelligence tables and is a production HOLD condition.

Any future decision to move ingestion to Cloudflare requires a separate cutover plan that first disables/replaces the corresponding Supabase writer and verifies idempotency, source registry ownership, snapshot writes, circuit-state ownership and rollback. It is not part of a web-hosting migration.

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
5. `npm run check:env-manifest` and `npm run check:cloudflare-architecture` pass whenever the Cloudflare/environment contract is changed.
6. Any failing deployment check classified as advisory has a written reason explaining why it is non-blocking for that PR.

A Netlify or Vercel check must not be ignored merely because another provider passed. Cloudflare health-worker evidence cannot substitute for Vercel production-web evidence.

## Production-launch policy

Production GO requires evidence from the provider(s) promoted for the release:

1. Vercel production deployment evidence for the canonical Harbourview production domain.
2. Netlify deployment evidence for any Netlify site promoted as public, preview, mirror, or alternate launch surface.
3. Production-domain public/private leakage scan.
4. Anonymous admin denial evidence.
5. Public route smoke evidence for the release cutline.
6. Confirmation that no required provider preview/deploy check is failing.

Cloudflare/OpenNext web production is not included in this policy until an explicit control change promotes it. Creating an OpenNext preview Worker does not promote Cloudflare to production authority.

## Branch-protection interpretation

Branch protection is the source of enforcement, but this file is the source of intent. If GitHub requires a check that this file marks advisory or pending-owner-confirmation, reviewers must either let the required check pass, update branch protection to match this file, or update this file if the check is actually intended to be blocking.

## Agent instructions

When a build agent sees deployment-provider checks:

1. Inspect this file before classifying Vercel, Netlify or Cloudflare status.
2. Preserve Vercel as the production web target unless an explicit owner-approved control change supersedes it.
3. Preserve Netlify's documented role independently.
4. Treat root `wrangler.toml` as the `harbourview` intelligence/health Worker only.
5. Never add a Cloudflare Cron Trigger for ingestion while the Supabase ingestion writer remains active.
6. Do not activate `harbourview-platform-web-preview`, install OpenNext, attach a custom domain or change production secrets without explicit authorization.

## Current GO/HOLD defaults

| Decision | Default |
| --- | --- |
| Branch GO | Allowed with relevant build/test evidence. |
| Merge GO | Requires protected GitHub Actions, Project Registry Discipline when applicable, provider checks, environment-manifest validation and Cloudflare architecture validation for affected changes. |
| Vercel production GO | Governed by the existing exact-SHA production promotion workflow and production verification. |
| Cloudflare intelligence/health Worker GO | GO only when Worker identity is `harbourview`, runtime Supabase URL + service-role secret are configured, `/healthz` passes and no Cron Trigger exists. |
| Cloudflare/OpenNext web preview GO | HOLD until adapter installation/configuration is explicitly authorized and workerd parity tests pass. |
| Cloudflare web production GO | **HOLD** until separately promoted by owner decision and full compatibility/release evidence exists. |
