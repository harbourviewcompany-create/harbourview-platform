-- Stage 0 support: PostgREST on this project exposes ONLY the `api` schema
-- (lib/supabase/env.ts SUPABASE_DB_SCHEMA='api'). public.intel_eval_set is
-- therefore unreachable by the app's admin data client without an api-schema
-- surface. This migration adds a read VIEW and a write RPC, service_role-only.
-- Reason: the Stage 0 admin labeling page needs a reachable read/write path.
-- Additive + reversible. Rollback:
--   drop function if exists api.save_intel_eval_label(text,text,text,text,text,text,boolean);
--   drop view if exists api.intel_eval_labeling;

create view api.intel_eval_labeling as
select
  e.id, e.signal_id,
  s.headline, s.summary, s.source, s.url,
  e.lang_at_sample, e.country_at_sample, e.score_at_sample, e.top_lane_at_sample,
  e.sample_stratum,
  e.draft_quality_label, e.draft_content_type, e.draft_impact, e.draft_reason,
  e.quality_label, e.content_type, e.impact, e.label_notes, e.labeled_by, e.labeled_at,
  e.label_status, e.updated_at
from public.intel_eval_set e
join public.signals s on s.id = e.signal_id;

comment on view api.intel_eval_labeling is
  'Stage 0 labeling surface: intel_eval_set joined to signal content. Admin/service-role only. Provenance (source/url) is admin-context only, never a public DTO.';

create function api.save_intel_eval_label(
  p_signal_id     text,
  p_quality_label text,
  p_content_type  text,
  p_impact        text,
  p_notes         text default null,
  p_labeled_by    text default 'human:tyler',
  p_unlabelable   boolean default false
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dq text; v_dc text; v_di text; v_status text;
begin
  select draft_quality_label, draft_content_type, draft_impact
    into v_dq, v_dc, v_di
    from public.intel_eval_set where signal_id = p_signal_id;
  if not found then
    raise exception 'intel_eval_set has no row for signal_id %', p_signal_id;
  end if;

  if p_unlabelable then
    update public.intel_eval_set set
      quality_label = null, content_type = null, impact = null,
      label_notes = p_notes, labeled_by = p_labeled_by, labeled_at = now(),
      label_status = 'unlabelable', updated_at = now()
    where signal_id = p_signal_id;
    return;
  end if;

  v_status := case
    when p_quality_label is distinct from v_dq
      or p_content_type  is distinct from v_dc
      or p_impact        is distinct from v_di then 'corrected'
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
end;
$$;

comment on function api.save_intel_eval_label is
  'Stage 0: write a human label to intel_eval_set; derives label_status (confirmed|corrected|unlabelable). Never mutates draft_* or sample snapshot.';

revoke all on api.intel_eval_labeling from public;
revoke all on function api.save_intel_eval_label(text,text,text,text,text,text,boolean) from public;
grant select on api.intel_eval_labeling to service_role;
grant execute on function api.save_intel_eval_label(text,text,text,text,text,text,boolean) to service_role;
