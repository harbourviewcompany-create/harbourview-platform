# Cloudflare deployment architecture

Status: controlled design / no production change

Last audited: 2026-08-15

## Decision

Harbourview has two distinct Cloudflare concepts and they must remain separate.

### Active target A — `harbourview`

The active repository Cloudflare target is the standalone intelligence/health Worker defined by root `wrangler.toml`.

- Worker name: `harbourview`
- Entrypoint: `scripts/engine/cloudflare-worker.ts`
- HTTP surface: `/healthz`
- `workers.dev`: enabled
- Cron Triggers: none
- Ingestion authority: Supabase Edge Functions + `pg_cron`
- Web application authority: none

This Worker must not be converted in place to OpenNext. Doing so would replace a utility Worker with a web runtime and would make the existing Worker identity/hostname/deployment history ambiguous.

### Reserved target B — `harbourview-platform-web-preview`

A full Next.js deployment on Cloudflare is technically appropriate only as a separate Worker and, initially, only as a preview/parity target.

The reserved design name is `harbourview-platform-web-preview`. The design template is `config/cloudflare/wrangler.web-preview.example.toml`.

This target is not active. Current `package.json` does not install `@opennextjs/cloudflare`; there is no `.open-next/worker.js`; no OpenNext build/deploy scripts exist; and Vercel remains the production web authority.

## Worker-name reconciliation

Root `wrangler.toml` is authoritative for the connected standalone Worker and uses `name = "harbourview"`.

If Cloudflare still shows a Worker/project named `harbourview-platform`, treat it as legacy/ambiguous until inspected. Before changing anything in the dashboard, record:

1. its current deployment SHA/version;
2. connected GitHub repository and root directory;
3. workers.dev hostname;
4. custom domains/routes;
5. Cron Triggers;
6. Variables and Secrets names only, never values;
7. invocation history and whether `/healthz` resolves there.

Then apply one of these non-destructive dispositions:

- If it is the old identity of the same health Worker and has no distinct deployment/route dependency, disconnect or archive it after the `harbourview` Worker is confirmed healthy.
- If it has distinct traffic or a distinct deployment, leave it unchanged and document that role before any rename.
- Never rename root `wrangler.toml` back to `harbourview-platform` solely to make an unexplained dashboard object pass a build.

## Active Worker dashboard checklist

Cloudflare dashboard target: Worker `harbourview`.

### Build configuration

Repository: `harbourviewcompany-create/harbourview-platform`

Root directory: repository root

Build command:

```text
npm run typecheck
```

Deploy command:

```text
npx wrangler deploy
```

Build Variables & Secrets: none required by the current health Worker build.

### Runtime Settings → Variables and Secrets

Add as a **Variable**:

```text
NEXT_PUBLIC_SUPABASE_URL
```

Add as a **Secret**:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Do not expose the secret value in source control, logs, screenshots, PRs or documentation.

`NODE_ENV=production` and `INTELLIGENCE_WORKER_ID=cf-worker-01` are already defined under `[vars]` in root `wrangler.toml`.

`WORKER_BATCH_SIZE` is optional and inert while no Cron Trigger exists. Leave it unset unless a future ingestion cutover is explicitly approved.

### Bindings

The current health Worker requires no KV, D1, R2, Queue, Durable Object, service or assets binding.

The former placeholder `RATE_LIMIT_KV` binding is not part of the live contract and must not be recreated merely to satisfy an old configuration.

### Triggers

There must be **no Cron Trigger** on the `harbourview` Worker while the Supabase ingestion pipeline remains active.

A Cloudflare Cron Trigger that reaches `scheduled()` would call `WorkerNode.runOnce()` for the historical ingestion schedule and create a second writer to the same intelligence persistence layer.

### Health verification

After an authorized dashboard configuration/deployment change, verify:

```text
GET https://<harbourview-workers-dev-host>/healthz
```

Expected conditions:

- configuration is present;
- Supabase heartbeat query succeeds;
- no write is performed by `/healthz`;
- no Cloudflare Cron Trigger exists;
- Supabase `pg_cron` remains the only scheduled ingestion authority.

## Full Next.js/OpenNext preview design

Do not activate this section without explicit authorization. It is intentionally designed so it cannot replace or disturb the Vercel production release path.

### Required package changes at activation time

Install the Cloudflare OpenNext adapter and retain Wrangler as a development dependency:

```text
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

Add an `open-next.config.ts` with this minimum contract:

```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig()
```

Add package scripts:

```json
{
  "preview:cloudflare": "opennextjs-cloudflare build && opennextjs-cloudflare preview --config config/cloudflare/wrangler.web-preview.toml",
  "build:cloudflare": "opennextjs-cloudflare build",
  "deploy:cloudflare-preview": "opennextjs-cloudflare build && opennextjs-cloudflare deploy --config config/cloudflare/wrangler.web-preview.toml",
  "cf-typegen": "wrangler types --config config/cloudflare/wrangler.web-preview.toml --env-interface CloudflareEnv cloudflare-env.d.ts"
}
```

Exact CLI flags must be revalidated against the installed adapter version during activation; do not assume an old adapter command surface.

### Wrangler/OpenNext target

When activated, promote the example template to an explicitly invoked configuration. The required contract is:

```toml
name = "harbourview-platform-web-preview"
main = ".open-next/worker.js"
compatibility_date = "<activation-date>"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[observability]
enabled = true
```

The preview Worker must have:

- no Cron Triggers;
- no production custom domain;
- no route claiming the Vercel production hostname;
- no ingestion-specific Cloudflare binding;
- no Vercel deployment credential;
- a separate Worker identity from `harbourview`.

### Cloudflare Workers Builds — Build Variables & Secrets

Because Next.js public environment values are inlined during build, put the following in **Build Variables & Secrets** when the preview target is activated.

Required build variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_URL
```

Add any enabled `NEXT_PUBLIC_HARBOURVIEW_*` feature flags used by the desired preview build. The canonical list and classification is `config/environment-manifest.json`.

Optional Sentry source-map build values:

```text
SENTRY_ORG                    # Variable
SENTRY_PROJECT                # Variable
SENTRY_AUTH_TOKEN             # Secret
NEXT_PUBLIC_SENTRY_DSN        # Variable, if client Sentry is enabled
```

Do not copy runtime-only provider/admin secrets into Build Variables merely because they exist in Vercel or GitHub. If a future SSG/build path proves a server-only value is required at build time, update the environment manifest and evidence first.

### Cloudflare Settings → Variables and Secrets for the web preview

Core runtime variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_URL
```

Core/runtime secrets required for production-equivalent server behavior:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Feature-specific runtime configuration is copied only for features exercised in the preview. Examples include Stripe, Upstash, Resend, AI-provider, Hugging Face, Google Drive and operator secrets. Every live name, sensitivity, provider and requirement is classified in `config/environment-manifest.json`.

Do not copy these Vercel/GitHub deployment credentials into Cloudflare runtime:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VERCEL_AUTOMATION_BYPASS_SECRET
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
PGPASSWORD
E2E_TEST_USER_PASSWORD
```

### OpenNext bindings

The minimum OpenNext web-preview binding is:

```text
ASSETS -> .open-next/assets
```

No KV, R2, D1, Queue or Durable Object binding is part of the baseline. If OpenNext caching or another feature later requires a binding, add it only with an explicit data-ownership and lifecycle decision.

## Vercel compatibility work required before Cloudflare web production

The current application contains provider-specific assumptions that are acceptable while Vercel is the only production web authority but must be resolved before Cloudflare can claim production parity.

At minimum:

1. `next.config.mjs` uses `VERCEL`/`VERCEL_ENV` to distinguish production/local Supabase behavior.
2. Sentry environment naming prefers `VERCEL_ENV`.
3. `lib/network/rateLimit.ts` only emits its missing-Upstash production warning when `VERCEL_ENV=production`.
4. Playwright injects `x-vercel-protection-bypass` when `VERCEL_AUTOMATION_BYPASS_SECRET` is present.
5. the protected smoke route uses `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_ENV` in production-target detection.
6. the production promotion workflow is intentionally Vercel-specific and must remain unchanged until provider authority changes.
7. Node.js middleware is not assumed portable to Workers without an adapter/runtime compatibility check.
8. Google API/service-account, Stripe SDK/webhooks, Supabase SSR/cookies, Sentry, Three/WebGL client bundles, Upstash, Resend and all Node built-ins used by route handlers require workerd parity verification.

These are preview-compatibility tasks, not permission to rewrite application architecture.

## Environment manifest

`config/environment-manifest.json` is the machine-readable registry for environment configuration. Each entry records:

- stage: Build only, Runtime only, Build + Runtime or CI/Deploy only;
- sensitivity: Secret or Plain variable;
- provider;
- requirement;
- target(s);
- Cloudflare placement for the current health Worker and future web preview.

The manifest also records:

- the future `ASSETS` Cloudflare binding;
- dynamic `process.env[metadata.auth_env]` source credentials;
- dynamic LLM model-variable names;
- forbidden public Hugging Face prefixes.

Before Cloudflare ingestion is ever activated, query production `source_registry.metadata.auth_env` for every distinct environment-secret name. Git alone cannot prove that dynamic set.

## CI and verification gates

The required `Security / Leakage` job should run:

```text
npm run check:env-manifest
npm run check:cloudflare-architecture
```

The architecture check proves that:

- root `wrangler.toml` remains the `harbourview` health Worker;
- no root Cron Trigger exists;
- root Worker is not converted to `.open-next/worker.js`;
- the reserved web-preview identity remains distinct;
- the OpenNext template declares the `ASSETS` binding;
- the preview template has no Cron Trigger or custom route;
- Vercel remains production-web authority;
- Cloudflare web production remains HOLD;
- the current health Worker requires the Supabase URL as a Variable and service-role key as a Secret.

The environment check proves all static application/config `process.env` references are represented in the manifest and rejects forbidden public Hugging Face variables.

### Current health Worker verification commands

```text
npm ci
npm run typecheck
npm run check:env-manifest
npm run check:cloudflare-architecture
npx wrangler deploy --dry-run --config wrangler.toml
```

`wrangler deploy --dry-run` must remain a dry run in repository/PR verification. Do not run a real deploy as part of this remediation.

### Future web-preview activation verification

After OpenNext is explicitly authorized and installed:

```text
npm ci
npm run typecheck
npm run test:security
npm run test:visibility
npm run build
npm run build:cloudflare
npm run preview:cloudflare
npm run test:e2e
```

Then run a workerd-targeted parity matrix covering at least:

- anonymous public pages;
- Supabase sign-in/sign-out/callback and SSR cookies;
- authenticated Command Centre;
- public marketplace reads;
- protected marketplace mutations;
- admin denial and authorized admin access;
- Stripe checkout and webhook signature handling using non-production test resources;
- Upstash distributed rate limiting;
- Resend notification path using a non-production recipient;
- AI/HF routes with feature-specific credentials;
- Google Drive dossier access if that feature is in preview scope;
- Sentry initialization;
- large static/image assets;
- leakage/security regression suite.

No production data mutation is required to establish web-runtime compatibility.

## GO/HOLD

Current standalone `harbourview` health Worker architecture: **GO at repository level** once the root configuration and checks pass. Dashboard/runtime GO additionally requires the Supabase URL Variable, service-role Secret and a successful `/healthz` check, with zero Cron Triggers.

Cloudflare full Next.js preview: **HOLD** until OpenNext dependency/config activation is explicitly authorized and workerd parity evidence passes.

Cloudflare full Next.js production: **HOLD**. Vercel remains Harbourview's production web authority.
