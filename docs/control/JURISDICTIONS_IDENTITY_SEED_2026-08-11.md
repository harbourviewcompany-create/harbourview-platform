# Jurisdictions identity seed — 2026-08-11

**Registry impact:** Harbourview Platform + provisional canonical DB (`zvxdgdkukjrrwamdpqrg`).

## Problem

Production inspection (2026-08-10) found:

- `public.jurisdictions`: **0 rows**
- `public.jurisdiction_crossref`: **~203 rows** (ISO bridges without `jurisdictions_id`)

Decision Intel Stage 0 ([#1309](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1309)) leaves canonical jurisdiction linkage **null** until this registry is populated. That is intentional fail-safe behaviour, not a merge blocker — but it **is** a production-activation prerequisite for non-null jurisdiction navigation.

## Migration

`supabase/migrations/20260811140000_seed_jurisdictions_identity_from_countries.sql`

| Step | Action |
|------|--------|
| 1 | Insert `public.jurisdictions` from `public.countries` where `iso_alpha3` is present |
| 2 | `jurisdiction_id` format `country_area:<ALPHA3>` (matches `lib/country-data` identity rows) |
| 3 | Link `jurisdiction_crossref.jurisdictions_id` when null |
| 4 | Seed minimal `country_profiles_public` identity DTOs |
| 5 | Audit row in `country_data_import_runs` |

## Claims boundary

**Identity only.**

- `identity_verification_status = verified_identity_only`
- `data_release_status = seeded_identity_pending_regulated_market_review`
- No regulated-market status, licensing, or route claims

## Apply gate

1. Merge this PR to `main`
2. Apply migration to production (`zvxdgdkukjrrwamdpqrg`) under existing production-migration controls
3. Verify: `select count(*) from public.jurisdictions` > 0 and crossref links non-null
4. Then Decision Intel Stage 0 migrations can resolve jurisdiction IDs on backfill

This PR does **not** apply to production by itself.
