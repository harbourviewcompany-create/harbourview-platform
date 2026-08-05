# Supabase Production Security Hardening

## Authority and scope

This control applies to Supabase project `zvxdgdkukjrrwamdpqrg`. It governs view execution context, application-role grants, RLS fail-closed behavior, foreign-table exposure, privileged RPC execution, mutable function search paths, extension placement, and leaked-password protection.

The migration and Auth operation remain unapplied. Merge, production migration application, and Auth mutation require separate operator authorization after exact-head verification.

## Canonical migration

`supabase/migrations/20260804190000_production_security_hardening.sql` is the canonical database change. It changes privileges and execution context; it does not delete business records.

Every advisor-identified view is assigned one explicit access policy:

### Public projections

These documented guest surfaces use `security_invoker=true`, have browser write privileges removed, and grant `SELECT` to `anon`, `authenticated`, and `service_role`:

- `public.country_intel_public`
- `public.marketplace_public_listings_v1`
- `public.public_country_profile_dto`
- `public.genetics_public_claims`
- `public.genetics_public_collaboration_projects`
- `public.genetics_public_country_opportunities`
- `public.genetics_public_cultivar_aliases`
- `public.genetics_public_cultivar_passports`
- `public.genetics_public_evidence_summaries`
- `public.genetics_public_profiles`
- `public.genetics_public_service_providers`
- `regulatory_signals.public_signals`
- `regulatory_signals.public_source_status`
- `regulatory_signals.public_watchlist_collection_signals`
- `regulatory_signals.public_watchlist_collections`

`security_invoker=true` means access still depends on the underlying table grants and RLS policies. The view grant does not bypass those controls.

### Existing application-read contracts

The following application projections use `security_invoker=true`; browser write privileges are removed, existing browser `SELECT` ACLs are preserved rather than widened or revoked, and `service_role` receives `SELECT`:

- `public.ia_sources_live`
- `public.local_intel_jurisdiction_combined`
- `public.platform_coverage_summary`
- `public.signals_intelligence_feed`
- `public.v_jurisdiction_unified`

A later access-contract change for any of these views must be made through a named forward migration with route and RLS evidence.

### Internal and administrative projections

Internal/admin projections use `security_invoker=true`, revoke all privileges from `public`, `anon`, and `authenticated`, and grant `SELECT` only to `service_role`. This inventory includes the `api.hv_*` processing views, admin marketplace queues, internal coverage/conflict queues, playbook queues, digest/quality processing views, and internal source-yield views named in the migration.

## Additional required outcomes

- RLS-enabled tables without an approved policy expose no application-role table privileges.
- Foreign integration tables are unavailable to browser roles.
- SECURITY DEFINER routines are closed to `anon` and to `authenticated` except for the exact audited authenticated allowlist.
- The service-role allowlist retains exact-signature execution, including `api.get_github_pat()` and `public.get_github_pat()` when those functions exist.
- Custom application routines have a pinned search path.
- Relocatable `vector` and `pg_trgm` extensions live in `extensions`.
- `pg_net` remains vendor-managed. Browser roles lose `net` schema usage, so extension-owned routines are not directly callable even when their vendor-managed function ACLs remain unchanged; `service_role` retains schema usage.
- Default privileges for future functions and tables start closed and must be granted intentionally by a forward migration.

## Verification boundary

The `Production Security Hardening` workflow applies the exact candidate migration to an isolated local Supabase fixture representing public, preserved-contract, internal, policyless-RLS, and SECURITY DEFINER boundaries. It then runs `supabase/tests/production_security_hardening.sql` as a zero-row state assertion.

This workflow intentionally does not claim that the repository's complete historical migration chain is replayable. Exact-head run `30959615043` exposed an earlier independent history defect: `20260304000000_marketplace_conversion_v1.sql` references `public.marketplace_inquiries` before that relation exists. That legacy defect must be repaired through a separate reviewed forward/history-reconciliation decision; it must not be concealed by rewriting an applied migration inside this hardening change.

Required pre-release evidence:

1. The isolated hardening fixture applies the exact migration successfully.
2. `supabase/tests/production_security_hardening.sql` returns zero rows. No accepted exceptions are implicit.
3. The public marketplace, public intelligence, genetics, and regulatory routes pass guest and authenticated access probes against a release-candidate database.
4. Admin authorization, provenance leakage, and production-visibility probes remain green.
5. A current database backup or PITR checkpoint is confirmed.
6. Supabase security advisors are rerun and any accepted exception is named in a control document and encoded in the assertion SQL.
7. Leaked-password protection is separately applied and verified only after operator authorization.

## Leaked-password protection

The setting is outside SQL migration control. The authorized command is:

```bash
SUPABASE_ACCESS_TOKEN=<management-token> node scripts/configure-supabase-auth-production.mjs --apply
```

The script is locked to project `zvxdgdkukjrrwamdpqrg`, sends only `{"password_hibp_enabled": true}`, and verifies the setting after the PATCH. Running the script with `--apply` is a production Auth mutation and remains HOLD without separate authorization.

## Rollback and forward repair

Before production application, capture the exact current ACLs and routine grants for every affected relation and signature. A privilege regression is repaired through a reviewed forward migration that restores only the affected captured grants or signatures. Blanket GRANT restoration is not authorized. PITR or backup restoration is reserved for cases where database state cannot be reconstructed safely; it is not the default response to a reversible ACL defect.

## GO criteria

GO requires all of the following on one frozen candidate SHA:

- zero rows from the verification SQL;
- green exact-head application, security, and nine-width Command Centre workflows;
- confirmed public-route access for the documented public projections;
- no new provenance, operator-data, or administrative exposure;
- reviewed migration grant matrix;
- leaked-password protection verified after separate authorization;
- explicit release authorization.

Until then, migration application, Auth mutation, merge, and production promotion remain HOLD.
