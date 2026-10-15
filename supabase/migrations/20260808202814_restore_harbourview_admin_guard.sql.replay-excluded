create or replace function public.is_harbourview_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  );
$$;

revoke all on function public.is_harbourview_admin() from public;
grant execute on function public.is_harbourview_admin() to authenticated, service_role;