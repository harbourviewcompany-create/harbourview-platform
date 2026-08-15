# Deployment Integration Control

## Objective

Prevent ordinary working branches from creating unintended external deployments while preserving the existing Vercel production path and keeping Cloudflare targets explicit and isolated.

## Canonical Vercel production

The canonical production web domain is `harbourview.vercel.app`. Vercel remains the primary production web target unless `docs/control/DEPLOYMENT_TARGETS.md` is explicitly changed.

The exact-SHA production promotion workflow remains authoritative. This Cloudflare remediation does not change that workflow, Vercel project mapping, production domain, environment values or deployment credentials.

## Vercel branch policy

Vercel reads `vercel.json` and the repository's ignore script. Existing production/main and approved preview/deploy intent rules remain unchanged by the Cloudflare architecture work.

## Netlify branch policy

Netlify remains an intentional secondary preview/alternate target under `netlify.toml` and `scripts/netlify-ignore-branch-policy.sh`. Its current policy remains independent of Cloudflare.

## Cloudflare Workers Git integration

The active repository Cloudflare configuration is **root `wrangler.toml`**, not `wrangler.jsonc`.

It defines one standalone Worker:

- name: `harbourview`
- entrypoint: `scripts/engine/cloudflare-worker.ts`
- role: intelligence/health utility
- live HTTP surface: `/healthz`
- Cron Triggers: none
- ingestion authority: Supabase Edge Functions + `pg_cron`

Cloudflare Git integration is not controlled by `vercel.json` or `netlify.toml`. The Cloudflare dashboard must therefore be configured against the correct Worker identity and explicit build/deploy commands.

For Worker `harbourview`:

- repository: `harbourviewcompany-create/harbourview-platform`
- root directory: repository root
- build command: `npm run typecheck`
- deploy command: `npx wrangler deploy`
- runtime Variable: `NEXT_PUBLIC_SUPABASE_URL`
- runtime Secret: `SUPABASE_SERVICE_ROLE_KEY`
- no Cron Trigger

If a Cloudflare dashboard project named `harbourview-platform` still exists, it is not an authorized repository target by name alone. Inspect its deployment history, routes, repository connection and runtime configuration before renaming, deleting, reconnecting or repurposing it.

## Reserved OpenNext web preview

A future Cloudflare Next.js/OpenNext preview, if explicitly authorized, must use a **separate** Worker identity: `harbourview-platform-web-preview`.

The design template is `config/cloudflare/wrangler.web-preview.example.toml`. It is intentionally non-active. It must not be attached to the production domain, must not contain Cron Triggers and must not replace root `wrangler.toml`.

Current `package.json` does not install `@opennextjs/cloudflare` and does not contain active OpenNext deploy scripts. Do not infer an active full-web Cloudflare deployment from the presence of Wrangler alone.

## Environment authority

`config/environment-manifest.json` classifies application, build, runtime and deployment variables by stage, sensitivity, provider, requirement and Cloudflare placement.

`docs/deployment/CLOUDFLARE.md` is the operator runbook for Build Variables & Secrets versus Settings → Variables and Secrets.

GitHub Actions secrets, Vercel environment values, Supabase deployment credentials and Cloudflare Worker runtime secrets are separate secret stores. A value existing in one does not imply it exists in another.

## Ingestion non-duplication rule

No Cloudflare Cron Trigger may invoke `scripts/engine/cloudflare-worker.ts::scheduled()` while the existing Supabase ingestion writer remains active. Web-hosting work must not alter intelligence-ingestion ownership as a side effect.

A future ingestion cutover requires an explicit replacement plan and proof that the Supabase writer is disabled/replaced before Cloudflare becomes a writer.

## Verification checklist

GO for repository-level Cloudflare architecture requires:

1. root `wrangler.toml` names `harbourview` and points to `scripts/engine/cloudflare-worker.ts`;
2. root `wrangler.toml` contains no Cron Trigger and no `.open-next/worker.js` entrypoint;
3. `config/cloudflare/wrangler.web-preview.example.toml` uses a distinct Worker name and declares the future OpenNext `ASSETS` binding;
4. `npm run check:env-manifest` passes;
5. `npm run check:cloudflare-architecture` passes;
6. the existing required `Security / Leakage` check passes;
7. Vercel production-promotion configuration remains unchanged.

Runtime GO for the active `harbourview` Worker additionally requires the Cloudflare dashboard runtime Variable/Secret to be configured and `/healthz` to succeed after an explicitly authorized deployment.

Cloudflare full-web production remains HOLD until separately promoted in `docs/control/DEPLOYMENT_TARGETS.md`.
