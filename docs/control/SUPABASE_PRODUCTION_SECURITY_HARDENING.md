# Supabase Production Security Hardening

## Authority and scope

This control applies to Supabase project `zvxdgdkukjrrwamdpqrg`. It governs view execution context, RLS fail-closed behavior, foreign-table exposure, privileged RPC execution, mutable function search paths, extension placement, and leaked-password protection.

## Migration

`supabase/migrations/20260804190000_production_security_hardening.sql` is the canonical database change. It is designed as a privilege/context migration and does not delete business data.

Required outcomes:

- Exposed application views use `security_invoker=true` and therefore respect underlying RLS.
- Historical write grants on views are removed.
- Internal/admin projections are unavailable to `anon` and ordinary `authenticated` callers.
- RLS-enabled tables without an approved policy remain deny-by-default.
- Foreign integration tables are unavailable to browser roles.
- SECURITY DEFINER routines are service-role only except for the explicit audited authenticated allowlist.
- Custom application routines have a pinned search path.
- Relocatable `vector` and `pg_trgm` extensions live in `extensions`.
- `pg_net` remains vendor-managed because the installed extension is non-relocatable; direct `net` schema access is revoked from browser roles as the compensating control.

## Leaked-password protection

The setting is outside SQL migration control. Use:

```bash
SUPABASE_ACCESS_TOKEN=<management-token> node scripts/configure-supabase-auth-production.mjs --apply
```

The script is locked to project `zvxdgdkukjrrwamdpqrg`, sends only `{"password_hibp_enabled": true}`, and verifies the setting after the PATCH. The operation requires a Supabase Pro plan or above.

## Pre-deployment evidence

1. Run the production-security workflow against an isolated local Supabase stack.
2. Review the generated SQL assertion artifact.
3. Create a production database backup or confirm PITR availability.
4. Apply the migration in a controlled release window.
5. Run `supabase/tests/production_security_hardening.sql` against production.
6. Run Supabase security advisors and capture the remaining accepted exceptions.
7. Apply and verify leaked-password protection.
8. Run Harbourview public leakage, admin authorization, Command Centre and production-visibility probes.

## Rollback

The supported rollback is database PITR/backup restoration to the point immediately before migration application. Privilege rollback by ad-hoc GRANT is not authorized because it can recreate historical overexposure. If only an authenticated RPC contract regresses, add the exact missing signature to the audited allowlist in a follow-up migration rather than restoring blanket function execution.

## GO criteria

GO requires zero unexpected rows from the verification SQL, green application/security workflows, leaked-password protection enabled, and no new public provenance or operator-data exposure.
