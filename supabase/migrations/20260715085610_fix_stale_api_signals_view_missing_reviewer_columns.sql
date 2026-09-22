-- Reconstructed from production.
--
-- This migration was already applied in production under version 20260715085610.
-- The repository copy is maintained for faithful zero-state replay only.
-- At this historical point in the migration chain, later signal columns
-- (including role_families) do not yet exist. Recreate the API view using the
-- columns that actually exist at this point in replay. Later migrations widen
-- the view additively.
--
-- The dynamic column list is deliberate: it prevents a historical replay from
-- referencing a column introduced by a later migration while preserving the
-- exact production-time object shape. No production data is changed by editing
-- this repository artifact.

do $$
declare
  v_columns text;
begin
  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
    into v_columns
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'signals'
    and c.column_name in (
      'id','date','cat','pri','score','headline','summary','source','url',
      'verification','tier','lang','company','country','in_network','lane_r',
      'lane_e','lane_t','top_lane','query_pack','commercial_impact','reviewed',
      'action','created_at','embedding_1024','embedding_model','embedded_at',
      'reviewed_by','reviewed_at','editorial_title','editorial_blurb',
      'country_iso2','quality_label','quality_confidence','content_type',
      'impact','classifier_version','title_en','summary_en','lang_detected',
      'is_representative','cluster_rep_id','corroborating_count','geo_scope',
      'geo_region','role_families','routing_version','routed_at'
    );

  if v_columns is null then
    raise exception 'public.signals has no replayable columns at 20260715085610';
  end if;

  execute format(
    'create or replace view api.signals with (security_invoker = on) as select %s from public.signals',
    v_columns
  );
end $$;
