-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920155245
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

do $do$
declare
  def text;
begin
  select pg_get_functiondef(p.oid)
    into def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hv_pipeline_alerts'
    and pg_get_function_identity_arguments(p.oid) = '';

  def := replace(
    def,
    $old$where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)$old$,
    $new$where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (
        select 1
        from public.hv_entity_jobs j
        join net._http_response r on r.id = j.request_id
        where j.signal_id = s.id
          and j.harvested
          and r.status_code = 200
      )$new$
  );

  def := replace(
    def,
    $old$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'$old$,
    $new$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$new$
  );

  def := replace(
    def,
    $old$from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version$old$,
    $new$from (
      select distinct classifier_version
      from public.signals
      where classifier_version is not null
        and created_at > now() - interval '14 days'
    ) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version$new$
  );

  execute def;
end
$do$;
