do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where p.prosecdef
      and n.nspname in ('public','api','signals','regulatory_signals')
  loop
    execute format('revoke execute on function %s from public', r.sig);
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;
end $$;
-- Re-open only the explicitly audited authenticated SECURITY DEFINER allowlist.
grant execute on function api.get_command_centre_stats() to authenticated;
grant execute on function api.get_corridor_stats(text) to authenticated;
grant execute on function api.get_source_registry_coverage(text) to authenticated;
grant execute on function api.regulatory_pending_changes_feed() to authenticated;
grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to authenticated;
grant execute on function api.is_verified_clinician(uuid) to authenticated;
grant execute on function api.clinical_has_active_consent(uuid,text) to authenticated;
grant execute on function api.clinical_request_verification(text,text,text,uuid) to authenticated;
grant execute on function public.hv_is_org_member(uuid) to authenticated;
grant execute on function public.hv_is_platform_staff() to authenticated;
grant execute on function public.is_genetics_admin_or_reviewer() to authenticated;
grant execute on function public.is_harbourview_admin() to authenticated;
grant execute on function public.is_hv_staff() to authenticated;
grant execute on function public.current_user_tier() to authenticated;
grant execute on function public.is_regulatory_tier_admin() to authenticated;