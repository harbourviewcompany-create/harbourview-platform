# Harbourview Platform

Harbourview Platform is a Next.js application for operating an intelligence workflow around sources, signals, review queues and dossier publishing.

## Verified stack

- Next.js 15
- React 19
- TypeScript
- Supabase SSR client libraries
- Vitest
- ESLint

## Current app shape

The root route redirects to `/app` and the operator dashboard loads server-side dashboard statistics and recent signals from Supabase-backed queries.

## Environment

Copy `.env.example` to `.env.local` and fill in real values.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`

Optional / environment-specific:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_ANALYST_EMAIL`
- `TEST_ANALYST_PASSWORD`

Do not commit `.env.local`.
Do not expose `SUPABASE_SERVICE_ROLE_KEY` through any `NEXT_PUBLIC_*` variable.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## GitHub operating model

GitHub is the delivery surface for:

- source control
- pull requests
- CI
- release discipline
- environment documentation

A GitHub Actions CI workflow should pass on every pull request and every push to `main`.

## Supabase operating model

Supabase is the backend system for:

- auth
- Postgres data
- server-side queries
- storage / future asset workflows
- row-level access controls

Recommended project rule:

- GitHub is always required
- Supabase is the default backend for shared/networked Harbourview product work
- local-only tools may use SQLite when offline-first behavior is the product requirement

## Immediate priorities

1. keep environment variables accurate and minimal
2. keep CI green on every push
3. keep Supabase schema and app code aligned
4. avoid introducing backend logic that bypasses the server-side Supabase access layer

## Notes

This repository already contains a Supabase-backed application surface. The immediate need is operational hardening and disciplined delivery, not replacing the stack.
