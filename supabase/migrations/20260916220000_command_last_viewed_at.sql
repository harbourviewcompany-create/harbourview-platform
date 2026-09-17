begin;

-- COMMAND-SURFACE-001: per-user "last viewed Command" timestamp.
--
-- Rationale: docs/COMMAND_SURFACE_SPEC.md §4.1. The Command overview had no
-- notion of what changed since the operator last looked, so every visit
-- rendered identically to the previous one. This column is the primitive the
-- delta line and NEW markers are derived from.
--
-- Placed on user_dashboard_preferences rather than in a new table because that
-- table is already per-user (unique on user_id, the upsert conflict target used
-- by /api/dashboard/preferences), its RLS is already scoped to auth.uid() and
-- initplan-hardened (20260708214318, 20260831011430), and no per-section read
-- state is planned. A dedicated user_surface_view_state table would only earn
-- its keep once Intel, Market and Command are tracked separately.
--
-- Nullable with no default on purpose: NULL means "never viewed", which the UI
-- renders as first-visit counters rather than a misleading zero delta.

alter table public.user_dashboard_preferences
  add column if not exists command_last_viewed_at timestamptz;

comment on column public.user_dashboard_preferences.command_last_viewed_at is
  'When this user last opened the Command overview. NULL = never. Drives the since-last-visit delta (docs/COMMAND_SURFACE_SPEC.md 4.1).';

commit;
