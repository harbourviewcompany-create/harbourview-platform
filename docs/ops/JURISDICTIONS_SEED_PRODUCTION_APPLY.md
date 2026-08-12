# Jurisdictions identity seed — production apply evidence

**Status:** Applied and verified in production after PR #1337 merged.

**Target DB:** Harbourview Marketplace / `zvxdgdkukjrrwamdpqrg`  
**Migration:** `supabase/migrations/20260811140000_seed_jurisdictions_identity_from_countries.sql`  
**Control note:** `docs/control/JURISDICTIONS_IDENTITY_SEED_2026-08-11.md`

## Why this matters

Decision Intel Stage 0 (#1309) requires canonical non-null jurisdiction identity for backfill and dossier navigation. The production prerequisite is now satisfied at the identity layer.

## Claims boundary

This migration establishes identity only:

- `identity_verification_status = verified_identity_only`
- `data_release_status = seeded_identity_pending_regulated_market_review`
- no regulated-market, licensing, or pathway claims are created by this seed

## Production verification — 2026-08-12

Post-apply verification returned:

- `public.jurisdictions`: **203** rows
- `public.jurisdiction_crossref`: **203** total rows
- linked `jurisdiction_crossref.jurisdictions_id`: **203** rows
- `public.country_profiles_public`: **203** rows

The seed therefore closed the empty-jurisdiction-registry activation prerequisite previously identified for Decision Intel Stage 0.

## Verification SQL

```sql
select count(*) as jurisdictions_count from public.jurisdictions;

select
  count(*) as crossref_total,
  count(*) filter (where jurisdictions_id is not null) as crossref_linked
from public.jurisdiction_crossref;

select jurisdiction_id, slug, canonical_name, data_release_status
from public.jurisdictions
where jurisdiction_id in ('country_area:DEU', 'country_area:USA', 'country_area:CAN')
order by jurisdiction_id;

select count(*) as profiles_count from public.country_profiles_public;

select import_run_id, status, loaded_jurisdiction_count, evidence_json
from public.country_data_import_runs
where import_run_id = 'seed-jurisdictions-identity-20260811';
```

## Result

- [x] `jurisdictions_count` > 0
- [x] `crossref_linked = crossref_total` — 203 / 203
- [x] identity profile population completed — 203 rows
- [x] identity-only claims boundary preserved
- [x] Decision Intel Stage 0 jurisdiction-registry prerequisite cleared

## Remaining activation boundary

This production apply does **not** activate Decision Intel Stage 0 by itself. #1309 still requires canonical merge, its three migrations, RLS/backfill verification, and real dossier runtime verification under separate release controls.

## Explicit non-goals

- This evidence does not authorize #1309 production apply by itself.
- It does not change Vercel configuration, secrets, or unrelated RLS.
- It does not populate regulated-market fields or imply regulated-market completeness.
