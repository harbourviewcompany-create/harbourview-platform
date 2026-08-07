-- Replay-safe restoration of the production operator-passport foundation.
--
-- public.hv_passports and public.hv_passport_scores exist in production but
-- have no registered creator migration. Their first ledger reference is the
-- immediately following numeric-to-double-precision optimization. Restore the
-- exact live contract here with the original numeric score types so that the
-- recorded optimization remains the owner of the float8 conversion.

create table if not exists public.hv_passports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.workspaces(id) on delete cascade,
  completeness_score numeric,
  completeness_band text,
  verification_level text not null default 'none',
  export_readiness_score numeric,
  export_readiness_band text,
  import_readiness_score numeric,
  deal_readiness_score numeric,
  payment_readiness_signals jsonb,
  recall_exposure_flag boolean not null default false,
  last_computed_at timestamptz,
  public_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_passports_completeness_band_check check (
    completeness_band is null
    or completeness_band in ('incomplete', 'partial', 'substantial', 'complete')
  ),
  constraint hv_passports_export_band_check check (
    export_readiness_band is null
    or export_readiness_band in ('not_ready', 'partial', 'ready', 'verified')
  ),
  constraint hv_passports_verification_level_check check (
    verification_level in ('none', 'basic', 'standard', 'enhanced')
  )
);

create table if not exists public.hv_passport_scores (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.hv_passports(id) on delete cascade,
  dimension text not null,
  score numeric,
  max_score numeric not null default 100,
  confidence text not null default 'insufficient_data',
  evidence_count integer not null default 0,
  flags jsonb,
  computed_at timestamptz not null default now(),
  constraint hv_passport_scores_passport_id_dimension_key unique (passport_id, dimension),
  constraint hv_passport_scores_dimension_check check (
    dimension in (
      'identity',
      'licence',
      'facility',
      'document',
      'claim',
      'coa',
      'export',
      'import',
      'payment',
      'recall'
    )
  ),
  constraint hv_passport_scores_confidence_check check (
    confidence in ('high', 'medium', 'low', 'insufficient_data')
  )
);

create index if not exists idx_hv_passports_org
  on public.hv_passports (org_id);

create index if not exists idx_hv_passports_band
  on public.hv_passports (verification_level, completeness_band);

create index if not exists idx_hv_passport_scores_passport
  on public.hv_passport_scores (passport_id);

alter table public.hv_passports enable row level security;
alter table public.hv_passport_scores enable row level security;

grant select, insert, update, delete
  on table public.hv_passports, public.hv_passport_scores
  to anon, authenticated;
grant all privileges
  on table public.hv_passports, public.hv_passport_scores
  to service_role;

do $restore_hv_passport_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passports'::regclass
      and polname = 'hv_passports_org_member_select'
  ) then
    execute $policy$
      create policy hv_passports_org_member_select
        on public.hv_passports
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passports'::regclass
      and polname = 'hv_passports_staff_all'
  ) then
    execute $policy$
      create policy hv_passports_staff_all
        on public.hv_passports
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passport_scores'::regclass
      and polname = 'hv_passport_scores_org_member_select'
  ) then
    execute $policy$
      create policy hv_passport_scores_org_member_select
        on public.hv_passport_scores
        as permissive
        for select
        to public
        using (
          passport_id in (
            select p.id
            from public.hv_passports p
            where public.hv_is_org_member(p.org_id)
          )
        )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_passport_scores'::regclass
      and polname = 'hv_passport_scores_staff_all'
  ) then
    execute $policy$
      create policy hv_passport_scores_staff_all
        on public.hv_passport_scores
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_passport_policies$;

comment on table public.hv_passports is
  'One passport per org. Scores computed by Edge Function only.';
comment on table public.hv_passport_scores is
  'Dimension-level breakdown. All numeric — PRIVATE to org and admin only.';
