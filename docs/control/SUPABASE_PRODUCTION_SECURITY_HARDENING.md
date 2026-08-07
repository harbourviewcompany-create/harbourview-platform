# Supabase Production Security Hardening

## Authority and scope

This control applies to Supabase project `zvxdgdkukjrrwamdpqrg`. It governs view execution context, RLS fail-closed behavior, foreign-table exposure, privileged RPC execution, mutable function search paths, extension placement, public projection availability and leaked-password protection.

## Migrations

`supabase/migrations/20260804190000_production_security_hardening.sql` is the canonical privilege/context change. `20260804233000_marketplace_inquiries_conversion_repair.sql` is the data-preserving forward repair for the historical marketplace migration-order defect. Neither migration deletes business records.

Required outcomes:

- Every enumerated application view uses `security_invoker=true` and therefore executes with caller privileges against underlying RLS.
- Retained public projections revoke historical blanket privileges, then grant `SELECT` only to `anon`, `authenticated` and `service_role`.
- Internal/admin projections revoke all privileges from `public`, `anon` and `authenticated`; only `service_role` retains `SELECT`.
- RLS-enabled tables without an approved policy remain deny-by-default, and foreign integration tables remain unavailable to browser roles.
- SECURITY DEFINER routines are service-role only except for the exact audited authenticated allowlist.
- Custom application routines have a pinned search path.
- Future PostgreSQL-owned functions and tables in controlled schemas start closed through explicit default-privilege revocation.
- Relocatable `vector` and `pg_trgm` extensions live in `extensions`.
- `pg_net` remains vendor-managed; direct `net` schema access is revoked from browser roles when that schema exists.
- `api.get_github_pat()` and `public.get_github_pat()` retain `service_role` execution only where those exact signatures exist.

## Leaked-password protection

The setting is outside SQL migration control. Use:

```bash
SUPABASE_ACCESS_TOKEN=<management-token> node scripts/configure-supabase-auth-production.mjs --apply
```

The script is locked to project `zvxdgdkukjrrwamdpqrg`, sends only `{"password_hibp_enabled": true}`, applies a 15-second timeout to each Management API request, and verifies the setting after the PATCH. The operation requires a supported Supabase plan.

## Pre-deployment evidence

1. Run the production-security workflow against an isolated local Supabase stack.
2. Confirm the complete migration history rebuilds from zero and the SQL assertion artifact is empty.
3. Capture the exact pre-change grants for every affected view and routine.
4. Create a production database backup or confirm PITR availability.
5. Apply the migrations in a controlled release window.
6. Run `supabase/tests/production_security_hardening.sql` against production.
7. Run Supabase security advisors and capture remaining findings.
8. Apply and verify leaked-password protection.
9. Run Harbourview public leakage, guest-read, admin authorization, Command Centre and production-visibility probes.

## Rollback

The primary rollback is a reviewed forward migration generated from the captured pre-change grant inventory. Restore only affected function signatures or relation privileges; never restore blanket grants. Use PITR or backup restoration only when the resulting database state cannot be reconstructed safely through a forward migration.

## GO criteria

GO requires zero rows from the verification SQL, green application and security workflows, leaked-password protection enabled, retained public projections readable by their intended roles, and no new public provenance or operator-data exposure. The zero-row assertion admits no implicit exceptions; any future exception must be documented and encoded explicitly in the SQL gate.
