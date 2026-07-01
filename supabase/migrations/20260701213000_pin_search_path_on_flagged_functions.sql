-- Pin search_path on the 13 functions flagged by the Supabase security advisor
-- (function_search_path_mutable). Applied to prod 2026-07-01 via MCP and
-- registered in the ledger; this file mirrors that apply.
ALTER FUNCTION public.claim_pipeline_tasks(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.complete_pipeline_task(uuid) SET search_path = 'public';
ALTER FUNCTION public.fail_pipeline_task(uuid, text, integer) SET search_path = 'public';
ALTER FUNCTION public.get_corridor_stats(text) SET search_path = 'public';
ALTER FUNCTION public.get_field_changes_for_country(text, integer) SET search_path = 'public';
ALTER FUNCTION public.get_regulatory_calendar(text, integer) SET search_path = 'public';
ALTER FUNCTION public.hv_clean_scraped_headline(text) SET search_path = 'public';
ALTER FUNCTION public.hv_trigger_embed() SET search_path = 'public';
ALTER FUNCTION public.hv_trigger_extract() SET search_path = 'public';
ALTER FUNCTION public.hv_trigger_score() SET search_path = 'public';
ALTER FUNCTION public.sync_playbook_regulators(text) SET search_path = 'public';
ALTER FUNCTION public.trg_track_briefing_field_changes() SET search_path = 'public';
ALTER FUNCTION public.trg_track_country_field_changes() SET search_path = 'public';
