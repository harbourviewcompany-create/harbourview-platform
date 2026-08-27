-- Wire clinical_evidence_claim_map for real use.
--
-- 20260821190000_clinical_framework_alignment_optional.sql created this table
-- deliberately locked down (RLS enabled, zero policies) with the explicit note
-- that whoever wires the Claim Map UI to it should add real policies as a
-- reviewed security change. Doing that now, at Tyler's direct request.
--
-- Access model: same review-role gate already used for the other admin-only
-- clinical governance tables (clinical_evidence_reviews, clinical_intake_queue,
-- etc.) via the existing clinical_evidence_has_review_role() helper — not a
-- new pattern, reusing what's already established.

drop policy if exists clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map;
create policy clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

revoke all on public.clinical_evidence_claim_map from anon;
grant select, insert, update on public.clinical_evidence_claim_map to authenticated;
grant all on public.clinical_evidence_claim_map to service_role;

drop trigger if exists clinical_evidence_claim_map_updated_at
  on public.clinical_evidence_claim_map;
create trigger clinical_evidence_claim_map_updated_at
before update on public.clinical_evidence_claim_map
for each row execute function public.clinical_set_updated_at();

-- Seed with the three entries the admin page has been showing as fixtures,
-- so switching the page over to the database is a zero-surprise change —
-- same content, now persisted and editable instead of hardcoded.
insert into public.clinical_evidence_claim_map (
  claim_key, claim_statement, claim_kind, framework_alignment,
  evidence_record_ids, gap_owner, target_date, status
) values
(
  'claim-dravet-cbd-efficacy',
  'Pharmaceutical purified CBD as adjunctive therapy reduces convulsive seizure frequency in Dravet syndrome versus placebo.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "covered", "notes": "Established association supported by pivotal programmes and labels."},
      "analytical_validation": {"status": "partial", "notes": "Pharmaceutical assay/manufacturing controls; not software validation."},
      "clinical_validation": {"status": "covered", "notes": "Pivotal RCTs showed clinically meaningful convulsive seizure reduction."}
    },
    "dtaDomains": [
      {"domain": "safety", "ecosystem": "regulatory", "status": "covered", "notes": "Labelled AEs and monitoring characterised."},
      {"domain": "benefit", "ecosystem": "regulatory", "status": "covered", "notes": "Efficacy on convulsive seizure frequency established."},
      {"domain": "durability", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Long-term developmental and durability data still accumulating."},
      {"domain": "usability_accessibility", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Access depends on jurisdiction and product authorisation."},
      {"domain": "user_engagement", "ecosystem": "payment", "status": "missing", "notes": "Not a DTx; engagement metrics N/A."}
    ],
    "dtxRwePhase": "monitor",
    "relevanceReliability": {
      "availability": "strong", "generalizability": "adequate", "accuracy": "strong",
      "completeness": "adequate", "provenance": "strong",
      "overallNotes": "Pivotal RCTs and regulatory assessments with clear provenance."
    },
    "alcoaPlusComplete": true,
    "commercialStageGate": "scale",
    "commercialPriority": "high"
  }'::jsonb,
  array['ev-dravet-cbd', 'ev-br-epilepsy-001'],
  'clinical-evidence',
  '2026-12-31',
  'partial'
),
(
  'claim-neuropathic-pain-modest',
  'Some THC-containing products produce small average reductions in chronic neuropathic pain intensity versus placebo, with higher adverse-event rates.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "partial", "notes": "Association signalled in meta-analyses; product heterogeneity limits strength."},
      "analytical_validation": {"status": "missing", "notes": "Heterogeneous non-standardised products dominate evidence base."},
      "clinical_validation": {"status": "partial", "notes": "Small average effects; functional benefit uncertain."}
    },
    "dtaDomains": [
      {"domain": "safety", "ecosystem": "regulatory", "status": "partial", "notes": "AE-related withdrawal not uncommon; product variability high."},
      {"domain": "benefit", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Modest intensity reductions in some analyses."},
      {"domain": "durability", "ecosystem": "clinical_acceptance", "status": "missing", "notes": "Long-term comparative effectiveness limited."}
    ],
    "dtxRwePhase": "test",
    "relevanceReliability": {
      "availability": "adequate", "generalizability": "partial", "accuracy": "partial",
      "completeness": "partial", "provenance": "adequate",
      "overallNotes": "Systematic reviews available; formulation heterogeneity weakens reliability."
    },
    "alcoaPlusComplete": false,
    "commercialStageGate": "series_a",
    "commercialPriority": "medium"
  }'::jsonb,
  array['ev-neuropathic-pain', 'ev-br-pain-001'],
  'clinical-evidence',
  '2027-06-30',
  'gap'
),
(
  'claim-ms-spasticity-nabiximols',
  'Oromucosal THC:CBD can improve moderate-to-severe MS spasticity symptoms after inadequate response to other agents in selected responders.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "covered", "notes": "Supported by nabiximols programme and product assessments."},
      "analytical_validation": {"status": "partial", "notes": "Regulated pharmaceutical product context."},
      "clinical_validation": {"status": "partial", "notes": "Enrichment designs limit generalisability; not first-line."}
    },
    "dtaDomains": [
      {"domain": "benefit", "ecosystem": "regulatory", "status": "partial", "notes": "NRS improvement in responder populations."},
      {"domain": "safety", "ecosystem": "regulatory", "status": "covered", "notes": "Dizziness and fatigue common and labelled."}
    ],
    "dtxRwePhase": "monitor",
    "relevanceReliability": {
      "availability": "adequate", "generalizability": "partial", "accuracy": "adequate",
      "completeness": "adequate", "provenance": "strong"
    },
    "alcoaPlusComplete": true,
    "commercialStageGate": "pre_launch",
    "commercialPriority": "high"
  }'::jsonb,
  array['ev-ms-spasticity'],
  null,
  null,
  'partial'
)
on conflict (claim_key) do nothing;
