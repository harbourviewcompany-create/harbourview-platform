# Rollback runbook — platform optimizations

Status: **manual runbook — not a migration**
Applies to: `supabase/migrations/20260729000000_platform_optimizations.sql`
Live project: `zvxdgdkukjrrwamdpqrg`
Retired from the forward migration directory: 2026-08-05

## Why this is a runbook and not a migration

This content previously lived at
`supabase/migrations/20260729000001_platform_optimizations_rollback.sql`. Its own
header described it as an *"EMERGENCY ROLLBACK — run this if the optimization
migration causes issues"*, but it sat in the forward migration directory, so
zero-state replay executed it unconditionally, one position after the forward
migration it reverses.

`docs/control/PENDING_PRODUCTION_MIGRATION_DECISIONS_2026-08-02.md` classifies it
**"Obsolete / must not apply"**, with the required action *"Move rollback
instructions to a controlled runbook; remove the rollback file from the active
forward migration directory."* That is what this file does.

Three independent facts make applying it during replay wrong:

1. **Production never ran it.** `supabase_migrations.schema_migrations` has no row
   for version `20260729000001`, under this or any name. The forward migration is
   recorded live as `20260731110914 platform_optimizations`. Production still has
   every column this file drops.
2. **It was actively destroying the candidate schema.** In candidate run
   `31086620969` it failed at statement 10, which means statements 1–9 had already
   succeeded — dropping `signals.snapshot_id`, all five `marketplace_candidates`
   provenance columns, and both marketplace indexes, including
   `idx_marketplace_candidates_source_id`, whose underlying column had just been
   restored at `20260728201439`. It stopped only because a view dependency blocked
   statement 10, not because anything guarded it.
3. **Section 5 drops a column the forward migration never created.** See below.

## Correction to section 5, recorded here rather than silently dropped

The file's author had already removed sections 7, 9 and 10 after discovering that
each tried to drop an object the forward migration had not created. Section 5 has
the same defect and was never caught:

`hv_artifacts.last_embedded_at` is part of the original `CREATE TABLE
public.hv_artifacts` at
`20260607230000_hv_bge_m3_1024_dim_embedding_column_and_search.sql`, seven weeks
before the forward migration. The forward migration's
`ADD COLUMN IF NOT EXISTS last_embedded_at` therefore no-op'd against an existing
column, exactly as its `CREATE TABLE IF NOT EXISTS countries` no-op'd against the
real `countries` table in section 7.

`api.hv_artifacts`, created at `20260710121500` as `SELECT * FROM
public.hv_artifacts`, expands to include that column, which is what produced:

```
ERROR: cannot drop column last_embedded_at of table hv_artifacts because other
objects depend on it (SQLSTATE 2BP01)
view api.hv_artifacts depends on column last_embedded_at of table hv_artifacts
```

**Section 5 must not be run.** Dropping `last_embedded_at` would remove a column
that predates the forward migration and is exposed through the api schema.

## Sections 1–4 and 6: safe to run, with one caution

These do correspond to objects the forward migration creates. Before running any
of them, confirm the object has no dependants, the way section 5's failure showed
`hv_artifacts` did.

Caution: `marketplace_candidates.raw_html_hash` is read by application code —
`lib/marketplace/candidates.ts`, `lib/marketplace/liveSources.ts`,
`lib/supabase/serviceCandidatesAdmin.ts`,
`lib/intelligence-engine/orchestrator.ts` and
`lib/intelligence-engine/worker-node.ts` — plus four `scripts/test-*` checks.
Dropping it breaks those paths. `scripts/verify-migration.ts` also asserts
`ia_extraction_failures`, `last_embedded_at`, `normaliser_model` and
`scrape_run_id` exist.

Note that `idx_marketplace_candidates_discovered_at` and
`idx_marketplace_candidates_source_id` are dropped by section 3, but the columns
they index (`discovered_at`, `source_id`) are **not** created by the forward
migration — they are production columns restored separately at `20260615091139`
and `20260728201439`. Drop the indexes if rolling back; never the columns.

## The statements

Run manually, against an explicitly chosen target, with sign-off. Do not add this
file or its contents back to `supabase/migrations/`.

```sql
-- 1. Remove snapshot_id FK and column from signals
ALTER TABLE signals DROP COLUMN IF EXISTS snapshot_id;
DROP INDEX IF EXISTS idx_signals_snapshot_id;

-- 2. Remove provenance columns from marketplace_candidates
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS raw_html_hash;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS parser_version;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS normaliser_model;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS normaliser_prompt_version;
ALTER TABLE marketplace_candidates DROP COLUMN IF EXISTS scrape_run_id;

-- 3. Remove indexes (indexes only -- see the note above about the columns)
DROP INDEX IF EXISTS idx_marketplace_candidates_discovered_at;
DROP INDEX IF EXISTS idx_marketplace_candidates_source_id;

-- 4. Remove tier from scraper_source_state
ALTER TABLE scraper_source_state DROP COLUMN IF EXISTS tier;

-- 5. DO NOT RUN. Drops a column that predates the forward migration and is
--    exposed via api.hv_artifacts. See the correction above.
--    ALTER TABLE hv_artifacts DROP COLUMN IF EXISTS last_embedded_at;
--    DROP INDEX IF EXISTS idx_hv_artifacts_last_embedded_at;

-- 6. Drop extraction failures table and its policies
DROP TABLE IF EXISTS ia_extraction_failures CASCADE;
```

## Sections carried over verbatim from the original file

- **7. (removed)** A real, actively-used `countries` table (203 rows,
  iso_alpha2/iso_alpha3/country_name/regulatory_tier/opportunity_score/etc.)
  already existed under this name before the forward migration was written. The
  forward migration's `CREATE TABLE IF NOT EXISTS` correctly no-op'd against it,
  so it never created (and must never drop) `countries` — the original
  `DROP TABLE IF EXISTS countries CASCADE` here would have destroyed that real
  table and anything depending on it via CASCADE.
- **8. Restore original `promote_snapshot_to_signals`** (without snapshot_id).
  The original function signature is preserved; the snapshot_id column is simply
  absent. If you need the exact pre-migration function body, restore from backup.
  Note that later migrations redefine this function — `20260727105241`,
  `20260728201438` and `20260729025619` all `CREATE OR REPLACE` it — so a
  rollback of the forward migration alone will not restore any particular
  historical body.
- **9. (removed)** Referenced the wrong table names
  (`professional_service_providers` / `_applications`). The real table PR #1178
  built is `professional_service_provider_listings`, which already has its own
  RLS and two policies unrelated to the forward migration. This section never
  successfully applied in the first place. Nothing to roll back.
- **10. (removed, same reason as 9 above).**
