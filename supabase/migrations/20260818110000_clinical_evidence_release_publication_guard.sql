-- Clinical corpus release guard.
--
-- Production currently has the August 18 seed migrations applied without the
-- Clinical Evidence V1/V1.1 governance chain. This migration is intentionally
-- ordered after V1/V1.1 and before those August 18 seeds for a zero-state replay.
-- It changes no evidence rows. Its only legacy accommodation is fail-closed:
-- known historical graded INSERT seeds are staged under review when replayed
-- from zero instead of bypassing credential-bound publication governance.

do $$
begin
  if to_regclass('public.clinical_evidence_reviews') is null
     or to_regclass('public.clinical_reviewer_credentials') is null
     or to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') is null then
    raise exception 'Clinical Evidence V1/V1.1 governance must be applied before the Clinical corpus release guard';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clinical_evidence_records'
      and column_name = 'publication_scope'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clinical_evidence_records'
      and column_name = 'freshness_status'
  ) then
    raise exception 'Clinical Evidence publication_scope/freshness controls are required before the Clinical corpus release guard';
  end if;
end $$;

create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  publication_transition boolean := false;
  provenance_approved boolean := false;
  qualified_review_approved boolean := false;
  legacy_zero_state_seed boolean := false;
begin
  if new.review_status <> 'published' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    publication_transition := true;
  elsif tg_op = 'UPDATE' then
    publication_transition :=
      old.review_status is distinct from 'published'
      or old.publication_scope is distinct from new.publication_scope
      or old.evidence_strength is distinct from new.evidence_strength;
  end if;

  if not publication_transition then
    return new;
  end if;

  select exists (
    select 1
    from public.clinical_evidence_reviews r
    where r.evidence_record_id = new.id
      and r.review_type = 'provenance'
      and r.decision = 'approved'
  ) into provenance_approved;

  if new.publication_scope = 'clinical-synthesis'
     or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
    select exists (
      select 1
      from public.clinical_evidence_reviews r
      where r.evidence_record_id = new.id
        and r.review_type = 'clinical'
        and r.reviewer_type in ('clinician','pharmacist')
        and r.decision = 'approved'
        and r.reviewer_user_id is not null
        and r.reviewer_credential_id is not null
        and public.clinical_reviewer_credential_is_valid(
          r.reviewer_credential_id,
          r.reviewer_user_id,
          r.reviewer_type,
          r.reviewed_at
        )
    ) into qualified_review_approved;
  else
    qualified_review_approved := true;
  end if;

  legacy_zero_state_seed := tg_op = 'INSERT' and new.slug = any (array[
    'ev-neuropathic-pain-overview',
    'ev-cbd-epilepsy-dravet-lgs',
    'ev-safety-monitoring-overview',
    'ev-cannabinoid-drug-interactions',
    'ev-spasticity-ms-overview',
    'ev-chemo-nausea-overview',
    'ev-anxiety-cbd-overview',
    'ev-sleep-cannabinoids-overview',
    'ev-chronic-pain-non-cancer-overview',
    'ev-parkinson-symptoms-overview',
    'ev-ptsd-symptoms-overview'
  ]::text[]);

  if legacy_zero_state_seed and (not provenance_approved or not qualified_review_approved) then
    new.review_status := 'under-review';
    new.publication_scope := 'clinical-synthesis';
    new.freshness_status := 'review-required';
    new.freshness_reason := 'Legacy graded seed replayed under Clinical Evidence V1/V1.1 governance; publication requires approved provenance and a valid credential-bound clinician/pharmacist review.';
    return new;
  end if;

  if not provenance_approved then
    raise exception 'clinical evidence publication requires an approved provenance review';
  end if;

  if not qualified_review_approved then
    raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
  end if;

  return new;
end;
$function$;

revoke all on function public.clinical_require_publication_review() from public;

drop trigger if exists trg_clinical_require_publication_review
  on public.clinical_evidence_records;
create trigger trg_clinical_require_publication_review
before insert or update of review_status, publication_scope, evidence_strength
on public.clinical_evidence_records
for each row execute function public.clinical_require_publication_review();

comment on function public.clinical_require_publication_review() is
  'Fail-closed Clinical publication gate. Known historical graded seed INSERTs are staged under review on zero-state replay; every other graded/synthesis publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.';
