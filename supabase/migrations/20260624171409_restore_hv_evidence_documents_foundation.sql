-- Replay-safe restoration of the production hv_evidence_documents and
-- hv_claims foundations.
--
-- The production relations and their access helpers predate their first
-- recorded migration-ledger reference (20260624171410), but no registered
-- migration owns their creation. Keep later migrations responsible for the
-- foreign-key covering indexes, API view exposure, authenticated SELECT grant,
-- anon-view tightening, and FORCE ROW LEVEL SECURITY.

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

-- public.hv_claims and public.hv_claim_reviews share this reconciliation slot.
-- They are the same defect: both exist in production, both are referenced for
-- the first time by ledger version 20260624171410 (the covering-index
-- migration indexes hv_claims.evidence_document_id, hv_claim_reviews.claim_id
-- and hv_claim_reviews.reviewed_by), and no registered migration owns their
-- creation. hv_claims carries a foreign key into hv_evidence_documents, so it
-- has to be restored after the block above and before 20260624171410, and
-- scripts/check-migration-filenames.mjs pins migration versions to exactly
-- fourteen digits — there is no free second between the two. Restoring them
-- here keeps the recorded chronology instead of inventing a later timestamp.
--
-- Later migrations stay the owners of everything they already own: the three
-- foreign-key covering indexes belong to 20260624171410, the api.hv_claims
-- view to 20260711012305, and the security-invoker hardening with its
-- companion authenticated grant to 20260711160935.

create table if not exists public.hv_claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  claim_type text not null,
  claim_text text not null,
  evidence_document_id uuid references public.hv_evidence_documents(id),
  status text not null default 'unreviewed',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_claims_type_check check (
    claim_type in (
      'gmp',
      'gacp',
      'organic',
      'export_ready',
      'iso_certified',
      'pesticide_free',
      'solvent_free',
      'heavy_metal_compliant',
      'pharmaceutical_grade',
      'other'
    )
  ),
  constraint hv_claims_status_check check (
    status in ('unreviewed', 'supported', 'unsupported', 'contested', 'withdrawn')
  )
);

create table if not exists public.hv_claim_reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.hv_claims(id) on delete cascade,
  reviewed_by uuid not null references auth.users(id),
  verdict text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint hv_claim_reviews_verdict_check check (
    verdict in (
      'supported',
      'unsupported',
      'contested',
      'insufficient_evidence',
      'deferred'
    )
  )
);

-- idx_hv_claims_org_status also covers the org_id foreign key, which is why
-- production has no separate idx_hv_claims_org_id from 20260624171410.
create index if not exists idx_hv_claims_org_status
  on public.hv_claims (org_id, status);

create index if not exists idx_hv_claims_public
  on public.hv_claims (org_id, is_public)
  where status = 'supported' and is_public = true;

alter table public.hv_claims enable row level security;
alter table public.hv_claim_reviews enable row level security;

-- Same client-role grant surface as hv_evidence_documents above, and safe for
-- the same reason: both policy sets resolve false without an authenticated
-- user, so the anon grant reaches no rows.
grant select, insert, update, delete
  on table public.hv_claims
  to anon, authenticated;
grant all privileges
  on table public.hv_claims
  to service_role;

grant select, insert, update, delete
  on table public.hv_claim_reviews
  to anon, authenticated;
grant all privileges
  on table public.hv_claim_reviews
  to service_role;

do $restore_hv_claims_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_insert'
  ) then
    execute $policy$
      create policy hv_claims_org_member_insert
        on public.hv_claims
        as permissive
        for insert
        to public
        with check (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_select'
  ) then
    execute $policy$
      create policy hv_claims_org_member_select
        on public.hv_claims
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_update'
  ) then
    execute $policy$
      create policy hv_claims_org_member_update
        on public.hv_claims
        as permissive
        for update
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_staff_all'
  ) then
    execute $policy$
      create policy hv_claims_staff_all
        on public.hv_claims
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claim_reviews'::regclass
      and polname = 'hv_claim_reviews_org_read_verdict'
  ) then
    execute $policy$
      create policy hv_claim_reviews_org_read_verdict
        on public.hv_claim_reviews
        as permissive
        for select
        to public
        using (
          claim_id in (
            select hv_claims.id
            from public.hv_claims
            where public.hv_is_org_member(hv_claims.org_id)
          )
        )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claim_reviews'::regclass
      and polname = 'hv_claim_reviews_staff_all'
  ) then
    execute $policy$
      create policy hv_claim_reviews_staff_all
        on public.hv_claim_reviews
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_claims_policies$;

do $restore_hv_claims_comments$
begin
  if col_description('public.hv_claims'::regclass, (
    select attnum
    from pg_attribute
    where attrelid = 'public.hv_claims'::regclass
      and attname = 'is_public'
  )) is null then
    execute $comment$
      comment on column public.hv_claims.is_public is
        'Only status=supported AND is_public=true claims appear in PublicPassportSummaryDTO'
    $comment$;
  end if;

  if obj_description('public.hv_claim_reviews'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_claim_reviews is
        'Reviewer verdicts on org claims. Notes are PRIVATE — never in org-facing DTOs.'
    $comment$;
  end if;

  if col_description('public.hv_claim_reviews'::regclass, (
    select attnum
    from pg_attribute
    where attrelid = 'public.hv_claim_reviews'::regclass
      and attname = 'notes'
  )) is null then
    execute $comment$
      comment on column public.hv_claim_reviews.notes is
        'FORBIDDEN in org-facing DTOs. Admin/reviewer only.'
    $comment$;
  end if;
end
$restore_hv_claims_comments$;
