-- Clinical publication gate — reviewer credential and GRADE integrity.
--
-- Control document: docs/control/CLINICAL_PUBLICATION_GATE_20260819.md
--
-- Context. The publication trigger chain is live and correct: a graded evidence
-- record cannot be published without an approved provenance review plus an
-- approved review by a clinician or pharmacist whose credential validates. What
-- the schema did not enforce was the integrity of the credential itself:
--
--   1. `clinical_reviewer_credentials.user_id` had no foreign key. Any UUID was
--      accepted, including one belonging to no account at all.
--   2. `verified_by_user_id` was nullable and unchecked while the write policy is
--      the same admin/operator role that performs the verification — so a
--      credential could be marked `verified` with no record of who checked the
--      register, and an admin could verify their own credential.
--   3. `clinical_grade_assessments` stored every GRADE domain as unconstrained
--      text, so a typo ("very serious") would persist silently and never match
--      the vocabulary the application reads.
--
-- `clinical_reviewer_credentials` and `clinical_grade_assessments` are both empty
-- in production at the time of writing, so every constraint below is added
-- without a backfill and cannot fail validation against existing rows.
--
-- This migration does not publish anything, does not create a credential, and
-- does not relax any existing gate. It only makes the gate harder to bypass.

begin;

-- 1. A credential must belong to a real account -------------------------------

alter table public.clinical_reviewer_credentials
  drop constraint if exists clinical_reviewer_credentials_user_id_fkey;

alter table public.clinical_reviewer_credentials
  add constraint clinical_reviewer_credentials_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete restrict;

alter table public.clinical_reviewer_credentials
  drop constraint if exists clinical_reviewer_credentials_verified_by_fkey;

alter table public.clinical_reviewer_credentials
  add constraint clinical_reviewer_credentials_verified_by_fkey
  foreign key (verified_by_user_id) references auth.users (id) on delete restrict;

-- 2. Verification must be attributable, and cannot be self-attested -----------

alter table public.clinical_reviewer_credentials
  drop constraint if exists clinical_reviewer_credential_verifier_recorded;

alter table public.clinical_reviewer_credentials
  add constraint clinical_reviewer_credential_verifier_recorded
  check (verification_status <> 'verified' or verified_by_user_id is not null);

alter table public.clinical_reviewer_credentials
  drop constraint if exists clinical_reviewer_credential_no_self_verification;

alter table public.clinical_reviewer_credentials
  add constraint clinical_reviewer_credential_no_self_verification
  check (verified_by_user_id is null or verified_by_user_id <> user_id);

-- 3. A validity window must be coherent ---------------------------------------

alter table public.clinical_reviewer_credentials
  drop constraint if exists clinical_reviewer_credential_validity_window;

alter table public.clinical_reviewer_credentials
  add constraint clinical_reviewer_credential_validity_window
  check (valid_from is null or valid_until is null or valid_from <= valid_until);

-- 4. GRADE domains must use the GRADE vocabulary ------------------------------

alter table public.clinical_grade_assessments
  drop constraint if exists clinical_grade_assessments_starting_certainty_check;

alter table public.clinical_grade_assessments
  add constraint clinical_grade_assessments_starting_certainty_check
  check (starting_certainty in ('high', 'moderate', 'low', 'very-low'));

alter table public.clinical_grade_assessments
  drop constraint if exists clinical_grade_assessments_final_certainty_check;

alter table public.clinical_grade_assessments
  add constraint clinical_grade_assessments_final_certainty_check
  check (final_certainty in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted'));

alter table public.clinical_grade_assessments
  drop constraint if exists clinical_grade_assessments_downgrade_domains_check;

-- Risk of bias, inconsistency, indirectness and imprecision share one scale.
alter table public.clinical_grade_assessments
  add constraint clinical_grade_assessments_downgrade_domains_check
  check (
    risk_of_bias in ('not-assessed', 'not-serious', 'serious', 'very-serious')
    and inconsistency in ('not-assessed', 'not-serious', 'serious', 'very-serious')
    and indirectness in ('not-assessed', 'not-serious', 'serious', 'very-serious')
    and imprecision in ('not-assessed', 'not-serious', 'serious', 'very-serious')
  );

alter table public.clinical_grade_assessments
  drop constraint if exists clinical_grade_assessments_publication_bias_check;

-- Publication bias has its own vocabulary rather than the serious/very-serious scale.
alter table public.clinical_grade_assessments
  add constraint clinical_grade_assessments_publication_bias_check
  check (publication_bias in ('not-assessed', 'undetected', 'suspected', 'strongly-suspected'));

-- 5. Lookup support for the credential validator ------------------------------

create index if not exists clinical_reviewer_credentials_validator_idx
  on public.clinical_reviewer_credentials (user_id, profession, verification_status);

commit;
