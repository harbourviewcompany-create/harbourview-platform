-- Clinical public-read grant restore (published-only).
-- Apply only with explicit production authorization.
-- Complements server-side service-role reads in clinicalEvidenceQuery /
-- clinicalInteractionQuery after 20260819100621 revoked anon EXECUTE on search.

begin;

-- ── Interactions ────────────────────────────────────────────────────────────
do $interactions$
begin
  if to_regclass('public.clinical_medication_interactions') is not null then
    grant select on public.clinical_medication_interactions to anon, authenticated;
    alter table public.clinical_medication_interactions enable row level security;

    if not exists (
      select 1 from pg_policy
      where polrelid = 'public.clinical_medication_interactions'::regclass
        and polname = 'clinical_interactions_public_read'
    ) then
      create policy clinical_interactions_public_read
        on public.clinical_medication_interactions
        for select
        to anon, authenticated
        using (review_status = 'published');
    end if;
  end if;

  if to_regclass('api.clinical_medication_interactions') is not null then
    grant select on api.clinical_medication_interactions to anon, authenticated, service_role;
  end if;
end
$interactions$;

-- ── Evidence records + change events ────────────────────────────────────────
do $evidence$
begin
  if to_regclass('public.clinical_evidence_records') is not null then
    grant select on public.clinical_evidence_records to anon, authenticated;
    alter table public.clinical_evidence_records enable row level security;

    if not exists (
      select 1 from pg_policy
      where polrelid = 'public.clinical_evidence_records'::regclass
        and polname = 'clinical_evidence_records_public_read'
    ) then
      create policy clinical_evidence_records_public_read
        on public.clinical_evidence_records
        for select
        to anon, authenticated
        using (review_status = 'published');
    end if;
  end if;

  if to_regclass('api.clinical_evidence_records') is not null then
    grant select on api.clinical_evidence_records to anon, authenticated, service_role;
  end if;

  if to_regclass('public.clinical_evidence_change_events') is not null then
    grant select on public.clinical_evidence_change_events to anon, authenticated;
    alter table public.clinical_evidence_change_events enable row level security;

    if not exists (
      select 1 from pg_policy
      where polrelid = 'public.clinical_evidence_change_events'::regclass
        and polname = 'clinical_evidence_change_events_public_read'
    ) then
      create policy clinical_evidence_change_events_public_read
        on public.clinical_evidence_change_events
        for select
        to anon, authenticated
        using (review_status = 'published');
    end if;
  end if;

  if to_regclass('api.clinical_evidence_change_events') is not null then
    grant select on api.clinical_evidence_change_events to anon, authenticated, service_role;
  end if;
end
$evidence$;

-- ── Search / known-term RPCs ────────────────────────────────────────────────
do $rpcs$
begin
  if to_regprocedure('public.search_clinical_evidence_records(text,text,integer)') is not null then
    revoke all on function public.search_clinical_evidence_records(text, text, integer) from public;
    grant execute on function public.search_clinical_evidence_records(text, text, integer)
      to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.clinical_condition_term_known(text)') is not null then
    revoke all on function public.clinical_condition_term_known(text) from public;
    grant execute on function public.clinical_condition_term_known(text)
      to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.resolve_clinical_query(text,integer)') is not null then
    revoke all on function public.resolve_clinical_query(text, integer) from public;
    grant execute on function public.resolve_clinical_query(text, integer)
      to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.clinical_evidence_claims_for_records(uuid[])') is not null then
    revoke all on function public.clinical_evidence_claims_for_records(uuid[]) from public;
    grant execute on function public.clinical_evidence_claims_for_records(uuid[])
      to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.clinical_evidence_study_families_for_records(uuid[])') is not null then
    revoke all on function public.clinical_evidence_study_families_for_records(uuid[]) from public;
    grant execute on function public.clinical_evidence_study_families_for_records(uuid[])
      to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.clinical_evidence_corpus_profile(text)') is not null then
    revoke all on function public.clinical_evidence_corpus_profile(text) from public;
    grant execute on function public.clinical_evidence_corpus_profile(text)
      to anon, authenticated, service_role;
  end if;
end
$rpcs$;

commit;
