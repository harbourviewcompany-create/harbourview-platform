-- Pin search_path on the function signatures flagged by the Supabase security
-- advisor. Production contained all 13 functions when this snapshot was
-- generated; repository zero-state history can omit optional pipeline routines.
-- Harden every exact signature that exists without weakening the final state.

do $pin_flagged_function_search_paths$
declare
  function_signature text;
  function_oid regprocedure;
begin
  foreach function_signature in array array[
    'public.claim_pipeline_tasks(text,text,integer)',
    'public.complete_pipeline_task(uuid)',
    'public.fail_pipeline_task(uuid,text,integer)',
    'public.get_corridor_stats(text)',
    'public.get_field_changes_for_country(text,integer)',
    'public.get_regulatory_calendar(text,integer)',
    'public.hv_clean_scraped_headline(text)',
    'public.hv_trigger_embed()',
    'public.hv_trigger_extract()',
    'public.hv_trigger_score()',
    'public.sync_playbook_regulators(text)',
    'public.trg_track_briefing_field_changes()',
    'public.trg_track_country_field_changes()'
  ]
  loop
    function_oid := to_regprocedure(function_signature);

    if function_oid is not null then
      execute format(
        'alter function %s set search_path = public',
        function_oid
      );
    end if;
  end loop;
end
$pin_flagged_function_search_paths$;
