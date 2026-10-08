
-- RECOVERY BEGIN 20260818192000_clinical_graded_evidence_interactions_depth.sql
-- Clinical corpus depth release: governed evidence staging + normalized interactions.
--
-- This migration is intentionally fail-closed. It must not be run against the
-- current production-shaped schema until the missing Clinical Evidence V1/V1.1
-- governance migrations have been applied. The nine graded clinical-synthesis
-- records are staged under review; this migration creates no provenance or
-- clinician/pharmacist approvals on their behalf.

do $$
begin
  if to_regclass('public.clinical_evidence_sources') is null
     or to_regclass('public.clinical_evidence_reviews') is null
     or to_regclass('public.clinical_reviewer_credentials') is null
     or to_regclass('public.clinical_evidence_source_snapshots') is null
     or to_regclass('public.clinical_evidence_intake_queue') is null
     or to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') is null then
    raise exception 'Clinical Evidence V1/V1.1 governance is required before 20260818192000 corpus depth';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinical_evidence_records' and column_name = 'publication_scope'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinical_evidence_records' and column_name = 'freshness_status'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinical_evidence_records' and column_name = 'primary_source_registry_id'
  ) then
    raise exception 'publication_scope, source provenance and freshness controls are required before 20260818192000 corpus depth';
  end if;
end $$;

-- Normalize interaction identity without deleting or rewriting any existing row.
alter table public.clinical_medication_interactions
  add column if not exists medication_ingredient_key text
    generated always as (lower(regexp_replace(btrim(medication_ingredient), '[[:space:]]+', ' ', 'g'))) stored,
  add column if not exists cannabinoid_key text
    generated always as (lower(btrim(cannabinoid))) stored;

create unique index if not exists clinical_medication_interactions_normalized_pair_uidx
  on public.clinical_medication_interactions (medication_ingredient_key, cannabinoid_key);

insert into public.clinical_medication_interactions as existing (
  medication_ingredient, cannabinoid, mechanism, clinical_significance,
  evidence_certainty, uncertainty, monitoring_consideration,
  primary_source_title, primary_source_url, verified_at, review_status
) values
(
  'valproate', 'CBD',
  'Concomitant CBD and valproate is associated with higher rates of transaminase elevation',
  'major', 'moderate',
  'Dose, product and baseline liver status modify risk',
  'Baseline and follow-up LFTs; interrupt or adjust with specialist input if enzymes rise',
  'Interactions between cannabidiol and commonly used antiepileptic drugs',
  'https://pubmed.ncbi.nlm.nih.gov/28782097/',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'clobazam', 'THC',
  'Additive sedation and psychomotor impairment are possible',
  'moderate', 'low',
  'Limited controlled data specific to THC plus clobazam',
  'Monitor sedation; counsel on driving and falls',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'opioids', 'THC',
  'Additive CNS depression and sedation may occur; vulnerable patients require additional caution',
  'major', 'moderate',
  'Patient frailty, dose and route strongly modify risk',
  'Avoid concurrent escalation; monitor sedation and respiratory status',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'opioids', 'CBD',
  'Possible additive sedation; interaction magnitude is formulation and dose dependent',
  'moderate', 'low',
  'Sparse controlled co-administration data',
  'Monitor sedation especially in older adults or respiratory disease',
  'Health Canada cannabis for medical purposes: general information',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'benzodiazepines', 'THC',
  'Additive sedation, impaired coordination and cognitive effects are possible',
  'moderate', 'moderate',
  'Depends on benzodiazepine half-life and THC dose and route',
  'Avoid concurrent titration; counsel on driving and falls',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'benzodiazepines', 'CBD',
  'Possible increased sedation via additive CNS effects and agent-specific metabolic pathways',
  'moderate', 'low',
  'Agent-specific pharmacokinetic data are incomplete',
  'Monitor sedation; consider specialist review in complex regimens',
  'Health Canada cannabis for medical purposes: general information',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'phenytoin', 'CBD',
  'Potential CYP-mediated change in antiseizure-medication exposure',
  'moderate', 'low',
  'Direct clinical evidence for individual agents is limited',
  'Consider level and clinical monitoring when starting or stopping CBD',
  'Interaction of cannabidiol with other antiseizure medications: a narrative review',
  'https://pubmed.ncbi.nlm.nih.gov/33541771/',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'carbamazepine', 'CBD',
  'Carbamazepine may alter CBD exposure and clinically relevant interaction remains possible',
  'moderate', 'low',
  'Bidirectional uncertainty remains and product variability is material',
  'Use clinical monitoring and drug levels where clinically indicated',
  'Interaction of cannabidiol with other antiseizure medications: a narrative review',
  'https://pubmed.ncbi.nlm.nih.gov/33541771/',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'everolimus', 'CBD',
  'CBD can increase everolimus systemic exposure',
  'major', 'moderate',
  'Magnitude depends on CBD exposure and patient factors',
  'Therapeutic drug monitoring and dose review are advised when CBD is introduced or changed',
  'Pharmacokinetic drug-drug interaction with cannabidiol and everolimus',
  'https://pubmed.ncbi.nlm.nih.gov/37132402/',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'alcohol', 'THC',
  'Combined use may increase impairment of cognition, coordination and driving performance',
  'major', 'moderate',
  'Dose dependent and individual response varies',
  'Counsel against combined use before driving or safety-critical work',
  'Health Canada cannabis for medical purposes: general information',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'alcohol', 'CBD',
  'Possible additive sedation and impairment',
  'moderate', 'low',
  'Controlled impairment evidence is less complete than for THC',
  'Counsel caution with combined use',
  'Health Canada cannabis for medical purposes: general information',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'theophylline', 'CBD',
  'Potential metabolic interaction warrants clinical awareness',
  'minor', 'very-low',
  'Sparse direct clinical confirmation',
  'Monitor clinical effect when material CBD exposure changes',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'bupropion', 'CBD',
  'Potential metabolic interaction remains clinically uncertain',
  'minor', 'very-low',
  'Limited direct evidence',
  'Monitor clinical response; do not assume absence of interaction',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'anticholinergics', 'THC',
  'Additive tachycardia, dry mouth and cognitive effects are possible in susceptible patients',
  'minor', 'low',
  'Evidence is primarily pharmacologic and class based',
  'Use caution in older adults; monitor cognition and heart rate if symptomatic',
  'Health Canada information for health care professionals: cannabis and cannabinoids',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html',
  '2026-08-18T00:00:00Z', 'published'
),
(
  'cns-depressants', 'CBD',
  'Additive somnolence is possible with sedating agents',
  'moderate', 'moderate',
  'Product, dose and co-medication dependent',
  'Titrate cautiously; counsel on sedation and driving',
  'Health Canada cannabis for medical purposes: general information',
  'https://www.canada.ca/en/health-canada/topics/accessing-cannabis-for-medical-purposes/cannabis-medical-purposes.html',
  '2026-08-18T00:00:00Z', 'published'
)
on conflict (medication_ingredient_key, cannabinoid_key) do update set
  mechanism = excluded.mechanism,
  clinical_significance = excluded.clinical_significance,
  evidence_certainty = excluded.evidence_certainty,
  uncertainty = excluded.uncertainty,
  monitoring_consideration = excluded.monitoring_consideration,
  primary_source_title = excluded.primary_source_title,
  primary_source_url = excluded.primary_source_url,
  verified_at = excluded.verified_at,
  review_status = existing.review_status,
  updated_at = now();

-- Normalized, record-specific source provenance for the nine graded records.
insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction,
  pmid, retrieved_at, currentness
) values
('pubmed-28538134', 'randomized-trial', 'Trial of Cannabidiol for Drug-Resistant Seizures in the Dravet Syndrome', 'N Engl J Med / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/28538134/', array['global'], '28538134', '2026-08-18T00:00:00Z', 'current'),
('pubmed-29768152', 'randomized-trial', 'Effect of Cannabidiol on Drop Seizures in the Lennox-Gastaut Syndrome', 'N Engl J Med / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/29768152/', array['global'], '29768152', '2026-08-18T00:00:00Z', 'current'),
('pubmed-39502271', 'systematic-review', 'Cannabinoids for spasticity in patients with multiple sclerosis: a systematic review and meta-analysis', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/39502271/', array['global'], '39502271', '2026-08-18T00:00:00Z', 'current'),
('pubmed-39953210', 'systematic-review', 'Efficacy of cannabinoids for the prophylaxis of chemotherapy-induced nausea and vomiting: a systematic review and meta-analysis', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/39953210/', array['global'], '39953210', '2026-08-18T00:00:00Z', 'current'),
('pubmed-40238954', 'systematic-review', 'Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain: 2024 Update', 'AHRQ / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/40238954/', array['global'], '40238954', '2026-08-18T00:00:00Z', 'current'),
('pubmed-32969022', 'other', 'Cannabidiol in conjunction with clobazam: analysis of four randomized controlled trials', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/32969022/', array['global'], '32969022', '2026-08-18T00:00:00Z', 'current'),
('pubmed-40929927', 'systematic-review', 'Effectiveness of cannabinoids on subjective sleep quality: a systematic review and meta-analysis of randomised studies', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/40929927/', array['global'], '40929927', '2026-08-18T00:00:00Z', 'current'),
('pubmed-36239014', 'systematic-review', 'Cannabidiol in clinical and preclinical anxiety research: a systematic review', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/36239014/', array['global'], '36239014', '2026-08-18T00:00:00Z', 'current'),
('pubmed-7730690', 'randomized-trial', 'Dronabinol as a treatment for anorexia associated with weight loss in patients with AIDS', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/7730690/', array['global'], '7730690', '2026-08-18T00:00:00Z', 'current')
on conflict (source_key) do update set
  source_type = excluded.source_type,
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  pmid = excluded.pmid,
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  updated_at = now();

insert into public.clinical_evidence_records as existing (
  slug, title, summary, condition_label, population, intervention, formulation,
  cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
  evidence_strength_method, grading_method_key, uncertainty, conflict_status,
  jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_registry_id,
  publication_date, verified_at, supersession_state, review_status, publication_scope,
  freshness_status, freshness_reason
) values
(
  'ev-dravet-cbd-adjunctive',
  'Purified CBD adjunctive therapy in Dravet syndrome — graded snapshot',
  'High-certainty trial evidence supports pharmaceutical purified CBD as adjunctive therapy reducing convulsive seizure frequency in Dravet syndrome versus placebo, with somnolence, decreased appetite and diarrhoea as common adverse effects. Interaction with clobazam requires monitoring.',
  'Dravet syndrome', 'paediatric / adult', 'Purified cannabidiol (pharmaceutical)', 'oral solution', array['CBD'],
  'regulated-cannabinoid-drug', 'convulsive seizure frequency', 'randomized-trial', 'high',
  'GRADE-oriented synthesis from pivotal RCTs', 'harbourview-clinical-evidence-v1',
  'Most robust data are for purified CBD products, not broad-spectrum extracts', 'none',
  array['global','US','CA','GB','EU','BR','AU'], array['physician','neurologist','paediatrician'],
  'Trial of Cannabidiol for Drug-Resistant Seizures in the Dravet Syndrome', 'N Engl J Med / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/28538134/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-28538134'),
  '2017-05-25', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-lgs-cbd-adjunctive',
  'Purified CBD adjunctive therapy in Lennox-Gastaut syndrome — graded snapshot',
  'High-certainty evidence supports pharmaceutical purified CBD as adjunctive therapy reducing drop seizures in Lennox-Gastaut syndrome versus placebo. Safety monitoring includes sedation, GI effects and hepatic enzymes when combined with valproate.',
  'Lennox-Gastaut syndrome', 'paediatric / adult', 'Purified cannabidiol (pharmaceutical)', 'oral solution', array['CBD'],
  'regulated-cannabinoid-drug', 'drop seizure frequency', 'randomized-trial', 'high',
  'GRADE-oriented synthesis from pivotal RCTs', 'harbourview-clinical-evidence-v1',
  'Extrapolate cautiously to non-purified cannabis extracts', 'none',
  array['global','US','CA','GB','EU','BR','AU'], array['physician','neurologist','paediatrician'],
  'Effect of Cannabidiol on Drop Seizures in the Lennox-Gastaut Syndrome', 'N Engl J Med / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/29768152/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-29768152'),
  '2018-05-17', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-ms-spasticity-nabiximols',
  'Nabiximols-class oromucosal THC:CBD for MS spasticity — graded snapshot',
  'Moderate evidence supports oromucosal THC:CBD (nabiximols-class) for symptomatic improvement of moderate-to-severe spasticity in multiple sclerosis in selected patients after inadequate response to other anti-spasticity medicines, with dizziness and fatigue common.',
  'multiple sclerosis spasticity', 'adult', 'THC:CBD oromucosal spray (nabiximols-class)', 'oromucosal', array['THC','CBD'],
  'regulated-cannabinoid-drug', 'spasticity severity / NRS', 'systematic-review', 'moderate',
  'GRADE-oriented synthesis from RCTs and systematic review', 'harbourview-clinical-evidence-v1',
  'Heterogeneous studies and responder-enrichment designs limit generalisation', 'none',
  array['global','CA','GB','EU','AU'], array['physician','neurologist'],
  'Cannabinoids for spasticity in patients with multiple sclerosis: a systematic review and meta-analysis', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/39502271/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-39502271'),
  '2024-11-05', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-chemotherapy-nausea-thc',
  'THC / nabilone-class agents for chemotherapy-induced nausea — graded snapshot',
  'Moderate evidence supports certain THC or synthetic THC analogues for refractory chemotherapy-induced nausea and vomiting in selected contexts, with psychoactive and cardiovascular adverse effects limiting use versus modern antiemetic regimens.',
  'chemotherapy-induced nausea and vomiting', 'adult', 'THC / nabilone-class', 'oral', array['THC'],
  'regulated-cannabinoid-drug', 'nausea / vomiting control', 'systematic-review', 'moderate',
  'Synthesis of randomized trials including modern-regimen context', 'harbourview-clinical-evidence-v1',
  'Modern multi-agent antiemetic standards change comparative relevance', 'none',
  array['global','US','CA','GB'], array['physician','oncologist'],
  'Efficacy of cannabinoids for the prophylaxis of chemotherapy-induced nausea and vomiting: a systematic review and meta-analysis', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/39953210/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-39953210'),
  '2025-02-14', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-neuropathic-pain-cannabinoids',
  'Cannabinoids for chronic neuropathic pain — graded snapshot',
  'Low-to-moderate evidence suggests small average reductions in neuropathic pain intensity with some THC-containing products versus placebo, with higher adverse-event rates and uncertain long-term functional benefit.',
  'chronic neuropathic pain', 'adult', 'THC / balanced cannabinoid products', 'oral / oromucosal', array['THC','CBD'],
  'cannabis-derived-formulation', 'pain intensity', 'systematic-review', 'low',
  'GRADE-oriented reading of systematic reviews', 'harbourview-clinical-evidence-v1',
  'Heterogeneous products and dosing; long-term evidence remains limited', 'none',
  array['global','CA','AU','GB','DE','IL'], array['physician','pain-specialist'],
  'Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain: 2024 Update', 'AHRQ / PubMed', 'https://pubmed.ncbi.nlm.nih.gov/40238954/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-40238954'),
  '2024-09-01', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-cbd-hepatic-safety',
  'CBD and hepatic enzyme elevation — safety graded snapshot',
  'Moderate evidence from pharmaceutical CBD programmes shows transaminase elevations, particularly with concomitant valproate. Baseline and follow-up liver tests are clinically relevant for higher-dose purified CBD.',
  'hepatic safety with CBD', 'paediatric / adult', 'Purified cannabidiol', 'oral', array['CBD'],
  'regulated-cannabinoid-drug', 'ALT/AST elevation', 'systematic-review', 'moderate',
  'Safety synthesis from randomized clinical programmes', 'harbourview-clinical-evidence-v1',
  'Risk with non-pharmaceutical CBD products is less precisely quantified', 'none',
  array['global','US','CA','GB','EU','BR','AU'], array['physician','pharmacist','neurologist'],
  'Cannabidiol in conjunction with clobazam: analysis of four randomized controlled trials', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/32969022/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-32969022'),
  '2020-01-01', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth safety synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-sleep-cannabinoids',
  'Cannabinoids for insomnia / sleep disturbance — graded snapshot',
  'Evidence for cannabinoids improving subjective sleep quality remains heterogeneous; formulation-specific effects, durability and chronic-use safety require careful interpretation.',
  'insomnia / sleep disturbance', 'adult', 'THC / CBD products', 'oral / inhaled', array['THC','CBD'],
  'general-cannabis', 'sleep quality / latency', 'systematic-review', 'very-low',
  'GRADE-oriented reading of heterogeneous randomized trials', 'harbourview-clinical-evidence-v1',
  'Substantial heterogeneity and formulation differences limit generalisation', 'none',
  array['global','CA','AU','US'], array['physician'],
  'Effectiveness of cannabinoids on subjective sleep quality: a systematic review and meta-analysis of randomised studies', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/40929927/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-40929927'),
  '2025-01-01', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-anxiety-cbd',
  'CBD for anxiety symptoms — graded snapshot',
  'Evidence that CBD reduces anxiety symptoms is limited and inconsistent across clinical settings; product, dose and outcome standards vary widely.',
  'anxiety symptoms', 'adult', 'CBD', 'oral', array['CBD'],
  'cannabinoid-isolate', 'anxiety symptom scores', 'systematic-review', 'low',
  'GRADE-oriented reading of controlled clinical evidence', 'harbourview-clinical-evidence-v1',
  'Not a substitute for evidence-based anxiety treatments; available studies do not support a general dosing recommendation', 'none',
  array['global','CA','AU','GB','BR'], array['physician','psychiatrist'],
  'Cannabidiol in clinical and preclinical anxiety research: a systematic review', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/36239014/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-36239014'),
  '2022-10-01', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
),
(
  'ev-appetite-thc-cachexia',
  'THC for appetite in cachexia / HIV wasting context — graded snapshot',
  'Historical randomized evidence supports dronabinol-associated appetite improvement in selected AIDS-related anorexia, while weight and modern comparative relevance remain uncertain.',
  'appetite / cachexia', 'adult', 'THC / dronabinol-class', 'oral', array['THC'],
  'regulated-cannabinoid-drug', 'appetite / weight', 'randomized-trial', 'low',
  'GRADE-oriented reading of historical randomized evidence', 'harbourview-clinical-evidence-v1',
  'Older HIV-wasting evidence does not establish benefit in other cachexia populations or against current supportive care', 'none',
  array['global','US','CA'], array['physician'],
  'Dronabinol as a treatment for anorexia associated with weight loss in patients with AIDS', 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/7730690/',
  (select id from public.clinical_evidence_sources where source_key = 'pubmed-7730690'),
  '1995-01-01', '2026-08-18T00:00:00Z', 'current', 'under-review', 'clinical-synthesis', 'review-required',
  'Staged corpus-depth synthesis. Publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  condition_label = excluded.condition_label,
  population = excluded.population,
  intervention = excluded.intervention,
  formulation = excluded.formulation,
  cannabinoids = excluded.cannabinoids,
  intervention_class = excluded.intervention_class,
  outcome = excluded.outcome,
  evidence_type = excluded.evidence_type,
  evidence_strength = excluded.evidence_strength,
  evidence_strength_method = excluded.evidence_strength_method,
  grading_method_key = excluded.grading_method_key,
  uncertainty = excluded.uncertainty,
  conflict_status = excluded.conflict_status,
  jurisdictions = excluded.jurisdictions,
  profession_relevance = excluded.profession_relevance,
  primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher,
  primary_source_url = excluded.primary_source_url,
  primary_source_registry_id = excluded.primary_source_registry_id,
  publication_date = excluded.publication_date,
  verified_at = excluded.verified_at,
  supersession_state = excluded.supersession_state,
  review_status = case
    when existing.review_status = 'published'
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id
          and r.review_type = 'provenance'
          and r.decision = 'approved'
      )
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id
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
      )
    then 'published'
    else 'under-review'
  end,
  publication_scope = 'clinical-synthesis',
  freshness_status = case
    when existing.review_status = 'published'
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id and r.review_type = 'provenance' and r.decision = 'approved'
      )
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
          and r.reviewer_user_id is not null
          and r.reviewer_credential_id is not null
          and public.clinical_reviewer_credential_is_valid(r.reviewer_credential_id, r.reviewer_user_id, r.reviewer_type, r.reviewed_at)
      )
    then existing.freshness_status
    else 'review-required'
  end,
  freshness_reason = case
    when existing.review_status = 'published'
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id and r.review_type = 'provenance' and r.decision = 'approved'
      )
      and exists (
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = existing.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
          and r.reviewer_user_id is not null
          and r.reviewer_credential_id is not null
          and public.clinical_reviewer_credential_is_valid(r.reviewer_credential_id, r.reviewer_user_id, r.reviewer_type, r.reviewed_at)
      )
    then existing.freshness_reason
    else excluded.freshness_reason
  end,
  updated_at = now();

-- Fail the migration rather than accept generic landing pages or incomplete
-- provenance for this governed nine-record corpus.
do $$
declare
  intended_slugs text[] := array[
    'ev-dravet-cbd-adjunctive','ev-lgs-cbd-adjunctive','ev-ms-spasticity-nabiximols',
    'ev-chemotherapy-nausea-thc','ev-neuropathic-pain-cannabinoids','ev-cbd-hepatic-safety',
    'ev-sleep-cannabinoids','ev-anxiety-cbd','ev-appetite-thc-cachexia'
  ];
begin
  if (select count(*) from public.clinical_evidence_records where slug = any(intended_slugs)) <> 9 then
    raise exception 'Clinical corpus depth must contain exactly nine intended evidence records';
  end if;

  if exists (
    select 1
    from public.clinical_evidence_records r
    where r.slug = any(intended_slugs)
      and (
        r.primary_source_registry_id is null
        or r.primary_source_url is null
        or r.primary_source_url in (
          'https://pubmed.ncbi.nlm.nih.gov/',
          'https://www.accessdata.fda.gov/scripts/cder/daf/'
        )
      )
  ) then
    raise exception 'Clinical corpus depth requires record-specific normalized primary-source provenance';
  end if;

  if exists (
    select 1
    from public.clinical_evidence_records r
    where r.slug = any(intended_slugs)
      and r.review_status = 'published'
      and not (
        exists (
          select 1 from public.clinical_evidence_reviews pr
          where pr.evidence_record_id = r.id and pr.review_type = 'provenance' and pr.decision = 'approved'
        )
        and exists (
          select 1 from public.clinical_evidence_reviews cr
          where cr.evidence_record_id = r.id
            and cr.review_type = 'clinical'
            and cr.reviewer_type in ('clinician','pharmacist')
            and cr.decision = 'approved'
            and cr.reviewer_user_id is not null
            and cr.reviewer_credential_id is not null
            and public.clinical_reviewer_credential_is_valid(cr.reviewer_credential_id, cr.reviewer_user_id, cr.reviewer_type, cr.reviewed_at)
        )
      )
  ) then
    raise exception 'Clinical corpus depth cannot publish graded synthesis without approved provenance and valid credential-bound clinical review';
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818192000','clinical_graded_evidence_interactions_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818192000_clinical_graded_evidence_interactions_depth.sql

-- RECOVERY BEGIN 20260818210936_clinical_monitoring_protocols.sql
-- Governed clinical monitoring protocol dataset.
-- Closes the "Governed monitoring protocol dataset" open item noted in
-- docs/control/CLINICAL_MOBILE_EVIDENCE_EXPLORER_20260818.md.
-- Mirrors the clinical_medication_interactions pattern: public-read RLS
-- gated on review_status = 'published', fixture fallback in the app layer.

create table if not exists public.clinical_monitoring_protocols (
  id uuid primary key default gen_random_uuid(),
  protocol_name text not null,
  context text not null,
  cannabinoid text,
  monitoring_parameter text not null,
  baseline_required boolean not null default false,
  follow_up_interval text,
  rationale text,
  evidence_certainty text not null
    check (evidence_certainty in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  primary_source_title text not null,
  primary_source_url text,
  verified_at timestamptz not null default now(),
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_monitoring_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_monitoring_context_idx
  on public.clinical_monitoring_protocols (context);
create index if not exists clinical_monitoring_review_idx
  on public.clinical_monitoring_protocols (review_status);

alter table public.clinical_monitoring_protocols enable row level security;

drop policy if exists clinical_monitoring_public_read on public.clinical_monitoring_protocols;
create policy clinical_monitoring_public_read
  on public.clinical_monitoring_protocols
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_monitoring_protocols to anon, authenticated;

insert into public.clinical_monitoring_protocols (
  protocol_name, context, cannabinoid, monitoring_parameter, baseline_required,
  follow_up_interval, rationale, evidence_certainty,
  primary_source_title, primary_source_url, verified_at, review_status
) values
(
  'CBD initiation — hepatic monitoring', 'cbd-initiation', 'CBD',
  'Liver function tests (ALT, AST, bilirubin)', true,
  '4-6 weeks after initiation or dose increase, then every 3 months for the first year',
  'Transaminase elevations are dose-related and more frequent with concomitant valproate; baseline values allow attribution of any rise',
  'moderate',
  'Pharmaceutical CBD safety data / product labels',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'THC initiation — psychiatric screening', 'thc-initiation', 'THC',
  'Personal and family history of psychosis, mania or severe mood disorder', true,
  'Reassess at each dose titration step',
  'THC is associated with dose-dependent psychotomimetic effects and can precipitate or worsen psychotic and manic episodes in predisposed individuals',
  'moderate',
  'Cannabinoid psychiatric safety reviews',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Concurrent anticoagulant — INR monitoring', 'concurrent-anticoagulant', 'CBD',
  'International normalised ratio (INR)', true,
  'Within 1 week of starting, stopping, or changing CBD dose; per usual anticoagulant schedule thereafter',
  'Possible CYP-mediated interaction can shift INR outside therapeutic range with warfarin and other vitamin K antagonists',
  'low',
  'Case series and interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'Paediatric epilepsy — growth and hepatic monitoring', 'pediatric', 'CBD',
  'Weight/height trend, LFTs, and concomitant antiepileptic drug levels', true,
  'Every 4-6 weeks during titration, then every 3 months',
  'Paediatric patients on adjunct CBD for refractory epilepsy show higher transaminase elevation rates, especially with concomitant valproate; growth monitoring supports dose-per-weight review',
  'moderate',
  'Paediatric CBD epilepsy trial safety data',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Older adults — falls and sedation monitoring', 'elderly', null,
  'Orthostatic blood pressure, gait/balance, and sedation score', true,
  'At each visit during the first 4 weeks, then every 3 months',
  'Older adults have higher sensitivity to CNS and postural effects of cannabinoids and higher baseline falls risk',
  'moderate',
  'Geriatric cannabinoid safety reviews',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Pregnancy and lactation — use avoidance and screening', 'pregnancy-lactation', null,
  'Pregnancy status confirmation and infant feeding plan review', true,
  'At every visit for the duration of pregnancy or lactation',
  'Cannabinoids cross the placenta and are present in breast milk; guidance is to avoid use given uncertain developmental safety data',
  'low',
  'Obstetric and lactation cannabinoid safety guidance',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'Driving and safety-critical work counselling', 'thc-initiation', 'THC',
  'Documented counselling on impairment window and safety-critical duties', true,
  'At initiation and at every dose increase',
  'THC impairs psychomotor performance and reaction time for a period after use that does not reliably track subjective intoxication',
  'high',
  'Cannabis impairment and driving studies',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'High-dose THC — cardiovascular monitoring', 'high-dose-thc', 'THC',
  'Heart rate and blood pressure', false,
  'At initiation and after each dose increase for patients with cardiovascular disease',
  'THC can cause dose-dependent tachycardia and orthostatic hypotension, with rare reports of precipitating cardiac events in susceptible patients',
  'low',
  'Cardiovascular cannabinoid safety case reports',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-15T00:00:00Z', 'published'
),
(
  'Hepatic or renal impairment — dose and level monitoring', 'organ-impairment', null,
  'Renal function (eGFR) or hepatic function panel prior to and during titration', true,
  'Before initiation, then every 4-6 weeks during titration',
  'Reduced clearance in hepatic or renal impairment can increase cannabinoid and interacting-drug exposure beyond levels seen in trial populations',
  'ungraded',
  'Pharmacokinetic labelling in organ impairment',
  'https://www.accessdata.fda.gov/scripts/cder/daf/',
  '2026-08-01T00:00:00Z', 'published'
),
(
  'Long-term use — cannabis use disorder screening', 'thc-initiation', 'THC',
  'Brief validated screening for problematic use patterns (e.g. tolerance, withdrawal, escalating use)', false,
  'At 3 months, then at least annually for ongoing therapy',
  'Regular high-dose THC use carries a measurable risk of dependence; periodic screening supports early identification and dose or regimen review',
  'moderate',
  'Cannabis use disorder prevalence and screening literature',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-08-01T00:00:00Z', 'published'
)
on conflict do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818210936','clinical_monitoring_protocols','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818210936_clinical_monitoring_protocols.sql

-- RECOVERY BEGIN 20260818212759_replay_clinical_evidence_spine_reconcile.sql
-- Harbourview Clinical Evidence Spine — production-shape reconciliation
-- Forward-only repair for the live 2026-08-18 production schema.
-- Preserves all existing rows. Existing graded/synthesis rows without credential-bound
-- review provenance are moved to under-review; no clinical-synthesis row is published here.

begin;

-- ---------------------------------------------------------------------------
-- 1. Reconcile the existing evidence-record contract without renaming live columns.
-- Canonical live names remain condition_label, cannabinoids, jurisdictions.
-- ---------------------------------------------------------------------------
alter table public.clinical_evidence_records
  add column if not exists source_registry_id text,
  add column if not exists grading_method_key text,
  add column if not exists publication_scope text,
  add column if not exists freshness_status text not null default 'current',
  add column if not exists review_due_at timestamptz,
  add column if not exists source_currentness_checked_at timestamptz,
  add column if not exists freshness_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_records'::regclass
      and conname = 'clinical_evidence_records_publication_scope_check'
  ) then
    alter table public.clinical_evidence_records
      add constraint clinical_evidence_records_publication_scope_check
      check (publication_scope in ('source-metadata','clinical-synthesis'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_records'::regclass
      and conname = 'clinical_evidence_records_freshness_status_check'
  ) then
    alter table public.clinical_evidence_records
      add constraint clinical_evidence_records_freshness_status_check
      check (freshness_status in ('current','stale','review-required','source-degraded'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Credential-bound review provenance required for future synthesis publish.
-- These tables are missing from the live production schema.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_reviewer_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profession text not null check (profession in ('clinician','pharmacist')),
  jurisdiction text not null,
  credential_reference text not null,
  verification_source_url text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','expired','revoked','rejected')),
  verified_by_user_id uuid,
  verified_at timestamptz,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profession, jurisdiction, credential_reference),
  constraint clinical_reviewer_credential_url_https
    check (verification_source_url ~ '^https://'),
  constraint clinical_reviewer_credential_verified_fields
    check (verification_status <> 'verified' or verified_at is not null)
);

create table if not exists public.clinical_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  review_type text not null
    check (review_type in ('provenance','clinical','methodology')),
  reviewer_type text not null
    check (reviewer_type in ('system','analyst','clinician','pharmacist')),
  reviewer_user_id uuid,
  reviewer_credential_id uuid
    references public.clinical_reviewer_credentials(id) on delete restrict,
  reviewer_identity text not null,
  decision text not null
    check (decision in ('approved','needs-changes','rejected')),
  grading_method_key text,
  assigned_evidence_strength text
    check (assigned_evidence_strength is null or assigned_evidence_strength in (
      'high','moderate','low','very-low','ungraded','conflicted'
    )),
  rationale text not null,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_clinical_evidence_reviews_record
  on public.clinical_evidence_reviews(evidence_record_id, review_type, decision, reviewed_at desc);

create or replace function public.clinical_reviewer_credential_is_valid(
  p_credential_id uuid,
  p_user_id uuid,
  p_reviewer_type text,
  p_reviewed_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_reviewer_credentials c
    where c.id = p_credential_id
      and c.user_id = p_user_id
      and c.profession = p_reviewer_type
      and c.verification_status = 'verified'
      and (c.valid_from is null or c.valid_from <= p_reviewed_at::date)
      and (c.valid_until is null or c.valid_until >= p_reviewed_at::date)
  );
$function$;

revoke all on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz) from public;
grant execute on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz)
  to authenticated, service_role;

-- Classify the pre-existing corpus conservatively. Regulatory/guidance rows that are
-- explicitly ungraded are source metadata; every graded or claim-bearing row is synthesis.
update public.clinical_evidence_records
set publication_scope = case
  when evidence_type in ('regulation','regulatory-guidance')
       and evidence_strength = 'ungraded'
    then 'source-metadata'
  else 'clinical-synthesis'
end
where publication_scope is null;

alter table public.clinical_evidence_records
  alter column publication_scope set not null;

-- Preserve every row, but fail closed on synthesis publication unless production already
-- contains both approved provenance review and valid credential-bound clinical review.
update public.clinical_evidence_records e
set review_status = 'under-review',
    updated_at = now()
where e.review_status = 'published'
  and e.publication_scope = 'clinical-synthesis'
  and not (
    exists (
      select 1
      from public.clinical_evidence_reviews p
      where p.evidence_record_id = e.id
        and p.review_type = 'provenance'
        and p.decision = 'approved'
    )
    and exists (
      select 1
      from public.clinical_evidence_reviews r
      where r.evidence_record_id = e.id
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
    )
  );

create or replace function public.clinical_require_credentialed_qualified_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.decision = 'approved' and new.review_type in ('clinical','methodology') then
    if new.reviewer_type not in ('clinician','pharmacist') then
      raise exception 'qualified Clinical review requires clinician or pharmacist reviewer type';
    end if;
    if new.reviewer_user_id is null or new.reviewer_credential_id is null then
      raise exception 'qualified Clinical review requires credential-bound reviewer identity';
    end if;
    if not public.clinical_reviewer_credential_is_valid(
      new.reviewer_credential_id,
      new.reviewer_user_id,
      new.reviewer_type,
      new.reviewed_at
    ) then
      raise exception 'qualified Clinical review credential is not verified/current for this reviewer';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_credentialed_qualified_review() from public;
drop trigger if exists trg_clinical_require_credentialed_qualified_review
  on public.clinical_evidence_reviews;
create trigger trg_clinical_require_credentialed_qualified_review
before insert or update of review_type, reviewer_type, reviewer_user_id,
  reviewer_credential_id, decision, reviewed_at
on public.clinical_evidence_reviews
for each row execute function public.clinical_require_credentialed_qualified_review();

create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published'
     and (
       tg_op = 'INSERT'
       or old.review_status is distinct from 'published'
       or old.publication_scope is distinct from new.publication_scope
       or old.evidence_strength is distinct from new.evidence_strength
     ) then
    if not exists (
      select 1
      from public.clinical_evidence_reviews p
      where p.evidence_record_id = new.id
        and p.review_type = 'provenance'
        and p.decision = 'approved'
    ) then
      raise exception 'clinical evidence publication requires an approved provenance review';
    end if;

    if new.publication_scope = 'clinical-synthesis'
       or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
      if not exists (
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
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
      end if;
    end if;
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

-- ---------------------------------------------------------------------------
-- 3. Reconcile change events for PR #1525 currentness job.
-- Existing published events are preserved; internal currentness events may omit display fields.
-- ---------------------------------------------------------------------------
alter table public.clinical_evidence_change_events
  add column if not exists payload jsonb not null default '{}'::jsonb,
  alter column title drop not null,
  alter column summary drop not null,
  alter column verified_at drop not null,
  alter column primary_source_title drop not null,
  alter column primary_source_publisher drop not null,
  alter column primary_source_url drop not null,
  alter column occurred_at set default now();

alter table public.clinical_evidence_change_events
  drop constraint if exists clinical_evidence_change_events_event_type_check;

create index if not exists idx_clinical_change_events_record
  on public.clinical_evidence_change_events(evidence_record_id, created_at desc);
create index if not exists idx_clinical_change_events_type
  on public.clinical_evidence_change_events(event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Missing supporting Clinical tables required by #1523/#1525.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_registry_id text not null,
  snapshot_key text not null,
  source_url text not null,
  source_version text,
  retrieved_at timestamptz not null,
  media_type text not null,
  hash_scope text not null check (hash_scope in (
    'source-bytes','normalized-text','normalized-reviewed-extract'
  )),
  content_sha256 text not null,
  byte_size bigint,
  locator_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_registry_id, snapshot_key),
  constraint clinical_evidence_snapshots_source_https check (source_url ~ '^https://'),
  constraint clinical_evidence_snapshots_sha256 check (content_sha256 ~ '^[0-9a-f]{64}$')
);

create index if not exists idx_clinical_snapshots_registry
  on public.clinical_evidence_snapshots(source_registry_id, retrieved_at desc);

create table if not exists public.clinical_structured_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  source_snapshot_id uuid not null
    references public.clinical_evidence_snapshots(id) on delete restrict,
  population jsonb,
  intervention jsonb,
  comparator jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  study_design text,
  sample_size integer,
  follow_up text,
  effect_estimates jsonb not null default '[]'::jsonb,
  uncertainty jsonb,
  limitations jsonb not null default '[]'::jsonb,
  source_locator text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_outcome_evidence (
  id uuid primary key default gen_random_uuid(),
  condition_id text not null,
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  source_snapshot_id uuid
    references public.clinical_evidence_snapshots(id) on delete restrict,
  intervention_label text,
  intervention_class text not null,
  formulation text,
  cannabinoids text[] not null default '{}',
  population_summary text,
  comparator_summary text,
  outcome_key text not null,
  outcome_label text not null,
  relationship_kind text not null check (relationship_kind in (
    'authorized-indication','efficacy','safety','tolerability','quality-of-life','other'
  )),
  direction text not null check (direction in (
    'benefit','harm','no-clear-effect','mixed','not-assessed'
  )),
  effect_summary text,
  uncertainty_summary text,
  publication_scope text not null check (publication_scope in ('source-metadata','clinical-synthesis')),
  review_status text not null check (review_status in ('published','under-review','superseded')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_grade_assessments (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  review_id uuid not null
    references public.clinical_evidence_reviews(id) on delete restrict,
  grading_method_key text not null,
  starting_certainty text not null,
  risk_of_bias text not null,
  inconsistency text not null,
  indirectness text not null,
  imprecision text not null,
  publication_bias text not null,
  final_certainty text not null,
  assessment_rationale text not null,
  created_at timestamptz not null default now(),
  unique (evidence_record_id, review_id)
);

create table if not exists public.clinical_intake_queue (
  id uuid primary key default gen_random_uuid(),
  intake_status text not null default 'queued',
  priority text not null default 'normal',
  coverage_status text not null default 'source-identified',
  intended_conditions text[] not null default '{}',
  intended_jurisdictions text[] not null default '{}',
  intended_publication_scope text not null default 'source-metadata'
    check (intended_publication_scope in ('source-metadata','clinical-synthesis')),
  assigned_user_id uuid,
  review_due_at timestamptz,
  notes text,
  source_id text not null,
  source_key text not null,
  source_type text not null,
  source_title text not null,
  publisher text not null,
  source_url text not null,
  doi text,
  pmid text,
  din text,
  source_version text,
  currentness text not null default 'unknown',
  latest_snapshot_id uuid references public.clinical_evidence_snapshots(id) on delete set null,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint clinical_intake_source_https check (source_url ~ '^https://')
);

create table if not exists public.clinical_view_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  evidence_record_id uuid not null
    references public.clinical_evidence_records(id) on delete cascade,
  record_verified_at timestamptz not null,
  jurisdiction_context text,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_clinical_view_audit_user
  on public.clinical_view_audit(user_id, viewed_at desc);
create index if not exists idx_clinical_evidence_records_review_status
  on public.clinical_evidence_records(review_status);
create index if not exists idx_clinical_evidence_records_freshness
  on public.clinical_evidence_records(freshness_status);
create index if not exists idx_clinical_evidence_records_currentness_checked
  on public.clinical_evidence_records(source_currentness_checked_at nulls first);
create index if not exists idx_clinical_evidence_records_jurisdictions
  on public.clinical_evidence_records using gin(jurisdictions);

-- ---------------------------------------------------------------------------
-- 5. RLS: one effective published-read policy for authenticated users only.
-- Private governance/source-processing tables stay reviewer/service-role scoped.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_has_review_role(
  allowed_roles text[] default array['admin','operator','analyst']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$function$;

revoke all on function public.clinical_evidence_has_review_role(text[]) from public;
grant execute on function public.clinical_evidence_has_review_role(text[])
  to authenticated, service_role;

alter table public.clinical_evidence_records enable row level security;
alter table public.clinical_evidence_change_events enable row level security;
alter table public.clinical_evidence_snapshots enable row level security;
alter table public.clinical_structured_extractions enable row level security;
alter table public.clinical_outcome_evidence enable row level security;
alter table public.clinical_grade_assessments enable row level security;
alter table public.clinical_reviewer_credentials enable row level security;
alter table public.clinical_evidence_reviews enable row level security;
alter table public.clinical_intake_queue enable row level security;
alter table public.clinical_view_audit enable row level security;

drop policy if exists clinical_evidence_records_public_read
  on public.clinical_evidence_records;
drop policy if exists clinical_evidence_published_read
  on public.clinical_evidence_records;
create policy clinical_evidence_published_read
  on public.clinical_evidence_records
  for select to authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_change_events_public_read
  on public.clinical_evidence_change_events;
drop policy if exists clinical_evidence_change_events_published_read
  on public.clinical_evidence_change_events;
create policy clinical_evidence_change_events_published_read
  on public.clinical_evidence_change_events
  for select to authenticated
  using (
    review_status = 'published'
    and (
      evidence_record_id is null
      or exists (
        select 1
        from public.clinical_evidence_records r
        where r.id = clinical_evidence_change_events.evidence_record_id
          and r.review_status = 'published'
      )
    )
  );

drop policy if exists clinical_snapshots_review_read on public.clinical_evidence_snapshots;
create policy clinical_snapshots_review_read
  on public.clinical_evidence_snapshots
  for select to authenticated
  using (public.clinical_evidence_has_review_role());

drop policy if exists clinical_structured_extractions_review_access
  on public.clinical_structured_extractions;
create policy clinical_structured_extractions_review_access
  on public.clinical_structured_extractions
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_outcome_evidence_review_access
  on public.clinical_outcome_evidence;
create policy clinical_outcome_evidence_review_access
  on public.clinical_outcome_evidence
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_grade_assessments_review_access
  on public.clinical_grade_assessments;
create policy clinical_grade_assessments_review_access
  on public.clinical_grade_assessments
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_reviewer_credentials_review_read
  on public.clinical_reviewer_credentials;
drop policy if exists clinical_reviewer_credentials_admin_write
  on public.clinical_reviewer_credentials;
create policy clinical_reviewer_credentials_review_read
  on public.clinical_reviewer_credentials
  for select to authenticated
  using (public.clinical_evidence_has_review_role());
create policy clinical_reviewer_credentials_admin_write
  on public.clinical_reviewer_credentials
  for all to authenticated
  using (public.clinical_evidence_has_review_role(array['admin','operator']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator']));

drop policy if exists clinical_evidence_reviews_review_access
  on public.clinical_evidence_reviews;
create policy clinical_evidence_reviews_review_access
  on public.clinical_evidence_reviews
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_intake_queue_review_access
  on public.clinical_intake_queue;
create policy clinical_intake_queue_review_access
  on public.clinical_intake_queue
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_view_audit_own on public.clinical_view_audit;
create policy clinical_view_audit_own
  on public.clinical_view_audit
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.clinical_evidence_records from anon;
revoke all on public.clinical_evidence_change_events from anon;
revoke all on public.clinical_evidence_snapshots from anon;
revoke all on public.clinical_structured_extractions from anon;
revoke all on public.clinical_outcome_evidence from anon;
revoke all on public.clinical_grade_assessments from anon;
revoke all on public.clinical_reviewer_credentials from anon;
revoke all on public.clinical_evidence_reviews from anon;
revoke all on public.clinical_intake_queue from anon;
revoke all on public.clinical_view_audit from anon;

grant select on public.clinical_evidence_records to authenticated;
grant select on public.clinical_evidence_change_events to authenticated;
grant select on public.clinical_evidence_snapshots to authenticated;
grant select, insert, update on public.clinical_structured_extractions to authenticated;
grant select, insert, update on public.clinical_outcome_evidence to authenticated;
grant select, insert, update on public.clinical_grade_assessments to authenticated;
grant select, insert, update on public.clinical_evidence_reviews to authenticated;
grant select on public.clinical_reviewer_credentials to authenticated;
grant select, insert, update on public.clinical_intake_queue to authenticated;
grant select, insert, update, delete on public.clinical_view_audit to authenticated;

grant all on public.clinical_evidence_records to service_role;
grant all on public.clinical_evidence_change_events to service_role;
grant all on public.clinical_evidence_snapshots to service_role;
grant all on public.clinical_structured_extractions to service_role;
grant all on public.clinical_outcome_evidence to service_role;
grant all on public.clinical_grade_assessments to service_role;
grant all on public.clinical_reviewer_credentials to service_role;
grant all on public.clinical_evidence_reviews to service_role;
grant all on public.clinical_intake_queue to service_role;
grant all on public.clinical_view_audit to service_role;

-- The live search helpers were historically executable by anon. Keep them aligned with
-- the authenticated-only evidence policy rather than relying on RLS to return an empty set.
do $$
begin
  if to_regprocedure('public.search_clinical_evidence_records(text,text,integer)') is not null then
    revoke execute on function public.search_clinical_evidence_records(text,text,integer) from anon;
    grant execute on function public.search_clinical_evidence_records(text,text,integer)
      to authenticated, service_role;
  end if;
  if to_regprocedure('public.clinical_condition_term_known(text)') is not null then
    revoke execute on function public.clinical_condition_term_known(text) from anon;
    grant execute on function public.clinical_condition_term_known(text)
      to authenticated, service_role;
  end if;
end $$;

create or replace function public.clinical_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists clinical_evidence_records_updated_at
  on public.clinical_evidence_records;
create trigger clinical_evidence_records_updated_at
before update on public.clinical_evidence_records
for each row execute function public.clinical_set_updated_at();

comment on column public.clinical_evidence_records.publication_scope is
  'source-metadata or clinical-synthesis. Existing graded/claim-bearing rows were conservatively classified as synthesis during 2026-08-18 reconciliation.';
comment on table public.clinical_evidence_snapshots is
  'Source-currentness snapshots used by the protected Clinical currentness job; not a public evidence projection.';
comment on table public.clinical_evidence_reviews is
  'Private review provenance. Approved clinical/methodology reviews require a valid credential-bound clinician or pharmacist identity.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818212759','replay_clinical_evidence_spine_reconcile','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818212759_replay_clinical_evidence_spine_reconcile.sql

-- RECOVERY BEGIN 20260818212800_clinical_prescriber_governance_preflight.sql
-- Clinical Prescriber OS production-governance preflight.
--
-- This migration intentionally performs no schema or data mutation. It fails
-- closed unless the production-shaped Clinical Evidence Spine reconciliation
-- now represented by 20260819100621_clinical_evidence_spine_reconcile.sql is
-- present. Historical Evidence V1/V1.1 object names are not production
-- prerequisites for this forward reconciliation.
--
-- Safe outcomes:
--   * applied production governance contract is present -> no-op;
--   * required contract is absent -> raise before later Prescriber OS DDL.

DO $preflight$
DECLARE
  missing text[] := '{}'::text[];
BEGIN
  IF to_regclass('public.clinical_evidence_reviews') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_reviews');
  END IF;
  IF to_regclass('public.clinical_reviewer_credentials') IS NULL THEN
    missing := array_append(missing, 'public.clinical_reviewer_credentials');
  END IF;
  IF to_regclass('public.clinical_evidence_snapshots') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_snapshots');
  END IF;
  IF to_regclass('public.clinical_grade_assessments') IS NULL THEN
    missing := array_append(missing, 'public.clinical_grade_assessments');
  END IF;
  IF to_regclass('public.clinical_monitoring_protocols') IS NULL THEN
    missing := array_append(missing, 'public.clinical_monitoring_protocols');
  END IF;
  IF to_regclass('public.clinical_formulary_skus') IS NULL THEN
    missing := array_append(missing, 'public.clinical_formulary_skus');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'publication_scope'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.publication_scope');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'freshness_status'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.freshness_status');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'source_registry_id'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.source_registry_id');
  END IF;

  IF to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') IS NULL THEN
    missing := array_append(missing, 'public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz)');
  END IF;
  IF to_regprocedure('public.clinical_evidence_has_review_role(text[])') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_has_review_role(text[])');
  END IF;

  IF cardinality(missing) > 0 THEN
    RAISE EXCEPTION
      'Clinical Prescriber OS governance preflight failed. Apply/reconcile the production Clinical Evidence Spine contract before this release. Missing: %',
      array_to_string(missing, ', ');
  END IF;
END
$preflight$;

comment on table public.clinical_evidence_records is
  'Clinical evidence records. Prescriber OS reconciliation requires the applied production Clinical Evidence Spine governance contract.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818212800','clinical_prescriber_governance_preflight','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818212800_clinical_prescriber_governance_preflight.sql

-- RECOVERY BEGIN 20260818212900_clinical_interaction_published_uniqueness.sql
-- Normalize interaction-pair publication uniqueness before Prescriber OS reconciliation.
-- Preserve every row; only duplicate published projections are staged under review.

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(medication_ingredient)), lower(btrim(cannabinoid))
      order by verified_at desc nulls last, updated_at desc nulls last, id
    ) as pair_rank
  from public.clinical_medication_interactions
  where review_status = 'published'
), duplicates as (
  select id from ranked where pair_rank > 1
)
update public.clinical_medication_interactions i
set review_status = 'under-review',
    uncertainty = case
      when coalesce(i.uncertainty, '') = '' then
        'Duplicate normalized interaction pair retained for reconciliation; not eligible for the published projection.'
      else i.uncertainty || ' Duplicate normalized interaction pair retained for reconciliation; not eligible for the published projection.'
    end,
    updated_at = now()
where i.id in (select id from duplicates);

-- The following migration uses the same index name with IF NOT EXISTS. Creating
-- the safe partial form first prevents an unsafe full-table uniqueness constraint
-- from rejecting preserved historical/under-review duplicates.
create unique index if not exists uq_clinical_interaction_normalized_pair
  on public.clinical_medication_interactions (
    lower(btrim(medication_ingredient)),
    lower(btrim(cannabinoid))
  )
  where review_status = 'published';

comment on index public.uq_clinical_interaction_normalized_pair is
  'Only one published projection per normalized medication/cannabinoid pair. Historical and under-review duplicates remain preserved.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818212900','clinical_interaction_published_uniqueness','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818212900_clinical_interaction_published_uniqueness.sql

-- RECOVERY BEGIN 20260818213000_clinical_prescriber_os_reconciliation.sql
-- Clinical Prescriber OS reconciliation against current main after 20260818200000.
--
-- Purpose:
--   * preserve the existing patient / consent / authority / RLS contracts;
--   * add the missing Prescriber OS domain objects without replacing current tables;
--   * reconcile the pre-existing clinical_monitoring_protocols table rather than
--     creating PR #1514's stale alternate shape;
--   * fail closed on generic homepages/search portals as prescriber provenance;
--   * stage unsafe published evidence/interactions for review without deleting them.
--
-- This migration is additive/reconciling and is NOT self-applying.

-- ---------------------------------------------------------------------------
-- 1. Shared prescriber-inspectable provenance predicate
-- ---------------------------------------------------------------------------
create or replace function public.clinical_source_is_prescriber_inspectable(p_url text)
returns boolean
language sql
immutable
set search_path = public
as $function$
  select
    p_url is not null
    and btrim(p_url) ~ '^https://'
    and btrim(p_url) !~* '^https://[^/]+/?$'
    and btrim(p_url) !~* '^https://pubmed\.ncbi\.nlm\.nih\.gov/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.gov\.br/anvisa/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.accessdata\.fda\.gov/scripts/cder/daf/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.tga\.gov\.au/?(\?.*)?$'
    and btrim(p_url) !~* '/search/?(\?.*)?$'
    and btrim(p_url) !~* '/search-results/?(\?.*)?$';
$function$;

revoke all on function public.clinical_source_is_prescriber_inspectable(text) from public;
grant execute on function public.clinical_source_is_prescriber_inspectable(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Canonical concepts and claim-level evidence provenance
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_concepts (
  id uuid primary key default gen_random_uuid(),
  canonical_label text not null,
  concept_kind text not null check (concept_kind in (
    'condition','symptom','population','intervention','product','medicine','outcome'
  )),
  coding_system text,
  code text,
  status text not null default 'active' check (status in ('active','superseded','retired')),
  superseded_by_id uuid references public.clinical_concepts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_kind, canonical_label)
);

create table if not exists public.clinical_concept_aliases (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_url text,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  unique (concept_id, normalized_alias),
  constraint clinical_concept_alias_source_https check (source_url is null or source_url ~ '^https://')
);

create index if not exists clinical_concept_alias_lookup_idx
  on public.clinical_concept_aliases (normalized_alias);

create table if not exists public.clinical_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  claim_text text not null,
  population text,
  intervention text,
  comparator text,
  outcome text,
  timeframe text,
  direction text not null default 'uncertain' check (direction in ('benefit','harm','neutral','uncertain')),
  effect_measure text,
  effect_value numeric,
  effect_unit text,
  ci_lower numeric,
  ci_upper numeric,
  absolute_effect text,
  relative_effect text,
  clinically_important_difference text,
  certainty text not null default 'ungraded' check (certainty in (
    'high','moderate','low','very-low','ungraded','conflicted'
  )),
  applicability text,
  publication_family_id text,
  independence_group_id text,
  status text not null default 'review-required' check (status in (
    'current','superseded','retracted','review-required'
  )),
  superseded_by_id uuid references public.clinical_evidence_claims(id) on delete set null,
  primary_source_url text not null,
  source_locator text not null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_claim_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_evidence_claim_locator_nonempty check (length(btrim(source_locator)) > 0)
);

-- Replay-only reconciliation of the legacy Clinical Evidence OS and
-- Prescriber OS concept contracts. CREATE TABLE IF NOT EXISTS cannot add the
-- lifecycle columns used by the policies below. Preserve the earlier review
-- gate when mapping its existing rows: only published concepts/aliases become
-- active in the later lifecycle vocabulary.
alter table public.clinical_concepts
  add column if not exists status text not null default 'active'
    check (status in ('active','superseded','retired')),
  add column if not exists superseded_by_id uuid
    references public.clinical_concepts(id) on delete set null;

update public.clinical_concepts
set status = case when review_status = 'published' then 'active' else 'retired' end;

alter table public.clinical_concept_aliases
  add column if not exists status text not null default 'active'
    check (status in ('active','retired'));

update public.clinical_concept_aliases
set status = case when review_status = 'published' then 'active' else 'retired' end;

-- Replay-only reconciliation of the two checked-in claim contracts. The
-- earlier operating-system migration creates the legacy columns but explicitly
-- seeds no rows; this later migration says it is additive yet CREATE TABLE IF
-- NOT EXISTS alone cannot add the Prescriber OS columns used below.
alter table public.clinical_evidence_claims
  add column if not exists concept_id uuid references public.clinical_concepts(id) on delete set null,
  add column if not exists claim_text text not null,
  add column if not exists population text,
  add column if not exists intervention text,
  add column if not exists comparator text,
  add column if not exists outcome text,
  add column if not exists timeframe text,
  add column if not exists direction text not null default 'uncertain'
    check (direction in ('benefit','harm','neutral','uncertain')),
  add column if not exists effect_measure text,
  add column if not exists effect_value numeric,
  add column if not exists effect_unit text,
  add column if not exists ci_lower numeric,
  add column if not exists ci_upper numeric,
  add column if not exists absolute_effect text,
  add column if not exists relative_effect text,
  add column if not exists clinically_important_difference text,
  add column if not exists certainty text not null default 'ungraded'
    check (certainty in ('high','moderate','low','very-low','ungraded','conflicted')),
  add column if not exists applicability text,
  add column if not exists publication_family_id text,
  add column if not exists independence_group_id text,
  add column if not exists status text not null default 'review-required'
    check (status in ('current','superseded','retracted','review-required')),
  add column if not exists superseded_by_id uuid
    references public.clinical_evidence_claims(id) on delete set null,
  add column if not exists primary_source_url text not null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

-- The newer contract replaces these legacy mandatory inputs. Zero-state has no
-- claim rows, so this changes no data and lets future Prescriber OS writes use
-- the later authoritative fields.
alter table public.clinical_evidence_claims
  alter column claim_key drop not null,
  alter column claim_kind drop not null,
  alter column statement drop not null,
  alter column verified_at drop not null,
  alter column source_locator set not null;

do $replay_claim_contract$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_claims'::regclass
      and conname = 'clinical_evidence_claim_source_https'
  ) then
    alter table public.clinical_evidence_claims
      add constraint clinical_evidence_claim_source_https
      check (primary_source_url ~ '^https://');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_claims'::regclass
      and conname = 'clinical_evidence_claim_locator_nonempty'
  ) then
    alter table public.clinical_evidence_claims
      add constraint clinical_evidence_claim_locator_nonempty
      check (length(btrim(source_locator)) > 0);
  end if;
end
$replay_claim_contract$;

create index if not exists clinical_evidence_claim_record_idx
  on public.clinical_evidence_claims (evidence_record_id, status);
create index if not exists clinical_evidence_claim_concept_idx
  on public.clinical_evidence_claims (concept_id, status);
create index if not exists clinical_evidence_claim_family_idx
  on public.clinical_evidence_claims (publication_family_id, independence_group_id);

create or replace function public.clinical_require_inspectable_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'current' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'current Clinical claim requires a prescriber-inspectable source';
    end if;
    if btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'current Clinical claim requires an exact source locator';
    end if;
    if new.reviewed_at is null then
      raise exception 'current Clinical claim requires review metadata';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_inspectable_claim() from public;
drop trigger if exists trg_clinical_require_inspectable_claim on public.clinical_evidence_claims;
create trigger trg_clinical_require_inspectable_claim
before insert or update of status, primary_source_url, source_locator, reviewed_at
on public.clinical_evidence_claims
for each row execute function public.clinical_require_inspectable_claim();

-- ---------------------------------------------------------------------------
-- 3. Structured safety, regimen and guidelines
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_safety_rules (
  id uuid primary key default gen_random_uuid(),
  rule_kind text not null check (rule_kind in (
    'contraindication','precaution','special-population','interaction'
  )),
  subject text not null,
  applies_when jsonb not null default '{}'::jsonb,
  severity text not null check (severity in ('info','caution','major','contraindicated','unknown')),
  rationale text not null,
  action_text text,
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete set null,
  interaction_id uuid references public.clinical_medication_interactions(id) on delete set null,
  jurisdictions text[] not null default array['global']::text[],
  primary_source_url text not null,
  source_locator text not null,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_safety_rule_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_safety_rule_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_safety_rule_subject_idx
  on public.clinical_safety_rules (subject, review_status);
create index if not exists clinical_safety_rule_jurisdiction_idx
  on public.clinical_safety_rules using gin (jurisdictions);

create table if not exists public.clinical_regimen_protocols (
  id uuid primary key default gen_random_uuid(),
  formulary_product_id uuid not null references public.clinical_formulary_products(id) on delete cascade,
  formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  jurisdiction text not null,
  population text,
  indication text not null,
  regimen_structured jsonb not null default '{}'::jsonb,
  titration_structured jsonb not null default '{}'::jsonb,
  administration_instructions text[] not null default '{}'::text[],
  monitoring_requirements text[] not null default '{}'::text[],
  stopping_rules text[] not null default '{}'::text[],
  primary_source_url text not null,
  source_locator text not null,
  source_version text,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_regimen_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_regimen_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_regimen_product_idx
  on public.clinical_regimen_protocols (formulary_product_id, jurisdiction, review_status);
create index if not exists clinical_regimen_concept_idx
  on public.clinical_regimen_protocols (concept_id, review_status);

create table if not exists public.clinical_guideline_recommendations (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  jurisdiction text not null,
  authority text not null,
  title text not null,
  recommendation_text text not null,
  recommendation_strength text,
  population text,
  intervention text,
  outcome text,
  effective_date date,
  primary_source_url text not null,
  source_locator text not null,
  status text not null default 'review-required' check (status in (
    'current','superseded','review-required'
  )),
  superseded_by_id uuid references public.clinical_guideline_recommendations(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_guideline_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_guideline_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_guideline_context_idx
  on public.clinical_guideline_recommendations (jurisdiction, concept_id, status);

-- Reconcile the governed monitoring table created on current main. Do not create
-- PR #1514's incompatible alternate table shape.
alter table public.clinical_monitoring_protocols
  add column if not exists concept_id uuid references public.clinical_concepts(id) on delete set null,
  add column if not exists formulary_product_id uuid references public.clinical_formulary_products(id) on delete set null,
  add column if not exists formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  add column if not exists jurisdiction text,
  add column if not exists baseline_requirements text[] not null default '{}'::text[],
  add column if not exists therapeutic_objectives text[] not null default '{}'::text[],
  add column if not exists efficacy_measures text[] not null default '{}'::text[],
  add column if not exists safety_measures text[] not null default '{}'::text[],
  add column if not exists laboratory_monitoring text[] not null default '{}'::text[],
  add column if not exists reassessment_schedule text[] not null default '{}'::text[],
  add column if not exists stopping_rules text[] not null default '{}'::text[],
  add column if not exists source_locator text,
  add column if not exists provenance_status text not null default 'review-required'
    check (provenance_status in ('inspectable','review-required'));

-- ---------------------------------------------------------------------------
-- 4. Patient context, objectives and longitudinal decision record
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_patient_contexts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  recorded_by uuid not null,
  jurisdiction text not null,
  condition_concept_ids uuid[] not null default '{}'::uuid[],
  current_medicines text[] not null default '{}'::text[],
  prior_therapies text[] not null default '{}'::text[],
  allergies text[] not null default '{}'::text[],
  pregnancy_status text not null default 'unknown' check (pregnancy_status in ('yes','no','unknown','not-applicable')),
  hepatic_status text not null default 'unknown' check (hepatic_status in ('none-known','present','unknown')),
  renal_status text not null default 'unknown' check (renal_status in ('none-known','present','unknown')),
  cardiovascular_status text not null default 'unknown' check (cardiovascular_status in ('none-known','present','unknown')),
  psychiatric_risk_status text not null default 'unknown' check (psychiatric_risk_status in ('none-known','present','unknown')),
  substance_use_risk_status text not null default 'unknown' check (substance_use_risk_status in ('none-known','present','unknown')),
  driving_or_safety_sensitive_activity text not null default 'unknown' check (driving_or_safety_sensitive_activity in ('yes','no','unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinical_patient_context_patient_idx
  on public.clinical_patient_contexts (patient_id, created_at desc);

create table if not exists public.clinical_therapeutic_objectives (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  recorded_by uuid not null,
  description text not null,
  outcome_measure text,
  baseline_value text,
  target_value text,
  target_date date,
  status text not null default 'active' check (status in ('active','met','not-met','stopped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_decision_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  clinician_user_id uuid not null,
  jurisdiction text not null,
  decision_type text not null check (decision_type in ('consider','initiate','continue','adjust','stop','defer')),
  rationale text not null,
  evidence_claim_ids uuid[] not null default '{}'::uuid[],
  formulary_product_ids uuid[] not null default '{}'::uuid[],
  guideline_recommendation_ids uuid[] not null default '{}'::uuid[],
  unresolved_safety_items text[] not null default '{}'::text[],
  shared_decision_summary text,
  created_at timestamptz not null default now()
);

create index if not exists clinical_decision_patient_idx
  on public.clinical_decision_records (patient_id, created_at desc);

create table if not exists public.clinical_change_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'evidence','guideline','safety','product','regulatory','professional-rule'
  )),
  title text not null,
  summary text not null,
  jurisdictions text[] not null default array['global']::text[],
  affected_concept_ids uuid[] not null default '{}'::uuid[],
  affected_formulary_product_ids uuid[] not null default '{}'::uuid[],
  materiality text not null default 'review' check (materiality in ('informational','review','urgent')),
  primary_source_url text not null,
  source_locator text not null,
  effective_at timestamptz,
  verified_at timestamptz not null,
  review_status text not null default 'review-required' check (review_status in ('published','review-required','retired')),
  created_at timestamptz not null default now(),
  constraint clinical_change_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_change_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create table if not exists public.clinical_patient_impact_reviews (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  change_event_id uuid not null references public.clinical_change_events(id) on delete cascade,
  match_reasons text[] not null default '{}'::text[],
  status text not null default 'unreviewed' check (status in (
    'unreviewed','reviewed-no-action','reviewed-action-needed','dismissed'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  unique (patient_id, change_event_id)
);

-- ---------------------------------------------------------------------------
-- 5. Interaction provenance and normalized pair idempotency
-- ---------------------------------------------------------------------------
alter table public.clinical_medication_interactions
  add column if not exists source_locator text,
  add column if not exists provenance_status text not null default 'review-required'
    check (provenance_status in ('inspectable','review-required'));

update public.clinical_medication_interactions
set provenance_status = case
  when public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and btrim(coalesce(source_locator, '')) <> '' then 'inspectable'
  else 'review-required'
end;

update public.clinical_medication_interactions
set review_status = 'under-review',
    provenance_status = 'review-required',
    updated_at = now()
where review_status = 'published'
  and (
    not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    or btrim(coalesce(source_locator, '')) = ''
  );

create unique index if not exists uq_clinical_interaction_normalized_pair
  on public.clinical_medication_interactions (
    lower(btrim(medication_ingredient)),
    lower(btrim(cannabinoid))
  );

create or replace function public.clinical_require_interaction_provenance()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'published Clinical interaction requires a prescriber-inspectable source';
    end if;
    if btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'published Clinical interaction requires an exact source locator';
    end if;
    new.provenance_status := 'inspectable';
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_interaction_provenance() from public;
drop trigger if exists trg_clinical_require_interaction_provenance on public.clinical_medication_interactions;
create trigger trg_clinical_require_interaction_provenance
before insert or update of review_status, primary_source_url, source_locator
on public.clinical_medication_interactions
for each row execute function public.clinical_require_interaction_provenance();

-- Monitoring rows are also prescriber-facing. Existing generic-source seeds are
-- retained but removed from the published set until exact sources/locators exist.
update public.clinical_monitoring_protocols
set provenance_status = case
  when public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and btrim(coalesce(source_locator, '')) <> '' then 'inspectable'
  else 'review-required'
end;

update public.clinical_monitoring_protocols
set review_status = 'under-review',
    provenance_status = 'review-required',
    updated_at = now()
where review_status = 'published'
  and (
    not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    or btrim(coalesce(source_locator, '')) = ''
  );

-- ---------------------------------------------------------------------------
-- 6. Evidence publication fail-closed repair
-- ---------------------------------------------------------------------------
-- First preserve every record but remove generic/search-portal rows from the
-- published surface. No replacement URL or claim is invented here.
update public.clinical_evidence_records
set review_status = 'under-review',
    freshness_status = 'review-required',
    freshness_reason = case
      when coalesce(freshness_reason, '') = '' then
        'Prescriber provenance remediation: primary source is generic, a search portal, or otherwise not directly inspectable.'
      else freshness_reason || ' Prescriber provenance remediation: primary source is not directly inspectable.'
    end,
    updated_at = now()
where review_status = 'published'
  and not public.clinical_source_is_prescriber_inspectable(primary_source_url);

-- A clinical-synthesis row additionally requires at least one current,
-- source-located claim. Existing rows without that claim-level provenance are
-- retained privately and staged for review.
update public.clinical_evidence_records e
set review_status = 'under-review',
    freshness_status = 'review-required',
    freshness_reason = case
      when coalesce(e.freshness_reason, '') = '' then
        'Prescriber provenance remediation: clinical synthesis lacks a current claim-level source locator.'
      else e.freshness_reason || ' Prescriber provenance remediation: clinical synthesis lacks a current claim-level source locator.'
    end,
    updated_at = now()
where e.review_status = 'published'
  and e.publication_scope = 'clinical-synthesis'
  and not exists (
    select 1
    from public.clinical_evidence_claims c
    where c.evidence_record_id = e.id
      and c.status = 'current'
      and public.clinical_source_is_prescriber_inspectable(c.primary_source_url)
      and btrim(c.source_locator) <> ''
  );

-- Preserve the credential-bound publication gate from current main and add the
-- direct-source + claim-level constraints.
create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'published Clinical evidence requires a prescriber-inspectable primary source';
    end if;

    if not exists (
      select 1 from public.clinical_evidence_reviews r
      where r.evidence_record_id = new.id
        and r.review_type = 'provenance'
        and r.decision = 'approved'
    ) then
      raise exception 'clinical evidence publication requires an approved provenance review';
    end if;

    if new.publication_scope = 'clinical-synthesis' or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
      if not exists (
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
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
      end if;

      if not exists (
        select 1
        from public.clinical_evidence_claims c
        where c.evidence_record_id = new.id
          and c.status = 'current'
          and public.clinical_source_is_prescriber_inspectable(c.primary_source_url)
          and btrim(c.source_locator) <> ''
      ) then
        raise exception 'clinical synthesis or graded certainty requires current claim-level inspectable provenance';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. RLS: reference material requires verified clinician access; patient data
--    remains care-team scoped and consent-gated.
-- ---------------------------------------------------------------------------
alter table public.clinical_concepts enable row level security;
alter table public.clinical_concept_aliases enable row level security;
alter table public.clinical_evidence_claims enable row level security;
alter table public.clinical_safety_rules enable row level security;
alter table public.clinical_regimen_protocols enable row level security;
alter table public.clinical_guideline_recommendations enable row level security;
alter table public.clinical_patient_contexts enable row level security;
alter table public.clinical_therapeutic_objectives enable row level security;
alter table public.clinical_decision_records enable row level security;
alter table public.clinical_change_events enable row level security;
alter table public.clinical_patient_impact_reviews enable row level security;

-- Reference reads: verified clinicians see only reviewed/current material.
drop policy if exists clinical_concepts_verified_read on public.clinical_concepts;
create policy clinical_concepts_verified_read on public.clinical_concepts
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_concept_aliases_verified_read on public.clinical_concept_aliases;
create policy clinical_concept_aliases_verified_read on public.clinical_concept_aliases
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_evidence_claims_verified_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_verified_read on public.clinical_evidence_claims
  for select to authenticated using (
    public.is_verified_clinician()
    and status = 'current'
    and public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and exists (
      select 1 from public.clinical_evidence_records e
      where e.id = clinical_evidence_claims.evidence_record_id
        and e.review_status = 'published'
    )
  );

drop policy if exists clinical_safety_rules_verified_read on public.clinical_safety_rules;
create policy clinical_safety_rules_verified_read on public.clinical_safety_rules
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations
  for select to authenticated using (public.is_verified_clinician() and status = 'current');

drop policy if exists clinical_change_events_verified_read on public.clinical_change_events;
create policy clinical_change_events_verified_read on public.clinical_change_events
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

-- Review staff can inspect non-public reference rows without weakening the
-- verified-clinician customer surface.
drop policy if exists clinical_evidence_claims_review_access on public.clinical_evidence_claims;
create policy clinical_evidence_claims_review_access on public.clinical_evidence_claims
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_safety_rules_review_access on public.clinical_safety_rules;
create policy clinical_safety_rules_review_access on public.clinical_safety_rules
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_regimen_protocols_review_access on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_review_access on public.clinical_regimen_protocols
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

-- Patient-scoped tables: verified clinician + active care team + core consent.
drop policy if exists clinical_patient_contexts_member_access on public.clinical_patient_contexts;
create policy clinical_patient_contexts_member_access on public.clinical_patient_contexts
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_contexts.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_contexts.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  );

drop policy if exists clinical_therapeutic_objectives_member_access on public.clinical_therapeutic_objectives;
create policy clinical_therapeutic_objectives_member_access on public.clinical_therapeutic_objectives
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_therapeutic_objectives.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_decision_records_member_access on public.clinical_decision_records;
create policy clinical_decision_records_member_access on public.clinical_decision_records
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_decision_records.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and clinician_user_id = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_patient_impact_reviews_member_access on public.clinical_patient_impact_reviews;
create policy clinical_patient_impact_reviews_member_access on public.clinical_patient_impact_reviews
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_impact_reviews.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

revoke all on public.clinical_concepts from anon;
revoke all on public.clinical_concept_aliases from anon;
revoke all on public.clinical_evidence_claims from anon;
revoke all on public.clinical_safety_rules from anon;
revoke all on public.clinical_regimen_protocols from anon;
revoke all on public.clinical_guideline_recommendations from anon;
revoke all on public.clinical_patient_contexts from anon;
revoke all on public.clinical_therapeutic_objectives from anon;
revoke all on public.clinical_decision_records from anon;
revoke all on public.clinical_change_events from anon;
revoke all on public.clinical_patient_impact_reviews from anon;

grant select on public.clinical_concepts, public.clinical_concept_aliases,
  public.clinical_evidence_claims, public.clinical_safety_rules,
  public.clinical_regimen_protocols, public.clinical_guideline_recommendations,
  public.clinical_change_events to authenticated;
grant select, insert, update on public.clinical_patient_contexts,
  public.clinical_therapeutic_objectives, public.clinical_patient_impact_reviews to authenticated;
grant select, insert on public.clinical_decision_records to authenticated;

grant all on public.clinical_concepts, public.clinical_concept_aliases,
  public.clinical_evidence_claims, public.clinical_safety_rules,
  public.clinical_regimen_protocols, public.clinical_guideline_recommendations,
  public.clinical_patient_contexts, public.clinical_therapeutic_objectives,
  public.clinical_decision_records, public.clinical_change_events,
  public.clinical_patient_impact_reviews to service_role;

comment on function public.clinical_source_is_prescriber_inspectable(text) is
  'Fail-closed URL predicate for prescriber-facing Clinical provenance. Generic homepages and search portals do not qualify.';
comment on table public.clinical_evidence_claims is
  'Claim-level Prescriber OS evidence with exact inspectable source URL and source locator; no claim is inferred from record-level metadata.';
comment on table public.clinical_patient_contexts is
  'Consent- and care-team-scoped patient clinical context for Prescriber OS decision support.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818213000','clinical_prescriber_os_reconciliation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818213000_clinical_prescriber_os_reconciliation.sql

-- RECOVERY BEGIN 20260818213100_clinical_provenance_remediation_audit.sql
-- Record reconciliation counts in a private, append-only Clinical operations audit trail.
-- Production received the production-shaped Evidence Spine reconciliation without the
-- historical V1.1 operations migration, so this migration safely provisions the audit
-- table when absent. It does not publish or delete clinical content.

create table if not exists public.clinical_evidence_operation_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'source','intake','snapshot','extraction','credential','review','grade','conflict','evidence-record','publication','corpus'
  )),
  entity_id uuid,
  event_type text not null,
  actor_user_id uuid,
  event_payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create or replace function public.clinical_operation_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical operation events are append-only';
end;
$function$;

revoke all on function public.clinical_operation_event_immutable() from public;
drop trigger if exists trg_clinical_operation_event_immutable on public.clinical_evidence_operation_events;
create trigger trg_clinical_operation_event_immutable
before update or delete on public.clinical_evidence_operation_events
for each row execute function public.clinical_operation_event_immutable();

alter table public.clinical_evidence_operation_events enable row level security;

drop policy if exists clinical_operation_events_review_access on public.clinical_evidence_operation_events;
drop policy if exists clinical_operation_events_review_insert on public.clinical_evidence_operation_events;
create policy clinical_operation_events_review_access on public.clinical_evidence_operation_events
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_insert on public.clinical_evidence_operation_events
  for insert to authenticated with check (public.clinical_evidence_has_review_role());

revoke all on public.clinical_evidence_operation_events from public, anon;
grant select, insert on public.clinical_evidence_operation_events to authenticated;
grant all on public.clinical_evidence_operation_events to service_role;

create index if not exists idx_clinical_operation_events_entity
  on public.clinical_evidence_operation_events(entity_type, entity_id, recorded_at desc);

insert into public.clinical_evidence_operation_events (
  entity_type,
  entity_id,
  event_type,
  event_payload,
  recorded_at
)
values (
  'corpus',
  null,
  'prescriber-provenance-remediation',
  jsonb_build_object(
    'evidence_records_withheld', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'under-review'
        and coalesce(freshness_reason, '') ilike '%Prescriber provenance remediation%'
    ),
    'interaction_records_withheld', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'monitoring_records_withheld', (
      select count(*)
      from public.clinical_monitoring_protocols
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'remaining_published_noninspectable_evidence', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'published'
        and not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    ),
    'remaining_published_noninspectable_interactions', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'published'
        and (
          not public.clinical_source_is_prescriber_inspectable(primary_source_url)
          or btrim(coalesce(source_locator, '')) = ''
        )
    ),
    'recorded_by_migration', '20260818213100_clinical_provenance_remediation_audit.sql'
  ),
  now()
);

comment on table public.clinical_evidence_operation_events is
  'Private append-only operations audit trail. Provisioned by the Prescriber OS reconciliation when the historical V1.1 operations table is absent.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818213100','clinical_provenance_remediation_audit','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818213100_clinical_provenance_remediation_audit.sql

-- RECOVERY BEGIN 20260818213200_clinical_prescriber_sku_links.sql
-- Clinical Prescriber OS: exact SKU linkage after current-main SKU bootstrap.
-- Depends on 20260818213000_clinical_prescriber_os_reconciliation.sql and the
-- current-main clinical_formulary_skus schema. Additive/forward only; not self-applying.

alter table public.clinical_regimen_protocols
  add column if not exists formulary_sku_id uuid
    references public.clinical_formulary_skus(id) on delete cascade;

alter table public.clinical_regimen_protocols
  alter column formulary_product_id drop not null;

alter table public.clinical_regimen_protocols
  drop constraint if exists clinical_regimen_requires_product_reference;
alter table public.clinical_regimen_protocols
  add constraint clinical_regimen_requires_product_reference
  check (formulary_product_id is not null or formulary_sku_id is not null);

create index if not exists clinical_regimen_sku_idx
  on public.clinical_regimen_protocols (formulary_sku_id, jurisdiction, review_status)
  where formulary_sku_id is not null;

alter table public.clinical_monitoring_protocols
  add column if not exists formulary_sku_id uuid
    references public.clinical_formulary_skus(id) on delete set null;

create index if not exists clinical_monitoring_sku_idx
  on public.clinical_monitoring_protocols (formulary_sku_id, review_status)
  where formulary_sku_id is not null;

alter table public.clinical_decision_records
  add column if not exists formulary_sku_ids uuid[] not null default '{}'::uuid[];

comment on column public.clinical_regimen_protocols.formulary_sku_id is
  'Exact governed formulary SKU where the regimen is product-specific. A class-level formulary product remains allowed only when the source itself defines a class-level regimen.';
comment on column public.clinical_decision_records.formulary_sku_ids is
  'Exact governed SKU references considered by the clinician-authored decision; presence does not imply authorization or appropriateness.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818213200','clinical_prescriber_sku_links','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818213200_clinical_prescriber_sku_links.sql

-- RECOVERY BEGIN 20260818213300_clinical_prescriber_pharmacovigilance.sql
-- Clinical Prescriber OS: patient adverse-event / pharmacovigilance workflow.
-- Additive/forward only. This migration records clinician-authored events and
-- reporting status; it does not infer regulatory reporting obligations or
-- submit reports to an external authority.

create table if not exists public.clinical_adverse_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  reporter_user_id uuid not null,
  professional_id uuid references public.hv_professionals(id) on delete set null,
  jurisdiction text not null,
  formulary_product_id uuid references public.clinical_formulary_products(id) on delete set null,
  formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  suspected_product_name text not null,
  lot_number text,
  event_summary text not null,
  seriousness text not null default 'unknown'
    check (seriousness in ('serious', 'non-serious', 'unknown')),
  onset_at timestamptz,
  concomitant_products text[] not null default '{}',
  action_taken text,
  outcome text,
  authority_report_required boolean,
  authority_report_status text not null default 'not-assessed'
    check (authority_report_status in ('not-assessed', 'not-required', 'pending', 'submitted', 'failed')),
  authority_report_reference text,
  authority_reported_at timestamptz,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'closed', 'void')),
  metadata jsonb not null default '{}'::jsonb,
  constraint clinical_adverse_event_product_reference
    check (formulary_product_id is not null or formulary_sku_id is not null or length(trim(suspected_product_name)) > 0)
);

create index if not exists clinical_adverse_events_patient_idx
  on public.clinical_adverse_events (patient_id, created_at desc);
create index if not exists clinical_adverse_events_reporter_idx
  on public.clinical_adverse_events (reporter_user_id, created_at desc);
create index if not exists clinical_adverse_events_status_idx
  on public.clinical_adverse_events (status, authority_report_status, created_at desc);

alter table public.clinical_adverse_events enable row level security;

revoke all on public.clinical_adverse_events from anon;
grant select, insert, update on public.clinical_adverse_events to authenticated;
grant all on public.clinical_adverse_events to service_role;

drop policy if exists clinical_adverse_events_clinician_select on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_select
  on public.clinical_adverse_events for select to authenticated
  using (
    public.is_verified_clinician()
    and (
      reporter_user_id = (select auth.uid())
      or exists (
        select 1
        from public.clinical_patients p
        where p.id = clinical_adverse_events.patient_id
          and (
            p.created_by = (select auth.uid())
            or exists (
              select 1
              from public.clinical_care_team ct
              where ct.patient_id = p.id
                and ct.user_id = (select auth.uid())
                and ct.membership_status = 'active'
            )
          )
      )
    )
  );

drop policy if exists clinical_adverse_events_clinician_insert on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_insert
  on public.clinical_adverse_events for insert to authenticated
  with check (
    public.is_verified_clinician()
    and reporter_user_id = (select auth.uid())
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1
      from public.clinical_patients p
      where p.id = clinical_adverse_events.patient_id
        and (
          p.created_by = (select auth.uid())
          or exists (
            select 1
            from public.clinical_care_team ct
            where ct.patient_id = p.id
              and ct.user_id = (select auth.uid())
              and ct.membership_status = 'active'
          )
        )
    )
  );

drop policy if exists clinical_adverse_events_clinician_update on public.clinical_adverse_events;
create policy clinical_adverse_events_clinician_update
  on public.clinical_adverse_events for update to authenticated
  using (
    public.is_verified_clinician()
    and (
      reporter_user_id = (select auth.uid())
      or exists (
        select 1 from public.clinical_care_team ct
        where ct.patient_id = clinical_adverse_events.patient_id
          and ct.user_id = (select auth.uid())
          and ct.membership_status = 'active'
          and ct.role in ('treating_clinician', 'pharmacist', 'care_coordinator')
      )
    )
  )
  with check (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_adverse_events_service on public.clinical_adverse_events;
create policy clinical_adverse_events_service
  on public.clinical_adverse_events for all to public
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create or replace function public.clinical_adverse_event_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.clinical_require_core_consent(new.patient_id);

  if new.encounter_id is not null and not exists (
    select 1 from public.clinical_encounters e
    where e.id = new.encounter_id and e.patient_id = new.patient_id
  ) then
    raise exception 'clinical_adverse_event_encounter_patient_mismatch'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    -- Ownership and patient identity are immutable after creation. This keeps
    -- an authenticated direct-table update from moving an event to a different
    -- patient/reporter context after the USING policy has authorized OLD.
    if new.patient_id is distinct from old.patient_id
      or new.reporter_user_id is distinct from old.reporter_user_id
      or new.professional_id is distinct from old.professional_id
      or new.jurisdiction is distinct from old.jurisdiction
    then
      raise exception 'clinical_adverse_event_ownership_immutable'
        using errcode = '23514';
    end if;

    new.updated_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.clinical_adverse_event_before_write() from public;

drop trigger if exists trg_clinical_adverse_event_before_write on public.clinical_adverse_events;
create trigger trg_clinical_adverse_event_before_write
  before insert or update on public.clinical_adverse_events
  for each row execute function public.clinical_adverse_event_before_write();

create or replace function public.clinical_adverse_event_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.clinical_audit_write(
    case when tg_op = 'INSERT' then 'adverse_event.record' else 'adverse_event.update' end,
    'clinical_adverse_events',
    new.id::text,
    new.jurisdiction,
    jsonb_build_object(
      'patient_id', new.patient_id,
      'seriousness', new.seriousness,
      'status', new.status,
      'authority_report_status', new.authority_report_status,
      'has_formulary_product', new.formulary_product_id is not null,
      'has_formulary_sku', new.formulary_sku_id is not null
    ),
    new.reporter_user_id
  );
  return new;
end;
$$;

revoke all on function public.clinical_adverse_event_after_write() from public;

drop trigger if exists trg_clinical_adverse_event_after_write on public.clinical_adverse_events;
create trigger trg_clinical_adverse_event_after_write
  after insert or update on public.clinical_adverse_events
  for each row execute function public.clinical_adverse_event_after_write();

-- Shared-decision documentation remains explicitly linked to existing consent
-- records rather than replacing the consent model.
alter table public.clinical_decision_records
  add column if not exists shared_decision_recorded_at timestamptz,
  add column if not exists consent_record_ids uuid[] not null default '{}'::uuid[];

comment on table public.clinical_adverse_events is
  'Restricted clinician-authored adverse-event/pharmacovigilance records. Harbourview does not infer or automatically submit regulator reports from this table.';
comment on column public.clinical_adverse_events.authority_report_required is
  'Clinician-recorded assessment only; null means not assessed. No regulatory obligation is inferred by the platform.';
comment on column public.clinical_decision_records.consent_record_ids is
  'References the consent records the clinician relied on when documenting shared decision-making; existing consent tables remain authoritative.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818213300','clinical_prescriber_pharmacovigilance','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818213300_clinical_prescriber_pharmacovigilance.sql

-- RECOVERY BEGIN 20260819125403_regulatory_tier_import_aware_classifier.sql
-- ============================================================
-- Import-aware regulatory_tier classifier + live reclassify
-- ============================================================
-- Root cause of DE/BR-style mis-colouring on the market-access globe:
--   * api.derive_regulatory_tier only treated EXPORT language as
--     legal_commercial_access. Import-heavy medical markets (Germany)
--     fell through to medical_limited_trade or domestic_only.
--   * Adult-use / social-club keywords ranked ABOVE medical, so CanG
--     social clubs forced domestic_only even when commercial import
--     pathways operate at scale.
--
-- Live path (already wired):
--   briefing program_status change
--     → trg_sync_regulatory_tier
--     → countries.regulatory_tier
--     → GlobeProvider realtime merge + /api/globe cache
--   signal pipeline
--     → market_access_events → promote_market_access_from_signals
--
-- This migration upgrades the shared classifier and re-runs it for every
-- origin='auto' country so the map matches current briefing text. Override
-- rows are left alone.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  under_discussion boolean;
begin
  if ps = '' then
    return null;
  end if;

  under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful CROSS-BORDER commercial pathway at scale.
  -- Import and export are peers — an import market is commercial access.
  if not under_discussion then
    if ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
       and ps !~* 'export licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    -- Licensed / operating import pathways (Germany-style medical import markets).
    if ps ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
       and ps !~* 'import licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  -- domestic_only: lawful internally, no cross-border commercial route signal.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- medical_limited_trade: affirmative medical access; exclude negated/future.
  if ps ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Derives countries.regulatory_tier from briefing program_status. Import and export pathways both map to legal_commercial_access; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Snapshot + reclassify origin=auto countries from current briefing text.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.derive_regulatory_tier(b.program_status) as new_tier,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(b.program_status, '') <> ''
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified import-aware classifier 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing: "' || left(ch.program_status, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.program_status, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = true
  from changed ch
  where c.iso_alpha2 = ch.country_iso2
  returning c.iso_alpha2, ch.old_tier, ch.new_tier, ch.program_status
)
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  iso_alpha2,
  old_tier,
  new_tier,
  'auto',
  'classifier_upgrade',
  program_status,
  'system',
  'Bulk reclassify after import-aware classifier upgrade (20260819125403).'
from updated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819125403','regulatory_tier_import_aware_classifier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819125403_regulatory_tier_import_aware_classifier.sql

-- RECOVERY BEGIN 20260819150000_regulatory_tier_classifier_negation_fix.sql
-- ============================================================
-- Regulatory tier classifier — negation-aware commercial signals
-- ============================================================
-- Production apply of 20260819125403 succeeded, but the post-apply
-- medical-only probe failed:
--
--   'Medical legal; prescription programme; no licensed export industry'
--     → legal_commercial_access  (wrong)
--     expected medical_limited_trade
--
-- Cause: export/import regexes matched substrings inside negated
-- phrases ("no licensed export industry" still matched "licensed export"
-- and "export industry").
--
-- This migration:
--   1. Replaces api.derive_regulatory_tier with negation guards
--   2. Reclassifies origin='auto' countries from current briefings
-- Override rows are left alone.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  under_discussion boolean;
  export_negated boolean;
  import_negated boolean;
begin
  if ps = '' then
    return null;
  end if;

  under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- Negation windows: "no/not/without/lack of … export|import"
  export_negated :=
    ps ~* '(no|not|without|lack of)[[:space:]]+(a[[:space:]]+|an[[:space:]]+|any[[:space:]]+)?(licensed[[:space:]]+)?export'
    or ps ~* '(no|not|without|lack of)[[:space:]]+[^.;]{0,40}export[[:space:]]+(industry|hub|permit|market)';

  import_negated :=
    ps ~* '(no|not|without|lack of)[[:space:]]+(a[[:space:]]+|an[[:space:]]+|any[[:space:]]+)?(licensed[[:space:]]+)?import'
    or ps ~* '(no|not|without|lack of)[[:space:]]+[^.;]{0,40}import[[:space:]]+(industry|pathway|permit|market)';

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- legal_commercial_access: lawful CROSS-BORDER commercial pathway at scale.
  -- Import and export are peers — an import market is commercial access.
  -- Negated phrases must not promote (e.g. "no licensed export industry").
  if not under_discussion then
    if not export_negated
       and ps ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
       and ps !~* 'export licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    -- Licensed / operating import pathways (Germany-style medical import markets).
    if not import_negated
       and ps ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
       and ps !~* 'import licensing under (discussion|consideration|review)'
    then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  -- domestic_only: lawful internally, no cross-border commercial route signal.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- medical_limited_trade: affirmative medical access; exclude negated/future.
  if ps ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Derives countries.regulatory_tier from briefing program_status. Import and export pathways both map to legal_commercial_access unless negated; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Reclassify origin=auto from current briefing text with the fixed classifier.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.derive_regulatory_tier(b.program_status) as new_tier,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(b.program_status, '') <> ''
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified negation-aware classifier 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing: "' || left(ch.program_status, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.program_status, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = true
  from changed ch
  where c.iso_alpha2 = ch.country_iso2
  returning c.iso_alpha2, ch.old_tier, ch.new_tier, ch.program_status
)
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  iso_alpha2,
  old_tier,
  new_tier,
  'auto',
  'classifier_upgrade',
  program_status,
  'system',
  'Bulk reclassify after negation-aware classifier fix (20260819150000).'
from updated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819150000','regulatory_tier_classifier_negation_fix','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819150000_regulatory_tier_classifier_negation_fix.sql

-- RECOVERY BEGIN 20260819151000_correct_de_br_program_status_commercial_import.sql
-- ============================================================
-- DE / BR program_status correction → live tier re-derive
-- ============================================================
-- After import-aware + negation-aware classifiers landed on production,
-- DE and BR remained domestic_only because live program_status text lacked
-- affirmative cross-border commercial language (or over-weighted adult-use).
--
-- Facts (2025–2026):
--   DE: Europe's largest medical cannabis import market (BfArM: ~201 t in 2025);
--       licensed importers / wholesalers under MedCanG; CanG adult-use social
--       clubs coexist but do not erase the commercial import pathway.
--   BR: Medical cannabis legal via Anvisa product authorisation and prescription;
--       no adult-use commercial market; not a scale commercial import hub on the
--       same order as DE — tier should be medical_limited_trade, not domestic_only.
--
-- UPDATE of program_status fires trg_sync_regulatory_tier →
--   countries.regulatory_tier for origin=auto rows.
-- ============================================================

-- Germany
UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Adult-use social club framework (CanG); Europe''s largest medical import market with licensed importers (BfArM MedCanG pathway)',
  change_notes = coalesce(change_notes, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'title', 'program_status: record commercial medical import pathway so regulatory_tier promotes to legal_commercial_access',
      'market', 'Germany',
      'timeAgo', '19 August 2026',
      'direction', 'up',
      'sourceRef', 'BfArM Medizinalcannabisverkehr Ein-/Ausfuhr; BfArM 2025 import totals (~201 t); MedCanG §4 licensed importers',
      'reviewState', 'reviewed'
    )
  ),
  last_reviewed_date = '2026-08-19',
  updated_at = now()
WHERE country_iso2 = 'DE'
  AND jurisdiction_type = 'country';

-- Brazil
UPDATE public.cc_jurisdiction_briefings
SET
  program_status = 'Medical legal; prescription programme; Anvisa-authorised product pathway',
  change_notes = coalesce(change_notes, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'title', 'program_status: medical prescription pathway without adult-use commercial framing; tier medical_limited_trade',
      'market', 'Brazil',
      'timeAgo', '19 August 2026',
      'direction', 'neutral',
      'sourceRef', 'Anvisa RDC medical cannabis product authorisation; prescription access',
      'reviewState', 'reviewed'
    )
  ),
  last_reviewed_date = '2026-08-19',
  updated_at = now()
WHERE country_iso2 = 'BR'
  AND jurisdiction_type = 'country';

-- Safety net: if trigger path is disabled or origin was sticky, force auto re-derive
-- for DE/BR only when origin is auto (never touch overrides).
UPDATE public.countries c
SET
  regulatory_tier = api.derive_regulatory_tier(b.program_status),
  regulatory_tier_source = 'auto-reclassified on DE/BR briefing correction 2026-08-19',
  regulatory_tier_rationale = 'Derived from briefing: "' || left(b.program_status, 500) || '"',
  regulatory_tier_source_hash = md5(coalesce(b.program_status, '')),
  regulatory_tier_last_derived_at = now(),
  regulatory_tier_needs_review = true
FROM public.cc_jurisdiction_briefings b
WHERE b.country_iso2 = c.iso_alpha2
  AND b.jurisdiction_type = 'country'
  AND c.iso_alpha2 IN ('DE', 'BR')
  AND coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
  AND b.program_status IS NOT NULL
  AND api.derive_regulatory_tier(b.program_status) IS DISTINCT FROM c.regulatory_tier;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819151000','correct_de_br_program_status_commercial_import','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819151000_correct_de_br_program_status_commercial_import.sql

-- RECOVERY BEGIN 20260819152000_tier_classify_all_countries_from_briefing_prose.sql
-- ============================================================
-- Tier classify ALL active countries from full briefing prose
-- ============================================================
-- DE/BR-only program_status patches are too narrow. Commercial import/export
-- facts often live in public_summary / market_dynamics / regulatory_outlook while
-- the short program_status still reads adult-use-only or medical-only.
--
-- This migration:
--   1. Adds api.briefing_classifier_text(...) — concatenates the four prose fields
--   2. Points the live briefing trigger at the combined text
--   3. Reclassifies every origin='auto' country that has a country-level briefing
-- Override rows are never rewritten.
-- ============================================================

create or replace function api.briefing_classifier_text(
  program_status text,
  public_summary text default null,
  market_dynamics text default null,
  regulatory_outlook text default null
)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    trim(both from concat_ws(
      ' | ',
      nullif(trim(both from coalesce(program_status, '')), ''),
      nullif(trim(both from coalesce(public_summary, '')), ''),
      nullif(trim(both from coalesce(market_dynamics, '')), ''),
      nullif(trim(both from coalesce(regulatory_outlook, '')), '')
    )),
    ''
  );
$$;

comment on function api.briefing_classifier_text(text, text, text, text) is
  'Canonical text fed to api.derive_regulatory_tier for a country briefing. program_status is primary; longer prose supplies commercial import/export signals when the short status omits them.';

revoke all on function api.briefing_classifier_text(text, text, text, text) from public, anon, authenticated;
grant execute on function api.briefing_classifier_text(text, text, text, text) to service_role;

-- Live path: any program_status change still fires the trigger; classifier now
-- sees the full briefing row so secondary prose is not ignored.
create or replace function public.sync_regulatory_tier_from_briefing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_iso        text := new.country_iso2;
  v_old_tier   text;
  v_origin     text;
  v_new_tier   text;
  v_text       text;
  v_new_hash   text;
begin
  if new.jurisdiction_type is distinct from 'country' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.program_status is not distinct from new.program_status
     and old.public_summary is not distinct from new.public_summary
     and old.market_dynamics is not distinct from new.market_dynamics
     and old.regulatory_outlook is not distinct from new.regulatory_outlook
  then
    return new;
  end if;

  select regulatory_tier, regulatory_tier_origin
    into v_old_tier, v_origin
    from public.countries
   where iso_alpha2 = v_iso;

  if not found then
    return new;
  end if;

  v_text := api.briefing_classifier_text(
    new.program_status,
    new.public_summary,
    new.market_dynamics,
    new.regulatory_outlook
  );
  v_new_hash := md5(coalesce(v_text, ''));
  v_new_tier := public.api_derive_or_null(v_text);

  if v_origin = 'override' then
    update public.countries set
      regulatory_tier_source_hash = v_new_hash,
      regulatory_tier_needs_review = true,
      regulatory_tier_last_derived_at = now()
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_old_tier, 'override', 'briefing_change', new.program_status, 'system',
       'Briefing prose changed under an overridden tier; flagged for re-confirmation, tier left as-is.');
    return new;
  end if;

  update public.countries set
    regulatory_tier = coalesce(v_new_tier, regulatory_tier),
    regulatory_tier_source = 'auto-reclassified on briefing prose ' || to_char(now(), 'YYYY-MM-DD'),
    regulatory_tier_rationale = 'Derived from briefing prose: "' || left(coalesce(v_text, ''), 500) || '"',
    regulatory_tier_source_hash = v_new_hash,
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = case
      when v_new_tier is distinct from v_old_tier then true
      else regulatory_tier_needs_review
    end
  where iso_alpha2 = v_iso;

  if v_new_tier is distinct from v_old_tier then
    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (v_iso, v_old_tier, v_new_tier, 'auto', 'briefing_change', new.program_status, 'system',
       'Auto-reclassified after briefing prose change (full-field classifier).');
  end if;

  return new;
end;
$$;

-- Also fire when secondary prose fields change (not only program_status).
drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
  after insert or update of program_status, public_summary, market_dynamics, regulatory_outlook
  on public.cc_jurisdiction_briefings
  for each row execute function public.sync_regulatory_tier_from_briefing();

-- Bulk reclassify every active country briefing with origin=auto.
with derived as (
  select
    b.country_iso2,
    b.program_status,
    api.briefing_classifier_text(
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    ) as classifier_text,
    api.derive_regulatory_tier(
      api.briefing_classifier_text(
        b.program_status,
        b.public_summary,
        b.market_dynamics,
        b.regulatory_outlook
      )
    ) as new_tier,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(b.program_status, '') <> ''
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified full briefing prose 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing prose: "' || left(ch.classifier_text, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.classifier_text, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = true
  from changed ch
  where c.iso_alpha2 = ch.country_iso2
  returning c.iso_alpha2, ch.old_tier, ch.new_tier, ch.program_status
)
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  iso_alpha2,
  old_tier,
  new_tier,
  'auto',
  'classifier_upgrade',
  program_status,
  'system',
  'Bulk reclassify all origin=auto countries from full briefing prose (20260819152000).'
from updated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819152000','tier_classify_all_countries_from_briefing_prose','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819152000_tier_classify_all_countries_from_briefing_prose.sql

-- RECOVERY BEGIN 20260819153000_regulatory_tier_classifier_clause_scope_hardening.sql
-- ============================================================
-- Regulatory tier classifier — clause-scope hardening
-- ============================================================
-- Forward repair after:
--   20260819150000_regulatory_tier_classifier_negation_fix.sql
--   20260819152000_tier_classify_all_countries_from_briefing_prose.sql
--
-- 20260819150000 fixed the immediate false positive where
-- "no licensed export industry" matched affirmative export regexes. Remaining
-- classifier-contract gaps include clause-local negation, natural-language
-- negation forms, and trade-discussion text erasing established medical access.
--
-- 20260819152000 makes full briefing prose the canonical classifier input by
-- joining program_status, public_summary, market_dynamics, and
-- regulatory_outlook with " | ". This migration preserves that contract.
--
-- Override rows are never reclassified.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  general_under_discussion boolean;
  export_commercial boolean;
  import_commercial boolean;
begin
  if trim(both from ps) = '' then
    return null;
  end if;

  general_under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  -- Evaluate trade evidence clause-by-clause. Full briefing prose is joined by
  -- " | ", so pipe separators are boundaries as well as punctuation.
  -- and/but/however also start a new clause so historical negative wording does
  -- not suppress a later current affirmative pathway.
  select exists (
    select 1
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?(commercial[[:space:]]+)?)(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* 'export licensing under (discussion|consideration|review)'
  ) into export_commercial;

  select exists (
    select 1
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?((commercial|medical)[[:space:]]+)?)(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* 'import licensing under (discussion|consideration|review)'
  ) into import_commercial;

  -- cbd_hemp_only: cannabis prohibited BUT affirmative licensed hemp/CBD.
  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  -- Cross-border commercial access requires at least one affirmative,
  -- non-negated import/export clause.
  if export_commercial or import_commercial then
    return 'legal_commercial_access';
  end if;

  -- Preserve fail-closed handling for broad future/discussion language on the
  -- non-trade commercial signals inherited from the earlier classifier.
  if not general_under_discussion then
    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;

    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  -- Domestic lawful access without an affirmative cross-border pathway.
  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  -- Established medical access remains established when a separate trade
  -- reform is under discussion. The medical-legal token must end at "legal"
  -- so future terms such as "medical legalization/legalisation" do not get
  -- mistaken for an already-legal medical programme.
  if ps ~* '(medical legal([[:space:][:punct:]]|$)|medical[[:space:]]*(—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|no medical program|medical (reform|programme|program|access|legalization|legalisation|licensing)( remains?)? under (active )?(consideration|discussion|review))'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Derives countries.regulatory_tier from canonical briefing text. Affirmative non-negated import/export clauses map to legal_commercial_access; unrelated trade discussion does not erase established medical access; future medical legalization text is not treated as already legal; adult-use alone is domestic_only; medical-only is medical_limited_trade.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Re-derive automatic country tiers using the SAME canonical full-briefing
-- source contract introduced by 20260819152000. Do not fall back to
-- program_status-only reclassification here.
with briefing_text as (
  select
    b.country_iso2,
    b.program_status,
    api.briefing_classifier_text(
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    ) as classifier_text,
    c.regulatory_tier as old_tier
  from public.cc_jurisdiction_briefings b
  join public.countries c on c.iso_alpha2 = b.country_iso2
  where b.jurisdiction_type = 'country'
    and coalesce(c.regulatory_tier_origin, 'auto') = 'auto'
),
derived as (
  select
    country_iso2,
    program_status,
    classifier_text,
    api.derive_regulatory_tier(classifier_text) as new_tier,
    old_tier
  from briefing_text
  where classifier_text is not null
),
changed as (
  select * from derived
  where new_tier is not null
    and new_tier is distinct from old_tier
),
updated as (
  update public.countries c set
    regulatory_tier = ch.new_tier,
    regulatory_tier_source = 'auto-reclassified clause-scope full briefing prose 2026-08-19',
    regulatory_tier_rationale = 'Derived from briefing prose: "' || left(ch.classifier_text, 500) || '"',
    regulatory_tier_source_hash = md5(coalesce(ch.classifier_text, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = true
  from changed ch
  where c.iso_alpha2 = ch.country_iso2
  returning c.iso_alpha2, ch.old_tier, ch.new_tier, ch.program_status
)
insert into public.regulatory_tier_audit
  (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
select
  iso_alpha2,
  old_tier,
  new_tier,
  'auto',
  'classifier_clause_scope_hardening',
  program_status,
  'system',
  'Forward reclassify from canonical full briefing prose after clause-scope hardening (20260819153000).'
from updated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819153000','regulatory_tier_classifier_clause_scope_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819153000_regulatory_tier_classifier_clause_scope_hardening.sql

-- RECOVERY BEGIN 20260819160000_clinical_jurisdiction_supply_outlook.sql
-- Clinical × Market-Intelligence bridge: jurisdiction supply-continuity outlook.
--
-- Strategic rationale (see docs/control/CLINICAL_PRESCRIBER_OS_DIFFERENTIATION_20260819.md):
-- no cannabis-specific clinical decision support competitor (CannaScript, OpenEvidence,
-- InteractSafe, CANN-DIR, Lexicomp/UpToDate) has access to a real trade/regulatory
-- intelligence network. Harbourview does. This closes that gap: it surfaces a safe,
-- aggregated read of the existing `signals` market-intelligence pipeline, scoped to a
-- jurisdiction, for use anywhere a clinical surface shows a formulary SKU or regimen.
--
-- Design constraints:
--   * Never expose raw `signals` rows (internal notes, unverified inference chains,
--     embeddings, competitive intel) to clinical app users. Only an aggregated,
--     reviewed-only summary crosses the boundary.
--   * Additive only. Touches no existing clinical governance table, no RLS on
--     `signals`, no file under active concurrent development.
--   * SECURITY DEFINER so the function can read `signals` on the caller's behalf
--     without granting clinical users direct table access.

create or replace function public.clinical_jurisdiction_supply_outlook(
  p_country_iso2 text,
  p_lookback_days integer default 180
)
returns table (
  country_iso2 text,
  risk_level text,
  signal_count_90d integer,
  signal_count_lookback integer,
  top_category text,
  most_recent_headline text,
  most_recent_summary text,
  most_recent_source_url text,
  most_recent_signal_at timestamptz,
  generated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_country text := upper(nullif(trim(p_country_iso2), ''));
  v_lookback integer := greatest(coalesce(p_lookback_days, 180), 1);
  v_count_90d integer;
  v_count_lookback integer;
  v_top_category text;
  v_row record;
begin
  if v_country is null then
    return;
  end if;

  select count(*) into v_count_90d
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - interval '90 days';

  select count(*) into v_count_lookback
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval;

  select s.cat into v_top_category
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval
  group by s.cat
  order by count(*) desc, max(s.date) desc
  limit 1;

  select
    coalesce(s.editorial_title, s.title_en, s.headline) as headline,
    coalesce(s.editorial_blurb, s.summary_en, s.summary) as summary,
    s.url,
    s.date
  into v_row
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval
  order by s.date desc, s.score desc nulls last
  limit 1;

  return query select
    v_country,
    case
      when v_count_lookback = 0 then 'insufficient-data'
      when v_count_90d >= 3 then 'elevated'
      when v_count_90d >= 1 then 'watch'
      else 'normal'
    end,
    v_count_90d,
    v_count_lookback,
    v_top_category,
    v_row.headline,
    v_row.summary,
    v_row.url,
    v_row.date,
    now();
end;
$function$;

revoke all on function public.clinical_jurisdiction_supply_outlook(text, integer) from public;
grant execute on function public.clinical_jurisdiction_supply_outlook(text, integer)
  to authenticated, service_role;

comment on function public.clinical_jurisdiction_supply_outlook(text, integer) is
  'Clinical-safe aggregated read of the internal market-intelligence signals pipeline, scoped to one jurisdiction. Returns risk level + one representative reviewed signal, never raw rows. Feeds the supply-continuity badge on formulary SKUs and regimens.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819160000','clinical_jurisdiction_supply_outlook','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819160000_clinical_jurisdiction_supply_outlook.sql

-- RECOVERY BEGIN 20260819170000_clinical_reviewer_credential_integrity.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819170000','clinical_reviewer_credential_integrity','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819170000_clinical_reviewer_credential_integrity.sql

-- RECOVERY BEGIN 20260819190000_clinical_cross_border_formulary_check.sql
-- Cross-border formulary portability check.
--
-- Second half of the differentiation bet started in
-- 20260819160000_clinical_jurisdiction_supply_outlook.sql (see
-- docs/control/CLINICAL_PRESCRIBER_OS_DIFFERENTIATION_20260819.md). Cannabis
-- patients travel; no single-jurisdiction competitor (CannaScript=UK,
-- Releaf=UK) can answer "is this patient's product available/authorised in
-- their destination country" because it requires exactly the multi-country
-- formulary + regulatory dataset Harbourview already operates.
--
-- Deliberately stateless: takes a brand name and/or cannabinoid profile
-- directly rather than a regimen_id, so it works from a UI that already has
-- the source product loaded (no dependency on clinical_regimen_protocols'
-- grants/shape, which is under active concurrent development) and is usable
-- standalone before a regimen is even finalised.

create or replace function public.clinical_cross_border_formulary_check(
  p_destination_country_iso2 text,
  p_brand_name text default null,
  p_cannabinoid_profile text default null
)
returns table (
  destination_country_iso2 text,
  match_kind text,
  portability_verdict text,
  matched_source_type text,
  matched_product_name text,
  matched_brand_name text,
  matched_authorization_status text,
  supply_risk_level text,
  supply_signal_headline text,
  supply_signal_source_url text,
  generated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_country text := upper(nullif(trim(p_destination_country_iso2), ''));
  v_brand text := nullif(trim(p_brand_name), '');
  v_profile text := nullif(trim(p_cannabinoid_profile), '');
  v_match record;
  v_match_kind text;
  v_verdict text;
  v_outlook record;
begin
  if v_country is null or length(v_country) <> 2 then
    return;
  end if;

  if v_brand is null and v_profile is null then
    return query select
      v_country, 'no-input'::text, 'insufficient-input'::text,
      null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, now();
    return;
  end if;

  -- Pass 1: same brand, either table.
  if v_brand is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and brand_name ilike v_brand
    order by last_seen_at desc nulls last
    limit 1;

    if v_match is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and brand_name ilike v_brand
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match is not null then
      v_match_kind := 'same-brand';
    end if;
  end if;

  -- Pass 2: fall back to matching cannabinoid profile if no brand match.
  if v_match is null and v_profile is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and cannabinoid_profile ilike ('%' || v_profile || '%')
    order by last_seen_at desc nulls last
    limit 1;

    if v_match is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and cannabinoid_profile ilike ('%' || v_profile || '%')
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match is not null then
      v_match_kind := 'equivalent-profile';
    end if;
  end if;

  v_verdict := case
    when v_match is null then 'not-currently-available'
    when v_match_kind = 'same-brand' then 'likely-portable'
    else 'profile-equivalent-available'
  end;

  select o.risk_level, o.most_recent_headline, o.most_recent_source_url
  into v_outlook
  from public.clinical_jurisdiction_supply_outlook(v_country, 180) o;

  return query select
    v_country,
    coalesce(v_match_kind, 'no-match'),
    v_verdict,
    v_match.source_type,
    v_match.product_name,
    v_match.brand_name,
    v_match.authorization_status,
    v_outlook.risk_level,
    v_outlook.most_recent_headline,
    v_outlook.most_recent_source_url,
    now();
end;
$function$;

revoke all on function public.clinical_cross_border_formulary_check(text, text, text) from public;
grant execute on function public.clinical_cross_border_formulary_check(text, text, text)
  to authenticated, service_role;

comment on function public.clinical_cross_border_formulary_check(text, text, text) is
  'Cross-border regimen portability check: given a brand name and/or cannabinoid profile and a destination country, reports whether an equivalent published formulary entry exists there, plus that jurisdiction''s supply-continuity outlook. Informational only, not a legal or clinical determination.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819190000','clinical_cross_border_formulary_check','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819190000_clinical_cross_border_formulary_check.sql

-- RECOVERY BEGIN 20260819210000_clinical_prescriber_os_api_schema_exposure.sql
-- Clinical Prescriber OS — expose public tables through the `api` schema.
--
-- Production PostgREST only exposes schema `api` (see lib/supabase/env.ts
-- SUPABASE_DB_SCHEMA). Tables physically live in `public`. Without matching
-- `api.*` views, supabase-js reports:
--   Could not find the table 'api.clinical_safety_rules' in the schema cache
-- (and the same for regimen, monitoring, guideline tables).
--
-- This migration is additive and idempotent. It does not invent clinical claims.
-- Prerequisite: public.clinical_* objects from 20260818213000 (and monitoring
-- from 20260818210936) must already exist, or create-view will fail closed.

create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helper: drop + recreate view so column drift from later public alters is OK
-- ---------------------------------------------------------------------------

-- Safety rules
drop view if exists api.clinical_safety_rules cascade;
create view api.clinical_safety_rules
with (security_invoker = true)
as
select *
from public.clinical_safety_rules;

grant select on api.clinical_safety_rules to authenticated, service_role;
revoke all on api.clinical_safety_rules from anon;

-- Regimen protocols
drop view if exists api.clinical_regimen_protocols cascade;
create view api.clinical_regimen_protocols
with (security_invoker = true)
as
select *
from public.clinical_regimen_protocols;

grant select on api.clinical_regimen_protocols to authenticated, service_role;
revoke all on api.clinical_regimen_protocols from anon;

-- Monitoring protocols (table may pre-exist from 20260818210936)
drop view if exists api.clinical_monitoring_protocols cascade;
create view api.clinical_monitoring_protocols
with (security_invoker = true)
as
select *
from public.clinical_monitoring_protocols;

grant select on api.clinical_monitoring_protocols to authenticated, service_role;
-- Match historical public grant for published monitoring where intentional:
grant select on api.clinical_monitoring_protocols to anon;

-- Guideline recommendations
drop view if exists api.clinical_guideline_recommendations cascade;
create view api.clinical_guideline_recommendations
with (security_invoker = true)
as
select *
from public.clinical_guideline_recommendations;

grant select on api.clinical_guideline_recommendations to authenticated, service_role;
revoke all on api.clinical_guideline_recommendations from anon;

-- Core evidence + interactions + formulary surfaces used by workspace / ask
drop view if exists api.clinical_evidence_records cascade;
create view api.clinical_evidence_records
with (security_invoker = true)
as
select *
from public.clinical_evidence_records;

grant select on api.clinical_evidence_records to anon, authenticated, service_role;

drop view if exists api.clinical_evidence_change_events cascade;
create view api.clinical_evidence_change_events
with (security_invoker = true)
as
select *
from public.clinical_evidence_change_events;

grant select on api.clinical_evidence_change_events to anon, authenticated, service_role;

drop view if exists api.clinical_condition_terms cascade;
create view api.clinical_condition_terms
with (security_invoker = true)
as
select *
from public.clinical_condition_terms;

grant select on api.clinical_condition_terms to anon, authenticated, service_role;

drop view if exists api.clinical_medication_interactions cascade;
create view api.clinical_medication_interactions
with (security_invoker = true)
as
select *
from public.clinical_medication_interactions;

grant select on api.clinical_medication_interactions to authenticated, service_role;

drop view if exists api.clinical_formulary_products cascade;
create view api.clinical_formulary_products
with (security_invoker = true)
as
select *
from public.clinical_formulary_products;

grant select on api.clinical_formulary_products to anon, authenticated, service_role;

drop view if exists api.clinical_formulary_skus cascade;
create view api.clinical_formulary_skus
with (security_invoker = true)
as
select *
from public.clinical_formulary_skus;

grant select on api.clinical_formulary_skus to anon, authenticated, service_role;

-- Concepts (Evidence OS) when present
do $block$
begin
  if to_regclass('public.clinical_concepts') is not null then
    execute 'drop view if exists api.clinical_concepts cascade';
    execute $v$
      create view api.clinical_concepts
      with (security_invoker = true)
      as select * from public.clinical_concepts
    $v$;
    execute 'grant select on api.clinical_concepts to authenticated, service_role';
  end if;

  if to_regclass('public.clinical_concept_aliases') is not null then
    execute 'drop view if exists api.clinical_concept_aliases cascade';
    execute $v$
      create view api.clinical_concept_aliases
      with (security_invoker = true)
      as select * from public.clinical_concept_aliases
    $v$;
    execute 'grant select on api.clinical_concept_aliases to authenticated, service_role';
  end if;
end
$block$;

comment on view api.clinical_safety_rules is
  'API projection of public.clinical_safety_rules (security_invoker; RLS applies).';
comment on view api.clinical_regimen_protocols is
  'API projection of public.clinical_regimen_protocols (security_invoker; RLS applies).';
comment on view api.clinical_monitoring_protocols is
  'API projection of public.clinical_monitoring_protocols (security_invoker; RLS applies).';
comment on view api.clinical_guideline_recommendations is
  'API projection of public.clinical_guideline_recommendations (security_invoker; RLS applies).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260819210000','clinical_prescriber_os_api_schema_exposure','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260819210000_clinical_prescriber_os_api_schema_exposure.sql

-- RECOVERY BEGIN 20260820100000_network_command_p1_introduction_status.sql
begin;

-- Network Command P1-A: controlled introduction status advancement.
-- P0 left status updates off the authenticated role on purpose.
-- This migration adds a security-definer advance function + transition matrix.
-- Members: limited early transitions only.
-- Staff (admin/operator/super_admin/compliance_reviewer): full pipeline.
-- No broad UPDATE grant is added for authenticated on network_introductions.

create or replace function public.hv_network_introduction_transition_allowed(
  p_from text,
  p_to text,
  p_is_staff boolean
) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from is null or p_to is null then false
    when p_from = p_to then false
    when p_from in ('converted', 'declined', 'expired', 'closed') then false
    when p_from = 'draft' and p_to in ('review', 'closed') then true
    when p_from = 'draft' and p_is_staff and p_to = 'declined' then true
    when p_from = 'review' and p_to = 'closed' then true
    when p_from = 'review' and p_is_staff and p_to in ('disclosure_pending', 'declined', 'closed') then true
    when p_from = 'disclosure_pending' and p_is_staff and p_to in ('consent_pending', 'declined', 'closed') then true
    when p_from = 'consent_pending' and p_is_staff and p_to in ('approved', 'declined', 'closed') then true
    when p_from = 'approved' and p_is_staff and p_to in ('introduced', 'declined', 'closed') then true
    when p_from = 'introduced' and p_is_staff and p_to in ('converted', 'closed') then true
    else false
  end;
$$;

revoke all on function public.hv_network_introduction_transition_allowed(text, text, boolean) from public, anon;
grant execute on function public.hv_network_introduction_transition_allowed(text, text, boolean) to authenticated, service_role;

create or replace function public.hv_network_advance_introduction(
  p_introduction_id uuid,
  p_to_status text,
  p_outcome text default null,
  p_detail jsonb default '{}'::jsonb
) returns public.network_introductions
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.network_introductions;
  prior_status text;
  is_staff boolean;
  is_member boolean;
  cleaned_outcome text;
begin
  if p_to_status is null or length(btrim(p_to_status)) = 0 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_STATUS';
  end if;

  select * into rec
  from public.network_introductions
  where id = p_introduction_id
  for update;

  if not found then
    raise exception 'NETWORK_INTRODUCTION_NOT_FOUND';
  end if;

  prior_status := rec.status;
  is_member := public.hv_network_active_workspace_member(rec.workspace_id);
  is_staff := public.hv_has_transaction_role(
    array['admin', 'operator', 'super_admin', 'compliance_reviewer']
  );

  if not (is_member or is_staff) then
    raise exception 'NETWORK_INTRODUCTION_FORBIDDEN';
  end if;

  if not public.hv_network_introduction_transition_allowed(prior_status, p_to_status, is_staff) then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TRANSITION';
  end if;

  cleaned_outcome := nullif(btrim(coalesce(p_outcome, '')), '');
  if cleaned_outcome is not null and length(cleaned_outcome) > 1000 then
    raise exception 'NETWORK_INTRODUCTION_OUTCOME_TOO_LONG';
  end if;

  update public.network_introductions set
    status = p_to_status,
    outcome = coalesce(cleaned_outcome, outcome),
    introduced_at = case
      when p_to_status = 'introduced' and introduced_at is null then now()
      else introduced_at
    end,
    updated_at = now()
  where id = p_introduction_id
  returning * into rec;

  insert into public.network_introduction_events (
    introduction_id,
    workspace_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    detail
  ) values (
    rec.id,
    rec.workspace_id,
    auth.uid(),
    'status_advanced',
    prior_status,
    p_to_status,
    coalesce(p_detail, '{}'::jsonb) || jsonb_build_object(
      'outcome', cleaned_outcome,
      'is_staff', is_staff
    )
  );

  return rec;
end;
$$;

revoke all on function public.hv_network_advance_introduction(uuid, text, text, jsonb) from public, anon;
grant execute on function public.hv_network_advance_introduction(uuid, text, text, jsonb) to authenticated, service_role;

comment on function public.hv_network_advance_introduction(uuid, text, text, jsonb) is
  'Controlled Network introduction status advancement. Validates membership or staff role, enforces transition matrix, writes audit event. Does not grant broad UPDATE on network_introductions.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820100000','network_command_p1_introduction_status','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820100000_network_command_p1_introduction_status.sql

-- RECOVERY BEGIN 20260820120000_heatmap_conflict_freeze_seed.sql
-- ============================================================
-- Heat-map safety: conflict-aware roll-up, tier-1 freeze, seed
-- ============================================================
-- Follow-up to 20260816120000_auto_heatmap_from_signals.sql
-- 1. Restriction-aware status roll-up (prohibition / restrictive wins)
-- 2. Promote detects open+restricted conflicts → rejected_conflict
-- 3. Corroboration counts null source_id via signal_id
-- 4. Freeze high-stakes markets against auto-flip
-- 5. Correct known-wrong tiers for DE, BR, CO (reviewed overrides)
-- ============================================================

-- 1. Restriction-aware roll-up
-- When any prohibited status is present, prefer it over open statuses.
-- Otherwise prefer most open. Callers that need conflict rejection
-- check both open and restricted presence before calling this.
create or replace function public.roll_up_market_access_status(p_statuses text[])
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text;
  has_prohibited boolean := false;
  has_open boolean := false;
begin
  if p_statuses is null or array_length(p_statuses, 1) is null then
    return null;
  end if;

  foreach s in array p_statuses loop
    if s = 'prohibited' then
      has_prohibited := true;
    elsif s in ('legal_commercial_access', 'medical_limited_trade', 'domestic_only', 'cbd_hemp_only') then
      has_open := true;
    end if;
  end loop;

  -- Restriction wins over expansion when both appear in the same batch
  if has_prohibited then
    return 'prohibited';
  end if;

  foreach s in array array[
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only'
  ] loop
    if s = any (p_statuses) then
      return s;
    end if;
  end loop;

  return null;
end;
$$;

comment on function public.roll_up_market_access_status(text[]) is
  'Pathway events → one overall status. Prohibited wins over open statuses. Prefer most-open among non-prohibited.';

-- 2. Replace promote tick with conflict detection + better corroboration
create or replace function api.promote_market_access_from_signals(
  p_lookback_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_country text;
  v_current text;
  v_frozen boolean;
  v_proposed text;
  v_conf numeric;
  v_primary_count int;
  v_corroboration int;
  v_event_ids uuid[];
  v_signal_ids uuid[];
  v_decision text;
  v_reason text;
  v_applied int := 0;
  v_rejected int := 0;
  v_countries int := 0;
  v_has_prohibited boolean;
  v_has_open boolean;
  r record;
begin
  select enabled into v_enabled
  from public.platform_feature_flags
  where key = 'market_access_auto_apply_enabled';

  if not coalesce(v_enabled, false) then
    return jsonb_build_object(
      'ok', true,
      'applied', 0,
      'rejected', 0,
      'reason', 'auto-apply disabled'
    );
  end if;

  if not pg_try_advisory_xact_lock(hashtext('promote_market_access_from_signals')) then
    return jsonb_build_object('ok', true, 'applied', 0, 'rejected', 0, 'reason', 'lock held');
  end if;

  for r in
    with fresh as (
      select *
      from public.market_access_events e
      where e.processed_at is null
        and e.extracted_at > now() - make_interval(hours => p_lookback_hours)
        and e.confidence >= 0.80
    ),
    by_country as (
      select
        country_iso2,
        array_agg(distinct proposed_status) as statuses,
        max(confidence) filter (where is_primary_source) as max_primary_conf,
        max(confidence) as max_conf,
        count(*) filter (where is_primary_source) as primary_count,
        -- Null source_id: fall back to signal_id so multi-null does not collapse to 1
        count(distinct coalesce(source_id::text, signal_id::text)) as independent_sources,
        array_agg(id) as event_ids,
        array_agg(distinct signal_id) as signal_ids,
        bool_or(proposed_status = 'prohibited') as has_prohibited,
        bool_or(proposed_status in (
          'legal_commercial_access', 'medical_limited_trade',
          'domestic_only', 'cbd_hemp_only'
        )) as has_open,
        -- High-confidence restriction signals present?
        bool_or(direction in ('restricted', 'closed') and confidence >= 0.85) as has_strong_restriction,
        bool_or(direction in ('expanded', 'opened') and confidence >= 0.85) as has_strong_expansion
      from fresh
      group by country_iso2
    )
    select * from by_country
  loop
    v_countries := v_countries + 1;
    v_country := r.country_iso2;
    v_has_prohibited := r.has_prohibited;
    v_has_open := r.has_open;

    select c.regulatory_tier, c.regulatory_tier_auto_frozen
      into v_current, v_frozen
    from public.countries c
    where c.iso_alpha2 = v_country;

    if not found then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), null,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_stale', 'unknown country'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    if v_frozen then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), v_current,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_frozen', 'country auto-frozen'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    -- Conflict: strong expansion AND strong restriction in same window
    if r.has_strong_expansion and r.has_strong_restriction then
      v_decision := 'rejected_conflict';
      v_reason := 'conflicting expansion + restriction signals in lookback window';
      v_proposed := public.roll_up_market_access_status(r.statuses);
      v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
      v_primary_count := r.primary_count;
      v_corroboration := r.independent_sources;
      v_event_ids := r.event_ids;
      v_signal_ids := r.signal_ids;
      v_rejected := v_rejected + 1;

      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, v_proposed, v_current,
        v_conf, v_corroboration, v_primary_count,
        v_event_ids, v_signal_ids, v_decision, v_reason
      );

      update public.market_access_events
         set processed_at = now()
       where id = any (v_event_ids);
      continue;
    end if;

    -- Open + prohibited in same batch without a clear direction winner → conflict
    if v_has_open and v_has_prohibited and not r.has_strong_restriction then
      -- weak prohibition mixed with open → still treat as conflict if conf close
      if coalesce(r.max_conf, 0) < 0.95 then
        v_decision := 'rejected_conflict';
        v_reason := 'open and prohibited statuses without decisive confidence';
        v_proposed := public.roll_up_market_access_status(r.statuses);
        v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
        v_primary_count := r.primary_count;
        v_corroboration := r.independent_sources;
        v_event_ids := r.event_ids;
        v_signal_ids := r.signal_ids;
        v_rejected := v_rejected + 1;

        insert into public.market_access_proposals (
          country_iso2, proposed_status, previous_status,
          aggregate_confidence, corroboration_count, primary_source_count,
          event_ids, signal_ids, decision, decision_reason
        ) values (
          v_country, v_proposed, v_current,
          v_conf, v_corroboration, v_primary_count,
          v_event_ids, v_signal_ids, v_decision, v_reason
        );

        update public.market_access_events
           set processed_at = now()
         where id = any (v_event_ids);
        continue;
      end if;
    end if;

    v_proposed := public.roll_up_market_access_status(r.statuses);
    v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
    v_primary_count := r.primary_count;
    v_corroboration := r.independent_sources;
    v_event_ids := r.event_ids;
    v_signal_ids := r.signal_ids;

    if v_proposed is not null and v_proposed is not distinct from v_current then
      v_decision := 'rejected_stale';
      v_reason := 'status already current';
      v_rejected := v_rejected + 1;
    elsif v_primary_count >= 1 and v_conf >= 0.92 then
      v_decision := 'auto_applied';
      v_reason := format('primary source @ %.2f', v_conf);
    elsif v_corroboration >= 2 and v_conf >= 0.85 then
      v_decision := 'auto_applied';
      v_reason := format('%s sources @ %.2f', v_corroboration, v_conf);
    else
      v_decision := 'rejected_low_confidence';
      v_reason := format(
        'conf=%.2f corroboration=%s primary=%s',
        v_conf, v_corroboration, v_primary_count
      );
      v_rejected := v_rejected + 1;
    end if;

    insert into public.market_access_proposals (
      country_iso2, proposed_status, previous_status,
      aggregate_confidence, corroboration_count, primary_source_count,
      event_ids, signal_ids, decision, decision_reason
    ) values (
      v_country, v_proposed, v_current,
      v_conf, v_corroboration, v_primary_count,
      v_event_ids, v_signal_ids, v_decision, v_reason
    );

    if v_decision = 'auto_applied' and v_proposed is not null then
      update public.countries set
        regulatory_tier = v_proposed,
        regulatory_tier_origin = 'auto',
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_source = 'signal-auto v1.1 ' || to_char(now(), 'YYYY-MM-DD'),
        regulatory_tier_rationale = v_reason,
        regulatory_tier_needs_review = false
      where iso_alpha2 = v_country;

      insert into public.regulatory_tier_audit (
        country_iso2, old_tier, new_tier, origin, trigger_source,
        program_status, actor, note
      ) values (
        v_country, v_current, v_proposed, 'auto', 'signal_pipeline',
        null, 'auto:v1.1', v_reason
      );

      v_applied := v_applied + 1;
    end if;

    update public.market_access_events
       set processed_at = now()
     where id = any (v_event_ids);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'countries_seen', v_countries,
    'applied', v_applied,
    'rejected', v_rejected
  );
end;
$$;

comment on function api.promote_market_access_from_signals(integer) is
  'v1.1: conflict-aware promote. Rejects expansion+restriction conflicts. Restriction-aware roll-up. Null source_id counted via signal_id.';

-- 3. Freeze tier-1 / high-stakes markets until primary-source coverage is solid
update public.countries
   set regulatory_tier_auto_frozen = true
 where iso_alpha2 in (
   'DE', 'CA', 'AU', 'GB', 'US', 'NL', 'IL', 'FR', 'IT', 'ES',
   'PT', 'CH', 'DK', 'NZ', 'BR', 'CO', 'PL', 'CZ', 'MT', 'SE'
 );

-- 4. Correct known-wrong map colours (reviewed overrides; stay frozen)
-- Germany: leading EU medical commercial + CanG framework — not domestic-only
do $$
declare
  v_iso text;
  v_tier text;
  v_note text;
  v_old text;
begin
  for v_iso, v_tier, v_note in
    select * from (values
      ('DE', 'legal_commercial_access',
       'Reviewed correction: Germany is a leading EU medical commercial / import market with adult-use framework (CanG). Not domestic-only.'),
      ('BR', 'medical_limited_trade',
       'Reviewed correction: Brazil is a medical access / import market (ANVISA), not domestic-only or prohibited.'),
      ('CO', 'medical_limited_trade',
       'Reviewed correction: Colombia is medical cultivation/export pathway (INVIMA), not domestic-only.')
    ) as t(iso, tier, note)
  loop
    select regulatory_tier into v_old from public.countries where iso_alpha2 = v_iso;
    if not found then
      continue;
    end if;
    if v_old is not distinct from v_tier then
      continue;
    end if;

    update public.countries set
      regulatory_tier = v_tier,
      regulatory_tier_origin = 'override',
      regulatory_tier_reviewed_at = now(),
      regulatory_tier_needs_review = false,
      regulatory_tier_last_derived_at = now(),
      regulatory_tier_source = 'reviewed seed fix (heatmap v1.1) ' || to_char(now(), 'YYYY-MM-DD'),
      regulatory_tier_rationale = v_note,
      regulatory_tier_auto_frozen = true
    where iso_alpha2 = v_iso;

    insert into public.regulatory_tier_audit (
      country_iso2, old_tier, new_tier, origin, trigger_source,
      program_status, actor, note
    ) values (
      v_iso, v_old, v_tier, 'override', 'manual',
      null, 'seed:heatmap-v1.1', v_note
    );
  end loop;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820120000','heatmap_conflict_freeze_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820120000_heatmap_conflict_freeze_seed.sql

-- RECOVERY BEGIN 20260820130000_hv_pipeline_optimization.sql
-- =============================================================================
-- HV Intelligence Pipeline Optimization — 2026-08-20
-- =============================================================================
-- Additive and replay-safe. This migration does not schedule, unschedule, alter,
-- or enable any cron job.
--
-- The change is intentionally narrow:
--   * extend the current 20260814180000 classifier dispatch with a persisted
--     pre-filter disposition;
--   * add a borderline human-review queue and stage log;
--   * retain the classifier_validation publication gate in promotion.
--
-- Deliberately NOT redefined here:
--   * hv_classify_corpus_harvest() and its recorded retry outcomes;
--   * hv_dedup_assign(), whose authoritative body is the HNSW KNN implementation
--     from 20260814143000 with search_path pg_catalog, public, extensions;
--   * hv_pipeline_tick(), whose authoritative body is 20260730184257 and excludes
--     signals with an unharvested hv_embed_jobs row;
--   * hv_quality_promote_tick();
--   * the existing idx_signals_embedding_1024_hnsw index.
--
-- No second HNSW index is created. No fail-open evaluation helper is introduced:
-- classifier_validation remains the mechanical publication authority.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Borderline human-review queue
-- ---------------------------------------------------------------------------
create table if not exists public.hv_signal_review_queue (
  signal_id text primary key references public.signals(id) on delete cascade,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'skipped')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists hv_signal_review_queue_status_idx
  on public.hv_signal_review_queue (status, created_at desc);

alter table public.hv_signal_review_queue enable row level security;

drop policy if exists hv_signal_review_queue_service_all
  on public.hv_signal_review_queue;
drop policy if exists hv_signal_review_queue_service_select
  on public.hv_signal_review_queue;
create policy hv_signal_review_queue_service_select
  on public.hv_signal_review_queue
  for select
  to service_role
  using (true);

revoke all on table public.hv_signal_review_queue
  from public, anon, authenticated, service_role;
grant select on table public.hv_signal_review_queue to service_role;

comment on table public.hv_signal_review_queue is
  'Internal borderline-classification review queue. Direct service_role access is read-only; '
  'approval and rejection are authoritative through the locked SECURITY DEFINER RPCs.';

-- ---------------------------------------------------------------------------
-- 2. Persisted pre-filter dispositions
-- ---------------------------------------------------------------------------
create table if not exists public.hv_classify_prefilter_dispositions (
  signal_id text primary key references public.signals(id) on delete cascade,
  eligible boolean not null,
  disposition text not null check (
    disposition in (
      'eligible',
      'eligible_untranslated_non_english',
      'eligible_language_unknown',
      'filtered_too_short',
      'filtered_navigation',
      'filtered_excluded_domain',
      'filtered_low_relevance'
    )
  ),
  filter_version text not null,
  input_hash text not null,
  translated_text_used boolean not null default false,
  language text,
  evaluated_at timestamptz not null default now()
);

create index if not exists hv_classify_prefilter_disposition_idx
  on public.hv_classify_prefilter_dispositions
  (eligible, disposition, evaluated_at desc);

alter table public.hv_classify_prefilter_dispositions enable row level security;

drop policy if exists hv_classify_prefilter_dispositions_service_select
  on public.hv_classify_prefilter_dispositions;
create policy hv_classify_prefilter_dispositions_service_select
  on public.hv_classify_prefilter_dispositions
  for select
  to service_role
  using (true);

revoke all on table public.hv_classify_prefilter_dispositions
  from public, anon, authenticated, service_role;
grant select on table public.hv_classify_prefilter_dispositions to service_role;

comment on table public.hv_classify_prefilter_dispositions is
  'Explicit, versioned disposition for every signal evaluated by the classifier pre-filter. '
  'The input hash makes a translated-text update eligible for re-evaluation.';

-- ---------------------------------------------------------------------------
-- 3. Internal stage observability
-- ---------------------------------------------------------------------------
create table if not exists public.hv_pipeline_stage_log (
  id bigserial primary key,
  stage text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hv_pipeline_stage_log_stage_created_idx
  on public.hv_pipeline_stage_log (stage, created_at desc);

alter table public.hv_pipeline_stage_log enable row level security;

drop policy if exists hv_pipeline_stage_log_service_select
  on public.hv_pipeline_stage_log;
create policy hv_pipeline_stage_log_service_select
  on public.hv_pipeline_stage_log
  for select
  to service_role
  using (true);

revoke all on table public.hv_pipeline_stage_log
  from public, anon, authenticated, service_role;
grant select on table public.hv_pipeline_stage_log to service_role;

comment on table public.hv_pipeline_stage_log is
  'Internal pipeline counters. Browser roles have no privileges; service_role is read-only.';

-- ---------------------------------------------------------------------------
-- 4. Cheap pre-filter decision
-- ---------------------------------------------------------------------------
-- Remove the three-argument draft overload if an ephemeral branch applied the
-- earlier PR head. The repaired function has language/translation context so
-- untranslated non-English inputs can fail open instead of losing recall.
drop function if exists public.hv_prefilter_signal(text, text, text);

create or replace function public.hv_prefilter_signal_disposition(
  p_headline text,
  p_summary text,
  p_url text default null,
  p_language text default null,
  p_translated boolean default false
)
returns text
language plpgsql
stable
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_headline text := lower(btrim(coalesce(p_headline, '')));
  v_summary text := lower(btrim(coalesce(p_summary, '')));
  v_combined text := lower(btrim(coalesce(p_headline, '') || ' ' || coalesce(p_summary, '')));
  v_authority text;
  v_host text;
  v_language text := lower(split_part(coalesce(nullif(btrim(p_language), ''), 'unknown'), '-', 1));
begin
  if coalesce(btrim(p_url), '') <> '' then
    v_authority := split_part(
      regexp_replace(btrim(p_url), '^[a-z][a-z0-9+.-]*://', '', 'i'),
      '/',
      1
    );
    v_host := lower(regexp_replace(v_authority, '^.*@', ''));
    v_host := regexp_replace(v_host, ':[0-9]+$', '');
    v_host := regexp_replace(v_host, '^www\.', '');

    if exists (
      select 1
      from public.excluded_source_domains d
      where v_host = lower(regexp_replace(d.domain, '^www\.', ''))
         or v_host like '%.' || lower(regexp_replace(d.domain, '^www\.', ''))
    ) then
      return 'filtered_excluded_domain';
    end if;
  end if;

  -- PostgreSQL ARE does not treat \b as a word boundary. Explicit
  -- non-alphanumeric/end boundaries keep this branch executable and testable.
  if (
    v_headline ~ '(^|[^[:alnum:]_])(cookie(s)?|subscribe|sign[[:space:]]+in|log[[:space:]]+in|register|privacy[[:space:]]+policy|terms[[:space:]]+of[[:space:]]+use|all[[:space:]]+rights[[:space:]]+reserved)([^[:alnum:]_]|$)'
    or (
      v_headline ~ '^(home|menu|search|contact|about|faq)([^[:alnum:]_]|$)'
      and length(v_headline) < 80
    )
  ) then
    return 'filtered_navigation';
  end if;

  -- A terse headline can still be substantive when its summary carries the
  -- meaning. Filter only empty/near-empty combined inputs.
  if v_headline = '' or length(regexp_replace(v_combined, '[[:space:]]+', '', 'g')) < 12 then
    return 'filtered_too_short';
  end if;

  -- The classifier is language-agnostic; a predominantly English keyword filter
  -- is not. Until translation exists, explicitly fail open for known non-English
  -- rows. Unknown-language rows also fail open so missing metadata cannot become
  -- a hidden publication-recall loss.
  if not coalesce(p_translated, false)
     and v_language not in ('en', 'eng', 'unknown', 'und', '') then
    return 'eligible_untranslated_non_english';
  end if;

  if not coalesce(p_translated, false)
     and v_language in ('unknown', 'und', '') then
    return 'eligible_language_unknown';
  end if;

  -- Relevance filtering is applied only to English or translated text. The
  -- multilingual terms are defense in depth; translated rows normally match the
  -- English vocabulary.
  if v_combined !~ '(cannabis|marijuana|marihuana|maconha|hemp|chanvre|cáñamo|กัญชา|thc|cbd|gmp|gacp|licen[cs]e|regulat|ministry|minister|agency|fda|bfarm|health[[:space:]]+canada|ema|quota|import|export|cultivat|pharma|medicin|patient|dispensar|prescri|narcotic|drug|legalis|legaliz|decriminal|parliament|senate|bill|court|policy|market|sales|clinical[[:space:]]+trial)' then
    return 'filtered_low_relevance';
  end if;

  return 'eligible';
end
$function$;

create or replace function public.hv_prefilter_signal(
  p_headline text,
  p_summary text,
  p_url text default null,
  p_language text default null,
  p_translated boolean default false
)
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $function$
  select public.hv_prefilter_signal_disposition(
    p_headline,
    p_summary,
    p_url,
    p_language,
    p_translated
  ) like 'eligible%';
$function$;

revoke all on function public.hv_prefilter_signal_disposition(text, text, text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.hv_prefilter_signal(text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.hv_prefilter_signal_disposition(text, text, text, text, boolean)
  to service_role;
grant execute on function public.hv_prefilter_signal(text, text, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 5. Current safe classifier dispatch + pre-filter
-- ---------------------------------------------------------------------------
-- This is the 20260814180000 body with its budget accounting, five-attempt
-- retirement, unresolved manual-review exclusion, and broad live search_path
-- retained. The only selection change is the persisted pre-filter disposition.
create or replace function public.hv_classify_corpus_dispatch(
  p_limit integer default 100,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare
  r record;
  v_rid bigint;
  n int := 0;
  v_ids text[];
  v_evaluated int := 0;
  v_filtered int := 0;
  v_started_at timestamptz := clock_timestamp();
  c_max_attempts constant int := 5;
  c_filter_version constant text := 'hv-prefilter/v1-translated';
  c_prefilter_scan constant int := 400;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  -- Preserve the bounded retry/manual-review retirement from 20260814180000.
  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select
    s.id,
    coalesce(nullif(btrim(s.title_en), ''), s.headline),
    coalesce(
      nullif(btrim(s.summary_en), ''),
      nullif(btrim(left(s.summary, 1000)), ''),
      nullif(btrim(s.title_en), ''),
      s.headline
    ),
    'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days || ' days')::interval
    and (
      select count(*)
      from public.hv_classify_jobs k
      where k.signal_id = s.id
        and k.outcome is not null
        and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  -- Evaluate a bounded candidate window. The exact coalesced h/sm values sent
  -- to hv-classify are the values evaluated here. A changed translation changes
  -- input_hash and causes re-evaluation.
  with base as (
    select
      s.id,
      s.created_at,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm,
      s.url,
      coalesce(
        nullif(btrim(s.lang_detected), ''),
        nullif(btrim(s.lang), ''),
        'unknown'
      ) as language,
      (
        nullif(btrim(s.title_en), '') is not null
        or nullif(btrim(s.summary_en), '') is not null
      ) as translated_text_used
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days || ' days')::interval
      and not exists (
        select 1
        from public.hv_classify_jobs j
        where j.signal_id = s.id
          and not j.harvested
      )
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = s.id
          and not q.resolved
      )
  ),
  fingerprinted as (
    select
      b.*,
      md5(concat_ws(
        chr(31),
        coalesce(b.h, ''),
        coalesce(b.sm, ''),
        coalesce(b.url, ''),
        coalesce(b.language, ''),
        b.translated_text_used::text
      )) as input_hash
    from base b
  ),
  candidates as (
    select f.*
    from fingerprinted f
    left join public.hv_classify_prefilter_dispositions d
      on d.signal_id = f.id
    where d.signal_id is null
       or d.filter_version <> c_filter_version
       or d.input_hash is distinct from f.input_hash
    order by f.created_at desc
    limit least(c_prefilter_scan, greatest(p_limit * 5, p_limit))
  ),
  evaluated as (
    select
      c.*,
      public.hv_prefilter_signal_disposition(
        c.h,
        c.sm,
        c.url,
        c.language,
        c.translated_text_used
      ) as disposition
    from candidates c
  )
  insert into public.hv_classify_prefilter_dispositions (
    signal_id,
    eligible,
    disposition,
    filter_version,
    input_hash,
    translated_text_used,
    language,
    evaluated_at
  )
  select
    e.id,
    e.disposition like 'eligible%',
    e.disposition,
    c_filter_version,
    e.input_hash,
    e.translated_text_used,
    e.language,
    clock_timestamp()
  from evaluated e
  on conflict (signal_id) do update
    set eligible = excluded.eligible,
        disposition = excluded.disposition,
        filter_version = excluded.filter_version,
        input_hash = excluded.input_hash,
        translated_text_used = excluded.translated_text_used,
        language = excluded.language,
        evaluated_at = excluded.evaluated_at;

  get diagnostics v_evaluated = row_count;

  select count(*)
    into v_filtered
  from public.hv_classify_prefilter_dispositions d
  where d.filter_version = c_filter_version
    and not d.eligible
    and d.evaluated_at >= v_started_at;

  -- Select before consuming budget, then charge exactly the eligible rows that
  -- will dispatch. This preserves the August budget repair.
  with base as (
    select
      s.id,
      s.created_at,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm,
      s.url,
      coalesce(
        nullif(btrim(s.lang_detected), ''),
        nullif(btrim(s.lang), ''),
        'unknown'
      ) as language,
      (
        nullif(btrim(s.title_en), '') is not null
        or nullif(btrim(s.summary_en), '') is not null
      ) as translated_text_used
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days || ' days')::interval
      and not exists (
        select 1
        from public.hv_classify_jobs j
        where j.signal_id = s.id
          and not j.harvested
      )
      and not exists (
        select 1
        from public.intel_classify_review_queue q
        where q.signal_id = s.id
          and not q.resolved
      )
  ),
  fingerprinted as (
    select
      b.*,
      md5(concat_ws(
        chr(31),
        coalesce(b.h, ''),
        coalesce(b.sm, ''),
        coalesce(b.url, ''),
        coalesce(b.language, ''),
        b.translated_text_used::text
      )) as input_hash
    from base b
  )
  select array_agg(x.id order by x.created_at desc)
    into v_ids
  from (
    select f.id, f.created_at
    from fingerprinted f
    join public.hv_classify_prefilter_dispositions d
      on d.signal_id = f.id
     and d.filter_version = c_filter_version
     and d.input_hash = f.input_hash
     and d.eligible
    order by f.created_at desc
    limit p_limit
  ) x;

  if v_ids is null then
    insert into public.hv_pipeline_stage_log(stage, metrics)
    values (
      'classify_dispatch',
      jsonb_build_object(
        'dispatched', 0,
        'prefilter_evaluated', v_evaluated,
        'prefilter_filtered', v_filtered,
        'filter_version', c_filter_version
      )
    );
    return 0;
  end if;

  p_limit := public.hv_consume_dispatch_budget(
    'classify',
    array_length(v_ids, 1)
  );
  if p_limit <= 0 then
    insert into public.hv_pipeline_stage_log(stage, metrics)
    values (
      'classify_dispatch',
      jsonb_build_object(
        'dispatched', 0,
        'budget_blocked', true,
        'prefilter_evaluated', v_evaluated,
        'prefilter_filtered', v_filtered,
        'filter_version', c_filter_version
      )
    );
    return 0;
  end if;
  v_ids := v_ids[1:least(p_limit, array_length(v_ids, 1))];

  for r in
    select
      s.id,
      coalesce(nullif(btrim(s.title_en), ''), s.headline) as h,
      coalesce(
        nullif(btrim(s.summary_en), ''),
        nullif(btrim(left(s.summary, 1000)), ''),
        nullif(btrim(s.title_en), ''),
        s.headline
      ) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'hv_edge_anon_key'
          limit 1
        )
      ),
      body := jsonb_build_object(
        'text',
        jsonb_build_object('headline', r.h, 'summary', r.sm)
      ),
      timeout_milliseconds := 30000
    ) into v_rid;

    insert into public.hv_classify_jobs(request_id, signal_id)
    values (v_rid, r.id)
    on conflict do nothing;

    n := n + 1;
  end loop;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'classify_dispatch',
    jsonb_build_object(
      'dispatched', n,
      'prefilter_evaluated', v_evaluated,
      'prefilter_filtered', v_filtered,
      'filter_version', c_filter_version
    )
  );

  return n;
end
$function$;

-- Preserve the current postgres-only ACL from 20260814180000. CREATE OR REPLACE
-- carries that ACL forward; no service_role grant is added.
revoke all on function public.hv_classify_corpus_dispatch(integer, integer)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Promotion: classifier gate + authoritative review dispositions
-- ---------------------------------------------------------------------------
create or replace function public.hv_promote_signals(
  p_min_conf numeric default 0.65
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  v_queued int;
  v_floor numeric := greatest(coalesce(p_min_conf, 0.65), 0.65);
begin
  -- Queue only borderline rows. Existing approved/rejected/skipped decisions
  -- are never reopened by an automatic run.
  insert into public.hv_signal_review_queue (
    signal_id,
    quality_label,
    quality_confidence,
    content_type,
    impact,
    reason,
    status
  )
  select
    s.id,
    s.quality_label,
    s.quality_confidence,
    s.content_type,
    s.impact,
    'below_confidence_floor',
    'pending'
  from public.signals s
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= 0.50
    and s.quality_confidence < v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\.)?([^/]+).*',
      '\2'
    ) not in (select domain from public.excluded_source_domains)
  on conflict (signal_id) do update
    set quality_label = excluded.quality_label,
        quality_confidence = excluded.quality_confidence,
        content_type = excluded.content_type,
        impact = excluded.impact,
        reason = excluded.reason
  where public.hv_signal_review_queue.status = 'pending';

  get diagnostics v_queued = row_count;

  -- Auto-promotion retains the classifier_validation publication gate. Pending,
  -- rejected, and skipped human dispositions are authoritative and block it.
  update public.signals s
  set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1
      from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and not exists (
      select 1
      from public.hv_signal_review_queue q
      where q.signal_id = s.id
        and q.status in ('pending', 'rejected', 'skipped')
    )
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\.)?([^/]+).*',
      '\2'
    ) not in (select domain from public.excluded_source_domains);

  get diagnostics n = row_count;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'promote',
    jsonb_build_object(
      'promoted', n,
      'min_conf', v_floor,
      'queued_borderline', v_queued,
      'classifier_validation_gate', 'required'
    )
  );

  return n;
end
$function$;

revoke all on function public.hv_promote_signals(numeric)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Preservation boundary
-- ---------------------------------------------------------------------------
-- No CREATE OR REPLACE follows for hv_dedup_assign, hv_pipeline_tick, or
-- hv_quality_promote_tick. No CREATE INDEX follows. Their latest pre-existing
-- migration definitions remain authoritative, including HNSW KNN, extensions
-- search_path, pending-embedding exclusion, and current cron call behavior.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820130000','hv_pipeline_optimization','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820130000_hv_pipeline_optimization.sql

-- RECOVERY BEGIN 20260820131000_hv_review_queue_resolve.sql
-- Atomic, authoritative resolve helpers for hv_signal_review_queue.
-- Depends on 20260820130000_hv_pipeline_optimization.sql.
--
-- A queue decision and its signals row mutation occur in the same transaction.
-- The pending queue row is locked before either write. Approval/rejection of an
-- arbitrary signal ID is impossible, repeat decisions return false, and an
-- existing human disposition is never overwritten.

create or replace function public.hv_review_queue_approve(
  p_signal_id text,
  p_reviewer text default 'human:operator'
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_signal_id text;
  v_reviewer text := btrim(coalesce(p_reviewer, ''));
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_reviewer = '' then
    raise exception 'p_reviewer must be non-empty'
      using errcode = '22023';
  end if;
  if v_reviewer not like 'human:%' then
    v_reviewer := 'human:' || v_reviewer;
  end if;

  select q.signal_id
    into v_signal_id
  from public.hv_signal_review_queue q
  where q.signal_id = p_signal_id
    and q.status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  update public.signals s
  set
    reviewed = true,
    reviewed_by = v_reviewer,
    reviewed_at = v_now
  where s.id = v_signal_id
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception
      'signal % already has an authoritative human disposition',
      v_signal_id
      using errcode = '55000';
  end if;

  update public.hv_signal_review_queue q
  set
    status = 'approved',
    reviewed_at = v_now,
    reviewed_by = v_reviewer
  where q.signal_id = v_signal_id
    and q.status = 'pending';

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'pending queue row disappeared for signal %', v_signal_id
      using errcode = '55000';
  end if;

  return true;
end
$function$;

create or replace function public.hv_review_queue_reject(
  p_signal_id text,
  p_reviewer text default 'human:operator',
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_signal_id text;
  v_reviewer text := btrim(coalesce(p_reviewer, ''));
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_reviewer = '' then
    raise exception 'p_reviewer must be non-empty'
      using errcode = '22023';
  end if;
  if v_reviewer not like 'human:%' then
    v_reviewer := 'human:' || v_reviewer;
  end if;

  select q.signal_id
    into v_signal_id
  from public.hv_signal_review_queue q
  where q.signal_id = p_signal_id
    and q.status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  -- A deliberate rejection may demote an automatic promotion that raced the
  -- queue decision, but never overwrites another human's decision.
  update public.signals s
  set
    reviewed = false,
    reviewed_by = v_reviewer || ':rejected',
    reviewed_at = v_now
  where s.id = v_signal_id
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%');

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception
      'signal % already has an authoritative human disposition',
      v_signal_id
      using errcode = '55000';
  end if;

  update public.hv_signal_review_queue q
  set
    status = 'rejected',
    reason = coalesce(nullif(btrim(p_reason), ''), q.reason, 'operator_rejected'),
    reviewed_at = v_now,
    reviewed_by = v_reviewer
  where q.signal_id = v_signal_id
    and q.status = 'pending';

  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'pending queue row disappeared for signal %', v_signal_id
      using errcode = '55000';
  end if;

  return true;
end
$function$;

create or replace function public.hv_review_queue_list_pending(
  p_limit integer default 50
)
returns table (
  signal_id text,
  quality_label text,
  quality_confidence numeric,
  content_type text,
  impact text,
  reason text,
  headline text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select
    q.signal_id,
    q.quality_label,
    q.quality_confidence,
    q.content_type,
    q.impact,
    q.reason,
    coalesce(nullif(btrim(s.title_en), ''), s.headline) as headline,
    q.created_at
  from public.hv_signal_review_queue q
  join public.signals s
    on s.id = q.signal_id
  where q.status = 'pending'
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
  order by q.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$function$;

revoke all on function public.hv_review_queue_approve(text, text)
  from public, anon, authenticated;
revoke all on function public.hv_review_queue_reject(text, text, text)
  from public, anon, authenticated;
revoke all on function public.hv_review_queue_list_pending(integer)
  from public, anon, authenticated;

grant execute on function public.hv_review_queue_approve(text, text)
  to service_role;
grant execute on function public.hv_review_queue_reject(text, text, text)
  to service_role;
grant execute on function public.hv_review_queue_list_pending(integer)
  to service_role;

comment on function public.hv_review_queue_approve(text, text) is
  'Locks and approves one pending queue row atomically; service_role only.';
comment on function public.hv_review_queue_reject(text, text, text) is
  'Locks and rejects one pending queue row atomically, writing a human rejection marker that blocks auto-promotion; service_role only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820131000','hv_review_queue_resolve','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820131000_hv_review_queue_resolve.sql

-- RECOVERY BEGIN 20260820140000_seed_subnational_regulatory_tiers.sql
-- Seed the 88 subnational geometries rendered by the Harbourview globe.
-- Identifiers and centroids mirror the four data/globe geometry fixtures exactly.
-- Idempotent by countries.iso_alpha2; live DB rows override static app defaults at runtime.

with seed(country_name, iso_alpha2, iso_alpha3, lat, lng, regulatory_tier) as (
  values
    ('Alaska', 'US-AK', 'USA-AK', 61.506, -154.104, 'domestic_only'),
    ('Alabama', 'US-AL', 'USA-AL', 32.628, -86.704, 'medical_limited_trade'),
    ('Arkansas', 'US-AR', 'USA-AR', 34.756, -92.154, 'medical_limited_trade'),
    ('Arizona', 'US-AZ', 'USA-AZ', 34.164, -111.941, 'domestic_only'),
    ('California', 'US-CA', 'USA-CA', 37.267, -119.248, 'domestic_only'),
    ('Colorado', 'US-CO', 'USA-CO', 39.001, -105.53, 'domestic_only'),
    ('Connecticut', 'US-CT', 'USA-CT', 41.524, -72.759, 'domestic_only'),
    ('District of Columbia', 'US-DC', 'USA-DC', 38.909, -77.027, 'domestic_only'),
    ('Delaware', 'US-DE', 'USA-DE', 39.149, -75.41, 'domestic_only'),
    ('Florida', 'US-FL', 'USA-FL', 27.772, -83.824, 'medical_limited_trade'),
    ('Georgia', 'US-GA', 'USA-GA', 32.686, -83.248, 'medical_limited_trade'),
    ('Hawaii', 'US-HI', 'USA-HI', 23.593, -166.097, 'medical_limited_trade'),
    ('Iowa', 'US-IA', 'USA-IA', 41.941, -93.388, 'cbd_hemp_only'),
    ('Idaho', 'US-ID', 'USA-ID', 45.497, -114.126, 'prohibited'),
    ('Illinois', 'US-IL', 'USA-IL', 39.753, -89.27, 'domestic_only'),
    ('Indiana', 'US-IN', 'USA-IN', 39.774, -86.442, 'cbd_hemp_only'),
    ('Kansas', 'US-KS', 'USA-KS', 38.501, -98.321, 'cbd_hemp_only'),
    ('Kentucky', 'US-KY', 'USA-KY', 37.814, -85.763, 'medical_limited_trade'),
    ('Louisiana', 'US-LA', 'USA-LA', 30.999, -91.428, 'medical_limited_trade'),
    ('Massachusetts', 'US-MA', 'USA-MA', 42.066, -71.721, 'domestic_only'),
    ('Maryland', 'US-MD', 'USA-MD', 38.838, -77.263, 'domestic_only'),
    ('Maine', 'US-ME', 'USA-ME', 45.267, -69.036, 'domestic_only'),
    ('Michigan', 'US-MI', 'USA-MI', 45.002, -86.275, 'domestic_only'),
    ('Minnesota', 'US-MN', 'USA-MN', 46.435, -93.362, 'domestic_only'),
    ('Missouri', 'US-MO', 'USA-MO', 38.309, -92.444, 'domestic_only'),
    ('Mississippi', 'US-MS', 'USA-MS', 32.597, -89.871, 'medical_limited_trade'),
    ('Montana', 'US-MT', 'USA-MT', 46.695, -110.027, 'domestic_only'),
    ('North Carolina', 'US-NC', 'USA-NC', 35.244, -79.891, 'cbd_hemp_only'),
    ('North Dakota', 'US-ND', 'USA-ND', 47.468, -100.295, 'medical_limited_trade'),
    ('Nebraska', 'US-NE', 'USA-NE', 41.501, -99.688, 'medical_limited_trade'),
    ('New Hampshire', 'US-NH', 'USA-NH', 43.998, -71.643, 'medical_limited_trade'),
    ('New Jersey', 'US-NJ', 'USA-NJ', 40.149, -74.717, 'domestic_only'),
    ('New Mexico', 'US-NM', 'USA-NM', 34.164, -106.024, 'domestic_only'),
    ('Nevada', 'US-NV', 'USA-NV', 38.496, -117.021, 'domestic_only'),
    ('New York', 'US-NY', 'USA-NY', 42.762, -75.833, 'domestic_only'),
    ('Ohio', 'US-OH', 'USA-OH', 40.37, -82.67, 'domestic_only'),
    ('Oklahoma', 'US-OK', 'USA-OK', 35.325, -98.72, 'medical_limited_trade'),
    ('Oregon', 'US-OR', 'USA-OR', 44.113, -120.508, 'domestic_only'),
    ('Pennsylvania', 'US-PA', 'USA-PA', 41.131, -77.61, 'medical_limited_trade'),
    ('Rhode Island', 'US-RI', 'USA-RI', 41.674, -71.537, 'domestic_only'),
    ('South Carolina', 'US-SC', 'USA-SC', 33.62, -80.96, 'cbd_hemp_only'),
    ('South Dakota', 'US-SD', 'USA-SD', 44.227, -100.245, 'medical_limited_trade'),
    ('Tennessee', 'US-TN', 'USA-TN', 35.841, -85.976, 'cbd_hemp_only'),
    ('Texas', 'US-TX', 'USA-TX', 31.186, -100.099, 'medical_limited_trade'),
    ('Utah', 'US-UT', 'USA-UT', 39.501, -111.544, 'medical_limited_trade'),
    ('Virginia', 'US-VA', 'USA-VA', 38.001, -79.447, 'domestic_only'),
    ('Vermont', 'US-VT', 'USA-VT', 43.869, -72.468, 'domestic_only'),
    ('Washington', 'US-WA', 'USA-WA', 47.292, -120.803, 'domestic_only'),
    ('Wisconsin', 'US-WI', 'USA-WI', 44.901, -89.581, 'cbd_hemp_only'),
    ('West Virginia', 'US-WV', 'USA-WV', 38.928, -80.173, 'medical_limited_trade'),
    ('Wyoming', 'US-WY', 'USA-WY', 43.001, -107.537, 'cbd_hemp_only'),
    ('Alberta', 'CA-AB', 'CAN-AB', 52.88, -115.782, 'domestic_only'),
    ('British Columbia', 'CA-BC', 'CAN-BC', 52.429, -126.579, 'domestic_only'),
    ('Manitoba', 'CA-MB', 'CAN-MB', 55.876, -95.858, 'domestic_only'),
    ('New Brunswick', 'CA-NB', 'CAN-NB', 46.531, -66.459, 'domestic_only'),
    ('Newfoundland and Labrador', 'CA-NL', 'CAN-NL', 52.722, -59.579, 'domestic_only'),
    ('Northwest Territories', 'CA-NT', 'CAN-NT', 70.704, -121.267, 'domestic_only'),
    ('Nova Scotia', 'CA-NS', 'CAN-NS', 45.274, -62.724, 'domestic_only'),
    ('Nunavut', 'CA-NU', 'CAN-NU', 71.107, -87.815, 'domestic_only'),
    ('Ontario', 'CA-ON', 'CAN-ON', 48.789, -83.693, 'domestic_only'),
    ('Prince Edward Island', 'CA-PE', 'CAN-PE', 46.396, -63.324, 'domestic_only'),
    ('Québec', 'CA-QC', 'CAN-QC', 54.023, -69.327, 'domestic_only'),
    ('Saskatchewan', 'CA-SK', 'CAN-SK', 54.381, -105.898, 'domestic_only'),
    ('Yukon', 'CA-YT', 'CAN-YT', 64.003, -132.173, 'domestic_only'),
    ('Sachsen', 'DE-SN', 'DE-SN', 51.005, 13.46, 'domestic_only'),
    ('Bayern', 'DE-BY', 'DE-BY', 49.006, 11.397, 'domestic_only'),
    ('Rheinland-Pfalz', 'DE-RP', 'DE-RP', 49.868, 7.37, 'domestic_only'),
    ('Saarland', 'DE-SL', 'DE-SL', 49.403, 6.866, 'domestic_only'),
    ('Schleswig-Holstein', 'DE-SH', 'DE-SH', 54.132, 9.846, 'domestic_only'),
    ('Niedersachsen', 'DE-NI', 'DE-NI', 52.775, 8.862, 'domestic_only'),
    ('Nordrhein-Westfalen', 'DE-NW', 'DE-NW', 51.615, 7.657, 'domestic_only'),
    ('Baden-Württemberg', 'DE-BW', 'DE-BW', 48.59, 9.003, 'domestic_only'),
    ('Brandenburg', 'DE-BB', 'DE-BB', 52.816, 12.921, 'domestic_only'),
    ('Mecklenburg-Vorpommern', 'DE-MV', 'DE-MV', 53.753, 12.565, 'domestic_only'),
    ('Hamburg', 'DE-HH', 'DE-HH', 53.559, 10.034, 'domestic_only'),
    ('Hessen', 'DE-HE', 'DE-HE', 50.61, 8.959, 'domestic_only'),
    ('Thüringen', 'DE-TH', 'DE-TH', 50.905, 11.098, 'domestic_only'),
    ('Sachsen-Anhalt', 'DE-ST', 'DE-ST', 51.934, 11.68, 'domestic_only'),
    ('Berlin', 'DE-BE', 'DE-BE', 52.513, 13.421, 'domestic_only'),
    ('Bremen', 'DE-HB', 'DE-HB', 53.121, 8.743, 'domestic_only'),
    ('Western Australia', 'AU-WA', 'AU-WA', -25.848, 121.646, 'medical_limited_trade'),
    ('Northern Territory', 'AU-NT', 'AU-NT', -20.103, 133.78, 'medical_limited_trade'),
    ('South Australia', 'AU-SA', 'AU-SA', -29.65, 135.783, 'medical_limited_trade'),
    ('Queensland', 'AU-QLD', 'AU-QLD', -23.136, 144.778, 'medical_limited_trade'),
    ('New South Wales', 'AU-NSW', 'AU-NSW', -32.475, 146.781, 'medical_limited_trade'),
    ('Victoria', 'AU-VIC', 'AU-VIC', -37.008, 144.75, 'medical_limited_trade'),
    ('Tasmania', 'AU-TAS', 'AU-TAS', -42.138, 146.603, 'medical_limited_trade'),
    ('Australian Capital Territory', 'AU-ACT', 'AU-ACT', -35.462, 148.983, 'medical_limited_trade')
),
prepared as (
  select
    country_name,
    'subnational-' || lower(iso_alpha2) as country_slug,
    iso_alpha2,
    iso_alpha3,
    lat,
    lng,
    regulatory_tier,
    case
      when iso_alpha2 like 'US-%' and regulatory_tier = 'domestic_only'
        then 'State/District permits adult non-medical cannabis; interstate commercial trade remains federally constrained.'
      when iso_alpha2 like 'US-%' and regulatory_tier = 'medical_limited_trade'
        then 'Comprehensive state medical cannabis access without state adult-use legalization.'
      when iso_alpha2 like 'US-%' and regulatory_tier = 'cbd_hemp_only'
        then 'Limited low-THC/CBD access only; no comprehensive medical or adult-use cannabis program.'
      when iso_alpha2 = 'US-ID'
        then 'No state medical or adult-use cannabis program.'
      when iso_alpha2 like 'CA-%'
        then 'Federal adult-use and medical legality applies within the province/territory; tier represents domestic market access.'
      when iso_alpha2 like 'DE-%'
        then 'Federal CanG adult-use framework and medical legality apply within the Land; tier represents domestic access.'
      when iso_alpha2 like 'AU-%'
        then 'Medical cannabis is legal under the national/state framework; non-medical commercial access remains prohibited.'
    end as regulatory_tier_rationale,
    case
      when iso_alpha2 like 'US-%' then 'NCSL State Medical Cannabis Laws (2026-06-01)'
      when iso_alpha2 like 'CA-%' then 'cc_jurisdiction_briefings Canada subnational seed (2026-06-22)'
      when iso_alpha2 like 'DE-%' then 'cc_jurisdiction_briefings Germany subnational seed (2026-06-22)'
      when iso_alpha2 like 'AU-%' then 'cc_jurisdiction_briefings Australia subnational seed (2026-06-22)'
    end as regulatory_tier_source
  from seed
)
insert into public.countries (
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  lat,
  lng,
  regulatory_tier,
  regulatory_tier_rationale,
  regulatory_tier_source
)
select
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  lat,
  lng,
  regulatory_tier,
  regulatory_tier_rationale,
  regulatory_tier_source
from prepared
on conflict (iso_alpha2) do update set
  country_name = excluded.country_name,
  country_slug = excluded.country_slug,
  iso_alpha3 = excluded.iso_alpha3,
  lat = excluded.lat,
  lng = excluded.lng,
  regulatory_tier = excluded.regulatory_tier,
  regulatory_tier_rationale = excluded.regulatory_tier_rationale,
  regulatory_tier_source = excluded.regulatory_tier_source,
  updated_at = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820140000','seed_subnational_regulatory_tiers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820140000_seed_subnational_regulatory_tiers.sql

-- RECOVERY BEGIN 20260820235959_replay_talent_job_board.sql
-- Migration: Harbourview Talent Job Board foundation
-- Date: 2026-08-21
-- Additive only. Does not touch supplier_profiles, clinical tables, or counterparty records.
-- organization_id is optional UUID (no hard FK) so migration applies even if org table naming differs.

-- ---------------------------------------------------------------------------
-- 1. talent_opportunities
-- ---------------------------------------------------------------------------
create table if not exists public.talent_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  company_name text not null default '',
  company_location text,
  title text not null check (char_length(title) between 3 and 200),
  slug text not null,
  description text not null,
  requirements text,
  benefits text,
  role_family text not null,
  seniority text check (seniority is null or seniority in (
    'entry', 'mid', 'senior', 'director', 'executive'
  )),
  employment_type text not null default 'full_time' check (employment_type in (
    'full_time', 'part_time', 'contract', 'temporary', 'internship'
  )),
  location_type text not null default 'onsite' check (location_type in (
    'onsite', 'hybrid', 'remote'
  )),
  primary_jurisdiction text,
  jurisdictions text[] not null default '{}',
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  salary_currency text not null default 'EUR',
  salary_period text not null default 'year' check (salary_period in (
    'year', 'month', 'hour', 'day'
  )),
  application_url text,
  application_email text,
  status text not null default 'draft' check (status in (
    'draft', 'pending_review', 'published', 'closed', 'archived'
  )),
  is_featured boolean not null default false,
  published_at timestamptz,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  source text not null default 'manual' check (source in (
    'manual', 'import', 'partner', 'api'
  )),
  view_count integer not null default 0 check (view_count >= 0),
  application_count integer not null default 0 check (application_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint talent_opportunities_salary_range_check
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

create unique index if not exists talent_opportunities_slug_active_idx
  on public.talent_opportunities (slug)
  where status <> 'archived';

create index if not exists talent_opportunities_status_jurisdiction_idx
  on public.talent_opportunities (status, primary_jurisdiction);

create index if not exists talent_opportunities_role_family_status_idx
  on public.talent_opportunities (role_family, status);

create index if not exists talent_opportunities_organization_id_idx
  on public.talent_opportunities (organization_id)
  where organization_id is not null;

create index if not exists talent_opportunities_published_at_idx
  on public.talent_opportunities (published_at desc nulls last)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- 2. talent_applications
-- ---------------------------------------------------------------------------
create table if not exists public.talent_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.talent_opportunities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  applicant_name text,
  applicant_email text,
  status text not null default 'submitted' check (status in (
    'submitted', 'viewed', 'shortlisted', 'rejected', 'withdrawn', 'hired'
  )),
  cover_note text,
  resume_url text,
  professional_profile_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_applications_opportunity_id_idx
  on public.talent_applications (opportunity_id);

create index if not exists talent_applications_user_id_idx
  on public.talent_applications (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- 3. talent_saved_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.talent_saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.talent_opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- ---------------------------------------------------------------------------
-- 4. talent_alerts
-- ---------------------------------------------------------------------------
create table if not exists public.talent_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  jurisdictions text[] not null default '{}',
  role_families text[] not null default '{}',
  location_types text[] not null default '{}',
  min_salary numeric,
  frequency text not null default 'daily' check (frequency in (
    'instant', 'daily', 'weekly'
  )),
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_alerts_user_id_idx
  on public.talent_alerts (user_id);

-- ---------------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_opportunities_set_updated_at on public.talent_opportunities;
create trigger talent_opportunities_set_updated_at
  before update on public.talent_opportunities
  for each row execute function public.set_updated_at();

drop trigger if exists talent_applications_set_updated_at on public.talent_applications;
create trigger talent_applications_set_updated_at
  before update on public.talent_applications
  for each row execute function public.set_updated_at();

drop trigger if exists talent_alerts_set_updated_at on public.talent_alerts;
create trigger talent_alerts_set_updated_at
  before update on public.talent_alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Increment RPCs
-- ---------------------------------------------------------------------------
create or replace function public.increment_talent_view_count(opportunity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.talent_opportunities
  set view_count = view_count + 1
  where id = opportunity_id and status = 'published';
$$;

create or replace function public.increment_talent_application_count(opportunity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.talent_opportunities
  set application_count = application_count + 1
  where id = opportunity_id;
$$;

grant execute on function public.increment_talent_view_count(uuid) to anon, authenticated;
grant execute on function public.increment_talent_application_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RLS (no organization_members dependency)
-- ---------------------------------------------------------------------------
alter table public.talent_opportunities enable row level security;
alter table public.talent_applications enable row level security;
alter table public.talent_saved_jobs enable row level security;
alter table public.talent_alerts enable row level security;

-- Published readable by anyone
drop policy if exists "talent_opportunities_select_published" on public.talent_opportunities;
create policy "talent_opportunities_select_published"
  on public.talent_opportunities
  for select
  using (status = 'published' or created_by = auth.uid());

-- Authenticated users can insert their own drafts
drop policy if exists "talent_opportunities_insert_own" on public.talent_opportunities;
create policy "talent_opportunities_insert_own"
  on public.talent_opportunities
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- Owners can update their non-published rows (cannot self-publish)
drop policy if exists "talent_opportunities_update_own" on public.talent_opportunities;
create policy "talent_opportunities_update_own"
  on public.talent_opportunities
  for update
  to authenticated
  using (created_by = auth.uid() and status in ('draft', 'pending_review', 'closed'))
  with check (created_by = auth.uid() and status in ('draft', 'pending_review', 'closed', 'archived'));

-- Applications
drop policy if exists "talent_applications_select_own" on public.talent_applications;
create policy "talent_applications_select_own"
  on public.talent_applications
  for select
  using (user_id = auth.uid());

drop policy if exists "talent_applications_insert_own" on public.talent_applications;
create policy "talent_applications_insert_own"
  on public.talent_applications
  for insert
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "talent_applications_update_own" on public.talent_applications;
create policy "talent_applications_update_own"
  on public.talent_applications
  for update
  using (user_id = auth.uid());

-- Saved jobs + alerts: owner only
drop policy if exists "talent_saved_jobs_own" on public.talent_saved_jobs;
create policy "talent_saved_jobs_own"
  on public.talent_saved_jobs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "talent_alerts_own" on public.talent_alerts;
create policy "talent_alerts_own"
  on public.talent_alerts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.talent_opportunities is
  'Reviewed job postings for the regulated cannabis industry. Separated from counterparty commercial records.';
comment on column public.talent_opportunities.status is
  'draft → pending_review → published | closed | archived. Publish requires service-role / admin review.';
comment on column public.talent_opportunities.company_name is
  'Denormalized company display name so list/detail work without an organizations join.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260820235959','replay_talent_job_board','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260820235959_replay_talent_job_board.sql

-- RECOVERY BEGIN 20260821000000_performance_advisor_fixes.sql
-- Performance fixes from Supabase's own advisor (964 findings reviewed;
-- this addresses the low-risk, well-documented subset). See
-- docs/control/EVIDENCE_LOG.md for the full triage.
--
-- NOT addressed here, deliberately: multiple_permissive_policies (391) and
-- unused_index (478). Both carry real risk if fixed in bulk without
-- per-case review -- overlapping permissive RLS policies are often
-- intentional layered logic (e.g. "owns row" OR "is admin"), and dropping
-- an index on stats alone risks removing one that's actually load-bearing
-- for a query pattern the stats window didn't capture. Flagged for a
-- separate, slower pass rather than rushed here.
-- no_primary_key (2): both are one-off dated backup tables
-- (education_module_sections_backup_20260705, country_intel_backup_20260630)
-- -- expected to lack a PK, not a defect.

-- 1. auth_rls_initplan (11): RLS policies re-evaluating auth.uid() per row
-- instead of once per query. Wrapping in (select ...) lets Postgres hoist
-- it into an initplan. Purely a performance change -- verified each
-- USING/WITH CHECK clause against the live policy before editing, so the
-- access-control semantics are byte-identical, just faster to evaluate.

ALTER POLICY clinical_admin_audit_admin_read ON public.clinical_admin_audit_log
  USING (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text])))));

ALTER POLICY clinical_decision_records_member_access ON public.clinical_decision_records
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_decision_records.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (clinician_user_id = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY clinical_patient_contexts_member_access ON public.clinical_patient_contexts
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_contexts.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (recorded_by = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_contexts.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))));

ALTER POLICY clinical_patient_impact_reviews_member_access ON public.clinical_patient_impact_reviews
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_patient_impact_reviews.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY clinical_therapeutic_objectives_member_access ON public.clinical_therapeutic_objectives
  USING (is_verified_clinician() AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text) AND (EXISTS ( SELECT 1 FROM clinical_care_team ct WHERE ((ct.patient_id = clinical_therapeutic_objectives.patient_id) AND (ct.user_id = (select auth.uid())) AND (ct.membership_status = 'active'::text)))))
  WITH CHECK (is_verified_clinician() AND (recorded_by = (select auth.uid())) AND clinical_has_active_consent(patient_id, 'treatment'::text) AND clinical_has_active_consent(patient_id, 'data_processing'::text));

ALTER POLICY talent_alerts_own ON public.talent_alerts
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY talent_applications_select_own ON public.talent_applications
  USING (user_id = (select auth.uid()));

ALTER POLICY talent_applications_update_own ON public.talent_applications
  USING (user_id = (select auth.uid()));

ALTER POLICY talent_opportunities_select_published ON public.talent_opportunities
  USING ((status = 'published'::text) OR (created_by = (select auth.uid())));

ALTER POLICY talent_opportunities_update_own ON public.talent_opportunities
  USING ((created_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'closed'::text])))
  WITH CHECK ((created_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'closed'::text, 'archived'::text])));

ALTER POLICY talent_saved_jobs_own ON public.talent_saved_jobs
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 2. duplicate_index (1): source_registry had two byte-identical unique
-- indexes on source_url. Confirmed both indexdefs matched exactly and
-- neither name is referenced anywhere in the repo before dropping.
DROP INDEX IF EXISTS public.source_registry_source_url_unique_idx2;

-- 3. unindexed_foreign_keys (81): every FK in public/job_search/
-- regulatory_signals the advisor flagged as lacking a covering index.
-- Adding an index is close to risk-free (write-path cost only, no
-- behavior change), unlike dropping one -- so applied in full rather
-- than triaged. Verified afterward: 0 FKs in these three schemas remain
-- without a covering index.

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON job_search.contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON job_search.jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_application_id ON job_search.outreach_messages (application_id);
CREATE INDEX IF NOT EXISTS idx_prospects_company_id ON job_search.prospects (company_id);
CREATE INDEX IF NOT EXISTS idx_client_error_reports_user_id ON public.client_error_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_encounter_id ON public.clinical_adverse_events (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_formulary_product_id ON public.clinical_adverse_events (formulary_product_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_formulary_sku_id ON public.clinical_adverse_events (formulary_sku_id);
CREATE INDEX IF NOT EXISTS idx_clinical_adverse_events_professional_id ON public.clinical_adverse_events (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_calculations_encounter_id ON public.clinical_calculations (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_care_team_professional_id ON public.clinical_care_team (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_concepts_superseded_by_id ON public.clinical_concepts (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_condition_evidence_links_evidence_record_id ON public.clinical_condition_evidence_links (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_condition_terms_superseded_by_condition_id ON public.clinical_condition_terms (superseded_by_condition_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decision_records_encounter_id ON public.clinical_decision_records (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_claims_superseded_by_id ON public.clinical_evidence_claims (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_condition_term_id ON public.clinical_evidence_conflicts (condition_term_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_evidence_record_a_id ON public.clinical_evidence_conflicts (evidence_record_a_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_evidence_record_b_id ON public.clinical_evidence_conflicts (evidence_record_b_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_conflicts_resolution_review_id ON public.clinical_evidence_conflicts (resolution_review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_source_id ON public.clinical_evidence_extractions (source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_source_snapshot_id ON public.clinical_evidence_extractions (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_grade_assessments_grading_method_key ON public.clinical_evidence_grade_assessments (grading_method_key);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_grade_assessments_review_id ON public.clinical_evidence_grade_assessments (review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_outcome_links_source_snapshot_id ON public.clinical_evidence_outcome_links (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_condition_term_id ON public.clinical_evidence_records (condition_term_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_primary_source_registry_id ON public.clinical_evidence_records (primary_source_registry_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_superseded_by_id ON public.clinical_evidence_records (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_reviews_reviewer_credential_id ON public.clinical_evidence_reviews (reviewer_credential_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_source_snapshots_source_id ON public.clinical_evidence_source_snapshots (source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_sources_latest_snapshot_id ON public.clinical_evidence_sources (latest_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_sources_superseded_by_source_id ON public.clinical_evidence_sources (superseded_by_source_id);
CREATE INDEX IF NOT EXISTS idx_clinical_formulary_skus_feed_run_id ON public.clinical_formulary_skus (feed_run_id);
CREATE INDEX IF NOT EXISTS idx_clinical_guideline_recommendations_concept_id ON public.clinical_guideline_recommendations (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_guideline_recommendations_superseded_by_id ON public.clinical_guideline_recommendations (superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_clinical_intake_queue_latest_snapshot_id ON public.clinical_intake_queue (latest_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_monitoring_protocols_concept_id ON public.clinical_monitoring_protocols (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_monitoring_protocols_formulary_product_id ON public.clinical_monitoring_protocols (formulary_product_id);
CREATE INDEX IF NOT EXISTS idx_clinical_outcome_evidence_evidence_record_id ON public.clinical_outcome_evidence (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_outcome_evidence_source_snapshot_id ON public.clinical_outcome_evidence (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_patient_contexts_encounter_id ON public.clinical_patient_contexts (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_patient_impact_reviews_change_event_id ON public.clinical_patient_impact_reviews (change_event_id);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_encounter_id ON public.clinical_prescriptions (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_recommendation_id ON public.clinical_prescriptions (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_calculation_id ON public.clinical_recommendations (calculation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_encounter_id ON public.clinical_recommendations (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_reviewer_credentials_verified_by ON public.clinical_reviewer_credentials (verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_safety_rules_evidence_record_id ON public.clinical_safety_rules (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_safety_rules_interaction_id ON public.clinical_safety_rules (interaction_id);
CREATE INDEX IF NOT EXISTS idx_clinical_structured_extractions_evidence_record_id ON public.clinical_structured_extractions (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_structured_extractions_source_snapshot_id ON public.clinical_structured_extractions (source_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_concept_id ON public.clinical_therapeutic_objectives (concept_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_encounter_id ON public.clinical_therapeutic_objectives (encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_view_audit_evidence_record_id ON public.clinical_view_audit (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_deal_capital_raises_company_operator_id ON public.deal_capital_raises (company_operator_id);
CREATE INDEX IF NOT EXISTS idx_deal_ma_transactions_acquirer_operator_id ON public.deal_ma_transactions (acquirer_operator_id);
CREATE INDEX IF NOT EXISTS idx_deal_ma_transactions_target_operator_id ON public.deal_ma_transactions (target_operator_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_country_id ON public.dossiers (country_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_snapshot_id ON public.editorial_items (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_source_id ON public.editorial_items (source_id);
CREATE INDEX IF NOT EXISTS idx_education_content_citations_module_id ON public.education_content_citations (module_id);
CREATE INDEX IF NOT EXISTS idx_education_content_citations_section_id ON public.education_content_citations (section_id);
CREATE INDEX IF NOT EXISTS idx_education_modules_reviewed_by ON public.education_modules (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_resolved_by ON public.ia_extraction_failures (resolved_by);
CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_staging_id ON public.ia_extraction_failures (staging_id);
CREATE INDEX IF NOT EXISTS idx_intel_eval_predictions_signal_id ON public.intel_eval_predictions (signal_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_playbooks_source_id ON public.jurisdiction_playbooks (source_id);
CREATE INDEX IF NOT EXISTS idx_professional_service_provider_listings_professional_service ON public.professional_service_provider_listings (submitted_by);
CREATE INDEX IF NOT EXISTS idx_signal_relevance_feedback_user_id ON public.signal_relevance_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_talent_candidates_created_by ON public.talent_candidates (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_created_by ON public.talent_jobs (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_jobs_workspace_id ON public.talent_jobs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_talent_opportunities_created_by ON public.talent_opportunities (created_by);
CREATE INDEX IF NOT EXISTS idx_talent_opportunities_reviewed_by ON public.talent_opportunities (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_talent_saved_jobs_opportunity_id ON public.talent_saved_jobs (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_professional_id ON public.clinical_encounters (professional_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_extractions_evidence_record_id ON public.clinical_evidence_extractions (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_outcome_links_evidence_record_id ON public.clinical_evidence_outcome_links (evidence_record_id);
CREATE INDEX IF NOT EXISTS idx_clinical_grade_assessments_review_id ON public.clinical_grade_assessments (review_id);
CREATE INDEX IF NOT EXISTS idx_clinical_therapeutic_objectives_patient_id ON public.clinical_therapeutic_objectives (patient_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_collection_signals_signal_id ON regulatory_signals.watchlist_collection_signals (signal_id);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260821000000','performance_advisor_fixes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260821000000_performance_advisor_fixes.sql

-- RECOVERY BEGIN 20260821100000_p0_p2_canonical_finish.sql
-- =============================================================================
-- Harbourview P0-P2 canonical finish — 2026-08-21
-- =============================================================================
-- Depends on:
--   20260820130000_hv_pipeline_optimization.sql
--   20260820131000_hv_review_queue_resolve.sql
--
-- This forward migration is the canonical replacement for the removed
-- 20260820180000_p0_p2_pipeline_optimization.sql. It does not mutate pg_cron.
-- It preserves the repaired PR #1598 dispatch/retry/manual-review path, the
-- authoritative HNSW KNN dedup implementation, the extensions search_path,
-- pending-embedding exclusion in hv_pipeline_tick(), and classifier_validation
-- as the mechanical publication gate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Accurate global 8,000-unit daily dispatch ceiling
-- -----------------------------------------------------------------------------
-- The existing stage budgets remain authoritative lower ceilings. The global
-- ceiling is consumed inside hv_consume_dispatch_budget(), after each dispatcher
-- has selected its actual candidate set. This avoids the removed migration's
-- reservation-before-selection accounting defect.
create table if not exists public.hv_pipeline_cost_budget (
  budget_date date primary key,
  dispatch_units integer not null default 0 check (dispatch_units >= 0),
  hard_cap integer not null default 8000 check (hard_cap > 0),
  updated_at timestamptz not null default now()
);

alter table public.hv_pipeline_cost_budget enable row level security;
alter table public.hv_pipeline_cost_budget force row level security;

drop policy if exists hv_pipeline_cost_budget_service_select
  on public.hv_pipeline_cost_budget;
create policy hv_pipeline_cost_budget_service_select
  on public.hv_pipeline_cost_budget
  for select
  to service_role
  using (true);

revoke all on table public.hv_pipeline_cost_budget
  from public, anon, authenticated, service_role;
grant select on table public.hv_pipeline_cost_budget to service_role;

comment on table public.hv_pipeline_cost_budget is
  'Internal aggregate dispatch-unit ceiling. Charged only for the actual batch admitted by hv_consume_dispatch_budget; browser roles have no access.';

create or replace function public.hv_pipeline_budget_remaining()
returns integer
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select greatest(
    8000 - coalesce(
      (
        select b.dispatch_units
        from public.hv_pipeline_cost_budget b
        where b.budget_date = current_date
      ),
      0
    ),
    0
  );
$function$;

create or replace function public.hv_consume_dispatch_budget(
  p_stage text,
  p_requested integer
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_stage_ceiling integer;
  v_stage_used integer;
  v_global_cap integer;
  v_global_used integer;
  v_allowed integer;
  v_requested integer := greatest(coalesce(p_requested, 0), 0);
begin
  if v_requested = 0 then
    return 0;
  end if;

  -- Reset only the addressed stage at the UTC database-day boundary.
  update public.hv_dispatch_budget
  set budget_date = current_date,
      calls_used = 0
  where stage = p_stage
    and budget_date <> current_date;

  -- Unknown stage names fail closed. Lock the stage row so concurrent dispatches
  -- cannot over-consume its existing per-stage ceiling.
  select b.daily_ceiling, b.calls_used
    into v_stage_ceiling, v_stage_used
  from public.hv_dispatch_budget b
  where b.stage = p_stage
  for update;

  if not found then
    return 0;
  end if;

  insert into public.hv_pipeline_cost_budget (
    budget_date,
    dispatch_units,
    hard_cap,
    updated_at
  )
  values (current_date, 0, 8000, now())
  on conflict (budget_date) do update
    set hard_cap = 8000,
        updated_at = excluded.updated_at;

  -- Lock the aggregate row in the same transaction. The admitted amount is the
  -- intersection of the caller's measured batch, the stage ceiling and the
  -- global 8,000-unit ceiling.
  select b.hard_cap, b.dispatch_units
    into v_global_cap, v_global_used
  from public.hv_pipeline_cost_budget b
  where b.budget_date = current_date
  for update;

  v_allowed := least(
    v_requested,
    greatest(v_stage_ceiling - v_stage_used, 0),
    greatest(v_global_cap - v_global_used, 0)
  );

  if v_allowed <= 0 then
    return 0;
  end if;

  update public.hv_dispatch_budget
  set calls_used = calls_used + v_allowed
  where stage = p_stage;

  update public.hv_pipeline_cost_budget
  set dispatch_units = dispatch_units + v_allowed,
      updated_at = now()
  where budget_date = current_date;

  return v_allowed;
end
$function$;

revoke all on function public.hv_pipeline_budget_remaining()
  from public, anon, authenticated;
revoke all on function public.hv_consume_dispatch_budget(text, integer)
  from public, anon, authenticated;
grant execute on function public.hv_pipeline_budget_remaining()
  to service_role;

comment on function public.hv_consume_dispatch_budget(text, integer) is
  'Atomically admits the measured dispatch batch against both its preserved per-stage ceiling and the aggregate 8,000-unit daily ceiling.';

-- -----------------------------------------------------------------------------
-- 2. Hard 0.80 automatic-promotion floor + 0.65–0.80 human review band
-- -----------------------------------------------------------------------------
create or replace function public.hv_promote_signals(
  p_min_conf numeric default 0.80
)
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  n integer;
  v_queued integer;
  v_floor numeric := greatest(0.80, least(coalesce(p_min_conf, 0.80), 0.99));
begin
  insert into public.hv_signal_review_queue (
    signal_id,
    quality_label,
    quality_confidence,
    content_type,
    impact,
    reason,
    status
  )
  select
    s.id,
    s.quality_label,
    s.quality_confidence,
    s.content_type,
    s.impact,
    'below_automatic_promotion_floor',
    'pending'
  from public.signals s
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= 0.65
    and s.quality_confidence < v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\\.)?([^/]+).*',
      '\\2'
    ) not in (select domain from public.excluded_source_domains)
  on conflict (signal_id) do update
    set quality_label = excluded.quality_label,
        quality_confidence = excluded.quality_confidence,
        content_type = excluded.content_type,
        impact = excluded.impact,
        reason = excluded.reason
  where public.hv_signal_review_queue.status = 'pending';

  get diagnostics v_queued = row_count;

  update public.signals s
  set
    reviewed = true,
    reviewed_by = 'auto:v1',
    reviewed_at = now()
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and s.quality_confidence is not null
    and s.quality_confidence >= v_floor
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and exists (
      select 1
      from public.classifier_validation cv
      where cv.classifier_version = s.classifier_version
        and cv.gate_passed = true
    )
    and not exists (
      select 1
      from public.hv_signal_review_queue q
      where q.signal_id = s.id
        and q.status in ('pending', 'rejected', 'skipped')
    )
    and regexp_replace(
      coalesce(s.url, ''),
      '^https?://(www\\.)?([^/]+).*',
      '\\2'
    ) not in (select domain from public.excluded_source_domains);

  get diagnostics n = row_count;

  insert into public.hv_pipeline_stage_log(stage, metrics)
  values (
    'promote',
    jsonb_build_object(
      'promoted', n,
      'min_conf', v_floor,
      'review_floor', 0.65,
      'queued_borderline', v_queued,
      'classifier_validation_gate', 'required'
    )
  );

  return n;
end
$function$;

revoke all on function public.hv_promote_signals(numeric)
  from public, anon, authenticated;

comment on function public.hv_promote_signals(numeric) is
  'Auto-promotion floor is hard >=0.80. 0.65–0.80 remains human-review territory. classifier_validation.gate_passed remains mandatory.';

-- -----------------------------------------------------------------------------
-- 3. Internal table RLS / ACL hardening
-- -----------------------------------------------------------------------------
alter table public.hv_signal_review_queue enable row level security;
alter table public.hv_signal_review_queue force row level security;
alter table public.hv_classify_prefilter_dispositions enable row level security;
alter table public.hv_classify_prefilter_dispositions force row level security;
alter table public.hv_pipeline_stage_log enable row level security;
alter table public.hv_pipeline_stage_log force row level security;

revoke all on table public.hv_signal_review_queue
  from public, anon, authenticated;
revoke all on table public.hv_classify_prefilter_dispositions
  from public, anon, authenticated;
revoke all on table public.hv_pipeline_stage_log
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Read-only gate snapshot. This is observability only; promotion never calls
--    it and classifier_validation remains the publication authority.
-- -----------------------------------------------------------------------------
create or replace function public.hv_eval_gate_snapshot()
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'publication_gate', 'classifier_validation.gate_passed',
    'gate_passed_versions', (
      select count(*)
      from public.classifier_validation cv
      where cv.gate_passed = true
    ),
    'promote_floor', 0.80,
    'human_review_floor', 0.65,
    'global_daily_dispatch_cap', 8000,
    'global_budget_remaining_today', public.hv_pipeline_budget_remaining(),
    'mechanical_gate_preserved', true
  );
$function$;

revoke all on function public.hv_eval_gate_snapshot()
  from public, anon, authenticated;
grant execute on function public.hv_eval_gate_snapshot()
  to service_role;

comment on function public.hv_eval_gate_snapshot() is
  'Read-only P0-P2 observability snapshot. Not an authorization gate; classifier_validation remains authoritative.';

-- Preservation boundary: this migration intentionally does not redefine
-- hv_classify_corpus_dispatch, hv_classify_corpus_harvest, hv_dedup_assign,
-- hv_pipeline_tick, hv_quality_promote_tick, or any HNSW index.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260821100000','p0_p2_canonical_finish','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260821100000_p0_p2_canonical_finish.sql

-- RECOVERY BEGIN 20260821121000_talent_applications_unique.sql
-- Partial unique index: one application per authenticated user per opportunity
create unique index if not exists talent_applications_user_opportunity_uidx
  on public.talent_applications (opportunity_id, user_id)
  where user_id is not null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260821121000','talent_applications_unique','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260821121000_talent_applications_unique.sql

-- RECOVERY BEGIN 20260821190000_clinical_framework_alignment_optional.sql
-- Phase B (optional): additive framework_alignment JSONB on clinical_evidence_records.
-- Safe to apply forward-only. Does not change clinical conclusions, review gates, or public search.
-- Application code may read/write this column when present; absence is treated as unmapped.

ALTER TABLE public.clinical_evidence_records
  ADD COLUMN IF NOT EXISTS framework_alignment jsonb NULL;

COMMENT ON COLUMN public.clinical_evidence_records.framework_alignment IS
  'Optional commercial evidence strategy alignment (IMDRF / DTA / DTx RWE / FDA RWE / stage-gate). Metadata only; does not replace GRADE or clinical review.';

-- Optional child table for living claim map entries (operator dossiers).
CREATE TABLE IF NOT EXISTS public.clinical_evidence_claim_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_key text NOT NULL UNIQUE,
  claim_statement text NOT NULL,
  claim_kind text NOT NULL DEFAULT 'other',
  framework_alignment jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_record_ids text[] NOT NULL DEFAULT '{}',
  gap_owner text NULL,
  target_date date NULL,
  status text NOT NULL DEFAULT 'partial'
    CHECK (status IN ('complete', 'partial', 'gap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid NULL
);

COMMENT ON TABLE public.clinical_evidence_claim_map IS
  'Operator claim → framework map for commercial readiness. Not clinician-facing directives.';

CREATE INDEX IF NOT EXISTS clinical_evidence_claim_map_status_idx
  ON public.clinical_evidence_claim_map (status);

-- RLS. Every other table in public carries it, and the api-schema views grant
-- anon INSERT/UPDATE/DELETE on the assumption that base-table RLS is what
-- actually holds. Shipping a new public table without it would make this the
-- fourth RLS-disabled public table and would widen that gap.
--
-- Enabled with no permissive policy on purpose: nothing reads or writes this
-- table yet (app/admin/(protected)/clinical-review/claim-map renders from
-- CLAIM_MAP_FIXTURES, not from the database), so deny-by-default costs nothing
-- today and is the safe starting point. The service role bypasses RLS, so
-- operator tooling still works.
--
-- Whoever wires the Claim Map UI to this table adds the explicit policies then,
-- as a reviewed security change, rather than inheriting an open table.
ALTER TABLE public.clinical_evidence_claim_map ENABLE ROW LEVEL SECURITY;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260821190000','clinical_framework_alignment_optional','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260821190000_clinical_framework_alignment_optional.sql

-- RECOVERY BEGIN 20260822000000_service_role_policy_scoping.sql
-- Performance fix: convert "service role" policies scoped TO public with an
-- internal auth.role()='service_role' check into policies scoped TO
-- service_role directly. Functionally identical -- Supabase's connection
-- pooler does `SET ROLE` to match the JWT's role claim before RLS ever
-- evaluates, so a policy's `TO service_role` and its `auth.role() =
-- 'service_role'` check are kept in sync by the platform, not something
-- this migration is introducing. Confirmed live afterward: 0 policies with
-- the old (roles={public}, qual=auth.role()='service_role') pattern remain.
--
-- This is what was driving the bulk of the multiple_permissive_policies
-- advisory: scoping TO public meant Postgres had to evaluate this policy
-- (and reject it) for every anon/authenticated row too, on top of whatever
-- policy actually grants their access. TO service_role lets Postgres skip
-- the policy entirely for roles it doesn't apply to.

ALTER POLICY "service role full access" ON job_search.applications TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.companies TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.contacts TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.jobs TO service_role USING (true);
-- Zero-state replay: job_search.opportunities exists only in production; no
-- repository migration creates it (20260729230849 creates the job_search schema
-- and its eight tables, and this is not one of them). Re-scoping a policy on an
-- absent table is a no-op, so guarding on existence cannot change access: there
-- is no table to expose. Against production, where the table and policy both
-- exist, the ALTER runs exactly as before.
do $replay_job_search_opportunities$
begin
  if to_regclass('job_search.opportunities') is not null then
    execute 'ALTER POLICY "service role full access" ON job_search.opportunities TO service_role USING (true)';
  end if;
end
$replay_job_search_opportunities$;
ALTER POLICY "service role full access" ON job_search.outreach_messages TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.prospects TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.resume_versions TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.settings TO service_role USING (true);
ALTER POLICY "service role full access" ON job_search.settings_legacy_single_row TO service_role USING (true);
ALTER POLICY clinical_adverse_events_service ON public.clinical_adverse_events TO service_role USING (true);
ALTER POLICY clinical_audit_log_service_all ON public.clinical_audit_log TO service_role USING (true);
ALTER POLICY clinical_calculations_service ON public.clinical_calculations TO service_role USING (true);
ALTER POLICY clinical_care_team_service ON public.clinical_care_team TO service_role USING (true);
ALTER POLICY clinical_clinician_links_service_write ON public.clinical_clinician_links TO service_role USING (true);
ALTER POLICY clinical_consent_service ON public.clinical_consent_records TO service_role USING (true);
ALTER POLICY clinical_dispensing_service ON public.clinical_dispensing_events TO service_role USING (true);
ALTER POLICY clinical_encounters_service ON public.clinical_encounters TO service_role USING (true);
ALTER POLICY clinical_jurisdiction_authority_service ON public.clinical_jurisdiction_authority TO service_role USING (true);
ALTER POLICY clinical_patients_service ON public.clinical_patients TO service_role USING (true);
ALTER POLICY clinical_prescriptions_service ON public.clinical_prescriptions TO service_role USING (true);
ALTER POLICY clinical_recommendations_service ON public.clinical_recommendations TO service_role USING (true);
-- Zero-state replay: country_intel_backup_20260630 is a one-off dated backup
-- table (20260821000000's own header calls it out as such) created out of band in
-- production; no repository migration creates it. Same reasoning as above -- a
-- policy re-scope on an absent table is a no-op and cannot widen access.
do $replay_country_intel_backup$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null then
    execute 'ALTER POLICY service_role_only ON public.country_intel_backup_20260630 TO service_role USING (true)';
  end if;
end
$replay_country_intel_backup$;
ALTER POLICY deal_capital_raises_service_write ON public.deal_capital_raises TO service_role USING (true);
ALTER POLICY deal_investors_service_write ON public.deal_investors TO service_role USING (true);
ALTER POLICY deal_ma_transactions_service_write ON public.deal_ma_transactions TO service_role USING (true);
ALTER POLICY deal_participants_service_write ON public.deal_participants TO service_role USING (true);
ALTER POLICY service_write_deal_room_messages ON public.deal_room_messages TO service_role USING (true);
ALTER POLICY service_write_deal_rooms ON public.deal_rooms TO service_role USING (true);
ALTER POLICY education_content_citations_service_write ON public.education_content_citations TO service_role USING (true);
ALTER POLICY service_write_professionals ON public.hv_professionals TO service_role USING (true);
ALTER POLICY hv_public_feed_service_write ON public.hv_public_feed TO service_role USING (true);
ALTER POLICY service_write_playbooks ON public.jurisdiction_playbooks TO service_role USING (true);
ALTER POLICY opportunities_service_write ON public.opportunities TO service_role USING (true);
ALTER POLICY service_role_only ON public.scraper_source_state TO service_role USING (true);
ALTER POLICY "Service role manages webhook events" ON public.stripe_webhook_events TO service_role USING (true);
ALTER POLICY prefs_service_write ON public.user_dashboard_preferences TO service_role USING (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822000000','service_role_policy_scoping','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822000000_service_role_policy_scoping.sql

-- RECOVERY BEGIN 20260822010000_scope_anon_unsatisfiable_policies.sql
-- Performance fix, part 2 of the multiple_permissive_policies pass started
-- in 20260822000000_service_role_policy_scoping.sql. Narrows 131 policies
-- from `TO public` to `TO authenticated` where the policy's USING/WITH
-- CHECK is built entirely from auth.uid()-based conditions (direct
-- comparisons, EXISTS subqueries against user_roles/workspace_members, or
-- calls to helper functions -- is_genetics_admin_or_reviewer(),
-- hv_is_platform_staff(), hv_is_org_member(), hv_has_transaction_role(),
-- clinical_evidence_has_review_role(), is_harbourview_admin(), is_hv_staff()
-- -- each independently confirmed by reading pg_proc.prosrc to internally
-- require user_id = auth.uid(), which is always null/false for anon).
--
-- anon's auth.uid() is always null, so every one of these already denies
-- anon today; TO authenticated changes nothing about who gets access, it
-- just lets Postgres skip evaluating the policy for anon entirely instead
-- of evaluating it and getting false every time.
--
-- Explicitly NOT included: talent_opportunities_select_published, whose
-- condition is `status = 'published' OR created_by = auth.uid()` -- the
-- first branch is genuinely anon-satisfiable (published listings are meant
-- to be publicly visible), so it must stay `TO public`. Checked every
-- other matching policy by hand for the same shape before running this;
-- this was the only one found.
--
-- Applied and verified live before writing this file: exactly 1 policy
-- matching the original pattern remains -- the excluded one above.

do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and roles = '{public}'
      and (qual ilike '%auth.uid()%' or with_check ilike '%auth.uid()%')
      and not (tablename = 'talent_opportunities' and policyname = 'talent_opportunities_select_published')
  loop
    execute format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
    n := n + 1;
  end loop;
  raise notice 'altered % policies', n;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822010000','scope_anon_unsatisfiable_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822010000_scope_anon_unsatisfiable_policies.sql

-- RECOVERY BEGIN 20260822123000_clinical_public_read_grants_restore.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822123000','clinical_public_read_grants_restore','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822123000_clinical_public_read_grants_restore.sql

-- RECOVERY BEGIN 20260822130009_fix_clinical_cross_border_match_kind.sql
-- Fix: clinical_cross_border_formulary_check's match_kind stuck at 'no-match'
-- even on a real match, whenever the matched row had a mix of null and
-- non-null fields (e.g. a genuine match with a null brand_name).
--
-- Root cause: the original body derived "was a match found" from whole-record
-- `v_match IS NULL` / `IS NOT NULL` checks. Per the SQL-standard row-comparison
-- rule, a row is only `IS NULL` if ALL fields are null, and only `IS NOT NULL`
-- if ALL fields are non-null — a row with a MIX of null/non-null fields makes
-- BOTH predicates evaluate to false. Confirmed live:
--   select row(1,null,3) is null, row(1,null,3) is not null;  -- false, false
-- So `if v_match is not null then v_match_kind := ...` silently never ran
-- whenever the matched row's brand_name happened to be null (the common case
-- today, since brand_name is largely unpopulated in both formulary feeds).
-- portability_verdict was coincidentally correct — its only check was
-- `v_match IS NULL` for the negative case — but match_kind stayed null and
-- coalesced to 'no-match' even on a real match. Confirmed via a scratch debug
-- function reproducing the AU + "Wide CBD/THC range" case from the original
-- verification: match_is_null=false (correct) but match_kind_val stayed null
-- straight through the assignment step.
--
-- Fix: use `v_match.source_type IS NULL` as the "not found yet" sentinel
-- instead of whole-record nullity. source_type is always a literal
-- ('sku'/'product') when a row was actually found, and is only null before
-- any select has matched — so it can never itself be affected by other
-- columns' nullability. v_match is given a fixed row shape up front so this
-- sentinel check is safe even before either pass has run (e.g. when only
-- p_cannabinoid_profile is supplied and Pass 1 never executes).

create or replace function public.clinical_cross_border_formulary_check(
  p_destination_country_iso2 text,
  p_brand_name text default null,
  p_cannabinoid_profile text default null
)
returns table (
  destination_country_iso2 text,
  match_kind text,
  portability_verdict text,
  matched_source_type text,
  matched_product_name text,
  matched_brand_name text,
  matched_authorization_status text,
  supply_risk_level text,
  supply_signal_headline text,
  supply_signal_source_url text,
  generated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_country text := upper(nullif(trim(p_destination_country_iso2), ''));
  v_brand text := nullif(trim(p_brand_name), '');
  v_profile text := nullif(trim(p_cannabinoid_profile), '');
  v_match record;
  v_match_kind text;
  v_verdict text;
  v_outlook record;
begin
  if v_country is null or length(v_country) <> 2 then
    return;
  end if;

  if v_brand is null and v_profile is null then
    return query select
      v_country, 'no-input'::text, 'insufficient-input'::text,
      null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, now();
    return;
  end if;

  select null::text as source_type, null::text as product_name,
         null::text as brand_name, null::text as authorization_status
  into v_match;

  -- Pass 1: same brand, either table.
  if v_brand is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and brand_name ilike v_brand
    order by last_seen_at desc nulls last
    limit 1;

    if v_match.source_type is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and brand_name ilike v_brand
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match.source_type is not null then
      v_match_kind := 'same-brand';
    end if;
  end if;

  -- Pass 2: fall back to matching cannabinoid profile if no brand match.
  if v_match.source_type is null and v_profile is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and cannabinoid_profile ilike ('%' || v_profile || '%')
    order by last_seen_at desc nulls last
    limit 1;

    if v_match.source_type is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and cannabinoid_profile ilike ('%' || v_profile || '%')
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match.source_type is not null then
      v_match_kind := 'equivalent-profile';
    end if;
  end if;

  v_verdict := case
    when v_match.source_type is null then 'not-currently-available'
    when v_match_kind = 'same-brand' then 'likely-portable'
    else 'profile-equivalent-available'
  end;

  select o.risk_level, o.most_recent_headline, o.most_recent_source_url
  into v_outlook
  from public.clinical_jurisdiction_supply_outlook(v_country, 180) o;

  return query select
    v_country,
    coalesce(v_match_kind, 'no-match'),
    v_verdict,
    v_match.source_type,
    v_match.product_name,
    v_match.brand_name,
    v_match.authorization_status,
    v_outlook.risk_level,
    v_outlook.most_recent_headline,
    v_outlook.most_recent_source_url,
    now();
end;
$function$;

-- Grants/comment unchanged, but reasserted for a clean forward-only migration.
revoke all on function public.clinical_cross_border_formulary_check(text, text, text) from public;
grant execute on function public.clinical_cross_border_formulary_check(text, text, text)
  to authenticated, service_role;

comment on function public.clinical_cross_border_formulary_check(text, text, text) is
  'Cross-border regimen portability check: given a brand name and/or cannabinoid profile and a destination country, reports whether an equivalent published formulary entry exists there, plus that jurisdiction''s supply-continuity outlook. Informational only, not a legal or clinical determination.';

drop function if exists public._debug_cross_border_trace(text, text);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822130009','fix_clinical_cross_border_match_kind','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822130009_fix_clinical_cross_border_match_kind.sql
