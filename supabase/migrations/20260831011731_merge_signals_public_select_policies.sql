-- Reconstructed from production. Verbatim statements for version 20260831011731.
begin;

-- Confirmed via migration history (20260716200514_signals_scored_visibility_gate.sql):
-- the two-policy OR (score>=60 OR reviewed=true) is intentional, documented tiering
-- (automated quality gate OR hand-picked editorial override), not a bug.
-- Collapsing into one policy preserves identical access outcomes while cutting the
-- per-row policy evaluation from 2 permissive policies to 1 for every anon/authenticated
-- SELECT against public.signals (the advisor's own recommended fix for
-- "multiple_permissive_policies").

drop policy if exists signals_public_reviewed_select on public.signals;
drop policy if exists signals_public_scored_select on public.signals;

create policy signals_public_select
  on public.signals
  for select
  to anon, authenticated
  using (score >= 60 or reviewed = true);

comment on policy signals_public_select on public.signals is
  'Public signal gate, merged 2026-08-31: score >= 60 (automated quality bar) OR reviewed = true (editorial hand-pick override). Was two separate permissive policies OR-ed implicitly by Postgres; merged into one for the same access outcome with half the per-row policy evaluation cost. See 20260716200514_signals_scored_visibility_gate.sql for the original design rationale.';

commit;
