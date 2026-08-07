-- Production already had marketplace_candidates.price_amount when the
-- junk-routing backfill was applied, but repository zero-state never recorded
-- its creator. Restore only that prerequisite column immediately before the
-- production-recorded migration whose WHERE clause reads it.
--
-- 20260719190929 fails without it during zero-state replay with:
--   column "price_amount" does not exist (SQLSTATE 42703)
--
-- Same shape as 20260615091139_restore_marketplace_candidates_discovered_at.sql,
-- which restored a different prerequisite column on this table for the same
-- reason. marketplace_candidates is built during replay by the pinned
-- candidate assembler, whose column set differs from production's; a check
-- across every migration that reads this table shows price_amount is the only
-- production column referenced that replay does not already have.

alter table public.marketplace_candidates
  add column if not exists price_amount numeric;
