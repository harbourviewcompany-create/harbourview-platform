-- Widen the Stage 0 labeling view to surface the cross-check columns so the
-- review UI can flag disagreement rows for extra care during the full human pass.
-- (CREATE OR REPLACE cannot run cross-schema unqualified here; drop+recreate.)
-- Reversible: re-run the view body from expose_intel_eval_set_via_api_schema.
drop view if exists api.intel_eval_labeling;
create view api.intel_eval_labeling as
select
  e.id, e.signal_id,
  s.headline, s.summary, s.source, s.url,
  e.lang_at_sample, e.country_at_sample, e.score_at_sample, e.top_lane_at_sample,
  e.sample_stratum,
  e.draft_quality_label, e.draft_content_type, e.draft_impact, e.draft_reason,
  e.quality_label, e.content_type, e.impact, e.label_notes, e.labeled_by, e.labeled_at,
  e.label_status, e.updated_at,
  e.struct_is_junk, e.needs_human
from public.intel_eval_set e
join public.signals s on s.id = e.signal_id;

comment on view api.intel_eval_labeling is
  'Stage 0 labeling surface: intel_eval_set joined to signal content + cross-check flags. Admin/service-role only. Provenance (source/url) is admin-context only, never a public DTO.';

grant select on api.intel_eval_labeling to service_role;
