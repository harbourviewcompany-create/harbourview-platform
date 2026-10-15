-- Recovery operational marker.
-- The corresponding live recovery action only adjusted source capture target state
-- (locks/next-crawl scheduling) while all cron jobs were subsequently paused.
-- It is intentionally not replayed as schema or seed state.
select 1;
