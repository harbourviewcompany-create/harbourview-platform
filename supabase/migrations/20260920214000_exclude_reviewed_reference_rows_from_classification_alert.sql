do $do$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='hv_pipeline_alerts'
    and pg_get_function_identity_arguments(p.oid)='';

  def := replace(
    def,
    $old$where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$old$,
    $new$where quality_label is null
      and reviewed is distinct from true
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = public.signals.id
          and q.resolved = false
      )$new$
  );
  execute def;
end
$do$;
