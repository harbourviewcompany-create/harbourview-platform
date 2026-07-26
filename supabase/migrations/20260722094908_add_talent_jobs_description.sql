
alter table public.talent_jobs add column description text;

drop view api.talent_jobs_public;

create view api.talent_jobs_public
  with (security_invoker = on)
  as
  select
    tj.id,
    tj.title,
    tj.department,
    tj.location,
    tj.description,
    tj.created_at,
    w.id as workspace_id,
    coalesce(w.trade_name, w.legal_name) as operator_name,
    w.verification_status as operator_verification_status
  from public.talent_jobs tj
  join public.workspaces w on w.id = tj.workspace_id
  where tj.status = 'open'
    and w.is_public = true;

grant select on api.talent_jobs_public to anon, authenticated;
