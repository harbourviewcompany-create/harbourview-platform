# Cloudflare Workers Preview

## Purpose

Cloudflare is a non-production preview runtime only. Vercel remains Harbourview's production runtime and canonical production alias. This configuration does not create, upload, or deploy a Worker by itself.

## Runtime model

Harbourview uses Next.js App Router server features and must run on Cloudflare Workers through `@opennextjs/cloudflare`. Cloudflare Pages static output is not a valid preview runtime for dynamic App Router routes, server redirects, middleware, route handlers, authentication, or React Server Components.

Generated output:

- Worker entry: `.open-next/worker.js`
- Static assets: `.open-next/assets/`
- Wrangler configuration: `wrangler.jsonc`
- OpenNext configuration: `open-next.config.ts`

`.open-next/`, `.wrangler/`, `.dev.vars`, and environment-local secret files remain ignored by Git.

## Commands

- `npm run build:cloudflare` — build the OpenNext Worker bundle without deploying.
- `npm run preview:cloudflare` — build and run the application locally in the Workers runtime.
- `npm run upload:cloudflare` — build and upload a Worker version. Requires explicit authorization and Cloudflare credentials.
- `npm run deploy:cloudflare` — build and deploy. Requires explicit authorization and Cloudflare credentials.
- `npm run cf-typegen` — generate Worker binding types.

The GitHub Actions verification workflow runs only the build and local preview paths. It contains no upload or deploy command and requires no Cloudflare credentials.

## Build-time environment

The Next.js build may evaluate server modules and pre-render static routes. GitHub Actions and Cloudflare Workers Builds must provide the variables needed by those build paths.

Minimum baseline for the current application:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` where build-time code requires privileged server access
- `SUPABASE_JWT_SECRET` where authentication helpers require it

Feature-specific server variables remain required only when the corresponding routes or integrations are exercised. The complete registry remains in `.env.example`.

Local Worker preview values belong in `.dev.vars`, copied from `.dev.vars.example`. Real values and secrets must not be committed.

## Cloudflare project settings required after authorization

Create a new Workers project rather than reusing the static Pages project.

Recommended non-production project name:

`harbourview-platform-preview`

Repository configuration:

- Production branch: a dedicated preview branch or another operator-approved branch; do not point the Worker at the Vercel production alias.
- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler deploy` or `npm run deploy:cloudflare` only after deployment authorization.
- Worker entry: `.open-next/worker.js`
- Asset directory: `.open-next/assets`
- Compatibility flag: `nodejs_compat`
- Compatibility date: `2026-08-02` or a later operator-approved date.

Required GitHub/Cloudflare credentials for an authorized deployment workflow:

- `CLOUDFLARE_API_TOKEN` with least-privilege Workers Scripts and account access.
- `CLOUDFLARE_ACCOUNT_ID`.

These credentials are intentionally not referenced by the build-only workflow.

## Production separation

- Vercel production configuration and aliases remain unchanged.
- `npm run build` remains `next build` for Vercel and Node verification.
- No Worker route, custom domain, production alias, Pages project, or DNS record is created or modified by this change.
- Upload and deployment commands are documented but are not invoked in CI.
