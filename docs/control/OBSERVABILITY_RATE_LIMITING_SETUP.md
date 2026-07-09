# Observability & Rate Limiting — Deployment Setup

Companion doc to PR `feat/observability-rate-limiting`. Covers the steps that
can't be done in code and must be completed in the Vercel/Supabase/Sentry
dashboards before this is fully live in production.

## 1. Sentry

1. Create (or reuse) a Sentry project for `harbourview-platform`.
2. Set env vars in Vercel (Production + Preview): `NEXT_PUBLIC_SENTRY_DSN`,
   `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
   - `SENTRY_AUTH_TOKEN` is only needed for source map upload during build —
     scope it to the minimum Sentry permission (project:releases) and store
     it as a Vercel encrypted env var, not committed anywhere.
3. In Supabase → Logs → Drains, add a destination pointing at the Sentry DSN
   to pull Postgres/PostgREST/edge-function/cron logs into the same project
   as the Next.js errors. Keep it in its own Sentry sub-project per Sentry's
   own guidance, so app noise and infra noise can be filtered independently.
4. Verify: trigger a deliberate error in a preview deploy and confirm it
   lands in Sentry with a resolved stack trace before merging to `main`.

## 2. Upstash Redis (rate limiting)

1. Create an Upstash Redis database (region close to your primary Vercel
   deployment region to minimize added latency per rate-limit check).
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel
   (Production + Preview).
3. **Without these two vars set, `lib/network/rateLimit.ts` silently falls
   back to the old process-local in-memory behavior** — which does not
   enforce a real limit across serverless instances. This is intentional for
   local dev, but must not ship to production unconfigured. Confirm both
   vars are set before the next production deploy that includes this PR.
4. Routes now covered by real (Redis-backed) rate limiting once configured:
   `app/admin/login/submit`, `app/api/genetics/access-request`,
   `app/api/marketplace/capture`, `app/api/marketplace/listing-submission`,
   `app/api/marketplace/quote`, `app/api/marketplace/proof-request`,
   `app/api/signals/subscribe`, `app/api/watchlist/items`, `app/api/org/create`.

## 3. Supabase Advisors (manual, recurring — no code)

Dashboard-only, not automatable via migration or API. Add as a standing
checklist item after every migration batch (referenced from
`docs/control/DATABASE_CONTROL.md`):

1. Supabase Dashboard → Advisors → Security: confirm 0 unaddressed
   missing-RLS-policy warnings.
2. Supabase Dashboard → Advisors → Performance: review flagged missing
   indexes against tables touched by the migration batch just applied.
3. Log the check (pass/fail + date) in `docs/control/EVIDENCE_LOG.md`.

## Rollback

- Sentry: removing the env vars disables reporting; no code rollback needed
  (the SDK no-ops safely when `enabled: false`).
- Rate limiting: removing `UPSTASH_REDIS_REST_URL`/`TOKEN` reverts to the
  prior in-memory behavior automatically — no code change required to roll
  back the backing store. To fully revert the routes themselves, revert this
  PR's commits on `app/admin/login/submit`, the marketplace routes,
  `watchlist/items`, `org/create`, and `signals/subscribe`.
