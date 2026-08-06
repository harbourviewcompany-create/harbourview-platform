-- Restore the exact production-owned body for migration 20260704212448.
-- The previous stub omitted public.current_user_tier(), which 20260714192255
-- and 20260718080340 use in RLS policy predicates.

-- Tiered access + RLS. The existing user_profiles.tier column (free/intel/
-- operator, CHECK-constrained) is the real, already-designed subscription
-- model — this wires real enforcement to it instead of leaving every
-- authenticated (and in country_intel's case, even anonymous) user with
-- full read access regardless of tier.
--
-- Verified before changing: every app-code caller of both tables uses a
-- service-role client (bypasses RLS entirely), so this only affects direct
-- Supabase REST/anon-key access — no existing page or feature depends on
-- the open behavior being removed here.

-- ── ia_signals: was open to ANY authenticated user, no tier check ──────────
drop policy if exists ia_signals_authenticated_read on ia_signals;

create policy ia_signals_intel_tier_read on ia_signals
  for select
  to authenticated
  using (
    stage = any (array['active','closed'])
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.tier in ('intel','operator')
    )
  );

-- ── country_intel: was open to literally anyone, anon included ─────────────
drop policy if exists country_intel_public_active_select on country_intel;

-- Deviation from the recorded body: one added drop, mirroring the guard the
-- line above already uses. In production this policy did not exist before this
-- migration, so the recorded CREATE was unconditional. In zero-state replay it
-- does exist: 20260618211000_country_intel_foundation_replay.sql, a
-- repository-only reconciliation migration with no ledger entry, already
-- creates a policy of the same name three weeks earlier. Without this drop the
-- replay fails here with:
--   policy "country_intel_intel_tier_read" for table "country_intel"
--   already exists (SQLSTATE 42710)
-- The recorded definition below still wins, which is the correct outcome since
-- this migration is its production-recorded owner.
drop policy if exists country_intel_intel_tier_read on country_intel;

create policy country_intel_intel_tier_read on country_intel
  for select
  to authenticated
  using (
    review_status = 'active'
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid() and up.tier in ('intel','operator')
    )
  );

-- Free/unauthenticated visitors still get the public teaser fields (country
-- name + public_summary + regulatory_tier) via this view — no gated columns.
create or replace view country_intel_public as
select id, country_code, country_name, public_summary, regulatory_tier, review_status
from country_intel
where review_status = 'active';

grant select on country_intel_public to anon, authenticated;

-- ── user_profiles: helper for RLS checks + app code, avoids repeating the
-- `exists (select 1 from user_profiles ...)` pattern everywhere.
create or replace function public.current_user_tier()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select tier from user_profiles where id = auth.uid();
$$;

grant execute on function public.current_user_tier() to authenticated;
