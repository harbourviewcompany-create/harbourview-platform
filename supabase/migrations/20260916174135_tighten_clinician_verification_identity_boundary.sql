-- Prevent authenticated callers from probing verification status for arbitrary user IDs.
-- Service-role callers retain the explicit-user lookup used by trusted backend paths.

create or replace function public.is_verified_clinician(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when auth.uid() is not null and p_user_id is distinct from auth.uid() then false
      else exists (
        select 1
        from public.hv_professionals p
        join public.clinical_clinician_links l
          on l.professional_id = p.id
         and l.user_id = p_user_id
         and l.link_status = 'active'
        where p.user_id = p_user_id
          and p.verification_status = 'verified'
          and p.status = 'active'
          and p.clinical_role is not null
      )
    end;
$$;

revoke all on function public.is_verified_clinician(uuid) from public;
grant execute on function public.is_verified_clinician(uuid) to authenticated, service_role;

create or replace function api.is_verified_clinician(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_verified_clinician(p_user_id);
$$;

revoke all on function api.is_verified_clinician(uuid) from public;
grant execute on function api.is_verified_clinician(uuid) to authenticated, service_role;
