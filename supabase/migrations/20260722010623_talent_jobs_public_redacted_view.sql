
-- Match the marketplace_public_listings_v1 pattern (PR_REVIEW_CHECKLIST.md:
-- "Public listing views are redacted"): the public job board should not read
-- from a raw passthrough of talent_jobs (which carries created_by, a user id).
-- It also has no business showing a job from a workspace that hasn't opted
-- into public visibility, even if the posting itself is 'open' — respect
-- workspaces.is_public the same way the rest of the platform does.

create view api.talent_jobs_public
  with (security_invoker = on)
  as
  select
    tj.id,
    tj.title,
    tj.department,
    tj.location,
    tj.created_at,
    w.id as workspace_id,
    coalesce(w.trade_name, w.legal_name) as operator_name,
    w.verification_status as operator_verification_status
  from public.talent_jobs tj
  join public.workspaces w on w.id = tj.workspace_id
  where tj.status = 'open'
    and w.is_public = true;

-- The board reads from the redacted view; api.talent_jobs (full columns,
-- including created_by) stays authenticated-only for the future company
-- dashboard, gated by the workspace_manage / admin_manage RLS policies.
revoke select on api.talent_jobs from anon;
grant select on api.talent_jobs_public to anon, authenticated;
