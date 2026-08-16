\set ON_ERROR_STOP on
begin transaction read only;

select 'STRUCTURAL|' || case when
  not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_dashboard_preferences' and column_name='active_workspace_id')
  and to_regclass('public.workspace_invitations') is null
  and to_regclass('api.workspace_invitations') is null
  and to_regprocedure('api.accept_workspace_invitation(text,uuid,text)') is null
  and not exists (select 1 from supabase_migrations.schema_migrations where version='20260814122000')
  and (select array_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='api' and table_name='user_dashboard_preferences') = array['id','user_id','country_iso2','role_id','heatmap_layer','created_at','updated_at']::text[]
  and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='api' and c.relname='user_dashboard_preferences' and 'security_invoker=true'=any(coalesce(c.reloptions,array[]::text[])))
  and exists (select 1 from pg_constraint where conrelid='public.workspace_members'::regclass and conname='workspace_members_pkey' and pg_get_constraintdef(oid)='PRIMARY KEY (workspace_id, user_id)')
  and exists (select 1 from pg_constraint where conrelid='public.workspace_members'::regclass and conname='workspace_members_role_check' and pg_get_constraintdef(oid) like '%admin%operator%analyst%viewer%')
  and exists (select 1 from pg_constraint where conrelid='public.workspace_members'::regclass and conname='workspace_members_status_check' and pg_get_constraintdef(oid) like '%active%invited%suspended%removed%')
  and exists (select 1 from pg_constraint where conrelid='public.workspaces'::regclass and conname='workspaces_status_check' and pg_get_constraintdef(oid) like '%active%suspended%archived%')
then 'PASS' else 'HOLD' end;

with eligible as (
  select wm.user_id, count(*) as eligible_count
  from public.workspace_members wm
  join public.workspaces w on w.id=wm.workspace_id and w.status='active'
  where wm.status='active'
  group by wm.user_id
)
select 'SNAPSHOT|' || json_build_object(
  'prefs_rows', (select count(*) from public.user_dashboard_preferences),
  'membership_rows', (select count(*) from public.workspace_members),
  'workspace_rows', (select count(*) from public.workspaces),
  'users_with_exactly_one_eligible_membership', (select count(*) from eligible where eligible_count=1),
  'prefs_rows_that_backfill', (select count(*) from public.user_dashboard_preferences p join eligible e on e.user_id=p.user_id and e.eligible_count=1),
  'users_with_multiple_eligible_memberships', (select count(*) from eligible where eligible_count>1),
  'active_memberships_in_nonactive_workspaces', (select count(*) from public.workspace_members wm join public.workspaces w on w.id=wm.workspace_id where wm.status='active' and w.status<>'active'),
  'orphan_memberships', (select count(*) from public.workspace_members wm left join public.workspaces w on w.id=wm.workspace_id where w.id is null),
  'membership_users_missing_auth', (select count(*) from public.workspace_members wm left join auth.users u on u.id=wm.user_id where u.id is null),
  'pref_users_missing_auth', (select count(*) from public.user_dashboard_preferences p left join auth.users u on u.id=p.user_id where u.id is null)
)::text;

select 'LATER|' || coalesce(json_agg(version order by version), '[]'::json)::text
from supabase_migrations.schema_migrations
where version > '20260814122000';

rollback;
