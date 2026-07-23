-- Stage C (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8): mechanically
-- enforce the classifier validation gate instead of relying on a human
-- remembering not to promote an unvalidated classifier version.
--
-- Backfilled row reflects the live api.intel_eval_scoring result for
-- run_id='v1-smoke' (verified 2026-07-23): n_human_truth=181,
-- signal_precision=1.000, signal_recall=0.559. gate_passed is FALSE because
-- recall is below the 0.70 bar proposed in spec Section 6.2/10 -- this is
-- Tyler's open decision (ship as-is vs. hold for more prompt-tuning work),
-- not yet made. Until he flips gate_passed, hv_promote_signals structurally
-- cannot promote anything for this classifier_version, regardless of cron
-- state.

create table if not exists public.classifier_validation (
  classifier_version text primary key,
  validated_at timestamptz not null default now(),
  n_eval_rows integer,
  signal_precision numeric,
  signal_recall numeric,
  gate_passed boolean not null default false,
  notes text
);

alter table public.classifier_validation enable row level security;
revoke all on public.classifier_validation from anon, authenticated, public;

insert into public.classifier_validation
  (classifier_version, n_eval_rows, signal_precision, signal_recall, gate_passed, notes)
values
  ('hv-classify/openai/v1', 181, 1.000, 0.559, false,
   'v1-smoke eval run 2026-07-21/22. Precision clears any reasonable bar (1.000). '
   'Recall (0.559) is below the 0.70 gate proposed in spec Section 6.2 -- open '
   'decision for Tyler: ship at current recall vs. hold for more prompt-tuning. '
   'Flip gate_passed to true (and update this row) only after that decision.')
on conflict (classifier_version) do nothing;

-- hv_promote_signals now refuses to promote any row whose classifier_version
-- doesn't have a gate_passed=true row here. Everything else about the
-- function (structural confidence floor, is_representative, excluded
-- domains, human-review protection) is unchanged from the 2026-07-22
-- baseline.
create or replace function public.hv_promote_signals(p_min_conf numeric default 0.65)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v1', reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= greatest(coalesce(p_min_conf, 0.65), 0.65)
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1 from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains);
  get diagnostics n = row_count;
  return n;
end$function$;
