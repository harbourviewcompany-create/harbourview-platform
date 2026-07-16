-- Signal visibility: replace the binary `reviewed` gate with a scored gate.
--
-- Why: crawler inflow ~5,874/month vs human review ~95/month (62x mismatch) meant RLS
-- exposed only 170 of 7,840 signals to any non-admin user. The feed was invisible.
--
-- Model now:
--   anon + authenticated : score >= 60          (the product)
--   anon + authenticated : OR reviewed = true   (editorial badge; keeps hand-picked sub-60 items)
--   admin/operator/analyst : everything         (unchanged)
--   country_intel / digests remain the paid tier (unchanged, gated on user_profiles.tier)
--
-- NOTE ON SCALE: `signals.score` is 0-100 (observed range 15-99), NOT 0-10. The previous
-- policy's `score >= 6` therefore admitted 100% of rows and was dead code -- it was only
-- masked by the `reviewed = true` conjunct. Any future threshold MUST be on the 0-100 scale.

drop policy if exists signals_anon_high_quality on public.signals;

create policy signals_public_scored_select
  on public.signals
  for select
  to anon, authenticated
  using (score >= 60);

comment on policy signals_public_scored_select on public.signals is
  'Public signal gate: score >= 60 on the 0-100 scale. Replaced the dead score>=6 filter (0-10 assumption). OR-ed with signals_public_reviewed_select.';

-- Supports the gate + the country-page ordering pattern.
create index if not exists idx_signals_score_date on public.signals (score desc, date desc);