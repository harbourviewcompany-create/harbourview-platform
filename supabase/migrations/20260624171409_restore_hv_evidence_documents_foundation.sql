-- Replay-safe restoration of the production hv_evidence_documents foundation.
--
-- The production relation and its access helpers predate their first recorded
-- migration-ledger reference (20260624171410), but no registered migration owns
-- their creation. Keep later migrations responsible for the two foreign-key
-- covering indexes, API view exposure, authenticated SELECT grant, anon-view
-- tightening, and FORCE ROW LEVEL SECURITY.

-- Restore the two production access helpers only when the environment does not
-- already provide them. Existing production definitions therefore remain
-- untouched when this reconciliation migration is eventually applied.
do $restore_hv_evidence_helpers$
begin
  if to_regprocedure('public.hv_is_org_member(uuid)') is null then
    execute $create_function$
      create function public.hv_is_org_member(p_org_id uuid)
      returns boolean
      language sql
      stable
      security definer
      set search_path to public
      as $function$
        select exists (
          select 1
          from public.workspace_members
          where workspace_id = p_org_id
            and user_id = auth.uid()
            and status = 'active'
        );
      $function$
    $create_function$;
  end if;

  if to_regprocedure('public.hv_is_platform_staff()') is null then
    execute $create_function$
      create function public.hv_is_platform_staff()
      returns boolean
      language sql
      stable
      security definer
      set search_path to public
      as $function$
        select exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role in ('admin', 'super_admin', 'compliance_reviewer')
        );
      $function$
    $create_function$;
  end if;
end
$restore_hv_evidence_helpers$;

create table if not exists public.hv_evidence_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  document_type text not null,
  display_name text not null,
  storage_path text not null,
  file_hash text,
  file_size_bytes bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id),
  verification_status text not null default 'unverified',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  expiry_date date,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint hv_evidence_documents_type_check check (
    document_type in (
      'licence',
      'gmp_certificate',
      'gacp_certificate',
      'insurance',
      'export_permit',
      'import_permit',
      'lab_accreditation',
      'financial_reference',
      'coa',
      'recall_notice',
      'iso_certificate',
      'coa_supporting',
      'other'
    )
  ),
  constraint hv_evidence_documents_vstatus_check check (
    verification_status in ('unverified', 'pending', 'verified', 'rejected', 'expired')
  )
);

create index if not exists idx_hv_evidence_org_type
  on public.hv_evidence_documents (org_id, document_type, verification_status);

create index if not exists idx_hv_evidence_expiry
  on public.hv_evidence_documents (expiry_date)
  where expiry_date is not null;

alter table public.hv_evidence_documents enable row level security;

-- Match the live production client-role grant surface. The policies below deny
-- unauthenticated access because both helper predicates resolve false without
-- an authenticated user. Later hardening remains responsible for API-view
-- exposure and SECURITY DEFINER execution grants.
grant select, insert, update, delete
  on table public.hv_evidence_documents
  to anon, authenticated;
grant all privileges
  on table public.hv_evidence_documents
  to service_role;

do $restore_hv_evidence_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_org_member_insert'
  ) then
    execute $policy$
      create policy hv_evidence_org_member_insert
        on public.hv_evidence_documents
        as permissive
        for insert
        to public
        with check (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_org_member_select'
  ) then
    execute $policy$
      create policy hv_evidence_org_member_select
        on public.hv_evidence_documents
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_staff_all'
  ) then
    execute $policy$
      create policy hv_evidence_staff_all
        on public.hv_evidence_documents
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_evidence_policies$;

do $restore_hv_evidence_comment$
begin
  if obj_description('public.hv_evidence_documents'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_evidence_documents is
        'Private document vault. storage_path NEVER in API responses. Signed URLs via Edge Function only.'
    $comment$;
  end if;
end
$restore_hv_evidence_comment$;
