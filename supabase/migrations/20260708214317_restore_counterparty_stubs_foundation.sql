-- Production's public.counterparty_stubs relation existed out of band before the
-- 20260708214318 RLS initplan snapshot rewrote its policy. Restore the exact
-- relation contract during zero-state replay without replacing or updating data.

create table if not exists public.counterparty_stubs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null check (char_length(display_name) > 0),
  jurisdiction_code text,
  license_number text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_counterparty_stubs_workspace
  on public.counterparty_stubs(workspace_id);

alter table public.counterparty_stubs enable row level security;

do $restore_counterparty_stubs_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.counterparty_stubs'::regclass
      and polname = 'admin_all_counterparty_stubs'
  ) then
    create policy admin_all_counterparty_stubs
      on public.counterparty_stubs
      as permissive
      for all
      to public
      using (
        (select auth.uid()) is not null
        and (select auth.role()) = 'admin'::text
      )
      with check (
        (select auth.uid()) is not null
        and (select auth.role()) = 'admin'::text
      );
  end if;
end
$restore_counterparty_stubs_policy$;

-- Match the production table ACL. The policy remains the row-access boundary;
-- service_role retains trusted maintenance access.
grant select, insert, update, delete on table public.counterparty_stubs
  to anon, authenticated;
grant all privileges on table public.counterparty_stubs to service_role;
