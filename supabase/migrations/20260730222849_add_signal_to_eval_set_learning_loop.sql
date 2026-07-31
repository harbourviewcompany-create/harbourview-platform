-- Close the classifier learning loop: let a human correction enter the eval set.
--
-- WHY
-- ---
-- intel_eval_set is the cohort every classifier version is gated against
-- (classifier_validation.gate_passed, enforced by hv_promote_signals). It had
-- been frozen at 202 rows since 2026-07-18, and structurally could not grow:
--
--   api.save_intel_eval_label raises 'intel_eval_set has no row for signal_id %'
--   for any signal that was not part of the original stratified sample.
--
-- So the only signals a human could correct were ones already in the sample.
-- A misclassification spotted in the live feed -- exactly the highest-value
-- label there is, because it is a known classifier error -- had nowhere to go.
-- The eval set could only ever describe the classifier's behaviour on a
-- snapshot taken before the classifier existed in its current form.
--
-- This adds the missing insert path. Correcting a live signal now seeds it into
-- the eval set (recording what the classifier said at the time, so the row is a
-- usable error example rather than just a label) and applies the human verdict.
--
-- Rows enter with sample_stratum = 'live_correction' so they stay separable
-- from the original stratified sample. That distinction matters: live
-- corrections are biased toward errors by construction, so precision/recall
-- computed over the combined set is not comparable to the original sample's
-- numbers. Keep them apart when scoring.
--
-- CONSOLIDATION NOTE
-- ------------------
-- Applied to production as two migrations: 20260730222807 created the function,
-- 20260730222849 fixed the seeded label_status. The first seeded 'pending',
-- which is not in intel_eval_set_label_status_check (unlabeled | drafted |
-- confirmed | corrected | unlabelable) -- every call raised 23514. This file
-- carries the corrected definition; the broken intermediate is not reproduced.

create or replace function api.add_signal_to_eval_set(
  p_signal_id     text,
  p_quality_label text,
  p_content_type  text,
  p_impact        text,
  p_notes         text default null,
  p_labeled_by    text default 'human:tyler'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_exists boolean;
  v_s      record;
  v_status text;
begin
  if p_quality_label not in ('signal','boilerplate','spam','nav','duplicate') then
    raise exception 'invalid quality_label: %', p_quality_label;
  end if;
  if p_content_type not in ('regulatory','market','story','research','noise') then
    raise exception 'invalid content_type: %', p_content_type;
  end if;
  if p_impact not in ('high','medium','low') then
    raise exception 'invalid impact: %', p_impact;
  end if;

  select * into v_s from public.signals where id = p_signal_id;
  if not found then
    raise exception 'no signal with id %', p_signal_id;
  end if;

  select exists(select 1 from public.intel_eval_set where signal_id = p_signal_id) into v_exists;

  if not v_exists then
    -- Seed the classifier's live verdict as the draft, so the row records what
    -- the model actually said at correction time. Without this the eval row
    -- would carry only the human answer and lose the error it is evidence of.
    insert into public.intel_eval_set (
      signal_id,
      draft_quality_label, draft_content_type, draft_impact, draft_reason,
      sample_stratum, sample_batch,
      score_at_sample, lang_at_sample, country_at_sample, top_lane_at_sample,
      label_status, created_at, updated_at
    ) values (
      p_signal_id,
      v_s.quality_label, v_s.content_type, v_s.impact,
      'seeded from live classifier verdict at correction time',
      'live_correction', to_char(now(), 'YYYY-MM-DD'),
      v_s.score, v_s.lang, v_s.country, v_s.top_lane,
      'drafted', now(), now()
    );
  end if;

  -- 'corrected' vs 'confirmed' is derived, not asserted by the caller: a human
  -- agreeing with the classifier is as much a signal as a human overruling it,
  -- and the two must not be conflated when the eval set is scored.
  v_status := case
    when p_quality_label is distinct from v_s.quality_label
      or p_content_type  is distinct from v_s.content_type
      or p_impact        is distinct from v_s.impact then 'corrected'
    else 'confirmed' end;

  update public.intel_eval_set set
    quality_label = p_quality_label,
    content_type  = p_content_type,
    impact        = p_impact,
    label_notes   = p_notes,
    labeled_by    = p_labeled_by,
    labeled_at    = now(),
    label_status  = v_status,
    updated_at    = now()
  where signal_id = p_signal_id;

  return jsonb_build_object(
    'ok', true,
    'signal_id', p_signal_id,
    'added', not v_exists,
    'label_status', v_status,
    'classifier_said', jsonb_build_object(
      'quality_label', v_s.quality_label,
      'content_type',  v_s.content_type,
      'impact',        v_s.impact),
    'eval_set_size', (select count(*) from public.intel_eval_set)
  );
end;
$function$;

comment on function api.add_signal_to_eval_set(text,text,text,text,text,text) is
  'Adds a live signal to intel_eval_set and applies a human label, seeding the classifier''s '
  'verdict as the draft. Unlike api.save_intel_eval_label this does not require the signal to be '
  'in the original stratified sample -- it is the only path by which the eval set can grow. Rows '
  'land with sample_stratum = ''live_correction''; score them separately, they are error-biased.';

-- Human labelling affordance: called from the signed-in UI, so `authenticated`
-- is intended here. Never anon -- this writes the cohort that gates promotion.
revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) from public, anon;
grant  execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) to authenticated, service_role;
