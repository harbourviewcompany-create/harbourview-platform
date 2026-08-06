-- Production already had marketplace_candidates.source_id when the platform
-- optimization migration was applied, but repository zero-state never recorded
-- its creator. Restore only that prerequisite column immediately before the
-- production-recorded migration that indexes it.
--
-- 20260729000000_platform_optimizations.sql fails without it during zero-state
-- replay, at its eighth statement:
--   CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_source_id
--     ON marketplace_candidates(source_id)
--   column "source_id" does not exist (SQLSTATE 42703)
--
-- Third column restored on this table for the same reason, after
-- 20260615091139 (discovered_at) and 20260719190928 (price_amount).
-- marketplace_candidates is built during replay by the pinned candidate
-- assembler, whose column set differs from production's.
--
-- Shape taken from the live table, not guessed: `text`, nullable, no default,
-- and no constraint on this project references source_id -- despite the name it
-- is not a foreign key to marketplace_source_registry, so none is added here.
--
-- Every other prerequisite 20260729000000 needs is already present at this
-- point in replay: the seventh statement indexes discovered_at (restored at
-- 20260615091139) and succeeds, and hv_import_staging, scraper_source_state,
-- hv_artifacts and source_snapshots -- the tables its remaining statements
-- reference -- are all created earlier. source_id is the only gap.

alter table public.marketplace_candidates
  add column if not exists source_id text;
