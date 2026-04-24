# Incident Response

## Severity levels

- Critical: leaked Supabase service role key, RLS bypass, public feed leakage, unauthorized workspace access, compromised GitHub account, compromised Supabase account.
- High: failed authz on admin route, token revocation failure, production rate limiting unavailable, CI secret scan failure.
- Medium: broken health check, dependency advisory without active exploit, staging-only misconfiguration.

## Critical incident procedure

1. Declare incident and freeze deploys.
2. Preserve evidence without copying secrets into chat, issues or docs.
3. Rotate affected credentials.
4. Revoke affected public feed tokens.
5. Disable vulnerable route or roll back deploy.
6. Review Supabase Auth logs, Postgres logs and hosting logs.
7. Validate RLS policies with cross-tenant tests.
8. Redeploy only after CI passes and health check succeeds.
9. Write post-incident notes with cause, impact, fix and prevention.

## Suspected Supabase service-role compromise

1. Rotate service-role secret in Supabase Dashboard.
2. Update deployment secret `SUPABASE_SERVICE_ROLE_KEY`.
3. Update trusted local `.env.local` files.
4. Redeploy.
5. Search code, docs and logs for the old key fingerprint only, never the full key.
6. Review Supabase logs for privileged access during the exposure window.
7. Review all writes to `publish_events`, `public_feed_tokens`, `profiles`, `workspace_memberships` and `signals`.

## Suspected public feed token leak

1. Set `public_feed_tokens.status = 'revoked'` and `revoked_at = now()` for the affected token.
2. Generate a new raw token offline.
3. Store only its SHA-256 hash in `public_feed_tokens.token_hash`.
4. Send the new raw token through an approved secure channel.
5. Review `public_feed_token_access_events` for unknown IP/user-agent patterns.

## Suspected RLS regression

1. Stop deploys.
2. Run cross-tenant access tests.
3. Export policies using `scripts/export-rls-policies.sql`.
4. Compare against the last known-good export.
5. Apply corrective migration.
6. Re-run tests before re-enabling deployment.

## Compromised GitHub credential

1. Revoke the token in GitHub immediately.
2. Review recent pushes, workflow runs and repository secrets.
3. Rotate deployment provider tokens.
4. Rotate Supabase keys if the compromised GitHub account could read repo secrets or workflow logs.
5. Require branch protection and signed-off review before next deploy.
