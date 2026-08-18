-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714225601.
--
-- Rewriting this file cannot affect production: 20260714225601 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 0 support: PostgREST on this project exposes ONLY the `api` schema
-- (lib/supabase/env.ts SUPABASE_DB_SCHEMA='api'). public.intel_eval_set is
-- therefore unreachable by the app's admin data client without an api-schema
-- surface. This migration adds a read VIEW and a write RPC, service_role-only.
-- Reason: the Stage 0 admin labeling page needs a reachable read/write path.
-- Additive + reversible. Rollback:
--   drop function if exists api.save_intel_eval_label(text,text,text,text,text,text);
--   drop view if exists api.intel_eval_labeling;

-- Read surface: eval rows joined to their signal content for the labeling UI.
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

-- Write surface: records a human label, derives label_status by comparing to the
-- assistant draft so draft-vs-human agreement stays measurable. Only ever writes
-- the human columns; never touches draft_* or the sample snapshot.
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

-- Least-privilege: service_role only (admin pages authenticate via requireAdminAuth
-- then use the service-role key). Keep PUBLIC/anon/authenticated off both objects.
revoke all on api.intel_eval_labeling from public;
revoke all on function api.save_intel_eval_label(text,text,text,text,text,text,boolean) from public;
grant select on api.intel_eval_labeling to service_role;
grant execute on function api.save_intel_eval_label(text,text,text,text,text,text,boolean) to service_role;
