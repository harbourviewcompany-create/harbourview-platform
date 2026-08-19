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
