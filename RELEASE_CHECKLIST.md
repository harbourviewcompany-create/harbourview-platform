# Release Checklist

## Before merge

- [ ] No raw secrets in code, docs, tests, screenshots or comments.
- [ ] `npm ci` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm audit --omit=dev --audit-level=high` passes or has approved exception.
- [ ] Gitleaks passes.
- [ ] Security-impacting code reviewed by a second human.
- [ ] Database migration reviewed against live schema export.

## Before production deploy

- [ ] Supabase service-role secret is rotated after known exposure.
- [ ] Production env vars are present and not exposed as `NEXT_PUBLIC_*` secrets.
- [ ] Upstash Redis env vars are set.
- [ ] Branch protection requires Security CI.
- [ ] Staging deploy passed health check.
- [ ] Staging RLS tenant-isolation tests passed.
- [ ] Public feed token tests passed for valid, invalid, expired and revoked tokens.
- [ ] Backup confirmed.
- [ ] Rollback path confirmed.

## After production deploy

- [ ] Admin health endpoint returns OK for admin.
- [ ] Invalid feed token returns 404.
- [ ] Revoked feed token returns no dossier data.
- [ ] Expired feed token returns no dossier data.
- [ ] Valid feed token returns sanitized dossier only.
- [ ] Logs contain no secrets.
- [ ] No unexpected Supabase auth or Postgres errors.
