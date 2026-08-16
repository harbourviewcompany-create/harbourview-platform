\set ON_ERROR_STOP on
begin transaction read only;

select 'POSTFLIGHT|' || case when
  (select count(*) from supabase_migrations.schema_migrations where version='20260814122000') = 1
  and exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_dashboard_preferences' and column_name='active_workspace_id' and is_nullable='YES' and udt_name='uuid')
  and exists (select 1 from pg_constraint where conrelid='public.user_dashboard_preferences'::regclass and contype='f' and pg_get_constraintdef(oid) like '%active_workspace_id%REFERENCES workspaces(id)%ON DELETE SET NULL%')
  and to_regclass('public.workspace_invitations') is not null
  and to_regclass('api.workspace_invitations') is not null
  and to_regprocedure('api.accept_workspace_invitation(text,uuid,text)') is not null
  and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='workspace_invitations' and c.relrowsecurity)
  and not has_table_privilege('anon','public.workspace_invitations','SELECT')
  and not has_table_privilege('authenticated','public.workspace_invitations','SELECT')
  and not has_table_privilege('anon','api.workspace_invitations','SELECT')
  and not has_table_privilege('authenticated','api.workspace_invitations','SELECT')
  and has_table_privilege('service_role','api.workspace_invitations','SELECT')
  and not has_function_privilege('anon','api.accept_workspace_invitation(text,uuid,text)','EXECUTE')
  and not has_function_privilege('authenticated','api.accept_workspace_invitation(text,uuid,text)','EXECUTE')
  and has_function_privilege('service_role','api.accept_workspace_invitation(text,uuid,text)','EXECUTE')
  and exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='api' and p.proname='accept_workspace_invitation'
      and pg_get_function_identity_arguments(p.oid)='p_token_hash text, p_user_id uuid, p_user_email text'
      and p.prosecdef
      and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%'
  )
  and not exists (
    select 1 from public.user_dashboard_preferences p
    where p.active_workspace_id is not null
      and not exists (
        select 1 from public.workspace_members wm
        join public.workspaces w on w.id=wm.workspace_id
        where wm.workspace_id=p.active_workspace_id and wm.user_id=p.user_id
          and wm.status='active' and w.status='active'
      )
  )
then 'PASS' else 'HOLD' end;

select 'LATER|' || coalesce(json_agg(version order by version), '[]'::json)::text
from supabase_migrations.schema_migrations
where version > '20260814122000';

rollback;
