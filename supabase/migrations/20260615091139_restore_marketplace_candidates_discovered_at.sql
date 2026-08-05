-- Production already had marketplace_candidates.discovered_at when the
-- seller self-serve migration was applied, but repository zero-state never
-- recorded its creator. Restore only that prerequisite column immediately
-- before the production-recorded migration that indexes it.

alter table public.marketplace_candidates
  add column if not exists discovered_at timestamptz default now();
