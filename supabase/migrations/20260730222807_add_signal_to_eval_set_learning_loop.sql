-- The learning loop: let any signal become a labelled eval example.
--
-- WHY THE EVAL SET WAS FROZEN
-- api.save_intel_eval_label() raises 'intel_eval_set has no row for signal_id %' when
-- the signal is not already in the set. So labelling only ever worked on the 202 rows
-- seeded on 2026-07-18, and there was no path — in the UI or the API — to add a new
-- one. That is the whole reason the set has been static for 12 days with 0 human
-- reviews ever, while being simultaneously the highest-leverage asset in the system:
-- it is what made the 0.559 -> 0.903 classifier fix findable and provable.
--
-- This adds the missing insert path. It seeds draft_* from the classifier's CURRENT
-- verdict before applying the human label, so api.save_intel_eval_label's
-- confirmed-vs-corrected derivation stays meaningful for rows added this way — a
-- correction is recorded as a correction, not silently as a confirmation.
--
-- Rows added here carry sample_stratum = 'live_correction' so they are
-- distinguishable from the original stratified sample. That matters: the 2026-07-18
-- sample deliberately over-represents non-English (55% vs a 3% corpus), so pooled
-- metrics across both strata must be read with that in mind rather than as a single
-- headline number.

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
    -- Seed the row, capturing the classifier's verdict as the draft so that
    -- confirmed-vs-corrected is computed against what the model actually said.
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
      'pending', now(), now()
    );
  end if;

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

revoke all on function api.add_signal_to_eval_set(text,text,text,text,text,text) from public, anon;
grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) to authenticated, service_role;

comment on function api.add_signal_to_eval_set(text,text,text,text,text,text) is
  'Adds a signal to intel_eval_set if absent and applies a human label, seeding draft_* '
  'from the live classifier verdict so corrected-vs-confirmed stays meaningful. This is '
  'the path that was missing: save_intel_eval_label raises for unseeded signals, which '
  'is why the eval set was frozen at its original 202 rows.';
