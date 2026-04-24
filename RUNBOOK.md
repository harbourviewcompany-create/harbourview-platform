# Harbourview Operations Runbook

## Production deployment gate

Do not deploy unless all items are true:

1. Supabase exposed service secret has been rotated.
2. `npm ci` passes.
3. `npm run typecheck` passes.
4. `npm run lint` passes.
5. `npm test` passes.
6. `npm run build` passes.
7. `npm audit --omit=dev --audit-level=high` passes or has an approved exception.
8. Gitleaks passes.
9. Supabase schema and RLS policy export has been reviewed.
10. `supabase/migrations/20260424_security_hardening.sql` has been applied to staging first.
11. Feed-token route has been tested with valid, invalid, expired and revoked tokens.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Production must fail closed if Redis env vars are missing.

## Supabase schema and RLS export

Run from a trusted machine with Supabase CLI authenticated:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db dump --schema public --file supabase/schema-public.sql
supabase db dump --schema auth --file supabase/schema-auth.sql
psql "$DATABASE_URL" -f scripts/export-rls-policies.sql > supabase/rls-policies-export.txt
```

If `DATABASE_URL` is unavailable, export policies from Supabase SQL Editor using the query in `scripts/export-rls-policies.sql`.

## Applying the security migration

Apply to staging first:

```bash
supabase db push
```

Or paste `supabase/migrations/20260424_security_hardening.sql` into Supabase SQL Editor for the staging project.

If the migration fails because expected tables or columns differ, stop and adjust the migration to match the real schema. Do not weaken RLS to make the migration pass.

## Health check

After deploy, sign in as admin and call:

```bash
curl -i https://<APP_HOST>/api/admin/health
```

Expected authenticated response:

```json
{"ok":true,"service":"harbourview-web","environment":"production","latency_ms":123}
```

## Rollback

1. Revert the deploy in the hosting provider.
2. If a DB migration was applied, restore from the latest verified backup unless a forward-only corrective migration is safer.
3. Disable affected public feed tokens if feed leakage is suspected.
4. Run health check.
5. Record incident notes in the incident log.

## Failed deploy

1. Stop further deploys.
2. Inspect CI logs without printing secrets.
3. Confirm env variables exist in the deployment provider.
4. Confirm Redis and Supabase connectivity.
5. Re-run `npm ci && npm run typecheck && npm run lint && npm test && npm run build` locally.
6. Revert if unresolved within the incident window.
