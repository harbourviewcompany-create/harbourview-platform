-- Production had the private disclosure workflow out of band before later
-- dashboard and API migrations referenced it. Zero-state replay can restore it
-- only after the canonical matching foundation at 20260630233905, because the
-- production contract requires disclosure_requests.match_id -> matches.id.
--
-- Additive and idempotent: existing reviewed workflow rows are never replaced,
-- updated, or deleted.

do $restore_disclosure_status$
declare
  actual_labels text[];
begin
  if to_regtype('public.disclosure_status') is null then
    create type public.disclosure_status as enum (
      'requested',
      'approved',
      'rejected'
    );
  else
    select array_agg(e.enumlabel order by e.enumsortorder)
      into actual_labels
    from pg_enum e
    where e.enumtypid = 'public.disclosure_status'::regtype;

    if actual_labels is distinct from array['requested','approved','rejected']::text[] then
      raise exception
        'Enum public.disclosure_status contract mismatch: expected %, found %',
        array['requested','approved','rejected']::text[],
        actual_labels;
    end if;
  end if;
end
$restore_disclosure_status$;

create table if not exists public.disclosure_requests (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id),
  requested_by text not null,
  status public.disclosure_status not null default 'requested',
  approved_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.disclosure_requests enable row level security;

create index if not exists idx_disclosure_requests_match_id
  on public.disclosure_requests(match_id);

comment on table public.disclosure_requests is
  'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';

do $restore_disclosure_admin_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.disclosure_requests'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.disclosure_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$restore_disclosure_admin_policy$;

-- Match production ACLs. RLS permits only the explicit admin/operator SELECT path;
-- all client writes remain denied while service_role retains trusted workflow access.
grant select, insert, update, delete on table public.disclosure_requests
  to anon, authenticated;
grant all privileges on table public.disclosure_requests to service_role;
