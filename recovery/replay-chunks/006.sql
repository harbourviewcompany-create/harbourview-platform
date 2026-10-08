
-- RECOVERY BEGIN 20260622155031_gap_e_education_track4_clinical_med.sql
WITH t4 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'clinical-medical',
        'Clinical & Medical Cannabis',
        'Evidence-based clinical guidance, prescribing frameworks, patient access pathways, and pharmacist workflows for medical cannabis.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t4_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'clinical-medical'
),
t4_id AS (
    SELECT id FROM t4
    UNION ALL
    SELECT id FROM t4_existing
    LIMIT 1
),
m_prescribing AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'prescribing-frameworks',
        'International Prescribing Frameworks',
        ARRAY['doctor','clinic','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_prescribing_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'prescribing-frameworks'
),
m_prescribing_id AS (
    SELECT id FROM m_prescribing
    UNION ALL
    SELECT id FROM m_prescribing_existing
    LIMIT 1
),
m_patient_access AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'patient-access-pathways',
        'Patient Access Pathways',
        ARRAY['doctor','clinic','patient_general','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_patient_access_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'patient-access-pathways'
),
m_patient_access_id AS (
    SELECT id FROM m_patient_access
    UNION ALL
    SELECT id FROM m_patient_access_existing
    LIMIT 1
),
m_pharm AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'cannabinoid-pharmacology',
        'Cannabinoid Pharmacology Essentials',
        ARRAY['doctor','pharmacist','clinic'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_pharm_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'cannabinoid-pharmacology'
),
m_pharm_id AS (
    SELECT id FROM m_pharm
    UNION ALL
    SELECT id FROM m_pharm_existing
    LIMIT 1
),
m_interactions AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t4_id),
        'drug-interactions',
        'Cannabis Drug Interactions',
        ARRAY['doctor','pharmacist'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_interactions_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'drug-interactions'
),
m_interactions_id AS (
    SELECT id FROM m_interactions
    UNION ALL
    SELECT id FROM m_interactions_existing
    LIMIT 1
),
d1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prescribing_id),
        'prescribing-uk-cbpm-framework',
        'UK CBPM Prescribing Framework for Specialist Clinicians',
        'In the United Kingdom, cannabis-based products for medicinal use (CBPMs) may only be initiated by specialist clinicians on the GMC Specialist Register, following the November 2018 rescheduling under the Misuse of Drugs Regulations 2001. GPs may continue prescriptions initiated by specialists, but cannot initiate CBPM treatment independently as of 2024, a restriction under ongoing review by NHS England. The NHS has issued clinical guidance recommending CBPMs only for three specific indications: intractable nausea/vomiting from chemotherapy, severe treatment-resistant epilepsy (notably Dravet and Lennox-Gastaut syndromes), and moderate-to-severe spasticity from multiple sclerosis.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prescribing_id),
        'prescribing-germany-framework',
        'German Medical Cannabis Prescribing Framework',
        'German physicians have been able to prescribe cannabis flowers, extracts, and cannabis medicines since the passage of the Medical Cannabis Act (BtMAendG) in March 2017, which reclassified cannabis as a Schedule 3 narcotic (prescribable without restriction by indication). Prescriptions are written on narcotic prescription forms (BtM-Rezept) and dispensed by pharmacies, with statutory health insurers (GKV) required to cover costs if medical necessity is established--a provision that generated significant demand growth between 2017 and 2024. The CanG 2024 does not alter the prescription model for pharmaceutical cannabis, maintaining the BtM-Rezept requirement and GKV coverage pathway.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_patient_access_id),
        'patient-access-australia-sas',
        'Australian Patient Access: SAS-B and Authorised Prescriber Pathways',
        'Australian patients access medicinal cannabis predominantly through TGA Special Access Scheme Category B (SAS-B), under which any registered medical practitioner may apply online for a specific patient via the TGA Business Services portal, with most approvals granted within 24-48 hours. Alternatively, specialists may seek Authorised Prescriber (AP) status for a class of patients with a specific condition, removing the need for per-patient TGA applications and streamlining clinical workflow for high-volume practices. Patients must obtain their medicinal cannabis from a TGA-listed pharmacy, and products must either be ARTG-registered or sourced through a licensed importer holding valid ODC permits.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_patient_access_id),
        'patient-access-barriers',
        'Common Barriers to Patient Access in Regulated Markets',
        'Despite legal frameworks permitting medical cannabis access, patients in many jurisdictions face practical barriers including high out-of-pocket costs (insurance non-coverage), limited specialist availability for prescription initiation, pharmacy stocking and dispensing gaps, and stigma from healthcare providers unfamiliar with cannabis medicine. In Germany, health insurer (GKV) prior authorisation rejections--reported at rates of 30-50% for initial applications in 2022-23--represent a significant access barrier, though rejection rates have trended downward following appeal mechanism improvements. Patient advocacy organisations in the UK, Australia, and Canada have documented that low-income and rural patients face disproportionate access challenges, calling for formulary inclusion and telehealth prescribing pathways.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_pharm_id),
        'ecs-thc-cbd-mechanism',
        'Endocannabinoid System: THC and CBD Mechanisms of Action',
        'The endocannabinoid system (ECS) comprises CB1 and CB2 receptors, endogenous ligands (anandamide and 2-arachidonoylglycerol), and metabolic enzymes (FAAH, MAGL), playing a modulatory role across the central nervous system, immune system, and peripheral tissues. Delta-9-tetrahydrocannabinol (THC) acts as a partial agonist at both CB1 and CB2 receptors, producing analgesic, antiemetic, and appetite-stimulating effects alongside psychoactive side effects mediated primarily through CB1 in the CNS. Cannabidiol (CBD) has low affinity for CB1/CB2 receptors but modulates the ECS indirectly through inhibition of FAAH, allosteric modulation of CB1, and activity at TRPV1, 5-HT1A, and GPR55 receptors, underpinning its anticonvulsant, anxiolytic, and anti-inflammatory clinical profiles.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_pharm_id),
        'cannabinoid-pharmacokinetics',
        'Cannabis Pharmacokinetics: Route of Administration Effects',
        'The route of administration significantly affects cannabinoid pharmacokinetics: inhaled cannabis delivers THC to peak plasma concentrations within 3-10 minutes with bioavailability of 10-35%, while oral administration produces delayed peak concentrations (1-3 hours), lower and more variable bioavailability (4-12%), and first-pass hepatic conversion of THC to the more potent 11-hydroxy-THC. Sublingual and oromucosal routes (as used in nabiximols/Sativex) provide intermediate onset (15-45 minutes) and improved dose consistency compared to oral ingestion. Pharmacists counselling patients on cannabis medicines should account for route-of-administration differences when advising on dose titration, onset of effect, and duration, particularly for patients transitioning between formulation types.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_interactions_id),
        'cannabis-cyp450-interactions',
        'Cannabis CYP450 Drug Interactions: Clinical Significance',
        'CBD is a potent inhibitor of cytochrome P450 enzymes CYP2C19 and CYP3A4, with clinically significant interactions documented with antiepileptic drugs (clobazam, valproate, stiripentol), anticoagulants (warfarin), and immunosuppressants (tacrolimus, cyclosporine). In clinical trials of Epidiolex (pharmaceutical CBD), co-administration with clobazam increased N-desmethylclobazam plasma levels by 3-fold, necessitating dose reduction of clobazam in most patients. Prescribers and pharmacists must review the complete medication list before initiating cannabis therapy and implement therapeutic drug monitoring for narrow-therapeutic-index drugs metabolised by CYP2C19 or CYP3A4.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
d8 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_interactions_id),
        'cannabis-cns-sedative-interactions',
        'Cannabis Interactions with CNS Depressants and Sedatives',
        'THC exerts additive CNS depressant effects when co-administered with benzodiazepines, opioids, antidepressants, antihistamines, and alcohol, increasing risk of sedation, respiratory depression, and cognitive impairment. This interaction is of particular concern in elderly patients, who have reduced drug clearance, and in patients on opioid therapy, where combined THC/opioid use requires careful dose titration despite potential opioid-sparing benefits in chronic pain management. Pharmacists should conduct structured medication reviews at cannabis initiation and monitor for signs of excessive sedation, falls risk, and driving impairment, advising patients accordingly under relevant jurisdiction-specific driving and medication guidelines.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)
SELECT 'Track 4: clinical-medical seeded' AS result;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622155031','gap_e_education_track4_clinical_med','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622155031_gap_e_education_track4_clinical_med.sql

-- RECOVERY BEGIN 20260622155128_gap_e_education_track5_industry_intel.sql
WITH t5 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'industry-intelligence',
        'Industry Intelligence',
        'Market data, company intelligence, investment signals, and deal flow analysis across the global cannabis industry.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t5_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'industry-intelligence'
),
t5_id AS (
    SELECT id FROM t5
    UNION ALL
    SELECT id FROM t5_existing
    LIMIT 1
),
m_market_sizing AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'global-market-sizing',
        'Global Market Sizing & Forecasts',
        ARRAY['investor','general'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_market_sizing_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'global-market-sizing'
),
m_market_sizing_id AS (
    SELECT id FROM m_market_sizing
    UNION ALL
    SELECT id FROM m_market_sizing_existing
    LIMIT 1
),
m_ma AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'ma-deal-analysis',
        'M&A and Capital Markets',
        ARRAY['investor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_ma_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'ma-deal-analysis'
),
m_ma_id AS (
    SELECT id FROM m_ma
    UNION ALL
    SELECT id FROM m_ma_existing
    LIMIT 1
),
m_supply_chain AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t5_id),
        'supply-chain-intelligence',
        'Supply Chain Intelligence',
        ARRAY['buyer_importer','supplier','distributor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_supply_chain_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'supply-chain-intelligence'
),
m_supply_chain_id AS (
    SELECT id FROM m_supply_chain
    UNION ALL
    SELECT id FROM m_supply_chain_existing
    LIMIT 1
),
e1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_market_sizing_id),
        'global-medical-cannabis-market-2024',
        'Global Medical Cannabis Market Sizing 2024-2030',
        'The global legal cannabis market was valued at approximately USD 57 billion in 2023, with the medical segment accounting for an estimated USD 15-20 billion of that total, driven primarily by North American adult-use markets and European medical markets. Analysts project compound annual growth rates (CAGR) of 14-20% for the global medical cannabis market through 2030, with Europe--particularly Germany, the UK, and Poland--expected to account for the largest incremental volume growth in the forecast period. Market sizing estimates carry significant uncertainty due to illicit market displacement effects, regulatory volatility, and inconsistent national reporting standards for cannabis consumption data.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_market_sizing_id),
        'europe-medical-cannabis-forecast',
        'European Medical Cannabis Market Forecast',
        'Europe''s medical cannabis market is projected to grow from approximately EUR 600 million in 2023 to EUR 3-5 billion by 2028, with Germany, Poland, the Czech Republic, and Denmark identified as the highest-growth national markets. Product mix is shifting toward standardised pharmaceutical formats (oils, capsules, granules) and away from unprocessed dried flower as pharmacies develop more sophisticated dispensing capabilities and prescribers increase familiarity with dosing titration. Supply chain dynamics are being reshaped by growing EU domestic cultivation capacity (Portugal, Spain, Denmark, Greece, the Netherlands) reducing dependency on extra-EU imports, though GMP-certified import volumes are expected to remain significant through the forecast period.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_ma_id),
        'cannabis-ma-trends-2023-2025',
        'Cannabis M&A Trends 2023-2025',
        'Global cannabis M&A activity declined sharply from the peak levels of 2018-2021, with deal volumes in 2022-2024 characterised by distressed asset acquisitions, vertical integration plays, and strategic consolidation rather than growth-driven premium transactions. Notable deal archetypes include EU-GMP-certified supplier acquisitions by European distributors seeking supply security, licensed producer consolidations in Canada driven by cost pressure and excess cultivation capacity, and pharmaceutical company acquisitions of cannabis drug development assets with FDA/EMA orphan drug designations. Valuation multiples have compressed significantly from the 2019-2021 peak, with most public cannabis companies trading at EV/Revenue multiples of 1-3x by 2024, creating potential value opportunities for strategic acquirers with long investment horizons.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_ma_id),
        'cannabis-capital-markets-access',
        'Cannabis Capital Markets: Banking, Listings, and Institutional Access',
        'Cannabis companies continue to face significant capital markets access challenges due to federal illegality in the United States creating banking, lending, and exchange listing barriers that restrict access to institutional capital, depressing valuations and liquidity. Canadian-listed cannabis companies (TSX, CSE) benefit from cleaner banking access but face limited institutional participation due to cross-border US investment restrictions, while European-listed cannabis companies (Frankfurt, Amsterdam, London AIM) attract a broader institutional investor base for pharmaceutical-focused operators. The potential passage of US federal cannabis reform (including the SAFER Banking Act and possible rescheduling) is widely regarded as the single most significant catalyst for cannabis capital market normalisation, given the scale of US institutional capital currently excluded from the sector.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_supply_chain_id),
        'cannabis-supply-chain-structure',
        'Global Cannabis Supply Chain Structure and Key Actors',
        'The international medical cannabis supply chain comprises four primary layers: cultivation and primary processing (licensed producers/cultivators), secondary manufacturing and extraction (GMP-certified processors), wholesale distribution and import (WDA/ODC licence holders), and final dispensing (pharmacies, clinics). Key supply origin countries for the global export market include Canada, the Netherlands, Denmark, Portugal, and Colombia, each offering different cost profiles, regulatory certifications, and product category strengths. Disruptions in the supply chain--including regulatory delays, batch failures, and logistics bottlenecks at customs--are common operational risks, with importers typically maintaining 3-6 month safety stock levels for high-demand SKUs.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
),
e6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_supply_chain_id),
        'cannabis-cold-chain-logistics',
        'Cold Chain and Controlled Substance Logistics for Cannabis',
        'Medicinal cannabis products--particularly oils, capsules, and botanical drug substances--may require temperature-controlled logistics (2-8 degrees C for some extracts) to preserve potency and prevent microbial proliferation during international transit. GDP (Good Distribution Practice) guidelines, as set out in the EU GDP Guidelines (2013/C 343/01), apply to pharmaceutical cannabis distribution in Europe and require qualified temperature mapping of storage and transport conditions, deviation reporting, and chain-of-custody documentation. Narcotic substance shipments additionally require secure controlled substance courier handling, with chain-of-custody documentation satisfying both GDP requirements and the traceability obligations of the 1961 UN Single Convention reporting framework.',
        'regulatory_official',
        'published',
        'review-required',
        CURRENT_DATE,
        CURRENT_DATE + interval '6 months',
        'medium',
        NULL,
        false,
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
)
SELECT 'Track 5: industry-intelligence seeded' AS result;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622155128','gap_e_education_track5_industry_intel','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622155128_gap_e_education_track5_industry_intel.sql

-- RECOVERY BEGIN 20260622155532_gap_f_add_seed_enum_value.sql
-- Restore the production country data-completeness enum contract.
-- Historical zero-state replays may still have a text column at this point;
-- production already has the enum and therefore follows the idempotent path.

do $data_completeness_type$
begin
  if not exists (
    select 1
    from pg_type type_record
    join pg_namespace namespace_record on namespace_record.oid = type_record.typnamespace
    where namespace_record.nspname = 'public'
      and type_record.typname = 'data_completeness'
  ) then
    create type public.data_completeness as enum ('full', 'partial', 'stub');
  end if;
end
$data_completeness_type$;

alter type public.data_completeness
  add value if not exists 'seed' after 'stub';

do $countries_data_completeness_column$
declare
  current_type text;
begin
  select pg_catalog.format_type(attribute_record.atttypid, attribute_record.atttypmod)
  into current_type
  from pg_attribute attribute_record
  where attribute_record.attrelid = 'public.countries'::regclass
    and attribute_record.attname = 'data_completeness'
    and attribute_record.attnum > 0
    and not attribute_record.attisdropped;

  if current_type is null then
    alter table public.countries
      add column data_completeness public.data_completeness not null default 'stub';
  elsif current_type <> 'data_completeness' then
    -- PostgreSQL does not permit a column type change while a view depends on
    -- that column. The canonical view is recreated below with the same contract.
    drop view if exists public.v_jurisdiction_unified;

    alter table public.countries
      alter column data_completeness drop default;

    alter table public.countries
      alter column data_completeness type public.data_completeness
      using data_completeness::text::public.data_completeness;

    alter table public.countries
      alter column data_completeness set default 'stub'::public.data_completeness,
      alter column data_completeness set not null;
  else
    alter table public.countries
      alter column data_completeness set default 'stub'::public.data_completeness,
      alter column data_completeness set not null;
  end if;
end
$countries_data_completeness_column$;

create or replace view public.v_jurisdiction_unified
with (security_invoker = true)
as
select
  xref.canonical_iso2,
  xref.canonical_name,
  xref.hv_core_jurisdiction_iso_code,
  country.country_name,
  country.market_access_status,
  country.medical_status,
  country.adult_use_status,
  country.import_status,
  country.export_status,
  country.opportunity_score,
  country.data_completeness,
  country.regulator_label,
  country.public_summary as countries_public_summary,
  jurisdiction.jurisdiction_id,
  jurisdiction.data_release_status,
  jurisdiction.identity_verification_status,
  public_profile.public_summary as profile_public_summary,
  public_profile.confidence_band_public,
  public_profile.last_regulatory_verified_at
from public.jurisdiction_crossref xref
left join public.countries country
  on country.iso_alpha2 = xref.countries_iso2
left join public.jurisdictions jurisdiction
  on jurisdiction.jurisdiction_id = xref.jurisdictions_id
left join public.country_profiles_public public_profile
  on public_profile.jurisdiction_id = jurisdiction.jurisdiction_id;

revoke all privileges on table public.v_jurisdiction_unified
  from public, anon, authenticated;
grant select on table public.v_jurisdiction_unified
  to anon, authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622155532','gap_f_add_seed_enum_value','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622155532_gap_f_add_seed_enum_value.sql

-- RECOVERY BEGIN 20260622155755_gap_f_stub_countries_classify.sql
-- Africa (40 countries)
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Angola maintains a full prohibition on cannabis under the 2019 Law on Drug Trafficking, with no medical or industrial hemp framework in place. Enforcement is active and there are no credible signals of near-term reform.', data_completeness = 'seed' WHERE iso_alpha2 = 'AO';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'Burkina Faso prohibits cannabis under national narcotics law with no medical or hemp regulatory pathway. Political instability following the 2022 coup has further delayed any drug-policy reform agenda.', data_completeness = 'seed' WHERE iso_alpha2 = 'BF';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Burundi enforces strict prohibition on all cannabis under its narcotics legislation, with severe criminal penalties for possession or trafficking.', data_completeness = 'seed' WHERE iso_alpha2 = 'BI';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'Benin prohibits recreational and medical cannabis under its 1997 narcotics law; possession carries criminal penalties.', data_completeness = 'seed' WHERE iso_alpha2 = 'BJ';
UPDATE public.countries SET market_access_status = 'emerging', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 28, regulator_label = NULL, public_summary = 'Botswana has debated cannabis decriminalisation in parliament and civil society forums. No legislation has passed to date and personal possession remains a criminal offence under the Drugs and Related Substances Act.', data_completeness = 'seed' WHERE iso_alpha2 = 'BW';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'The Democratic Republic of Congo prohibits cannabis under national law; enforcement is inconsistent. There is no medical or industrial hemp regulatory framework.', data_completeness = 'seed' WHERE iso_alpha2 = 'CD';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'The Central African Republic prohibits cannabis cultivation and use; state authority is limited due to ongoing armed conflict.', data_completeness = 'seed' WHERE iso_alpha2 = 'CF';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'The Republic of Congo (Congo-Brazzaville) maintains full prohibition on cannabis. No medical programme or hemp framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'CG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Cameroon prohibits cannabis under Law No. 92/006; illicit cultivation is widespread in the Western Highlands. No medical or licensed hemp framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'CM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'Cape Verde criminalises cannabis possession and trafficking under the 2004 Drugs Law. The country has not initiated formal reform.', data_completeness = 'seed' WHERE iso_alpha2 = 'CV';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Djibouti prohibits cannabis under its national narcotics law. No medical programme or reform discussion has been recorded.', data_completeness = 'seed' WHERE iso_alpha2 = 'DJ';
UPDATE public.countries SET market_access_status = 'unknown', medical_status = 'unknown', adult_use_status = 'unknown', import_status = 'unknown', export_status = 'unknown', opportunity_score = 10, regulator_label = NULL, public_summary = 'Western Sahara is a disputed territory administered largely by Morocco with no independent legal framework. No commercial cannabis opportunity exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'EH';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Ethiopia prohibits cannabis under the 2004 Anti-Narcotics Law. No medical framework exists and ongoing conflicts have deprioritised drug-policy reform.', data_completeness = 'seed' WHERE iso_alpha2 = 'ET';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'Gabon criminalises cannabis under its narcotics legislation. Following the 2023 military coup, drug-policy reform is not a government priority.', data_completeness = 'seed' WHERE iso_alpha2 = 'GA';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'The Gambia prohibits cannabis under the Drug Control Act 2003. No formal legislation for reform has been tabled.', data_completeness = 'seed' WHERE iso_alpha2 = 'GM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'Guinea prohibits cannabis under its narcotics law; the country has been subject to military governance since the 2021 coup.', data_completeness = 'seed' WHERE iso_alpha2 = 'GN';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Equatorial Guinea maintains strict prohibition on cannabis. The authoritarian governance structure leaves little space for drug-policy reform.', data_completeness = 'seed' WHERE iso_alpha2 = 'GQ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Guinea-Bissau prohibits cannabis under national law. Political instability has prevented any regulatory modernisation.', data_completeness = 'seed' WHERE iso_alpha2 = 'GW';
UPDATE public.countries SET market_access_status = 'emerging', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 38, regulator_label = 'Agriculture and Food Authority (AFA)', public_summary = 'Kenya introduced a Cannabis Control Bill in 2024 and has an active industrial hemp pilot programme regulated by the Agriculture and Food Authority. Medical cannabis remains formally prohibited but parliamentary debate signals near-term reform potential.', data_completeness = 'seed' WHERE iso_alpha2 = 'KE';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'The Comoros prohibits cannabis under national law with no medical or licensed framework. No reform signals have been identified.', data_completeness = 'seed' WHERE iso_alpha2 = 'KM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'Liberia prohibits cannabis under the Controlled Substance Act. No medical or hemp regulatory framework has been developed.', data_completeness = 'seed' WHERE iso_alpha2 = 'LR';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Madagascar prohibits cannabis under national narcotics law but illicit cultivation is widespread. There is no licensed medical or hemp framework.', data_completeness = 'seed' WHERE iso_alpha2 = 'MG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'Mali prohibits cannabis under its narcotics law; political instability following successive coups since 2020 has suspended any drug-policy modernisation.', data_completeness = 'seed' WHERE iso_alpha2 = 'ML';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 10, regulator_label = NULL, public_summary = 'Mauritania enforces strict prohibition on cannabis consistent with Islamic-influenced national law. No medical or hemp framework and no reform discussion.', data_completeness = 'seed' WHERE iso_alpha2 = 'MR';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 20, regulator_label = NULL, public_summary = 'Mozambique prohibits cannabis under its narcotics legislation. No formal bill or regulatory framework has advanced.', data_completeness = 'seed' WHERE iso_alpha2 = 'MZ';
UPDATE public.countries SET market_access_status = 'emerging', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 32, regulator_label = NULL, public_summary = 'Namibia''s parliament debated cannabis decriminalisation in 2024. The country has not yet enacted legislation, but political signals suggest reform is on the near-term agenda.', data_completeness = 'seed' WHERE iso_alpha2 = 'NA';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Niger prohibits cannabis under national narcotics law; following the 2023 military coup, drug-policy reform is not a priority.', data_completeness = 'seed' WHERE iso_alpha2 = 'NE';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 32, regulator_label = 'National Drug Law Enforcement Agency (NDLEA)', public_summary = 'Nigeria prohibits cannabis under the NDLEA Act; the country''s large population and growing civil society advocacy have kept decriminalisation on the legislative agenda.', data_completeness = 'seed' WHERE iso_alpha2 = 'NG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 28, regulator_label = NULL, public_summary = 'Rwanda maintains strict prohibition on cannabis; the government has not advanced any medical or hemp framework.', data_completeness = 'seed' WHERE iso_alpha2 = 'RW';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = NULL, public_summary = 'Sierra Leone prohibits cannabis under its Pharmacy and Drugs Act; illicit use is common but no licensed framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'SL';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 20, regulator_label = NULL, public_summary = 'Senegal prohibits cannabis under the 1997 narcotics law. No medical or hemp framework has been established despite broader West African reform debates.', data_completeness = 'seed' WHERE iso_alpha2 = 'SN';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 10, regulator_label = NULL, public_summary = 'South Sudan prohibits cannabis under national law; state capacity for regulatory enforcement is severely limited. No medical or commercial framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'SS';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'Sao Tome and Principe prohibits cannabis; the island nation''s small size and limited regulatory capacity preclude near-term commercial development.', data_completeness = 'seed' WHERE iso_alpha2 = 'ST';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Eswatini prohibits cannabis under the Opium and Habit-Forming Drugs Act, though historically a significant illicit producer supplying South Africa.', data_completeness = 'seed' WHERE iso_alpha2 = 'SZ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 10, regulator_label = NULL, public_summary = 'Chad enforces strict prohibition on cannabis; political instability and limited state capacity make any regulatory framework implausible in the near term.', data_completeness = 'seed' WHERE iso_alpha2 = 'TD';
UPDATE public.countries SET market_access_status = 'unknown', medical_status = 'unknown', adult_use_status = 'unknown', import_status = 'unknown', export_status = 'unknown', opportunity_score = 10, regulator_label = NULL, public_summary = 'The French Southern and Antarctic Territories are uninhabited; French national law nominally applies but there is no cannabis market or regulatory context.', data_completeness = 'seed' WHERE iso_alpha2 = 'TF';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 14, regulator_label = NULL, public_summary = 'Togo prohibits cannabis under its narcotics legislation. West African reform trends have not yet produced domestic legislative activity.', data_completeness = 'seed' WHERE iso_alpha2 = 'TG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 16, regulator_label = 'Tanzania Food and Drugs Authority (TFDA)', public_summary = 'Tanzania prohibits cannabis under the Drugs and Prevention of Illicit Traffic in Drugs Act 1995; penalties are severe and enforcement is active.', data_completeness = 'seed' WHERE iso_alpha2 = 'TZ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 20, regulator_label = NULL, public_summary = 'Uganda prohibits cannabis under the Narcotic Drugs and Psychotropic Substances Act 2015; illicit cultivation is extensive. Hemp and medical cannabis licensing has been discussed but no framework enacted.', data_completeness = 'seed' WHERE iso_alpha2 = 'UG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Zambia prohibits cannabis; the government has discussed industrial hemp licensing as an economic diversification measure.', data_completeness = 'seed' WHERE iso_alpha2 = 'ZM';
-- Americas (14 countries)
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'The Bahamas criminalises cannabis under the Dangerous Drugs Act; parliamentary discussions on medical access have not produced a formal programme.', data_completeness = 'seed' WHERE iso_alpha2 = 'BS';
UPDATE public.countries SET market_access_status = 'limited', medical_status = 'restricted', adult_use_status = 'limited', import_status = 'restricted', export_status = 'restricted', opportunity_score = 30, regulator_label = NULL, public_summary = 'Dominica enacted cannabis decriminalisation in 2023 following CARICOM recommendations. A medical licensing framework has been discussed but not yet established.', data_completeness = 'seed' WHERE iso_alpha2 = 'DM';
UPDATE public.countries SET market_access_status = 'emerging', medical_status = 'limited', adult_use_status = 'restricted', import_status = 'limited', export_status = 'restricted', opportunity_score = 42, regulator_label = 'Consejo Nacional de Drogas (CND)', public_summary = 'The Dominican Republic permits CBD products with low THC and a medical cannabis bill has advanced in congress. The trajectory points to a regulated medical market in the near term.', data_completeness = 'seed' WHERE iso_alpha2 = 'DO';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'The Falkland Islands are a British Overseas Territory following UK narcotics law; the tiny population makes commercial development implausible.', data_completeness = 'seed' WHERE iso_alpha2 = 'FK';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Greenland is an autonomous territory of Denmark under Danish narcotics law. Market access is negligible given the sparse population.', data_completeness = 'seed' WHERE iso_alpha2 = 'GL';
UPDATE public.countries SET market_access_status = 'unknown', medical_status = 'unknown', adult_use_status = 'unknown', import_status = 'unknown', export_status = 'unknown', opportunity_score = 10, regulator_label = NULL, public_summary = 'South Georgia and the South Sandwich Islands are an uninhabited British Overseas Territory with no applicable cannabis market.', data_completeness = 'seed' WHERE iso_alpha2 = 'GS';
UPDATE public.countries SET market_access_status = 'limited', medical_status = 'restricted', adult_use_status = 'limited', import_status = 'restricted', export_status = 'restricted', opportunity_score = 35, regulator_label = NULL, public_summary = 'Guyana decriminalised personal possession of up to 30 grams of cannabis in 2020. A medical and hemp regulatory framework has been discussed but not enacted.', data_completeness = 'seed' WHERE iso_alpha2 = 'GY';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Haiti prohibits cannabis; severe political instability has rendered effective regulatory enforcement or reform impossible.', data_completeness = 'seed' WHERE iso_alpha2 = 'HT';
UPDATE public.countries SET market_access_status = 'limited', medical_status = 'restricted', adult_use_status = 'limited', import_status = 'restricted', export_status = 'restricted', opportunity_score = 32, regulator_label = 'Saint Lucia Cannabis Licensing Authority', public_summary = 'Saint Lucia decriminalised cannabis in 2022 and established the Cannabis Licensing Authority. A full commercial framework is under development but not yet operational.', data_completeness = 'seed' WHERE iso_alpha2 = 'LC';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Nicaragua prohibits cannabis; the Ortega government has shown no interest in reform. No medical or hemp licensing programme exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'NI';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = 'SENAD (National Anti-Drug Secretariat)', public_summary = 'Paraguay is one of South America''s largest illicit cannabis producers but cannabis remains illegal under national law.', data_completeness = 'seed' WHERE iso_alpha2 = 'PY';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Suriname prohibits cannabis under the Opium Act; decriminalisation discussions have occurred in parliament but no legislation has passed.', data_completeness = 'seed' WHERE iso_alpha2 = 'SR';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'El Salvador prohibits cannabis; the Bukele government has focused drug policy on gang suppression rather than cannabis reform.', data_completeness = 'seed' WHERE iso_alpha2 = 'SV';
UPDATE public.countries SET market_access_status = 'regulated', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 35, regulator_label = 'Virgin Islands Cannabis Advisory Board', public_summary = 'The US Virgin Islands enacted a medical cannabis programme in 2019. Federal law (Controlled Substances Act) still prohibits interstate commerce, limiting import and export.', data_completeness = 'seed' WHERE iso_alpha2 = 'VI';
-- Asia (11 countries)
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Armenia criminalises cannabis under the Criminal Code; penalties for possession were reduced in 2021 but supply and trafficking remain serious offences.', data_completeness = 'seed' WHERE iso_alpha2 = 'AM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Azerbaijan enforces strict prohibition on cannabis. There is no medical or hemp regulatory framework and no reform signals.', data_completeness = 'seed' WHERE iso_alpha2 = 'AZ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Kyrgyzstan prohibits cannabis under the Criminal Code despite historical wild cannabis growth in the Chu Valley.', data_completeness = 'seed' WHERE iso_alpha2 = 'KG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 32, regulator_label = NULL, public_summary = 'Cambodia technically prohibits recreational cannabis following a 2022 crackdown; enforcement remains inconsistent. No formal medical or hemp framework has been enacted.', data_completeness = 'seed' WHERE iso_alpha2 = 'KH';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 25, regulator_label = NULL, public_summary = 'Kazakhstan prohibits cannabis under the Criminal Code. An industrial hemp licensing regulation was drafted in 2023 but not yet fully enacted.', data_completeness = 'seed' WHERE iso_alpha2 = 'KZ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Mongolia prohibits cannabis under the Law on Combating Drug Abuse. There are no credible reform signals.', data_completeness = 'seed' WHERE iso_alpha2 = 'MN';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 25, regulator_label = NULL, public_summary = 'Nepal criminalised cannabis in 1973; parliamentary bills to re-legalise have been repeatedly introduced but not passed. The country''s agricultural potential makes it a medium-term reform candidate.', data_completeness = 'seed' WHERE iso_alpha2 = 'NP';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Cannabis is prohibited in the Palestinian territories under historical law. The conflict environment precludes any near-term regulatory development.', data_completeness = 'seed' WHERE iso_alpha2 = 'PS';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Tajikistan enforces strict prohibition on cannabis; the country serves as a transit route for Afghan opiates and enforces narcotics law harshly.', data_completeness = 'seed' WHERE iso_alpha2 = 'TJ';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Timor-Leste prohibits cannabis under the Law Against Drugs 2004; limited state capacity means enforcement is inconsistent.', data_completeness = 'seed' WHERE iso_alpha2 = 'TL';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Uzbekistan enforces strict prohibition on cannabis under the Criminal Code, with sentences of up to 20 years for trafficking.', data_completeness = 'seed' WHERE iso_alpha2 = 'UZ';
-- Europe (10 countries)
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 35, regulator_label = NULL, public_summary = 'Albania is one of Europe''s largest illicit cannabis producers. The government has signalled interest in legalising medical cannabis cultivation for export as part of EU accession-era modernisation.', data_completeness = 'seed' WHERE iso_alpha2 = 'AL';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 25, regulator_label = 'Finnish Medicines Agency (Fimea)', public_summary = 'Aland follows Finnish national law including the Narcotics Act. Finland''s limited medical cannabis framework technically applies, but the local market is negligible.', data_completeness = 'seed' WHERE iso_alpha2 = 'AX';
UPDATE public.countries SET market_access_status = 'regulated', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'limited', export_status = 'limited', opportunity_score = 52, regulator_label = 'Agency for Medicines and Medical Devices of BiH (ALMBIH)', public_summary = 'Bosnia and Herzegovina passed a Law on Narcotic Drugs amendment in 2022 permitting medical cannabis. Early-stage cultivation licences have been issued and the country is positioning for EU-GMP exports.', data_completeness = 'seed' WHERE iso_alpha2 = 'BA';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 28, regulator_label = NULL, public_summary = 'The Faroe Islands are an autonomous Danish territory following Danish narcotics law. Small population (~55,000) offers negligible commercial opportunity.', data_completeness = 'seed' WHERE iso_alpha2 = 'FO';
UPDATE public.countries SET market_access_status = 'regulated', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'limited', export_status = 'restricted', opportunity_score = 38, regulator_label = 'Isle of Man Food and Drugs Authority', public_summary = 'The Isle of Man mirrors UK medicines law; Schedule 2 cannabis-based medicines are available on prescription. The domestic market is very small.', data_completeness = 'seed' WHERE iso_alpha2 = 'IM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 28, regulator_label = 'National Regulatory Agency for Medicines and Medical Devices (ANMDM)', public_summary = 'Moldova prohibits cannabis; industrial hemp cultivation with THC <0.3% is permitted under an agricultural licensing regime. No medical cannabis framework has been enacted.', data_completeness = 'seed' WHERE iso_alpha2 = 'MD';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 22, regulator_label = NULL, public_summary = 'Montenegro prohibits cannabis; as an EU accession candidate, the country is aligning its narcotics legislation with EU frameworks but has not introduced medical cannabis provisions.', data_completeness = 'seed' WHERE iso_alpha2 = 'ME';
UPDATE public.countries SET market_access_status = 'regulated', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'limited', export_status = 'active', opportunity_score = 72, regulator_label = 'Agency for Medicines and Medical Devices (MALMED)', public_summary = 'North Macedonia is a leading licensed cannabis exporter; MALMED has issued EU-GMP licences to several operators. The country exports to Germany, Poland, and other EU markets, positioning it as a strategic low-cost EU-supply corridor.', data_completeness = 'seed' WHERE iso_alpha2 = 'MK';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Kosovo prohibits cannabis; the country has no medical or hemp regulatory framework. Limited statehood recognition constrains international trade participation.', data_completeness = 'seed' WHERE iso_alpha2 = 'XK';
-- Oceania (10 countries)
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Fiji prohibits cannabis under the Illicit Drugs Control Act 2004. No medical or industrial hemp framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'FJ';
UPDATE public.countries SET market_access_status = 'regulated', medical_status = 'regulated', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 35, regulator_label = 'Guam Cannabis Control Board', public_summary = 'Guam enacted a Medical Cannabis Patient Protection Act and established the Cannabis Control Board. Federal law prevents interstate commerce.', data_completeness = 'seed' WHERE iso_alpha2 = 'GU';
UPDATE public.countries SET market_access_status = 'unknown', medical_status = 'unknown', adult_use_status = 'unknown', import_status = 'unknown', export_status = 'unknown', opportunity_score = 10, regulator_label = NULL, public_summary = 'Heard Island and McDonald Islands are an uninhabited Australian external territory. There is no resident population or applicable cannabis regulatory context.', data_completeness = 'seed' WHERE iso_alpha2 = 'HM';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'Kiribati prohibits cannabis; extreme remoteness, small population, and limited institutional capacity make any regulatory framework implausible.', data_completeness = 'seed' WHERE iso_alpha2 = 'KI';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 20, regulator_label = NULL, public_summary = 'New Caledonia is a French special collectivity applying French narcotics law. No independent cannabis regulatory framework exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'NC';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 20, regulator_label = NULL, public_summary = 'French Polynesia applies French national law; some CBD products are available following France''s 2022 CBD regulatory clarification. No independent cannabis market exists.', data_completeness = 'seed' WHERE iso_alpha2 = 'PF';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 18, regulator_label = NULL, public_summary = 'Papua New Guinea prohibits cannabis under the Dangerous Drugs Act; illicit cultivation is widespread in the Highlands region.', data_completeness = 'seed' WHERE iso_alpha2 = 'PG';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 12, regulator_label = NULL, public_summary = 'The Solomon Islands prohibit cannabis; limited institutional capacity and small economy preclude near-term regulatory development.', data_completeness = 'seed' WHERE iso_alpha2 = 'SB';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Vanuatu prohibits cannabis under the Dangerous Drugs Act; its offshore financial centre status has attracted some cannabis company incorporations.', data_completeness = 'seed' WHERE iso_alpha2 = 'VU';
UPDATE public.countries SET market_access_status = 'restricted', medical_status = 'restricted', adult_use_status = 'restricted', import_status = 'restricted', export_status = 'restricted', opportunity_score = 15, regulator_label = NULL, public_summary = 'Samoa prohibits cannabis under the Narcotics Act 1967; the country is a signatory to the UN drug conventions and has not initiated any reform discussion.', data_completeness = 'seed' WHERE iso_alpha2 = 'WS';
SELECT 'Gap F: 84 stub countries classified at seed level' AS result;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622155755','gap_f_stub_countries_classify','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622155755_gap_f_stub_countries_classify.sql

-- RECOVERY BEGIN 20260622160032_gap_g_playbook_de.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'DE',
  'Germany',
  'very_high',
  18,
  '€500K–€2M+ first year',
  'Germany distinguishes between medical cannabis (governed by the Betäubungsmittelgesetz/BtMG and the 2024 Cannabisgesetz/CanG) and the 2024 non-medical adult-use framework. Medical cannabis imports require a BfArM narcotic import authorisation under §3 BtMG. All medicinal products must comply with EU-GMP (EudraLex Vol. 4). Exporters based outside the EU must hold a GMP certificate recognised by the relevant EU competent authority plus an export permit from their country of origin (e.g. DEA Form 161 for US exporters). German wholesale and distribution requires a Wholesale Distribution Authorisation (WDA) held by the local importer. Products must meet German Arzneimittelgesetz (AMG) packaging and labelling requirements, including German-language patient information leaflets. The 2024 CanG introduced a social-club (Anbauvereinigungen) adult-use framework but does not create a commercial import pathway for non-medical cannabis.',
  '[
    {"step": 1, "title": "Identify German importer/distributor partner", "description": "Engage a German pharmaceutical wholesaler holding both a WDA and a BtM handling authorisation.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Obtain EU-GMP certificate for manufacturing site", "description": "Commission an EU-GMP audit of the origin manufacturing site.", "estimated_weeks": 24, "required": true},
    {"step": 3, "title": "Apply for BfArM §3 BtMG narcotic import authorisation", "description": "The German importer submits the import authorisation application to BfArM.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Register product or confirm dispensing pathway", "description": "Confirm with German importer which pathway applies to the product form.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish quality agreement and batch release process", "description": "Execute a Quality Technical Agreement (QTA) between exporting manufacturer and German QP.", "estimated_weeks": 6, "required": true},
    {"step": 6, "title": "Execute first commercial shipments under validated cold chain", "description": "Obtain per-shipment INCB import/export certificates.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "BfArM", "role": "Primary regulator for narcotic import authorisations", "website": "https://www.bfarm.de", "country": "DE"},
    {"name": "Paul-Ehrlich-Institut (PEI)", "role": "Regulates biological medicinal products", "website": "https://www.pei.de", "country": "DE"},
    {"name": "BAFA", "role": "German export licensing authority", "website": "https://www.bafa.de", "country": "DE"},
    {"name": "ZLG", "role": "Coordinates GMP inspections across German Länder", "website": "https://www.zlg.de", "country": "DE"}
  ]'::jsonb,
  ARRAY[
    'BfArM processing delays frequently exceed published 12-week timelines',
    'Batch release failures due to EU-GMP non-conformances',
    'Distributor exclusive territory conflicts',
    'German-specific packaging and labelling rules under AMG §10–11',
    'CanG 2024 adult-use clubs do not create a commercial import pathway',
    'Import authorisation is product- and importer-specific'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160032','gap_g_playbook_de','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160032_gap_g_playbook_de.sql

-- RECOVERY BEGIN 20260622160057_gap_g_playbook_au.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'AU',
  'Australia',
  'high',
  12,
  'A$200K–A$800K',
  'Australia regulates medicinal cannabis under the Narcotic Drugs Act 1967 and the Therapeutic Goods Act 1989. The Office of Drug Control (ODC) oversees cultivation, production, manufacture, import, and export licences and permits. The TGA regulates product access through: (1) ARTG registration/listing, (2) Special Access Scheme Category B (SAS-B), or (3) the Authorised Prescriber (AP) scheme. Importers must hold an ODC import licence and apply for a separate ODC import permit for each consignment. Australia is one of the world''s largest medical cannabis import markets with over 500 products notified. Most imported products access patients via SAS-B.',
  '[
    {"step": 1, "title": "Engage TGA-licensed importer/sponsor", "description": "Identify an Australian entity holding an ODC Importer Licence. This entity acts as the Australian sponsor responsible for TGA regulatory submissions and pharmacovigilance.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Prepare TGA product dossier and access pathway determination", "description": "Determine the appropriate access pathway: SAS Category B, ARTG registration, or Authorised Prescriber. For most imported products, SAS-B is the launch pathway.", "estimated_weeks": 8, "required": true},
    {"step": 3, "title": "Obtain TGA GMP clearance for overseas manufacturer", "description": "Apply via TGA overseas GMP verification process. TGA accepts EU-GMP certificates from recognised EU NCAs under MRA provisions. Processing: 3-6 months.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Apply for ODC import permit per consignment", "description": "Apply for an ODC import permit for each consignment via the ODC Online Services Portal. ODC processes permits within 15 business days.", "estimated_weeks": 3, "required": true},
    {"step": 5, "title": "Establish cold chain logistics to Australia", "description": "Validate cold chain for the product type. Australian Customs (ABF) will inspect under the Customs Act.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Launch prescriber network and SAS notification programme", "description": "Work with Australian distributor/sponsor to identify and educate prescribers eligible under SAS-B or AP scheme.", "estimated_weeks": 8, "required": true}
  ]'::jsonb,
  '[
    {"name": "TGA (Therapeutic Goods Administration)", "role": "Regulates therapeutic goods including medicinal cannabis: ARTG, SAS/AP pathways, GMP clearance", "website": "https://www.tga.gov.au", "country": "AU"},
    {"name": "ODC (Office of Drug Control)", "role": "Issues licences and permits for cultivation, manufacture, import, and export of narcotic drugs", "website": "https://www.odc.gov.au", "country": "AU"},
    {"name": "DAFF", "role": "Biosecurity controls on agricultural imports; relevant for dried cannabis flower", "website": "https://www.aff.gov.au", "country": "AU"},
    {"name": "ABF (Australian Border Force)", "role": "Customs and border enforcement; controls physical entry of goods including narcotics", "website": "https://www.abf.gov.au", "country": "AU"}
  ]'::jsonb,
  ARRAY[
    'TGA ARTG registration timelines of 12-24 months make SAS-B the only viable launch pathway',
    'SAS-B volume is unpredictable and depends on individual prescriber adoption',
    'TGA GMP clearance for overseas manufacturers can take 3-6 months',
    'ODC import permits are consignment-specific',
    'Dried cannabis flower may face DAFF biosecurity inspection delays',
    'Australian sponsors typically demand significant commercial terms given regulatory burden'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160057','gap_g_playbook_au','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160057_gap_g_playbook_au.sql

-- RECOVERY BEGIN 20260622160135_gap_g_playbook_gb.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'GB',
  'United Kingdom',
  'high',
  12,
  '£150K–£600K',
  'The UK regulates medicinal cannabis under the Misuse of Drugs Act 1971 (MDA), the Misuse of Drugs Regulations 2001 (MDR), and the Human Medicines Regulations 2012 (HMR). Following rescheduling in November 2018, cannabis-based products for medicinal use in humans (CBPMs) were placed in Schedule 2 MDR, enabling specialist hospital doctors to prescribe them. The MHRA is the UK medicines regulator; the Home Office Drugs Licensing and Compliance Unit (DLCU) issues controlled drug (CD) import licences. Importers must hold an MHRA Wholesale Dealer Licence (WDL) with a Responsible Person (RP) and a Home Office CD import licence. Post-Brexit, the UK no longer accepts EU-GMP certificates automatically; MHRA issues its own GMP certificates or accepts certificates from mutual recognition partners. The NHS prescribing pathway is complex: CBPMs must be prescribed by a GMC-registered specialist on a named-patient basis. Private clinic prescribing has grown significantly since 2018.',
  '[
    {"step": 1, "title": "Identify UK importer/distributor with WDL and CD licence", "description": "Engage a UK-based wholesale dealer holding both an MHRA WDL and a Home Office CD import licence. The entity must have a Responsible Person (RP) qualified under MHRA Good Distribution Practice (GDP). Verify their MHRA inspection history and CD licence scope.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Obtain MHRA GMP certification for manufacturing site", "description": "Post-Brexit, MHRA issues its own GMP certificates. Submit application to MHRA for overseas site GMP certification or site inspection. MHRA has MRAs with several countries including Australia, New Zealand, and Switzerland. Processing time 3-6 months. Without MHRA GMP certification, product cannot be imported for medicinal use.", "estimated_weeks": 20, "required": true},
    {"step": 3, "title": "Apply for Home Office CD import licence", "description": "The importer applies to the Home Office DLCU for a controlled drug import licence. Required documents: product details, manufacturer licence, importer WDL, intended use. Licences are typically granted for 12 months and renewed annually. Per-shipment import certificates may also be required under INCB provisions.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Determine product access pathway: NHS vs. private", "description": "NHS pathway requires NICE Technology Appraisal or inclusion in NHS formulary - currently only Epidyolex has full NHS approval. Most CBPMs access patients via named-patient private prescriptions from GMC-registered specialists. Engage a UK medical affairs partner to build specialist prescriber network in neurology, oncology, and pain.", "estimated_weeks": 10, "required": true},
    {"step": 5, "title": "Register product with MHRA or use unlicensed pathway", "description": "Full MHRA marketing authorisation (via national procedure) is a 12-24 month process requiring clinical data. Most CBPMs are supplied as unlicensed specials under the named-patient mechanism. MHRA requires notification of unlicensed imports. Ensure product meets UK labelling requirements including English-language PIL.", "estimated_weeks": 8, "required": true},
    {"step": 6, "title": "Establish pharmacovigilance and MHRA Yellow Card reporting", "description": "Implement UK pharmacovigilance system with a UK-qualified Pharmacovigilance Contact Person. Ensure MHRA Yellow Card adverse event reporting is in place. UK post-Brexit divergence from EMA pharmacovigilance rules means separate UK PSUR cycle may be required.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "MHRA (Medicines and Healthcare products Regulatory Agency)", "role": "UK medicines regulator: product authorisation, GMP certification, WDL licensing, pharmacovigilance oversight", "website": "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", "country": "GB"},
    {"name": "Home Office DLCU", "role": "Issues controlled drug import/export licences under the Misuse of Drugs Act 1971", "website": "https://www.gov.uk/government/organisations/home-office", "country": "GB"},
    {"name": "NICE", "role": "National Institute for Health and Care Excellence; conducts technology appraisals for NHS formulary inclusion", "website": "https://www.nice.org.uk", "country": "GB"},
    {"name": "NHS England", "role": "Commissioning and formulary management for NHS prescribing of CBPMs", "website": "https://www.england.nhs.uk", "country": "GB"}
  ]'::jsonb,
  ARRAY[
    'NHS prescribing pathway is extremely restricted; private clinic market is the primary commercial route',
    'Post-Brexit MHRA GMP certification diverges from EU-GMP; do not assume EU certificate is accepted',
    'Home Office CD import licence renewal must be managed proactively; lapse causes supply chain disruption',
    'Named-patient prescribing means volume is highly dependent on specialist prescriber adoption rates',
    'MHRA unlicensed special rules limit promotional activity; engage regulatory counsel before any UK marketing',
    'UK pharmacovigilance requirements have diverged from EMA post-Brexit; maintain separate UK PSUR cycle'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160135','gap_g_playbook_gb','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160135_gap_g_playbook_gb.sql

-- RECOVERY BEGIN 20260622160303_gap_g_playbook_ca.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CA',
  'Canada',
  'moderate',
  6,
  'C$100K–C$400K',
  'Canada was the first G7 nation to federally legalise adult-use cannabis under the Cannabis Act (2018). The Cannabis Act creates two main frameworks: (1) a recreational/adult-use framework with federally licensed producers (LPs) selling to provincial retailers, and (2) a medical framework enabling Health Canada licensed dealers to import/export for medical and scientific purposes. Importers must hold a Health Canada Import/Export licence. All cultivars must be approved or sold as standard equivalency units. Canada is primarily an export market; imports are uncommon except for specific medical products not available domestically. Key licence classes include: Licence for Sale (medical), Micro-licence, Standard Cultivation, Standard Processing. Health Canada''s Cannabis Tracking and Licensing System (CTLS) manages all licences.',
  '[
    {"step": 1, "title": "Obtain or partner with Health Canada licence holder", "description": "Identify a Canadian entity holding a Health Canada Cannabis Licence with Import authority. Import licences require a physical Canadian location, security clearance for key personnel, and compliance with the Cannabis Regulations security requirements.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Apply for import permit via Health Canada CTLS", "description": "Submit an import permit application through the Cannabis Tracking and Licensing System (CTLS). Required: product details, quantity, origin country licence, purpose of import. Health Canada processes permits within 60 business days.", "estimated_weeks": 12, "required": true},
    {"step": 3, "title": "Ensure GMP compliance under Cannabis Regulations", "description": "All cannabis products sold in Canada must be produced under Good Production Practices (GPP). Foreign manufacturers must demonstrate equivalent GMP standards.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Navigate provincial distribution requirements", "description": "Adult-use cannabis is distributed through provincial Crown corporations (e.g., OCS in Ontario, SQDC in Quebec, AGLC in Alberta). Medical cannabis is distributed direct-to-patient by licensed sellers.", "estimated_weeks": 10, "required": true},
    {"step": 5, "title": "Comply with Cannabis Act packaging and labelling", "description": "Cannabis Act mandates plain packaging with standardised cannabis symbol, health warnings, THC/CBD content disclosure, and no promotional content. Packaging must be child-resistant and tamper-evident.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Implement Cannabis Tracking System (CTS) reporting", "description": "All licensed cannabis activity must be reported to Health Canada''s CTS. Monthly reporting of inventory, sales, and destruction. Non-compliance triggers licence suspension or revocation.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "Health Canada", "role": "Federal cannabis regulator: issues licences, import/export permits, enforces Cannabis Act and Cannabis Regulations", "website": "https://www.canada.ca/en/health-canada", "country": "CA"},
    {"name": "CBSA (Canada Border Services Agency)", "role": "Enforces import/export controls at border; inspects cannabis shipments against permit conditions", "website": "https://www.cbsa-asfc.gc.ca", "country": "CA"},
    {"name": "OCS (Ontario Cannabis Store)", "role": "Provincial Crown corporation managing adult-use cannabis wholesale and retail in Ontario", "website": "https://www.ocs.ca", "country": "CA"},
    {"name": "Provincial Liquor/Cannabis Boards", "role": "Each province has its own distribution authority for adult-use retail", "website": "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis", "country": "CA"}
  ]'::jsonb,
  ARRAY[
    'Health Canada import permits take up to 60 business days; plan procurement cycle accordingly',
    'Provincial board supply agreements have long lead times and minimum volume requirements',
    'Plain packaging rules are strict; non-compliant packaging results in product seizure at border',
    'CTS reporting non-compliance triggers licence action; invest in compliance management systems early',
    'Recreational import pathway is complex; medical import is the more accessible route for foreign suppliers',
    'Key personnel security clearance processing can delay licence applications by 3-6 months'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160303','gap_g_playbook_ca','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160303_gap_g_playbook_ca.sql

-- RECOVERY BEGIN 20260622160339_gap_g_playbook_il.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'IL',
  'Israel',
  'high',
  14,
  '$300K–$1.2M',
  'Israel has one of the most established medical cannabis programmes globally, with roots dating to the 1990s. The Israeli Medical Cannabis Agency (IMCA, formerly YAKAR) under the Ministry of Health oversees all cultivation, manufacturing, distribution, and export. Exports became legal in 2020 under Amendment 9 to the Dangerous Drugs Ordinance. Israel operates a closed, regulated supply chain: only IMCA-licensed operators can export. Importers seeking Israeli supply must partner with an IMCA Export Licence holder. Products must meet Israeli standards (GCC-approved GAP/GMP) and the IMCA Technical Requirements for export. Israel exports primarily to Europe (Germany, UK, Australia). The regulatory environment is highly relationship-driven; IMCA maintains close oversight of all operators.',
  '[
    {"step": 1, "title": "Identify IMCA-licensed Israeli exporter", "description": "Only companies holding an IMCA Export Licence may legally export cannabis from Israel. Identify potential partners through the IMCA operator registry. Evaluate their product portfolio (flower grades, extract types), GMP status, available capacity, and track record with European regulators. Israel has a small number of licensed exporters; competition for capacity is high.", "estimated_weeks": 8, "required": true},
    {"step": 2, "title": "Verify IMCA Technical Requirements compliance", "description": "Israeli export products must meet IMCA Technical Requirements: pesticide residue limits, heavy metals, microbiological standards, THC/CBD content tolerances, and packaging specifications. Obtain product certificates of analysis (COA) validated against IMCA standards. Products must also hold a GCC-approved GAP or GMP certificate from the Israeli operator.", "estimated_weeks": 4, "required": true},
    {"step": 3, "title": "Apply for IMCA Export Permit", "description": "The Israeli exporter applies to IMCA for an export permit for each consignment. Required: buyer country import authorisation, product details, quantity, importer licence. IMCA coordinates with destination country regulator via INCB procedures. Processing time: 4-8 weeks. IMCA may request additional documentation from the destination country regulator.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Secure destination country import authorisation", "description": "Obtain the relevant import authorisation in the destination country (e.g., BfArM permit for Germany, ODC permit for Australia). The Israeli exporter typically requires a copy of this permit before submitting to IMCA. Coordinate closely between Israeli exporter and destination country importer to ensure permit documents are issued simultaneously.", "estimated_weeks": 16, "required": true},
    {"step": 5, "title": "Establish logistics and customs coordination", "description": "Israeli cannabis exports typically route via Ben Gurion Airport (TLV). Cold chain requirements must meet both Israeli and destination country standards. Israeli Customs Authority (ICA) must clear the export. Freight forwarders must be pre-approved by the Israeli exporter''s IMCA licence conditions. Insurance must cover controlled substance cargo.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Manage ongoing IMCA compliance and reporting", "description": "IMCA requires post-shipment confirmation from the destination country importer confirming receipt. Maintain ongoing communication with IMCA regarding product performance, quality incidents, and regulatory changes in destination markets. IMCA may conduct audits of export records. Israeli exporters are required to report all export activity quarterly.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "IMCA (Israeli Medical Cannabis Agency)", "role": "Sole regulatory authority for medical cannabis in Israel: licences, export permits, product standards, operator oversight", "website": "https://www.health.gov.il/English/Topics/cannabis", "country": "IL"},
    {"name": "Ministry of Health Israel", "role": "Policy and regulatory oversight of IMCA; issues Dangerous Drugs Ordinance amendments", "website": "https://www.health.gov.il", "country": "IL"},
    {"name": "Israel Customs Authority", "role": "Export customs clearance for controlled substances including cannabis", "website": "https://www.gov.il/en/departments/israel_customs", "country": "IL"}
  ]'::jsonb,
  ARRAY[
    'IMCA export capacity is constrained; popular Israeli exporters have waitlists; plan 6-12 months ahead',
    'IMCA Technical Requirements are updated periodically; ensure COA standards match current version',
    'Destination country permit must be in hand before IMCA will process export permit; coordinate timelines carefully',
    'Israeli exporters may have exclusivity arrangements with European distributors in certain markets; verify before contracting',
    'IMCA relationship management is critical; appoint a local Israeli regulatory affairs contact',
    'Post-shipment confirmation to IMCA is mandatory; failure to report receipt triggers export privilege suspension'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160339','gap_g_playbook_il','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160339_gap_g_playbook_il.sql

-- RECOVERY BEGIN 20260622160421_gap_g_playbook_nl.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'NL',
  'Netherlands',
  'high',
  12,
  '€200K–£700K',
  'The Netherlands has a unique dual system: a tolerated (gedoogd) adult-use market through licensed coffee shops, and a regulated medicinal cannabis programme. Medicinal cannabis is regulated under the Opium Act (Opiumwet) and managed by the Office of Medicinal Cannabis (OMC/BMC) under the Ministry of Health. The OMC is both the national regulator and the sole wholesale supplier of medicinal cannabis to pharmacies. Imported medicinal cannabis must be channelled through the OMC. The Netherlands also participates in the EU pilot for recreational cannabis regulation (Experiment Gesloten Coffeeshopketen) in select municipalities, but this does not create an import pathway. For export from the Netherlands, Dutch GMP-certified manufacturers can supply to EU and international markets. The Netherlands is an important EU hub for cannabis logistics and processing.',
  '[
    {"step": 1, "title": "Engage OMC as the mandatory wholesale intermediary", "description": "The Office of Medicinal Cannabis (OMC) is the sole legal wholesaler of medicinal cannabis to Dutch pharmacies. Foreign suppliers wishing to supply the Dutch market must contract with the OMC. Contact OMC to understand their current product needs, quality specifications, and tender/procurement processes. OMC periodically issues tenders for additional product supply.", "estimated_weeks": 10, "required": true},
    {"step": 2, "title": "Meet OMC quality and GMP specifications", "description": "OMC specifies strict quality requirements: EU-GMP for manufacturing, specific chemotype (THC/CBD content ranges), pesticide/heavy metals/microbiological limits per Dutch Pharmacopoeia (NF) and European Pharmacopoeia (Ph.Eur.). All products must have a Certificate of Analysis from an EU-accredited laboratory. Contact OMC quality department for current specifications before investing in product development.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Obtain Dutch import permit via OMC/Ministry of Health", "description": "Import permits for cannabis are issued by the Ministry of Health (VWS) under the Opium Act. As OMC acts as the importer, they will manage the permit process. However, foreign exporters must provide: product specification, COA, manufacturing licence, origin country export permit. INCB procedures apply for per-shipment certificates.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Negotiate supply agreement with OMC", "description": "Supply contracts with OMC typically cover pricing, volumes, delivery schedules, quality warranties, and recall procedures. OMC pricing is regulated and margins are controlled. Contracts typically run 1-3 years with options to extend. OMC has stringent change control requirements; product specification changes require re-approval.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish EU-GDP compliant logistics to Netherlands", "description": "All logistics must comply with EU Good Distribution Practice (GDP). Cold chain validation required for temperature-sensitive products. Dutch Customs (Douane) handles controlled substance clearance. Ensure NVWA (Netherlands Food and Consumer Product Safety Authority) import requirements are met if product involves agricultural components.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Manage ongoing OMC compliance and quality reviews", "description": "OMC conducts annual supplier audits and requires ongoing batch-by-batch COA submission. Any quality deviations must be reported immediately. OMC may require field safety corrective actions (FSCAs) for quality issues detected post-distribution to pharmacies. Maintain a Dutch-language product information file accessible to OMC.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "OMC (Office of Medicinal Cannabis / Bureau voor Medicinale Cannabis)", "role": "Sole wholesale supplier of medicinal cannabis to Dutch pharmacies; manages import permits and quality standards", "website": "https://www.cannabisbureau.nl", "country": "NL"},
    {"name": "Ministry of Health, Welfare and Sport (VWS)", "role": "Issues import/export permits under the Opium Act; policy oversight of OMC", "website": "https://www.government.nl/ministries/ministry-of-health-welfare-and-sport", "country": "NL"},
    {"name": "IGJ (Healthcare Inspectorate)", "role": "Inspects pharmacies and healthcare providers for compliance with medicinal cannabis dispensing rules", "website": "https://www.igj.nl", "country": "NL"},
    {"name": "Dutch Customs (Douane)", "role": "Controlled substance customs clearance at Dutch ports and airports", "website": "https://www.belastingdienst.nl/wps/wcm/connect/en/customs", "country": "NL"}
  ]'::jsonb,
  ARRAY[
    'OMC is the mandatory intermediary; direct pharmacy supply is not permitted',
    'OMC tender cycles are infrequent; missing a tender cycle means waiting 12-24 months for next opportunity',
    'OMC pricing is regulated; margins are lower than other European markets',
    'EU-GMP is mandatory; OMC will not accept products from non-EU-GMP certified manufacturers',
    'Product specification changes require OMC re-approval; build change control processes before contracting',
    'Dutch coffeeshop system does not create a commercial import pathway for foreign companies'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160421','gap_g_playbook_nl','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160421_gap_g_playbook_nl.sql

-- RECOVERY BEGIN 20260622160457_gap_g_playbook_co.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'CO',
  'Colombia',
  'moderate',
  8,
  '$80K–$300K',
  'Colombia is one of the world''s leading cannabis export markets, with a favourable regulatory framework under Law 1787 of 2016 and Decree 613 of 2017, regulated by the Ministry of Justice and Law (MinJusticia) and the Ministry of Health (MinSalud). The Colombian Institute for Drug Surveillance (INVIMA) oversees cannabis-derived products for therapeutic use. Colombia distinguishes between psychoactive cannabis (THC >1%) and non-psychoactive cannabis (THC ≤1%). Licences are issued for cultivation (seeds, cuttings, plants), manufacture of cannabis derivatives, and export. Colombia has positioned itself as a low-cost producer for the global medical cannabis market. Export volumes have grown significantly since 2019. Colombian companies may export dried flower, extracts, and APIs. The regulatory framework is considered among the most export-friendly globally.',
  '[
    {"step": 1, "title": "Identify licensed Colombian export partner or establish local entity", "description": "Engage a MinJusticia-licensed cannabis company with active export authorisation. Colombian export licences are company-specific; foreign companies typically partner with or acquire Colombian licensed entities rather than applying directly. Verify licence scope: psychoactive vs non-psychoactive, cultivation vs manufacture, and export authorisation status. Colombia has 30+ licensed exporters as of 2024.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Register product with INVIMA for export", "description": "Cannabis-derived products for therapeutic use must be registered with INVIMA. For export, INVIMA issues a Certificate of Free Sale (CFS) confirming the product is legally manufactured and marketed in Colombia. The CFS is required by most destination country regulators. INVIMA registration processing: 3-6 months for new products.", "estimated_weeks": 16, "required": true},
    {"step": 3, "title": "Apply for MinJusticia export authorisation per shipment", "description": "Each export shipment requires an export authorisation (cupo de exportación) from MinJusticia. Required: INVIMA registration, destination country import permit, product details, quantity. MinJusticia coordinates with INCB for international shipment certificates. Processing: 4-6 weeks per shipment. Plan export pipeline to manage permit lead times.", "estimated_weeks": 6, "required": true},
    {"step": 4, "title": "Ensure BPM/GMP compliance for Colombian manufacturing", "description": "Colombian manufacturers must comply with Colombian GMP (BPM - Buenas Prácticas de Manufactura) under INVIMA oversight. For European market access, EU-GMP certification is additionally required. INVIMA inspects manufacturing facilities periodically. Ensure batch records, SOPs, and quality systems meet both Colombian BPM and destination country GMP requirements.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish export logistics from Colombia", "description": "Colombian cannabis exports typically route through Bogotá El Dorado International Airport (BOG). DIAN (Colombian Customs) manages export clearance for controlled substances. Cold chain logistics must meet product specifications. Engage a Colombian freight forwarder with experience in controlled substance exports. Ensure all INCB documentation is complete before customs submission.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Manage FTA advantages and pricing strategy", "description": "Colombia has Free Trade Agreements with the EU (in force since 2013), the US, Canada, and other markets. These FTAs may reduce tariffs on cannabis derivatives. Consult with Colombian trade counsel to determine applicable FTA tariff codes and rules of origin requirements. Colombian production cost advantages can be significant vs other producing countries.", "estimated_weeks": 4, "required": false}
  ]'::jsonb,
  '[
    {"name": "MinJusticia (Ministry of Justice and Law)", "role": "Issues cannabis cultivation, manufacture, and export licences under Law 1787/2016", "website": "https://www.minjusticia.gov.co", "country": "CO"},
    {"name": "INVIMA (Colombian Institute for Drug Surveillance)", "role": "Regulates cannabis-derived therapeutic products: registration, CFS issuance, GMP inspection", "website": "https://www.invima.gov.co", "country": "CO"},
    {"name": "MinSalud (Ministry of Health)", "role": "Policy oversight of medical cannabis therapeutic use and clinical guidelines", "website": "https://www.minsalud.gov.co", "country": "CO"},
    {"name": "DIAN (Colombian Customs Authority)", "role": "Export customs clearance for cannabis products; enforces controlled substance export controls", "website": "https://www.dian.gov.co", "country": "CO"}
  ]'::jsonb,
  ARRAY[
    'INVIMA product registration can take 3-6 months; begin before confirming export contracts',
    'MinJusticia export authorisation per shipment adds 4-6 weeks to each export cycle; plan accordingly',
    'EU-GMP certification is required for European markets but not mandatory under Colombian law; budget for dual compliance',
    'Colombian partner exclusivity demands can be aggressive; negotiate carefully on territory and duration',
    'Currency risk (COP/USD volatility) affects pricing stability; consider USD-denominated contracts',
    'Political and regulatory environment changes can affect licence validity; maintain close relationships with MinJusticia'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160457','gap_g_playbook_co','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160457_gap_g_playbook_co.sql

-- RECOVERY BEGIN 20260622160536_gap_g_playbook_us.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'US',
  'United States',
  'very_high',
  24,
  '$500K–$3M+',
  'The United States maintains a complex dual federal/state cannabis regulatory framework. At the federal level, cannabis remains a Schedule I controlled substance under the Controlled Substances Act (CSA), making interstate commerce and import/export of cannabis federally illegal. The DEA regulates Schedule I substances. The FDA regulates cannabis-derived drug products: Epidiolex (cannabidiol) is the only FDA-approved cannabis-derived drug. Hemp (Cannabis sativa with ≤0.3% THC) was federally legalised under the 2018 Farm Bill. CBD products derived from hemp operate in a legally ambiguous space; FDA has not approved any CBD food or dietary supplement. 38+ states have legalised medical cannabis; 24 states have legalised adult-use cannabis as of 2024. State programmes are completely independent - supply must be cultivated and processed within state lines. Internationally, the US is primarily an import market for hemp derivatives (CBD isolate, broad-spectrum, hemp seed oil) but not for high-THC medical cannabis.',
  '[
    {"step": 1, "title": "Determine product classification: hemp vs. cannabis", "description": "Federal legality depends entirely on THC content. Hemp-derived CBD (THC ≤0.3% dry weight) can be imported legally at the federal level but faces FDA regulatory uncertainty for food/supplement applications. High-THC cannabis cannot be imported into the US under any federal pathway. State programmes require in-state cultivation and processing - no cross-state or international supply is permitted for state-legal THC products.", "estimated_weeks": 2, "required": true},
    {"step": 2, "title": "For hemp/CBD: register with FDA and comply with import requirements", "description": "Hemp-derived CBD imports face FDA scrutiny. FDA has issued warning letters to companies making drug claims about CBD. For cosmetic, topical, or agricultural applications, FDA compliance is more straightforward. Importers must register with FDA facility registration system. US Customs and Border Protection (CBP) may detain hemp shipments if THC content is unclear.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Navigate state-by-state market entry (for hemp products)", "description": "Even for hemp-derived products, each state has its own labelling, licensing, and testing requirements. Some states (e.g., Idaho, South Dakota) maintain stricter hemp laws. Engage a US regulatory attorney specialising in hemp/cannabis to map state-specific requirements for target markets.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Assess DEA Schedule I research exemption pathways", "description": "For pharmaceutical development involving Schedule I cannabis, the DEA issues researcher licences enabling importation of cannabis for clinical research. This pathway requires an IND (Investigational New Drug) application to FDA, a DEA Schedule I researcher registration, and approval from the country of export. Processing: 12-24 months. This is not a commercial supply pathway.", "estimated_weeks": 52, "required": false},
    {"step": 5, "title": "Monitor federal rescheduling developments", "description": "In May 2024, the DEA proposed rescheduling cannabis from Schedule I to Schedule III. If finalised, this would create new commercial and import pathways. Engage federal cannabis regulatory counsel to monitor rescheduling timeline, DEA hearing outcomes, and Congressional activity on SAFE Banking Act and other cannabis legislation. Do not build business plans around rescheduling until finalised.", "estimated_weeks": 4, "required": false},
    {"step": 6, "title": "Establish US hemp supply chain if pursuing hemp market", "description": "For hemp-derived ingredient imports (CBD isolate, CBG, CBN, hemp seed), identify US hemp processors and distributors as intermediaries. US hemp market is mature with domestic producers; imported hemp faces price competition. Target niche applications: rare cannabinoids (CBN, CBC, THCV), pharmaceutical-grade isolates, or certified organic hemp derivatives.", "estimated_weeks": 12, "required": false}
  ]'::jsonb,
  '[
    {"name": "DEA (Drug Enforcement Administration)", "role": "Enforces Controlled Substances Act; regulates Schedule I cannabis; issues research and import licences for Schedule I substances", "website": "https://www.dea.gov", "country": "US"},
    {"name": "FDA (Food and Drug Administration)", "role": "Regulates cannabis-derived drug products (Epidiolex); oversees hemp-derived CBD in food, supplements, and cosmetics", "website": "https://www.fda.gov", "country": "US"},
    {"name": "USDA AMS (Agricultural Marketing Service)", "role": "Regulates domestic hemp production under the 2018 Farm Bill; administers hemp programme including THC testing requirements", "website": "https://www.ams.usda.gov/rules-regulations/hemp", "country": "US"},
    {"name": "CBP (US Customs and Border Protection)", "role": "Enforces federal cannabis import prohibitions; inspects hemp shipments for THC compliance", "website": "https://www.cbp.gov", "country": "US"}
  ]'::jsonb,
  ARRAY[
    'High-THC medical cannabis CANNOT be imported into the US under any current federal pathway',
    'Hemp-derived CBD regulatory status under FDA remains unresolved; avoid drug and health claims in marketing',
    'State cannabis programmes require in-state supply chains; foreign companies cannot supply state-legal THC markets from outside the US',
    'DEA Schedule I rescheduling to Schedule III is pending (as of 2024) but not yet finalised; do not make business plans contingent on rescheduling',
    'CBP THC testing at border is inconsistent; hemp shipments may face detention if COA or testing methodology is questioned',
    'US hemp market is highly competitive with domestic producers; pricing strategy must account for established domestic supply'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160536','gap_g_playbook_us','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160536_gap_g_playbook_us.sql

-- RECOVERY BEGIN 20260622160611_gap_g_playbook_uy.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'UY',
  'Uruguay',
  'high',
  18,
  '$200K–$800K',
  'Uruguay was the first country in the world to fully legalise and regulate adult-use cannabis nationally (Law 19.172, 2013). The regulatory framework is administered by the Institute for the Regulation and Control of Cannabis (IRCCA) under the National Drug Board (JND). Uruguay''s cannabis market is a closed domestic system: cannabis can only be accessed by Uruguayan residents through three channels: (1) licensed pharmacies, (2) cannabis clubs (membership associations), and (3) home growing. Foreigners and tourists cannot legally purchase cannabis. However, Uruguay also permits a medical/industrial cannabis sector with export potential. Law 19.172 and subsequent decrees allow IRCCA-licensed companies to cultivate and manufacture cannabis for export. Uruguay is positioned as a potential export hub to Europe, leveraging its agricultural infrastructure and low production costs.',
  '[
    {"step": 1, "title": "Understand the Uruguayan export framework", "description": "Uruguay permits cannabis exports under IRCCA licence. Export-oriented operations require a separate IRCCA export authorisation in addition to the cultivation/manufacturing licence. The Uruguayan government has been actively promoting cannabis exports since 2020. Engage a Uruguayan cannabis regulatory attorney to map current export licence requirements and any recent regulatory updates.", "estimated_weeks": 4, "required": true},
    {"step": 2, "title": "Identify or establish IRCCA-licensed Uruguayan partner", "description": "Partner with an IRCCA-licensed Uruguayan operator holding export authorisation. Alternatively, establish a Uruguayan subsidiary and apply for an IRCCA licence (processing time: 6-12 months). Uruguay has a small number of licensed operators with export capacity. Key operators include companies backed by international cannabis groups.", "estimated_weeks": 12, "required": true},
    {"step": 3, "title": "Apply for IRCCA export authorisation", "description": "The Uruguayan operator applies to IRCCA for export authorisation per product and destination. Required: destination country import permit, product specifications, manufacturing licence, quality certificates. IRCCA coordinates with the Uruguayan Ministry of Foreign Affairs for INCB procedures. Processing: 6-10 weeks.", "estimated_weeks": 10, "required": true},
    {"step": 4, "title": "Achieve GMP certification for Uruguayan manufacturing", "description": "Uruguayan manufacturers must comply with IRCCA quality standards. For European markets, EU-GMP certification is additionally required. The Uruguayan Ministry of Public Health (MSP) oversees pharmaceutical GMP. EU-GMP inspections of Uruguayan sites have been conducted by European NCAs. Budget 12-18 months for full EU-GMP certification from a Uruguayan facility.", "estimated_weeks": 24, "required": true},
    {"step": 5, "title": "Establish export logistics and customs", "description": "Uruguayan cannabis exports route through Montevideo Carrasco International Airport (MVD) or Montevideo port. Uruguay Customs (DNA) handles controlled substance export clearance. Engage a Uruguayan freight forwarder with experience in pharmaceutical export. Cold chain requirements must meet both Uruguayan and destination country standards.", "estimated_weeks": 3, "required": true},
    {"step": 6, "title": "Navigate bilateral trade and INCB procedures", "description": "Uruguay is an INCB signatory. All cannabis exports require INCB import/export authorisations. Uruguay''s bilateral cannabis trade agreements with Germany, Israel, and other markets streamline some procedures. Monitor IRCCA and JND policy updates as the export framework is still maturing.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "IRCCA (Institute for Regulation and Control of Cannabis)", "role": "Primary cannabis regulatory authority: licences, export authorisations, quality standards, operator oversight", "website": "https://www.ircca.gub.uy", "country": "UY"},
    {"name": "JND (National Drug Board)", "role": "Policy oversight of cannabis regulation; supervises IRCCA", "website": "https://www.infodrogas.gub.uy", "country": "UY"},
    {"name": "MSP (Ministry of Public Health)", "role": "Pharmaceutical regulation including GMP standards for cannabis manufacturing", "website": "https://www.gub.uy/ministerio-salud-publica", "country": "UY"},
    {"name": "DNA (Uruguayan Customs)", "role": "Export customs clearance for controlled substances", "website": "https://www.aduana.gub.uy", "country": "UY"}
  ]'::jsonb,
  ARRAY[
    'Uruguayan export framework is still maturing; regulatory requirements change periodically',
    'EU-GMP certification from Uruguayan facilities is achievable but requires significant investment and time',
    'Limited number of IRCCA-licensed exporters; competition for supply partnerships is intense',
    'Adult-use domestic market is a closed system for residents only; do not attempt to access domestic retail channels',
    'Bilateral trade relationships with Germany and Israel create preferential pathways; leverage these connections',
    'Uruguay''s small pharmaceutical sector means limited local regulatory expertise; engage international regulatory consultants'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160611','gap_g_playbook_uy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160611_gap_g_playbook_uy.sql

-- RECOVERY BEGIN 20260622160647_gap_g_playbook_th.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'TH',
  'Thailand',
  'moderate',
  10,
  '$150K–$500K',
  'Thailand made history in June 2022 by removing cannabis from its narcotics list under the Narcotic Plants Act, making it the first Asian country to broadly liberalise cannabis. However, the regulatory framework remains in flux. The Thai FDA (TFDA) under the Ministry of Public Health regulates cannabis extracts with THC >0.2% as controlled substances. Cannabis flower (inflorescences) are controlled separately. Medical cannabis products require TFDA registration. The government has issued licences for cultivation, extraction, and manufacture. Thailand aims to become an ASEAN medical cannabis hub. As of 2024, recreational use remains restricted to medical and wellness purposes; the Thai government has indicated it intends to restrict adult-use and focus on medical/wellness tourism. Import and export of cannabis are regulated under TFDA oversight. Foreign investment in the Thai cannabis sector is permitted through BOI-promoted structures.',
  '[
    {"step": 1, "title": "Assess current regulatory status and obtain Thai legal counsel", "description": "Thai cannabis regulations are evolving rapidly. Engage a Bangkok-based regulatory attorney with current TFDA experience before committing capital. Verify current status of: cannabis flower classification, THC/CBD threshold updates, import/export regulations, and any new government policies since 2024. Regulatory position as of filing date may differ from current reality.", "estimated_weeks": 4, "required": true},
    {"step": 2, "title": "Identify TFDA-licensed Thai partner or establish Thai entity", "description": "Foreign companies must either partner with a TFDA-licensed Thai operator or establish a Thai entity. Foreign ownership restrictions may apply under the Foreign Business Act (FBA). BOI promotion may exempt certain cannabis businesses from FBA restrictions. Partner selection should consider TFDA licence scope, manufacturing capacity, and GMP status.", "estimated_weeks": 8, "required": true},
    {"step": 3, "title": "Register cannabis products with TFDA", "description": "Cannabis-derived products with THC >0.2% require TFDA registration as controlled substances. Extracts, tinctures, and pharmaceutical preparations require full product registration including clinical safety data. CBD products below THC threshold have a streamlined registration path. TFDA processing: 6-12 months for full registration.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Obtain TFDA import/export authorisation", "description": "Cannabis import/export requires TFDA authorisation under the Narcotic Plants Act and the Drug Act. For imports: product registration, manufacturer GMP certificate, importer licence. For exports: Thai manufacturer licence, TFDA export permit, destination country import authorisation. INCB procedures apply for international shipments. TFDA processes permits within 30-60 days.", "estimated_weeks": 8, "required": true},
    {"step": 5, "title": "Leverage BOI investment incentives", "description": "The Board of Investment (BOI) promotes medical cannabis businesses with incentives: corporate tax exemption (3-8 years), import duty exemption on machinery, and FBA exemption enabling majority foreign ownership. Apply for BOI promotion under Category 7.34 (medical cannabis) or relevant category. BOI application processing: 3-6 months. BOI promotion significantly reduces establishment costs.", "estimated_weeks": 16, "required": false},
    {"step": 6, "title": "Build Thai medical community and wellness tourism strategy", "description": "Thailand''s medical cannabis market is driven by wellness tourism (cannabis clinics, integrated health tourism) and domestic medical prescriptions. Build relationships with Thai medical practitioners and cannabis clinics. Engage Thai traditional medicine practitioners (TTM) for formulation opportunities. Wellness tourism channel offers faster revenue than pharmaceutical registration.", "estimated_weeks": 8, "required": false}
  ]'::jsonb,
  '[
    {"name": "TFDA (Thai Food and Drug Administration)", "role": "Regulates cannabis products: product registration, import/export permits, manufacturer licensing under Ministry of Public Health", "website": "https://www.fda.moph.go.th", "country": "TH"},
    {"name": "Ministry of Public Health (MOPH)", "role": "Policy oversight of cannabis regulation; issues Ministerial Notifications updating cannabis classification", "website": "https://www.moph.go.th", "country": "TH"},
    {"name": "BOI (Board of Investment)", "role": "Investment promotion including tax incentives and FBA exemptions for medical cannabis businesses", "website": "https://www.boi.go.th", "country": "TH"},
    {"name": "Customs Department Thailand", "role": "Export/import customs clearance for cannabis and controlled substances", "website": "https://www.customs.go.th", "country": "TH"}
  ]'::jsonb,
  ARRAY[
    'Thai cannabis regulations changed rapidly since 2022; always verify current regulatory status before proceeding',
    'Government policy direction on recreational vs medical use is unstable; focus on medical/wellness positioning',
    'Foreign Business Act restrictions on foreign ownership may apply; BOI promotion or Thai partnership is typically required',
    'TFDA product registration for THC-containing products requires clinical data which can be expensive and time-consuming',
    'Wellness tourism channel offers faster market entry than pharmaceutical registration but lower scale',
    'BOI application processing adds 3-6 months; begin early to capture tax incentives'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160647','gap_g_playbook_th','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160647_gap_g_playbook_th.sql

-- RECOVERY BEGIN 20260622160721_gap_g_playbook_mt.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'MT',
  'Malta',
  'moderate',
  9,
  '€120K–€450K',
  'Malta became the first EU member state to legalise adult-use cannabis in December 2021 (Act LII of 2021). The Malta Authority for the Responsible Use of Cannabis (ARUC) oversees the adult-use sector, including non-profit cannabis associations (maximum 500 members each). The Malta Medicines Authority (MMA) regulates medicinal cannabis products. Medical cannabis falls under the Medicines Act and requires MMA product registration. Malta is an EU member, meaning EU-GMP applies to all medicinal cannabis manufacturing. Importers must hold an MMA import licence. Malta''s small domestic market (population ~530,000) limits commercial scale, but its EU membership makes it a potential EU regulatory gateway for non-EU manufacturers seeking a European regulatory foothold. Malta has actively promoted itself as a European cannabis regulatory hub.',
  '[
    {"step": 1, "title": "Determine pathway: medical (MMA) vs. adult-use (ARUC)", "description": "Malta has distinct regulatory pathways for medicinal cannabis (MMA) and adult-use cannabis (ARUC). Medical pathway: full product registration, import licence, prescription requirement. Adult-use pathway: non-profit associations only, no commercial import permitted. For commercial export-to-Malta or EU gateway strategy, medical pathway is the relevant track.", "estimated_weeks": 2, "required": true},
    {"step": 2, "title": "Identify MMA-licensed Maltese importer", "description": "Engage a Maltese pharmaceutical wholesaler holding an MMA Wholesale Dealer Authorisation (WDA) and a controlled substance import licence. Malta has a small pharmaceutical sector; engage early as licensed importers are limited. The importer will act as the marketing authorisation holder or authorised representative.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Apply for MMA product registration or named-patient authorisation", "description": "Full MMA marketing authorisation follows EU procedures (national, mutual recognition, or decentralised). Processing: 12-18 months for full registration. Named-patient authorisation (similar to EU unlicensed use) is available for individual patients on prescription. For market entry, named-patient route is faster. Engage a Maltese regulatory affairs consultant for MMA submission.", "estimated_weeks": 16, "required": true},
    {"step": 4, "title": "Obtain EU-GMP certification and MMA import licence", "description": "EU-GMP is mandatory. MMA accepts EU-GMP certificates from any EU member state NCA. For non-EU manufacturers, apply for MMA GMP site clearance. MMA import licence application requires: manufacturer GMP certificate, product registration, importer WDA, controlled substance handling authorisation. Processing: 8-12 weeks.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Leverage Malta as EU regulatory gateway", "description": "Malta''s MMA participates in EU mutual recognition procedures (MRP) and decentralised procedures (DCP). A Maltese marketing authorisation can be extended to other EU member states via MRP/DCP without a full new application. This makes Malta an attractive reference member state for EU-wide cannabis product registration strategies. Engage a European regulatory affairs firm with MRP/DCP expertise.", "estimated_weeks": 8, "required": false},
    {"step": 6, "title": "Navigate ARUC framework if pursuing adult-use angle", "description": "ARUC-regulated cannabis associations are non-profit, membership-based, and cannot commercially import. Foreign companies cannot directly participate in the adult-use market. However, monitor ARUC framework evolution as Malta may develop commercial adult-use regulations in future. This step is for intelligence gathering only.", "estimated_weeks": 2, "required": false}
  ]'::jsonb,
  '[
    {"name": "MMA (Malta Medicines Authority)", "role": "Regulates medicinal cannabis: product registration, import licences, GMP oversight, wholesale dealer authorisations", "website": "https://medicinesauthority.gov.mt", "country": "MT"},
    {"name": "ARUC (Authority for the Responsible Use of Cannabis)", "role": "Regulates adult-use cannabis associations under Act LII of 2021", "website": "https://aruc.gov.mt", "country": "MT"},
    {"name": "Health Department Malta", "role": "Policy oversight of cannabis regulation; import/export of controlled substances under Dangerous Drugs Ordinance", "website": "https://deputyprimeminister.gov.mt/en/health", "country": "MT"}
  ]'::jsonb,
  ARRAY[
    'Maltese domestic market is small (~530K population); commercial viability depends on EU gateway strategy',
    'Limited number of MMA-licensed cannabis importers; engage early as capacity may be constrained',
    'Adult-use ARUC framework does not permit commercial imports; medical pathway is the only commercial route',
    'MMA mutual recognition strategy requires initial full dossier investment; ensure clinical data meets EMA standards',
    'Malta''s English-language regulatory environment and EU membership make it accessible; leverage for EU-wide strategy',
    'ARUC adult-use framework may evolve commercially; monitor for future opportunities'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160721','gap_g_playbook_mt','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160721_gap_g_playbook_mt.sql

-- RECOVERY BEGIN 20260622160759_gap_g_playbook_pt.sql
INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'PT',
  'Portugal',
  'moderate',
  10,
  '€150K–€500K',
  'Portugal has a well-established medical cannabis framework and is one of Europe''s leading cannabis export nations. Law 33/2018 authorised the use of cannabis-based medicines. Decree-Law 8/2019 established the licensing framework for cultivation and production of cannabis for medicinal and scientific purposes. INFARMED (National Authority of Medicines and Health Products) is the primary regulator. Portugal permits EU-GMP certified manufacturers to produce cannabis for domestic use and export. INFARMED issues cultivation, production (extraction/manufacture), research, and import/export licences. Portugal has attracted significant investment from international cannabis companies due to its favourable climate, EU membership, EU-GMP infrastructure, and export-friendly regulations. Several EU-GMP certified facilities now operate in Portugal. Portugal is a primary export hub for medical cannabis to Germany, the UK, and Australia.',
  '[
    {"step": 1, "title": "Identify INFARMED-licensed Portuguese operator", "description": "For export-from-Portugal strategy: Partner with an INFARMED-licensed Portuguese cultivator/manufacturer with EU-GMP certification and export authorisation. Portugal has 15+ licensed operators as of 2024. Evaluate production capacity, product portfolio (flower, extract, API), EU-GMP scope, and existing customer relationships in target markets. For import-to-Portugal strategy: identify a Portuguese wholesaler with INFARMED import licence.", "estimated_weeks": 6, "required": true},
    {"step": 2, "title": "Apply for INFARMED cannabis licence (if establishing in Portugal)", "description": "INFARMED issues licences for: (1) Cultivation, (2) Production (extraction/transformation), (3) Import/Export, (4) Research. Applications submitted to INFARMED Cannabis Unit. Required: facility details, security plan, quality management system, qualified persons identification. INFARMED processing: 6-9 months. Licence types can be combined. Portugal actively encourages new licence applications.", "estimated_weeks": 36, "required": false},
    {"step": 3, "title": "Obtain EU-GMP certification from INFARMED or EMA network", "description": "EU-GMP certification is mandatory for export to EU markets. INFARMED conducts GMP inspections and issues GMP certificates valid across the EU. Initial GMP inspection from a greenfield facility: 12-18 months from application. INFARMED has a reputation for thorough, efficient GMP inspections. GMP certificate is required before any commercial export.", "estimated_weeks": 20, "required": true},
    {"step": 4, "title": "Apply for INFARMED export authorisation", "description": "Each export requires an INFARMED export authorisation. Required: EU-GMP certificate, destination country import authorisation, product specification, quantity. INFARMED processes export authorisations within 20 business days. INCB import/export certificates required for Schedule I substances. Portugal has bilateral cooperation agreements with Germany, UK, and Australia that streamline procedures.", "estimated_weeks": 4, "required": true},
    {"step": 5, "title": "Leverage Portugal''s EU hub advantages", "description": "Portugal''s EU membership enables seamless intra-EU shipments under EU-GMP mutual recognition. Products with EU marketing authorisation can be shipped to any EU member state without separate national authorisations. Portuguese costs (labour, land) are lower than northern European competitors. Portugal''s Atlantic climate supports year-round outdoor cultivation with lower energy costs.", "estimated_weeks": 2, "required": false},
    {"step": 6, "title": "Establish Portuguese distribution and quality infrastructure", "description": "Portugal has a mature pharmaceutical distribution network. Engage a Portuguese 3PL with EU-GDP certification and controlled substance handling experience. Lisbon (LIS) and Porto (OPO) airports are primary export hubs. Portuguese logistics costs are competitive. Ensure QP batch release can be performed in Portugal or under an EU QP agreement.", "estimated_weeks": 4, "required": true}
  ]'::jsonb,
  '[
    {"name": "INFARMED (National Authority of Medicines and Health Products)", "role": "Primary cannabis regulator: issues all cannabis licences (cultivation, production, import/export), conducts GMP inspections, issues GMP certificates", "website": "https://www.infarmed.pt", "country": "PT"},
    {"name": "SICAD (General Directorate for Intervention on Addictive Behaviours)", "role": "Coordinates national drug policy; relevant for research and public health aspects of cannabis", "website": "https://www.sicad.pt", "country": "PT"},
    {"name": "AT (Tax and Customs Authority)", "role": "Export customs clearance for controlled substances including cannabis", "website": "https://www.portaldasfinancas.gov.pt", "country": "PT"},
    {"name": "AICEP Portugal Global", "role": "Portuguese investment and trade agency; provides support for foreign investors establishing cannabis operations in Portugal", "website": "https://www.portugalglobal.pt", "country": "PT"}
  ]'::jsonb,
  ARRAY[
    'EU-GMP certification from greenfield takes 12-18 months; plan capital and timeline accordingly',
    'INFARMED licence processing of 6-9 months means market entry timeline of 18-24 months minimum for new establishments',
    'Portugal is primarily an export hub, not a large domestic market; business model should focus on EU and global export',
    'Bilateral cooperation with Germany, UK, and Australia provides procedural advantages; leverage these relationships',
    'Portuguese labour and land costs are competitive but EU-GMP infrastructure investment is still significant',
    'INFARMED export authorisation per shipment requires destination country permit in advance; coordinate with importers early'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622160759','gap_g_playbook_pt','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622160759_gap_g_playbook_pt.sql

-- RECOVERY BEGIN 20260622161702_pr793_migration_drift_guard.sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260622000001', 'market_metrics_time_series', ARRAY['-- already applied as gap_a_market_metrics_time_series (20260622153559)']),
  ('20260622000002', 'trade_flows_structured', ARRAY['-- already applied as gap_b_trade_flows_structured (20260622153659)']),
  ('20260622000003', 'operator_entity_graph', ARRAY['-- already applied as gap_c_operator_entity_graph_ddl+seed (20260622153739/153821)']),
  ('20260622000004', 'jurisdiction_schema_unification', ARRAY['-- already applied as gap_d_jurisdiction_schema_unification (20260622153847)']),
  ('20260622000005', 'education_tracks_modules_seed', ARRAY['-- already applied as gap_e_education_tables_ddl + tracks 1-5 (20260622154316-155128)']),
  ('20260622000006', 'stub_countries_classify', ARRAY['-- already applied as gap_f_add_seed_enum_value+classify (20260622155532/155755)']),
  ('20260622000007', 'jurisdiction_playbooks_tier1_seed', ARRAY['-- already applied as gap_g_playbook_de through gap_g_playbook_pt (20260622160032-160759)'])
ON CONFLICT (version) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622161702','pr793_migration_drift_guard','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622161702_pr793_migration_drift_guard.sql

-- RECOVERY BEGIN 20260622162300_restore_core_education_modules.sql
-- Replay-safe restoration of the 12 core education modules referenced by the
-- immediately following section seed.
--
-- Production shows these identities were created out-of-band on 2026-06-09.
-- The repository history contains two education-module contracts: the Gap-E
-- schema uses a UUID track foreign key, while production later uses a text track
-- classification. This migration supports both without changing review state.

create temporary table hv_core_education_modules (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  audience text[] not null,
  sensitivity text not null,
  publication_state text not null,
  sort_order integer not null,
  legacy_track text not null,
  gap_track_slug text not null
) on commit drop;

insert into hv_core_education_modules values
  ('b4882b28-7039-471f-b580-c19786752be6','clinical-cannabis-prescribing','Clinical Cannabis Prescribing',array['doctor_prescriber','clinic_healthcare_operator','pharmacist'],'public','published',10,'clinical','clinical-medical'),
  ('03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587','pharmacy-dispensing-controls','Pharmacy Dispensing Controls',array['pharmacist','doctor_prescriber'],'public','published',20,'clinical','clinical-medical'),
  ('edc533ae-e077-4eac-8cb4-01f974a4ce5d','gmp-compliance-essentials','GMP Compliance Essentials',array['gmp_quality','lab_qa','cultivator_producer','general'],'public','published',20,'compliance','regulatory-compliance'),
  ('cb3bf297-51ed-4c85-bded-7370e1748d94','proof-pack-guide','Building a Proof Pack',array['exporter','cultivator_producer','importer','general'],'public','published',30,'compliance','regulatory-compliance'),
  ('8d4ba66c-776e-44a2-9bc6-7c1e95054a83','compliance-readiness-check','Compliance Readiness Self-Assessment',array['general'],'public','published',40,'compliance','regulatory-compliance'),
  ('6bff2f95-b4b5-4487-8455-26a5d110e742','export-readiness-101','Export Readiness 101',array['exporter','cultivator_producer','processor_extractor','general'],'public','published',10,'export','market-access-pathways'),
  ('7520ef89-8758-4436-860c-e016c53a6d32','genetics-ip-fundamentals','Genetics IP & Cultivar Documentation',array['geneticist_breeder','cultivator_producer','general'],'public','published',10,'genetics','industry-intelligence'),
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1','importer-pathway-guide','Importer / Buyer Pathway Guide',array['importer','wholesaler_distributor','general','distributor_wholesaler'],'public','published',10,'import','market-access-pathways'),
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe','gdp-logistics-cold-chain','GDP Logistics & Cold Chain',array['exporter','importer','wholesaler_distributor','general','distributor_wholesaler'],'public','published',10,'logistics','market-access-pathways'),
  ('5c3b131f-f733-4295-9f52-5d6cb2058410','market-access-strategy','Market Access Strategy',array['investor_operator','exporter','government_regulator','general'],'public','published',10,'market','market-access-pathways'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135','lab-testing-qa-frameworks','Lab Testing & QA Frameworks',array['lab_qa','gmp_quality','general'],'public','published',10,'quality','industry-intelligence'),
  ('ac01db02-2182-43a3-a1f3-54fd05e56621','regulatory-intelligence','Regulatory Intelligence & Monitoring',array['government_regulator','investor_operator','general'],'public','published',20,'regulatory','regulatory-compliance');

do $education_module_identity_conflicts$
declare
  conflict_rows text;
begin
  select string_agg(format('%s=>%s', expected.slug, existing.id), ', ' order by expected.slug)
  into conflict_rows
  from hv_core_education_modules expected
  join public.education_modules existing
    on existing.slug = expected.slug
   and existing.id <> expected.id;

  if conflict_rows is not null then
    raise exception 'Education module slug identity conflict: %', conflict_rows;
  end if;
end
$education_module_identity_conflicts$;

insert into public.education_modules (
  id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
)
select
  id, slug, title, audience, sensitivity, publication_state,
  '2026-06-09 05:36:29.382207+00'::timestamptz,
  '2026-06-09 05:36:29.382207+00'::timestamptz
from hv_core_education_modules
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  audience = excluded.audience,
  sensitivity = excluded.sensitivity,
  publication_state = excluded.publication_state;

-- Reconcile track identity according to the schema present in the environment.
do $education_module_track_contract$
declare
  track_type text;
begin
  select pg_catalog.format_type(attribute_record.atttypid, attribute_record.atttypmod)
  into track_type
  from pg_attribute attribute_record
  where attribute_record.attrelid = 'public.education_modules'::regclass
    and attribute_record.attname = 'track_id'
    and attribute_record.attnum > 0
    and not attribute_record.attisdropped;

  if track_type = 'uuid' then
    update public.education_modules module
    set track_id = track.id
    from hv_core_education_modules expected
    join public.education_tracks track on track.slug = expected.gap_track_slug
    where module.id = expected.id;
  elsif track_type = 'text' then
    update public.education_modules module
    set track_id = expected.legacy_track
    from hv_core_education_modules expected
    where module.id = expected.id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'education_modules'
      and column_name = 'sort_order'
  ) then
    execute $sql$
      update public.education_modules module
      set sort_order = expected.sort_order
      from hv_core_education_modules expected
      where module.id = expected.id
    $sql$;
  end if;
end
$education_module_track_contract$;

do $education_module_identity_assertion$
declare
  missing_ids uuid[];
begin
  select array_agg(expected.id order by expected.id)
  into missing_ids
  from hv_core_education_modules expected
  where not exists (
    select 1 from public.education_modules module
    where module.id = expected.id
  );

  if missing_ids is not null then
    raise exception 'Core education module restoration incomplete: %', missing_ids;
  end if;
end
$education_module_identity_assertion$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622162300','restore_core_education_modules','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622162300_restore_core_education_modules.sql

-- RECOVERY BEGIN 20260622162331_seed_education_module_sections.sql
-- Migration: Seed education_module_sections for all 12 education modules
-- Created: 2026-06-22

INSERT INTO education_module_sections
  (id, module_id, section_order, heading, body, block_type, created_at, updated_at)
VALUES

-- ============================================================
-- Module 1: Clinical Cannabis Prescribing (clinical track)
-- module_id: b4882b28-7039-471f-b580-c19786752be6
-- ============================================================
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  1,
  'Overview',
  'Clinical cannabis prescribing sits at the intersection of regulatory compliance, pharmacology, and patient-centred care. Across major markets — including Canada, Germany, Australia, and Israel — licensed healthcare practitioners must follow jurisdiction-specific frameworks that govern which products can be authorised, in what quantities, and for which indications. Understanding these frameworks is foundational for any clinician or operator seeking to participate in the regulated medical cannabis supply chain. This module provides a structured walkthrough of prescribing pathways, documentation obligations, and the product knowledge clinicians require to practise safely and lawfully.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  2,
  'Regulatory Prescribing Frameworks',
  'Each major medical cannabis jurisdiction has established its own prescribing authority model. In Canada, Sections 268–286 of the Cannabis Regulations permit patients to register directly with Licensed Producers upon receipt of a medical document from an authorised healthcare practitioner. Germany''s Cannabis Act (CanG 2024) allows any licensed physician to prescribe cannabis flower, extracts, or finished medicinal preparations without special narcotics authorisation, dramatically expanding access. Australia''s Therapeutic Goods Administration operates a Simplified Access Pathway under which GPs can authorise Schedule 8 or Schedule 4 cannabis medicines without prior TGA approval for most patients. Operators supplying into these markets must ensure their product labelling, Certificates of Analysis, and pharmacist-facing datasheets satisfy the requirements of each destination country''s prescribing framework.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  3,
  'Product Selection & Cannabinoid Dosing Principles',
  'Clinicians authorising cannabis medicines must be able to navigate product formats — flower, oil, capsule, sublingual spray — and their differing pharmacokinetic profiles. Inhaled products produce rapid onset (2–10 minutes) and shorter duration, making them suitable for breakthrough symptom management, whereas oral oil preparations provide slower onset (30–120 minutes) with extended duration, suiting chronic pain and sleep indications. THC:CBD ratio selection is clinically meaningful: high-CBD products (e.g. 20:1 CBD:THC) carry lower psychoactive risk for anxiety or epilepsy indications, while balanced or THC-dominant products may be required for treatment-resistant nausea or spasticity. Operators supplying to clinical settings should provide clear product monographs with start-low-go-slow dosing guidance aligned to each destination market''s clinical practice guidelines.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  4,
  'Documentation & Record-Keeping Requirements',
  'Medical cannabis prescribing generates a documentation chain that must satisfy both clinical governance standards and regulatory audit requirements. In most jurisdictions, the prescribing practitioner must retain a record of the clinical indication, the product authorised, the quantity and duration of the authorisation, and any follow-up assessment schedule. Canadian Licensed Producers are required to retain copies of medical documents for a minimum of two years; Australian sponsors must retain supply records for five years under TGA guidelines. For operators, this means that supply agreements with clinics and pharmacies should contractually define record-keeping obligations, and that ERP or seed-to-sale systems must be capable of producing supply records in formats acceptable to national health authority inspectors.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b4882b28-7039-471f-b580-c19786752be6',
  5,
  'Common Pitfalls & Next Steps',
  'Common errors in clinical prescribing programmes include issuing authorisations without documented clinical rationale, failing to reconcile patient purchase limits across multiple authorised suppliers, and providing products whose CoA dates have lapsed beyond the acceptable window for the destination jurisdiction. Operators should ensure that their medical affairs teams proactively train prescribing clinicians on product shelf life, storage requirements, and reporting obligations for adverse events. The next step for operators entering or scaling clinical supply is to establish a Medical Information function capable of responding to clinician enquiries and providing post-market safety data, aligned to pharmacovigilance obligations in each active market.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 2: Pharmacy Dispensing Controls (clinical track)
-- module_id: 03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587
-- ============================================================
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  1,
  'Overview',
  'Pharmacy dispensing controls for cannabis medicines govern how authorised products move from the licensed supply chain into the hands of patients, and impose obligations on both manufacturers and dispensing pharmacists. In markets where cannabis medicines are classified as Schedule 8 (Australia), Betäubungsmittel (Germany), or Narcotic Drugs (Canada), pharmacies must implement specific storage, dispensing, and record-keeping controls that go beyond standard prescription medicines. Operators supplying into pharmacy channels must understand these controls to ensure their packaging, labelling, and documentation meet the requirements that pharmacists need to dispense legally and efficiently. Failure to align product presentation with pharmacy workflow requirements is one of the most common causes of supply chain friction in regulated cannabis markets.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  2,
  'Scheduling Classifications & Storage Obligations',
  'Cannabis medicines are subject to controlled substance scheduling in virtually every regulated market, imposing specific storage requirements at the pharmacy level. In Australia, Schedule 8 products must be stored in a locked, fixed safe or vault that meets state health authority specifications, with separate registers maintained for each Schedule 8 substance. German pharmacies handling Betäubungsmittel (BtM) are required to store cannabis in a Class S steel safe per the BtMVV, maintain a separate BtM ledger updated within 24 hours of each transaction, and submit quarterly balance reports to the state authority. Canadian pharmacies dispensing cannabis under the Cannabis Regulations must maintain a controlled substance reconciliation log and conduct periodic physical inventory counts. Operators should confirm that their product unit sizes and packaging formats are compatible with the safe and dispensing infrastructure typical of pharmacies in each target market.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  3,
  'Labelling Standards for Dispensing Compliance',
  'Pharmacy-facing labelling for cannabis medicines must satisfy both the manufacturer''s regulatory obligations and the pharmacist''s ability to apply a dispensing label over or alongside the primary label without obscuring mandatory information. In Germany, finished cannabis medicines must display the BtM number, the product''s batch number, the cannabinoid content per unit and per container, and an expiry date in DD/MM/YYYY format. Australian TGA-listed or TGA-registered products must carry ARTG inclusion numbers where applicable, and labels must not make therapeutic claims beyond those approved in the product''s Schedule entry or indication list. Operators should test label layouts against the physical dispensing workflow — including the space available for pharmacist over-labelling — before committing to large production runs, as label recalls are costly and disruptive.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  4,
  'Dispensing Workflow & Patient Counselling',
  'Effective dispensing controls extend beyond physical security to encompass the pharmacist''s clinical role in cannabis medicine supply. In most regulated markets, dispensing pharmacists are expected to verify the prescriber''s authority, confirm the patient''s identity, check for potential drug-drug interactions (particularly with CNS depressants, blood thinners, and CYP450-metabolised medicines), and provide structured counselling on product use, storage at home, and driving restrictions. Operators can support pharmacy partners by providing pharmacist training modules, patient information leaflets in required languages, and direct-line medical information support. Markets with pharmacist-led dispensing models — including Germany, where pharmacies compound flower products to order — place additional demands on operators to supply accurate and up-to-date product monographs and stability data.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
  5,
  'Common Pitfalls & Next Steps',
  'Frequent dispensing compliance failures include pharmacies accepting product shipments without verifying that the accompanying documentation (CoA, import permit, BtM delivery receipt) is complete, and operators failing to provide sufficient advance notice of batch changes that require pharmacists to update their dispensing system records. Short-dated stock — product arriving at pharmacy with less than 6 months of shelf life remaining — is a significant source of waste and returns claims in pharmacy channels. The next step for operators building pharmacy distribution networks is to establish a pharmacy account management programme that provides timely communication on batch changes, shelf life, and product discontinuations, and to implement a product return and destruction workflow that satisfies BtM or Schedule 8 disposal requirements in each market.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 3: GMP Compliance Essentials (compliance track)
-- module_id: edc533ae-e077-4eac-8cb4-01f974a4ce5d
-- ============================================================
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  1,
  'Overview',
  'Good Manufacturing Practice (GMP) certification is the gateway requirement for accessing virtually every regulated international cannabis export market. EU-GMP (Annex 1 for sterile products and general GMP for non-sterile cannabis preparations), WHO-GMP, and PIC/S GMP standards form the core frameworks that regulators in Germany, Australia, the UK, Israel, and other importing markets use to assess whether foreign-produced cannabis medicines meet the quality standards required for patient safety. For cannabis operators, achieving and maintaining GMP certification is not a one-time event but an ongoing operational discipline that touches every function — from cultivation and extraction to packaging, laboratory testing, and distribution. This module provides a practical foundation in GMP principles as they apply to the cannabis sector.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  2,
  'Core GMP Principles Applied to Cannabis',
  'The ten core GMP principles — quality management, personnel, premises and equipment, documentation, production, quality control, contract manufacture and analysis, complaints and recalls, self-inspection, and change control — all apply to cannabis manufacturing with industry-specific nuances. Cannabis cultivation under GMP requires validated growing environments with controlled humidity, temperature, and lighting, along with documented pesticide management programmes and seed-to-harvest traceability. Extraction and processing operations must use validated methods with established critical process parameters, and all equipment must be qualified (IQ/OQ/PQ) and subject to a preventive maintenance schedule. GMP-compliant cannabis manufacturers must maintain a Pharmaceutical Quality System (PQS) documented in a Site Master File (SMF) that describes all manufacturing activities performed at the licensed site.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  3,
  'EU-GMP Certification Process',
  'EU-GMP certification for cannabis manufacturers is granted by a competent authority in an EU/EEA member state following a successful inspection of the manufacturing site. The process typically begins with a manufacturer applying for a Manufacturing and Import Authorisation (MIA) or equivalent national licence, submitting a detailed Site Master File, and undergoing an announced on-site inspection by the competent authority''s inspectorate team. Inspections assess conformance with EU GMP guidelines (EudraLex Volume 4) across all manufacturing steps and may result in the issuance of a GMP certificate valid for up to three years, subject to re-inspection. Non-EU manufacturers — such as those in Canada, Australia, or Colombia — can achieve EU-GMP recognition through bilateral Mutual Recognition Agreements (MRAs) or by applying directly to a member state authority and undergoing an overseas inspection, a process that can take 12–24 months and cost €150,000–€400,000 in preparation and inspection fees.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  4,
  'Documentation & Change Control',
  'GMP documentation underpins the entire quality system and is one of the most frequently cited areas of non-conformance during inspections. Cannabis manufacturers must maintain a full set of Standard Operating Procedures (SOPs), Batch Manufacturing Records (BMRs), Batch Packaging Records (BPRs), equipment qualification protocols, and analytical method validation reports. Change control is the formal process by which any modification to a validated process, material, equipment, facility, or document is assessed for quality impact before implementation — a requirement that prevents unauthorised changes that could compromise product quality or regulatory compliance. Operators building GMP systems should implement electronic document management systems (eDMS) capable of version controlling SOPs, managing approval workflows, and generating audit trails that are available for regulatory inspection without manual reconstruction.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
  5,
  'Common Pitfalls & Next Steps',
  'The most common GMP non-conformances identified during cannabis facility inspections include inadequate environmental monitoring programmes for controlled manufacturing areas, incomplete or retrospectively completed batch records, pest control programmes that lack documented effectiveness data, and calibration schedules that are not adhered to on time. Personnel training records are a frequent inspection finding — GMP requires documented evidence that every person performing GMP-critical tasks has been trained against the current version of the relevant SOP. Operators preparing for a first GMP inspection should conduct a gap assessment against EudraLex Volume 4 or the relevant national GMP guide, remediate identified gaps, and perform a full internal mock inspection at least 60 days before the scheduled regulatory inspection to allow time for corrective actions.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 4: Building a Proof Pack (compliance track)
-- module_id: cb3bf297-51ed-4c85-bded-7370e1748d94
-- ============================================================
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  1,
  'Overview',
  'A "Proof Pack" is the compiled dossier of regulatory, quality, and legal documentation that a cannabis operator presents to importers, regulators, distribution partners, and institutional buyers to demonstrate that their products and operations meet the required standards for market entry. In the cannabis industry, where trust is built on documentation rather than brand history, a well-structured Proof Pack is a competitive differentiator and a prerequisite for closing high-value distribution agreements. Proof Packs vary by market and counterparty, but typically include GMP certificates, Certificates of Analysis, import/export permits, product registrations, and corporate compliance declarations. This module walks through the components of a complete Proof Pack and how to assemble, maintain, and present it effectively.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  2,
  'Core Documents Every Proof Pack Needs',
  'The foundational documents in any cannabis Proof Pack include: (1) a current GMP Certificate issued by a recognised competent authority, with the scope statement confirming coverage of the specific product type being supplied; (2) Certificates of Analysis (CoA) for each batch offered, issued by a GMP-compliant or ISO 17025-accredited laboratory, covering potency, residual solvents, pesticides, heavy metals, microbiology, and mycotoxins; (3) a valid export licence or permit from the country of origin confirming the specific shipment or product category is authorised for export; (4) a product specification sheet or Technical Data Sheet that provides shelf life, storage conditions, packaging description, and cannabinoid profile; and (5) a Certificate of Origin where required by the destination country''s import authority. Each document must be current — expired GMP certificates or CoAs older than 12 months are common reasons for shipment rejection at customs.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  3,
  'Market-Specific Documentation Requirements',
  'Proof Pack requirements vary significantly by destination market, and operators must maintain market-specific document sets rather than a single universal dossier. Germany requires BtM import permits referencing specific batch quantities and UN narcotic codes, and the importer must be named on the export permit. Australia requires TGA import permits referencing the specific consignment, and the TGA may request a Foreign Government Certificate (FGC) from the exporting country''s health authority. The UK requires Home Office import licences that must be applied for well in advance of shipment. Israel''s IMCA requires suppliers to hold recognised GMP certification and to provide product registration documentation or a Letter of Access to relevant dossiers. Operators serving multiple markets should maintain a document matrix tracking the status and expiry of every required document by market, updated on a rolling basis.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  4,
  'Maintaining & Updating Your Proof Pack',
  'A Proof Pack is only as strong as its most recently expired document. Operators must establish a document lifecycle management process that tracks expiry dates for all certificates and permits, triggers renewal applications well in advance of expiry (at least 90 days for GMP certificates, 60 days for permits), and ensures that updated documents are distributed to all counterparties holding current copies. GMP re-inspections must be scheduled proactively — waiting for a certificate to expire before beginning the renewal process can leave an operator without a valid certificate for months, effectively blocking all exports during that period. Quality Management Systems (QMS) should include a dedicated register of external regulatory documents with owner assignments, expiry dates, and renewal action triggers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'cb3bf297-51ed-4c85-bded-7370e1748d94',
  5,
  'Presenting Your Proof Pack to Buyers & Regulators',
  'When presenting a Proof Pack to a prospective importer or institutional buyer, organisation and accessibility matter as much as content. Buyers conducting due diligence on multiple suppliers will favour operators whose documentation is logically structured, indexed, and available in a secure digital data room with clearly labelled folders by document type and market. Regulators conducting import permit reviews require that documentation submitted with permit applications is self-contained — all referenced certificates and permits should be included as annexes rather than described by reference. Operators should prepare both a "public" version of their Proof Pack (for early-stage commercial discussions) and a "full" version (for formal regulatory submissions and distribution agreements) that includes confidential manufacturing and quality system information under NDA protection.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 5: Compliance Readiness Self-Assessment (compliance track)
-- module_id: 8d4ba66c-776e-44a2-9bc6-7c1e95054a83
-- ============================================================
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  1,
  'Overview',
  'A Compliance Readiness Self-Assessment is a structured internal audit process that allows cannabis operators to measure their current state of regulatory compliance against the requirements of their target markets before engaging regulators, importers, or institutional partners. Unlike a formal regulatory inspection — which carries the risk of enforcement action for identified deficiencies — a self-assessment is a proactive, low-risk mechanism for identifying and remediating compliance gaps. Well-executed self-assessments are used by leading operators to prepare for GMP inspections, licensing renewals, distribution partner due diligence, and capital raises where investors require evidence of regulatory standing. This module provides a framework for conducting a meaningful self-assessment across the key compliance domains relevant to international cannabis operations.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  2,
  'Assessment Domains & Key Questions',
  'A comprehensive compliance readiness assessment for a cannabis operator should cover at minimum five domains: (1) Licensing & Regulatory Standing — are all licences current, in-scope for current activities, and free from conditions or enforcement actions? (2) Quality Management System — is the QMS documented, implemented, and effective, with all SOPs approved and in use? (3) Product Quality & Testing — are all batches released against specification, with CoAs from qualified laboratories and shelf life data on file? (4) Supply Chain & Traceability — is seed-to-sale tracking functional, complete, and capable of generating the data required by destination market regulators? (5) Personnel & Training — are all staff trained against current SOPs, with records maintained and accessible? Each domain should be assessed against the specific requirements of target export markets, not just the operator''s domestic regulatory framework.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  3,
  'Running the Assessment: Process & Tools',
  'An effective self-assessment combines document review, staff interviews, physical facility walk-throughs, and data integrity checks. The assessment team should include internal quality and compliance staff supplemented by an external GMP consultant with direct experience in the target market''s inspection standards — external reviewers bring objectivity and knowledge of what inspectors actually look for in practice. Assessment findings should be recorded in a structured format — typically a gap analysis matrix — that captures the regulatory requirement, the current state, the identified gap, the risk classification (critical, major, minor), the proposed corrective action, the responsible owner, and the target completion date. Prioritisation of corrective actions should be risk-based, with critical gaps (those that would result in a failed inspection or product recall) addressed first.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  4,
  'Interpreting Results & Prioritising Remediation',
  'Self-assessment results should be presented to senior leadership in a format that communicates risk clearly and drives resource allocation decisions. A traffic-light scoring system — Red (critical gap, immediate action required), Amber (significant gap, action required within 30–60 days), Green (compliant or minor gap) — provides an accessible summary that non-technical executives can act on. Remediation timelines should be realistic: a critical data integrity gap in a laboratory information management system (LIMS), for example, may require months of system reconfiguration and revalidation, while an SOP that lacks a required section can be corrected in days. Operators should avoid the common trap of treating self-assessment as a paper exercise — remediation actions must be implemented, verified, and closed with documented evidence, not simply noted as "in progress."',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
  5,
  'Next Steps: From Assessment to Action',
  'Completing a self-assessment is the beginning of a compliance improvement cycle, not the end. Operators should establish a CAPA (Corrective and Preventive Action) register to track all identified gaps through to verified closure, conduct follow-up assessments at 60 and 90 days to confirm that corrective actions have been implemented effectively, and schedule the next full self-assessment no more than 12 months later. Operators preparing for a GMP inspection should aim to complete their self-assessment at least six months before the scheduled inspection date to allow sufficient remediation time. The self-assessment process itself — when documented with gap analyses, CAPA records, and closure evidence — serves as powerful evidence of a functioning quality culture that regulators and institutional partners find reassuring.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 6: Export Readiness 101 (export track)
-- module_id: 6bff2f95-b4b5-4487-8455-26a5d110e742
-- ============================================================
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  1,
  'Overview',
  'Export readiness for cannabis operators encompasses the full set of regulatory, quality, logistics, and commercial capabilities required to successfully ship products across international borders into regulated markets. The global medical cannabis export market exceeded USD 600 million in 2024 and is projected to grow substantially as Germany''s liberalised prescribing framework drives European demand, and as emerging markets in Southeast Asia and Latin America establish regulated import pathways. However, achieving consistent, compliant export operations requires significant preparation: most operators attempting their first international export underestimate the complexity of simultaneous compliance with both the exporting and importing country''s regulatory requirements. This module provides a structured roadmap for operators at any stage of export readiness.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  2,
  'EU-GMP Certification Requirements',
  'EU-GMP certification is the non-negotiable prerequisite for exporting cannabis medicines to Germany, and is recognised or required by the majority of other regulated importing markets including the Netherlands, Portugal, Poland, and the Czech Republic. The certification process requires a cannabis manufacturer to implement a Pharmaceutical Quality System conforming to EudraLex Volume 4, undergo a formal inspection by a competent authority from an EU/EEA member state or a country with a Mutual Recognition Agreement, and receive a GMP Certificate that explicitly covers the manufacturing scope being exported. Operators in non-MRA countries — such as Colombia, Thailand, or Jamaica — must apply directly to a European competent authority (commonly the Dutch IGJ, German BfArM/Länder authorities, or the Portuguese INFARMED) for an overseas inspection, a process requiring a minimum of 12 months lead time and meticulous inspection preparation. Without a current, in-scope GMP certificate, no EU country will grant an import permit for a commercial shipment.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  3,
  'Phytosanitary & Import Permits',
  'In addition to GMP certification, international cannabis shipments require a set of permits that must be obtained and coordinated between the exporter, the importer, and both countries'' competent authorities. On the export side, an export licence or permit is required from the national drug control authority — for example, Health Canada for Canadian exports, or the ANVISA for Brazilian exports — referencing the specific product, quantity, destination country, and importing entity. On the import side, the receiving country''s authority issues an import permit — Germany''s BtM import permit, Australia''s TGA import licence, the UK''s Home Office licence — that must be in hand before the shipment departs. Phytosanitary certificates, issued by the exporting country''s national plant health authority, are required for cannabis flower and other plant-derived products and confirm that the shipment is free from pests and plant diseases. Permit procurement lead times range from 2 weeks (some Australian TGA permits) to 8 weeks (German BtM permits), and shipments that arrive without valid permits face seizure and destruction.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  4,
  'GDP Logistics Requirements',
  'Cannabis medicines exported to regulated markets must be transported under conditions that maintain product integrity from manufacturer to end customer, in accordance with GDP (Good Distribution Practice) guidelines. Temperature-controlled logistics — typically 15–25°C ambient or 2–8°C for cold chain products — must be maintained throughout the cold chain with continuous temperature monitoring using validated data loggers that generate records available for regulatory review. GDP-compliant logistics providers must hold the appropriate narcotics handling authorisations in each country through which the shipment transits, and must be named in the relevant import and export permits where required by national regulations. Air freight is the dominant mode for international cannabis medicine shipments due to the narcotics handling complexity of sea freight and the shorter transit times that reduce temperature excursion risk. Operators should perform GDP qualification of each logistics provider before first use, including review of the provider''s narcotics security procedures, temperature mapping data, and deviation management processes.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '6bff2f95-b4b5-4487-8455-26a5d110e742',
  5,
  'Common Pitfalls',
  'The most frequent causes of export failure among cannabis operators include: GMP certificates that do not explicitly cover the exported product type (e.g. a certificate covering extraction but not flower); CoAs that do not include all analytes required by the destination market''s import permit conditions; permit applications submitted without all required attachments, causing weeks of delays; logistics providers without narcotics handling authorisations in transit countries; and shipments that arrive at the destination port without advance notification to the importer and customs broker, resulting in delayed clearance and temperature excursions. A less visible but equally damaging pitfall is currency and counterparty risk — export invoices denominated in a currency that the importer cannot readily convert, or distribution agreements that do not clearly allocate responsibility for permit procurement, customs costs, and shipment rejection liability.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 7: Genetics IP & Cultivar Documentation (genetics track)
-- module_id: 7520ef89-8758-4436-860c-e016c53a6d32
-- ============================================================
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  1,
  'Overview',
  'Intellectual property protection for cannabis genetics is an increasingly critical competitive concern as the industry matures and proprietary cultivars become key commercial differentiators. Cannabis breeders and cultivators face a unique IP landscape: unlike pharmaceutical drug patents, which protect molecules, cannabis genetics IP sits at the intersection of plant variety protection law, trade secret law, utility patents, and international biosafety agreements such as the Nagoya Protocol. Operators who fail to document and protect their cultivar IP risk losing competitive advantages through uncontrolled genetic propagation by partners or competitors, and may face Freedom to Operate challenges when entering markets where competing genetics have been protected. This module introduces the key IP mechanisms available to cannabis operators and the documentation practices that underpin them.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  2,
  'Plant Variety Protection & Utility Patents',
  'The two primary legal instruments for protecting cannabis cultivar IP are Plant Variety Protection (PVP) certificates and utility patents. PVP certificates, issued under UPOV Convention frameworks by national plant variety offices (e.g. CFIA in Canada, CPVO in the EU, IP Australia), grant the holder exclusive rights to produce, sell, and import a registered variety for 20–25 years, provided the variety satisfies the DUS criteria: Distinctness (clearly different from existing varieties), Uniformity (sufficiently uniform across plants), and Stability (remaining true to description after repeated propagation). Utility patents — available in the US and increasingly tested in other jurisdictions — offer broader protection covering not just the specific variety but the genetic traits themselves, potentially blocking competitors from breeding related cultivars. Cannabis operators building a commercial genetics programme should pursue PVP registration as a minimum and assess utility patent viability with IP counsel familiar with the jurisdiction''s evolving case law.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  3,
  'Cultivar Documentation Standards',
  'Robust cultivar documentation is the foundation of any IP protection or licensing programme and serves the dual purpose of satisfying regulatory traceability requirements and establishing a defensible prior art record. A cultivar dossier should include: the breeding history and parentage (to the extent not protected as a trade secret), morphological descriptors (plant height, leaf shape, flower structure, trichome density), chemotype profile (cannabinoid and terpene ratios across multiple grow cycles and environments), genetic fingerprinting data (STR or SNP profiles generated by an accredited laboratory), and a phenotypic stability report demonstrating consistent expression across at least three independent grow cycles. Operators exporting genetics-derived products should also document the provenance of parent material in compliance with the Nagoya Protocol on Access and Benefit Sharing, which requires documented consent and benefit-sharing agreements when genetic resources originate from countries that are parties to the protocol.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  4,
  'Licensing & Commercialising Cultivar IP',
  'Proprietary cultivar IP can be commercialised through licensing agreements, joint ventures, and exclusive supply arrangements that generate revenue streams independent of the operator''s own production capacity. A cultivar licence should specify the licensed territory, the permitted use (propagation for own production only vs. sub-licensing), royalty structures (per-gram of flower produced, per-clone supplied, or percentage of net revenue), quality standards the licensee must maintain to protect the cultivar''s reputation, and audit rights allowing the licensor to verify compliance. Operators licensing genetics internationally must ensure that the licence agreement is governed by a law that provides effective enforcement mechanisms, and that the agreement addresses the risk of genetic drift or unauthorised cross-breeding by the licensee. Trade secret protection — maintaining cultivar parentage information as confidential, with access controlled through NDAs — is often used alongside formal IP registration to create a layered protection strategy.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '7520ef89-8758-4436-860c-e016c53a6d32',
  5,
  'Common Pitfalls & Next Steps',
  'Common genetics IP failures include sharing cultivar material with prospective partners before formal IP protection is in place or NDAs are signed, failing to document the chain of custody of genetic material from breeding through propagation, and not conducting freedom-to-operate searches before commercialising a new cultivar in a market where competitors may hold blocking IP. Operators frequently underestimate the time required for PVP registration — the examination process typically takes 2–4 years from filing, during which time the applicant must maintain the variety in growing trials available for examination by the plant variety office. The next steps for operators serious about genetics IP are to appoint an IP attorney specialising in plant variety rights, commission a genetic fingerprinting exercise across all commercial cultivars, and establish an internal IP register that tracks registration status, licensing agreements, and renewal obligations by jurisdiction.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 8: Importer / Buyer Pathway Guide (import track)
-- module_id: b65b8dbd-4e12-46fe-8928-99cf520770b1
-- ============================================================
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  1,
  'Overview',
  'Navigating the importer and buyer landscape is one of the most strategically important — and least standardised — activities for a cannabis exporter entering a new market. In regulated cannabis markets, the importer is often not just a logistics intermediary but a licensed entity with direct regulatory accountability, typically holding an import licence, a wholesale distribution authorisation, and in some markets a narcotics handling permit that cannot be transferred. Understanding who the key licensed importers are in each target market, what their commercial requirements and due diligence standards look like, and how to structure agreements that align incentives between exporter and importer is essential for building a sustainable international distribution business. This module guides operators through the importer identification, qualification, and contracting process in major cannabis importing markets.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  2,
  'Identifying Licensed Importers by Market',
  'In most regulated cannabis markets, the universe of licensed importers is limited and publicly identifiable through national regulatory registers. Germany''s BfArM publishes a list of BtM licence holders; Australia''s TGA maintains a register of import licence holders; the UK''s Home Office and MHRA jointly oversee cannabis medicine importers. These registers are the starting point for market entry — operators should systematically identify all licensed importers in target markets and prioritise outreach based on their apparent commercial activity (recent import permit applications, public distribution announcements, or pharmacy network relationships). In some markets, particularly those where distribution is vertically integrated — such as the Netherlands, where Bedrocan holds a government-mandated supply monopoly — the importer universe is extremely limited and commercial entry requires negotiation with a single counterparty or government body.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  3,
  'Importer Due Diligence & Qualification',
  'Before entering a distribution agreement, cannabis exporters should conduct structured due diligence on prospective importers to assess their regulatory standing, financial capacity, market reach, and operational capability. Key due diligence areas include: verification of current import licence and narcotics handling authorisations; confirmation of GDP certification or equivalent quality certification; review of the importer''s pharmacy distribution network (number of pharmacies, geographic coverage, exclusive vs. non-exclusive arrangements with existing suppliers); financial standing (particularly relevant for small importers requesting extended payment terms or consignment arrangements); and reputational assessment (regulatory enforcement history, litigation records, industry references). Operators should also assess whether the importer has exclusive agreements with competing suppliers that could create conflicts of interest, and whether their distribution infrastructure is aligned with the product formats and volume profiles the exporter intends to supply.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  4,
  'Distribution Agreement Key Terms',
  'A well-structured cannabis distribution agreement is the commercial backbone of an international supply relationship and must address both commercial and regulatory dimensions that are specific to narcotics supply chains. Key commercial terms include: territory and exclusivity provisions (exclusive territory arrangements provide importers with protection against parallel imports but limit the exporter''s flexibility); minimum purchase commitments with quarterly ratchets that create accountability for distribution performance; pricing mechanisms indexed to an agreed benchmark (e.g. spot price for comparable product in the market) with annual review provisions; payment terms that protect the exporter against credit risk (letter of credit or advance payment for first shipments, net-30 thereafter with credit insurance); and termination provisions with adequate notice periods (minimum 6 months for exclusive arrangements) and IP return obligations. Regulatory terms must cover: responsibility for permit procurement and costs; product liability and recall procedures; compliance with destination market advertising restrictions; and data sharing obligations for pharmacovigilance reporting.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b65b8dbd-4e12-46fe-8928-99cf520770b1',
  5,
  'Common Pitfalls & Next Steps',
  'Exporters frequently encounter the following problems in importer relationships: importers who secure exclusive territory rights but fail to invest in market development, resulting in stagnant sales under an exclusive arrangement that blocks alternative distribution; shipments rejected by the importer for minor documentation deficiencies that, under the contract, transfer the logistics and destruction costs to the exporter; and pricing disputes arising from exchange rate movements not anticipated in the original agreement. Establishing a performance review cadence — quarterly commercial reviews, annual distribution audits — within the contract framework prevents small issues from becoming costly disputes. The next step for operators finalising their first distribution agreement is to engage a lawyer with specific experience in cross-border narcotics supply contracts, as standard commercial contract templates do not adequately address the regulatory obligations and enforcement risk specific to cannabis medicine supply chains.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 9: GDP Logistics & Cold Chain (logistics track)
-- module_id: af5161a6-07fd-4a1c-9ea7-bd125cd658fe
-- ============================================================
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  1,
  'Overview',
  'Good Distribution Practice (GDP) for cannabis medicines governs the conditions under which licensed products must be stored and transported to maintain their quality, safety, and integrity throughout the supply chain from manufacturer to patient. The EU GDP Guidelines (2013/C 343/01) and equivalent national frameworks (e.g. TGA GDP, UK MHRA GDP) impose obligations on all entities in the distribution chain — manufacturers, importers, wholesale distributors, and logistics providers — to implement quality systems, staff training programmes, temperature monitoring, and deviation management procedures. For cannabis medicines, GDP compliance is not merely a regulatory formality: products that experience significant temperature excursions, compression damage, or contamination during transport may degrade in potency or develop microbial contamination that renders them unfit for patient use. This module provides a practical guide to building a GDP-compliant cannabis logistics operation.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  2,
  'Temperature Control Requirements',
  'Cannabis medicines typically require one of two temperature storage and transport conditions: controlled room temperature (CRT, 15–25°C) for most dried flower, oil, and capsule products, or refrigerated (2–8°C) for certain formulations. GDP compliance requires that these conditions be maintained throughout the entire logistics chain — from the warehouse loading dock, through air freight transit (where ambient temperatures in aircraft holds can range from -30°C to +50°C without active temperature control), to the importer''s receiving facility. Temperature mapping studies must be conducted on all storage areas to demonstrate that specified conditions are maintained across seasonal temperature variations, and all transport containers used for temperature-sensitive products must be validated for their intended use conditions. Temperature monitoring using calibrated, continuous data loggers is mandatory for all regulated shipments, and the resulting data must be reviewed before each batch is released for distribution.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  3,
  'Narcotics Security in Transit',
  'Cannabis medicines classified as narcotic drugs under the UN Single Convention require enhanced security measures throughout transit that go beyond standard pharmaceutical GDP requirements. Air freight consignments must be declared to the airline as dangerous goods under IATA Dangerous Goods Regulations and may require specific handling instructions; in some jurisdictions, armed escort of high-value narcotic shipments is mandatory or commercially advisable. Warehousing and distribution facilities must hold the appropriate narcotics handling licences in each country of operation and must implement dual-access inventory controls (two-person authorisation for receipt, dispensing, and destruction), with all movements recorded in a narcotics register that is available for inspection by the competent authority at any time. Operators should conduct due diligence on every logistics provider and freight forwarder in their supply chain to confirm that their narcotics security procedures satisfy both legal requirements and the practical risk profile of each shipping lane.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  4,
  'GDP Qualification of Logistics Providers',
  'Before using any logistics provider for cannabis medicine shipments, operators should conduct a formal GDP qualification process that assesses the provider against EU GDP guidelines or the relevant national equivalent. The qualification process typically involves a paper-based review of the provider''s quality documentation (GDP certificate or equivalent, SOPs for cannabis handling, temperature monitoring validation reports, narcotics licence copies), followed by an on-site audit of the provider''s facilities and operational procedures. Qualification findings should be documented in a Supplier Qualification Report, with any identified gaps subject to a corrective action plan before first use. Qualification should be renewed at least every two years, or immediately following any significant change to the provider''s facilities, operational scope, or regulatory status. A Technical Agreement or Quality Agreement with each qualified logistics provider formally defines the responsibilities of each party and provides a contractual basis for audit rights, deviation reporting, and recall support.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
  5,
  'Deviation Management & Next Steps',
  'Temperature excursions, delayed shipments, and damaged packaging are inevitable in complex international logistics operations; what distinguishes GDP-compliant operators is the rigour of their deviation management process. Every identified deviation must be formally recorded, assessed for impact on product quality (typically by the Quality Assurance team, with input from the stability data for the affected product), classified by severity, and subjected to a documented impact assessment that either confirms the product remains within specification or recommends rejection and destruction. Root cause analysis and corrective/preventive actions must be documented and followed up to prevent recurrence. Operators building their GDP capabilities should prioritise selection of a GDP-certified cold chain logistics partner with demonstrated experience in narcotics handling, invest in validated temperature monitoring equipment that provides real-time visibility during transit, and establish clear escalation procedures so that out-of-specification conditions are communicated to QA within 24 hours of identification.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 10: Market Access Strategy (market track)
-- module_id: 5c3b131f-f733-4295-9f52-5d6cb2058410
-- ============================================================
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  1,
  'Overview',
  'Market access strategy for cannabis operators involves the systematic analysis, prioritisation, and execution of entry into regulated international markets, balancing regulatory readiness, commercial opportunity, and competitive dynamics. The global medical cannabis market is characterised by highly heterogeneous regulatory environments — ranging from fully liberalised prescription access in Germany and Australia to tightly controlled government-monopoly models in the Netherlands and nascent frameworks in emerging markets such as Thailand, Colombia, and Zambia. Effective market access strategy requires operators to continuously monitor regulatory developments, assess their own capability readiness against each market''s entry requirements, and allocate limited regulatory, commercial, and financial resources to the highest-return opportunities. This module provides a structured framework for market prioritisation and entry planning.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  2,
  'Market Prioritisation Framework',
  'A rigorous market prioritisation framework evaluates prospective markets across four dimensions: (1) Market Size & Growth — current patient volumes, prescription rates, and projected compound annual growth rate driven by regulatory liberalisation and clinician adoption; (2) Regulatory Accessibility — whether the market is open to imports, the complexity and cost of the regulatory pathway, and the enforced timeline from application to first legal shipment; (3) Competitive Intensity — the number of established suppliers, the concentration of market share among top importers, and whether the operator has a differentiated product or cost position; and (4) Capability Alignment — whether the operator''s current certifications, product formats, and documentation meet the market''s requirements without significant incremental investment. Markets are scored and ranked across these dimensions, with the resulting prioritisation matrix used to guide investment in regulatory submissions, commercial development, and logistics infrastructure.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  3,
  'Regulatory Pathway Analysis by Market',
  'Each target market requires a detailed regulatory pathway analysis that maps the specific sequence of licences, certifications, product registrations, and permit applications required to achieve first commercial shipment. For Germany, the pathway for a non-EU manufacturer involves: (1) achieving EU-GMP certification from a European competent authority; (2) identifying and contracting a licensed German importer holding a BtM Einfuhrlizenz; (3) obtaining a BtM export permit from the exporting country; (4) the importer applying for a BtM Einfuhrerlaubnis for the specific shipment; and (5) completing customs clearance with a registered customs agent experienced in narcotics handling. For Australia, the pathway involves TGA import licence verification by the importer, SAS Category B application or ARTG listing depending on the product classification, and TGA import permit application per shipment. Operators should map each step''s lead time, cost, and dependency on counterparty actions to build a realistic first-shipment timeline.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  4,
  'Competitive Positioning & Differentiation',
  'In increasingly competitive regulated cannabis markets, commodity positioning — competing primarily on price — is a race to the bottom that favours operators with the lowest production costs. Sustainable market access is built on differentiation across multiple dimensions: product quality and consistency (demonstrated through CoA data and clinical outcomes evidence), supply reliability (proven track record of on-time, specification-compliant deliveries), service quality (responsive medical information, proactive communication on batch changes), and strategic alignment with importer and pharmacy partner needs. Operators with proprietary cultivars, unique extraction technologies, or clinical data packages have structural advantages that justify premium pricing and preferred supplier status. Market access strategy should explicitly address how the operator''s differentiation story is communicated to prospective importers, prescribers, and regulators — and should be backed by verifiable data rather than marketing claims.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '5c3b131f-f733-4295-9f52-5d6cb2058410',
  5,
  'Execution Planning & KPIs',
  'Translating market access strategy into execution requires a detailed market entry plan with defined milestones, resource requirements, and key performance indicators. Critical milestones typically include: GMP certificate issuance (trigger for regulatory submissions and importer negotiations), first import permit granted (trigger for first shipment preparation), first commercial shipment delivered (trigger for pharmacy onboarding and sales tracking), and first quarterly sales review with importer (trigger for market performance assessment and plan adjustment). KPIs for market access programmes should include: time from strategy approval to first shipment, shipment acceptance rate (percentage of consignments cleared without rejection or significant delay), days of inventory at the importer level, pharmacist/prescriber feedback scores, and net revenue per kilogram by market. Monthly tracking of these KPIs against plan enables early identification of execution problems and data-driven resource reallocation.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 11: Lab Testing & QA Frameworks (quality track)
-- module_id: b64698bc-edf3-4b93-96fc-0e9c991a0135
-- ============================================================
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  1,
  'Overview',
  'Laboratory testing and quality assurance frameworks are the technical backbone of compliant cannabis medicine production, providing the analytical evidence that a product meets its specification before it is released for distribution and patient use. International cannabis operators face a particularly complex testing landscape: each importing market specifies its own required analytes, test methods, and acceptance limits, and a Certificate of Analysis that satisfies Canadian Health Canada requirements may not satisfy German BfArM import permit conditions without additional testing. Building a fit-for-purpose QA framework that efficiently satisfies multi-market testing requirements — while maintaining the data integrity standards required for GMP compliance — is one of the most technically demanding challenges in international cannabis operations. This module provides a comprehensive overview of testing requirements and QA framework design.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  2,
  'Required Analyte Panels by Market',
  'Cannabis medicines destined for regulated markets must be tested for a defined set of analytes, and the specific requirements vary materially between jurisdictions. EU-GMP compliant products exported to Germany must typically be tested for: cannabinoid profile (THC, CBD, CBN, CBG, and other minor cannabinoids by HPLC), residual solvents (ICH Q3C Class 1 and 2 limits), pesticides (EU MRL list for herbs and teas, or pharmacopoeial limits), heavy metals (lead, cadmium, arsenic, mercury to Ph. Eur. 5.17 limits), microbiology (TAMC, TYMC, Enterobacteria, Salmonella, E. coli, Staphylococcus aureus, Candida albicans), and mycotoxins (aflatoxins B1, B2, G1, G2 and ochratoxin A). Australia''s TGA requires testing aligned to the Ph. Eur. or BP monographs applicable to the product type, with specific limits for THC in CBD-dominant products. Operators should maintain a living analyte matrix that maps each target market''s requirements to their standard test panel, identifying any gaps that require additional testing for specific shipments.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  3,
  'ISO 17025 & GMP Laboratory Qualification',
  'The analytical laboratories used to generate CoA data for regulated cannabis products must meet defined quality system standards. For GMP-manufactured products, in-house laboratories must implement a GMP-compliant quality system for all testing that supports batch release decisions, including analytical method validation, reference standard management, equipment qualification, and analyst training records. Where testing is contracted to external laboratories, those laboratories must be qualified as GMP contract testing organisations or hold ISO 17025 accreditation with the relevant test methods explicitly within their accreditation scope. ISO 17025 accreditation, awarded by national accreditation bodies (e.g. UKAS in the UK, DAkkS in Germany, NATA in Australia), demonstrates that a laboratory has validated its test methods against internationally recognised standards and is subject to regular technical assessments. Operators should verify laboratory accreditation scope before placing orders, as laboratories sometimes offer testing on methods not covered by their accreditation, generating data that regulators may not accept.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  4,
  'Batch Release & Specification Management',
  'The batch release process — the formal quality decision that a specific production batch meets its registered or approved specification and is fit for distribution — is a critical GMP control point. For cannabis medicines, batch release must be performed or authorised by a Qualified Person (QP) in EU-GMP markets, a role that carries personal legal liability for the quality of released batches. Specification management is the upstream discipline that defines what a product must meet at release and throughout its shelf life: specifications must be set based on validated manufacturing capability, clinical and regulatory requirements, and stability data, and must be formally approved before any batch is released against them. Operators must maintain a controlled specification register, ensure that specifications are aligned to what is stated on regulatory submissions and import permit applications, and implement a formal out-of-specification (OOS) investigation procedure for any batch result that falls outside the approved specification.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'b64698bc-edf3-4b93-96fc-0e9c991a0135',
  5,
  'Common Pitfalls & Next Steps',
  'Frequent QA failures in cannabis operations include reliance on CoA data from non-accredited laboratories, specification limits set without supporting stability data (causing batches to fail specification as they age during the distribution cycle), and analytical methods that have not been validated for the specific cannabis matrices being tested (leading to inaccurate results that are not discovered until challenged during a regulatory inspection). Data integrity — the completeness, consistency, and accuracy of analytical data — is a major focus of current regulatory inspection programmes; operators must ensure that their LIMS or laboratory record-keeping systems generate complete and unalterable audit trails. The next step for operators building QA frameworks is to conduct an analytical gap assessment, mapping current test panel and laboratory capabilities against the requirements of each active and planned market, and to develop a testing strategy that addresses gaps through validated method development or external laboratory qualification.',
  'text',
  NOW(), NOW()
),

-- ============================================================
-- Module 12: Regulatory Intelligence & Monitoring (regulatory track)
-- module_id: ac01db02-2182-43a3-a1f3-54fd05e56621
-- ============================================================
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  1,
  'Overview',
  'Regulatory intelligence — the systematic monitoring, analysis, and operationalisation of regulatory developments relevant to an operator''s business — is a strategic function that separates proactive operators from those who are perpetually reacting to regulatory changes that could have been anticipated. The cannabis regulatory landscape is among the most rapidly evolving in any industry: major structural reforms (Germany''s CanG 2024, Australia''s TGA rescheduling, Thailand''s reversal of decriminalisation, WHO scheduling recommendations) can fundamentally alter market access conditions, product requirements, and competitive dynamics within months. Operators who maintain a real-time regulatory intelligence capability can position for new market openings before competitors, anticipate product requirement changes in time to adapt manufacturing processes, and engage in regulatory consultations that shape the rules governing their industry. This module provides a framework for building and operationalising a regulatory intelligence function.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  2,
  'Monitoring Frameworks & Information Sources',
  'Effective regulatory intelligence begins with a structured monitoring framework that identifies the specific regulatory bodies, legislative bodies, and information channels relevant to each active and planned market. Primary sources include: official regulatory authority websites and gazette publications (BfArM, TGA, MHRA, Health Canada, INFARMED, IACM); parliamentary and legislative tracking services for bill progress in target markets; WHO and INCB publications on international drug scheduling and convention compliance; EU EMA guideline consultations relevant to cannabis medicines; and national pharmacopoeia updates. Secondary sources include: industry associations (EIHA, Cannabis Europe, Medicinal Cannabis Industry Australia, ACMPR); specialist law firms with regulatory cannabis practices; academic journals tracking regulatory change (Drug and Alcohol Review, Journal of Studies on Alcohol and Drugs); and commercial intelligence services. Operators should assign clear ownership for each monitored regulatory domain and establish a weekly intelligence digest process that surfaces relevant developments to operational decision-makers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  3,
  'Regulatory Change Impact Assessment',
  'When a material regulatory development is identified — a new consultation paper, an enacted legislative amendment, a change to import permit requirements — operators must rapidly assess its impact on their current operations, planned activities, and commercial agreements. A regulatory change impact assessment should address: which products, markets, or operational activities are affected; what the required operational response is (e.g. label change, new testing, revised submission); what the timeline for compliance is (immediate, phased, or prospective); what the cost and resource implications are; and what the competitive implications are (e.g. does the change disadvantage higher-cost operators in a way that creates a competitive opportunity?). Impact assessments should be documented, distributed to affected functional owners, and tracked through to the implementation of required responses. A register of regulatory changes under assessment, with status tracking, provides visibility to leadership and investors that regulatory risks are being actively managed.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  4,
  'Regulatory Engagement & Advocacy',
  'Beyond monitoring, leading operators actively engage in regulatory processes to shape the frameworks governing their industry. Participation in public consultations — submitting written responses to TGA consultation papers, appearing before parliamentary committees, contributing to European Monitoring Centre for Drugs and Drug Addiction (EMCDDA) data collection — allows operators to provide technical expertise that improves regulatory frameworks while simultaneously positioning the operator as a credible, constructive industry participant. Regulatory engagement is most effective when conducted collaboratively through industry associations, which provide greater weight and reach than individual company submissions, and when submissions are evidence-based, technically rigorous, and aligned to public health objectives rather than purely commercial interests. Operators building a regulatory engagement capability should appoint a Head of Regulatory Affairs or equivalent senior role with direct access to the CEO and Board, as regulatory outcomes at the strategic level require executive-level relationships with policy-makers.',
  'text',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'ac01db02-2182-43a3-a1f3-54fd05e56621',
  5,
  'Building a Regulatory Intelligence System',
  'A systematic regulatory intelligence function requires purpose-built tools and processes rather than ad hoc monitoring. Operators should implement a regulatory information management system — which may range from a structured Notion or SharePoint knowledge base to a specialist regulatory intelligence platform such as Citeline Regulatory or Cortellis — that captures regulatory developments, links them to affected products and markets, tracks assessment and response status, and generates automated alerts for upcoming deadlines and renewal dates. The system should be integrated with the operator''s QMS so that regulatory changes that require SOP updates, specification amendments, or training programme revisions automatically generate the relevant quality system change workflows. Finally, a quarterly regulatory horizon-scanning report — reviewed at Board level — that summarises the most significant regulatory developments in active and target markets, assesses their strategic implications, and recommends resource allocation adjustments, is the output that transforms regulatory intelligence from an operational function into a strategic asset.',
  'text',
  NOW(), NOW()
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622162331','seed_education_module_sections','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622162331_seed_education_module_sections.sql

-- RECOVERY BEGIN 20260622162900_register_gap_migration_versions.sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260622000001', 'market_metrics_time_series',        ARRAY['-- applied via gap_a_market_metrics_time_series']),
  ('20260622000002', 'trade_flows_structured',             ARRAY['-- applied via gap_b_trade_flows_structured']),
  ('20260622000003', 'operator_entity_graph',              ARRAY['-- applied via gap_c_operator_entity_graph_ddl and gap_c_operator_entity_graph_seed']),
  ('20260622000004', 'jurisdiction_schema_unification',    ARRAY['-- applied via gap_d_jurisdiction_schema_unification']),
  ('20260622000005', 'education_tracks_modules_seed',      ARRAY['-- applied via gap_e_education_tables_ddl, gap_e_education_track1_market_access, gap_e_education_track2_regulatory_compliance, gap_e_education_track3_country_intel, gap_e_education_track4_clinical_med, gap_e_education_track5_industry_intel']),
  ('20260622000006', 'stub_countries_classify',            ARRAY['-- applied via gap_f_add_seed_enum_value and gap_f_stub_countries_classify']),
  ('20260622000007', 'jurisdiction_playbooks_tier1_seed',  ARRAY['-- applied via gap_g_playbook_de, gap_g_playbook_au, gap_g_playbook_gb, gap_g_playbook_ca, gap_g_playbook_il, gap_g_playbook_nl, gap_g_playbook_co, gap_g_playbook_us, gap_g_playbook_uy, gap_g_playbook_th, gap_g_playbook_mt, gap_g_playbook_pt'])
ON CONFLICT (version) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622162900','register_gap_migration_versions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622162900_register_gap_migration_versions.sql

-- RECOVERY BEGIN 20260622181128_medical_cannabis_reference_system_init.sql
create extension if not exists pgcrypto;

create table if not exists reference_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

insert into reference_systems (name, version, content)
values (
  'Medical Cannabis Professional Reference System',
  '0.1.0',
  '{
    "system": "Medical Cannabis Professional Reference System",
    "created": "2026-06",
    "modules": [
      "Physician Handbook",
      "Nurse Handbook",
      "Pharmacist Handbook",
      "Toxicology Handbook",
      "Pharmacogenomics Handbook",
      "Product Quality & Manufacturing",
      "Hospital Medicine",
      "Surgery & Perioperative Care",
      "Mental Health",
      "Cannabis Use Disorder",
      "Regulatory Landscape",
      "Insurance & Reimbursement",
      "Health Economics",
      "Research Methods",
      "Global Formulary",
      "Future Technologies"
    ],
    "dependencies": {
      "Physician Handbook": ["Pharmacology", "Drug Interactions", "Evidence Grading", "Dosage Systems"],
      "Pharmacist Handbook": ["Product Quality", "Pharmacokinetics", "Drug Interactions"],
      "Nurse Handbook": ["Administration", "Monitoring", "Adverse Effects"],
      "Toxicology Handbook": ["Acute Effects", "Overdose Management", "Emergency Medicine"],
      "Surgery": ["Anesthesia Interactions", "Perioperative Management"],
      "Mental Health": ["Psychosis Risk", "Anxiety/Depression Evidence"],
      "CUD": ["Diagnostics", "Withdrawal", "Behavioral Interventions"]
    },
    "decision_support_objects": [
      "dosing_algorithms",
      "drug_interaction_matrix",
      "condition_treatment_trees",
      "risk_stratification_tools",
      "monitoring_protocols"
    ],
    "evidence_framework": {
      "levels": ["High", "Moderate", "Low", "Very Low"],
      "types": ["RCT", "Meta-analysis", "Observational", "Preclinical"],
      "grading_system": "modified_GRADE"
    },
    "databases": [
      "cannabinoids",
      "terpenes",
      "formulations",
      "drug_interactions",
      "clinical_indications"
    ],
    "note": "Expanded master TOC stored as system scaffold; full chapter expansion to be loaded as child tables or versioned JSON documents."
  }'::jsonb
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622181128','medical_cannabis_reference_system_init','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622181128_medical_cannabis_reference_system_init.sql

-- RECOVERY BEGIN 20260622181417_medical_cannabis_relational_schema_v1.sql
create extension if not exists pgcrypto;

-- SYSTEM MODULES
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(system_id, slug)
);

create index if not exists idx_modules_system_id on modules(system_id);

-- CHAPTERS
create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  name text not null,
  slug text not null,
  content_summary text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(module_id, slug)
);

create index if not exists idx_chapters_module_id on chapters(module_id);

-- SUBCHAPTERS
create table if not exists subchapters (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  name text not null,
  slug text not null,
  content text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(chapter_id, slug)
);

create index if not exists idx_subchapters_chapter_id on subchapters(chapter_id);

-- DECISION SUPPORT OBJECTS
create table if not exists decision_support_objects (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  type text not null,
  name text not null,
  schema jsonb,
  logic jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_dso_system_id on decision_support_objects(system_id);
create index if not exists idx_dso_type on decision_support_objects(type);
create index if not exists idx_dso_schema_gin on decision_support_objects using gin (schema);

-- EVIDENCE RECORDS
create table if not exists evidence_records (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references reference_systems(id) on delete cascade,
  source_type text not null, -- RCT, meta-analysis, observational, preclinical, guideline
  citation text not null,
  grade text not null, -- High, Moderate, Low, Very Low
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_evidence_system_id on evidence_records(system_id);
create index if not exists idx_evidence_grade on evidence_records(grade);
create index if not exists idx_evidence_source_type on evidence_records(source_type);

-- MODULE DEPENDENCIES (GRAPH EDGES)
create table if not exists module_dependencies (
  id uuid primary key default gen_random_uuid(),
  from_module_id uuid not null references modules(id) on delete cascade,
  to_module_id uuid not null references modules(id) on delete cascade,
  dependency_type text default 'requires',
  created_at timestamptz default now(),
  unique(from_module_id, to_module_id, dependency_type)
);

create index if not exists idx_module_dep_from on module_dependencies(from_module_id);
create index if not exists idx_module_dep_to on module_dependencies(to_module_id);

-- CHAPTER <-> DECISION SUPPORT MAPPING
create table if not exists chapter_decision_support_map (
  chapter_id uuid references chapters(id) on delete cascade,
  decision_support_id uuid references decision_support_objects(id) on delete cascade,
  primary key (chapter_id, decision_support_id)
);

-- SUBCHAPTER <-> EVIDENCE MAPPING
create table if not exists subchapter_evidence_map (
  subchapter_id uuid references subchapters(id) on delete cascade,
  evidence_id uuid references evidence_records(id) on delete cascade,
  primary key (subchapter_id, evidence_id)
);

-- PERFORMANCE NOTES (stored as comments for API developers)
-- Query patterns:
-- 1. module -> chapters -> subchapters drilldown via indexed FK chains
-- 2. evidence lookup by system_id + grade filtering
-- 3. decision support retrieval by type + system_id
-- 4. dependency graph traversal via module_dependencies


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260622181417','medical_cannabis_relational_schema_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260622181417_medical_cannabis_relational_schema_v1.sql

-- RECOVERY BEGIN 20260623000002_seed_genetics_collaboration_projects.sql
-- seed: genetics_collaboration_projects — 10 public collaboration projects
-- visibility = 'public_summary' so they appear on /genetics/collaboration
-- ON CONFLICT (slug) DO NOTHING — safe to re-run

INSERT INTO genetics_collaboration_projects (
  title, slug, project_type, visibility, status,
  country_code, jurisdiction_label,
  public_summary, evidence_needed
) VALUES

(
  'EU-GMP Equivalence Documentation for Colombian Cultivars',
  'eu-gmp-equivalence-colombia',
  'verification_project',
  'public_summary',
  'open',
  'CO', 'Colombia',
  'Seeking EU-licensed manufacturing partner to co-develop the GMP equivalence documentation package for Colombian-origin cannabis. INVIMA cultivation licence in place; manufacturing GMP certification pathway is the active bottleneck for European export.',
  'EU-GMP certified manufacturing partner; QP availability for batch certification; prior experience with third-country manufacturing equivalence submissions to EMA or a national medicines authority.'
),

(
  'High-CBD Phenotype Stability Trial — Northern Europe',
  'cbd-stability-trial-northern-europe',
  'trial_project',
  'public_summary',
  'open',
  'NL', 'Netherlands',
  'Multi-site phenotype stability assessment for a CBD-dominant cultivar across controlled indoor environments in the Netherlands, Germany, and Denmark. Seeking licensed research cultivation partners with GMP or GACP-certified facilities.',
  'GMP or GACP-certified cultivation research facility; analytical testing capability (HPLC cannabinoid profiling); willingness to share batch CoA data under an MTA framework.'
),

(
  'South African Landrace Provenance Documentation',
  'sa-landrace-provenance-documentation',
  'research_collaboration',
  'public_summary',
  'open',
  'ZA', 'South Africa',
  'Academic and commercial provenance documentation project for sativa-dominant landraces from the Drakensberg and Lesotho corridor. Seeking partnership with a South African research institution or licensed cultivator for formal genetic characterisation.',
  'South African institutional ethics clearance or licensed cultivation permit; access to landrace material with documented origin; willingness to participate in published genetic characterisation.'
),

(
  'Pharmaceutical Terpene Profile Standardisation — Australian Phenotypes',
  'pharma-terpene-standardisation-australia',
  'research_collaboration',
  'public_summary',
  'open',
  'AU', 'Australia',
  'Collaboration to develop standardised terpene profiling methodology and batch specification ranges for Australian-licensed cultivars targeting TGA therapeutic goods pathways. Seeking accredited analytical partner.',
  'ISO 17025 accredited cannabis analytical laboratory; GC-MS terpene profiling capability; experience with TGA therapeutic goods documentation.'
),

(
  'Minor Cannabinoid Extraction Yield Optimisation',
  'minor-cannabinoid-extraction-yield',
  'research_collaboration',
  'public_summary',
  'open',
  'CA', 'Canada',
  'Seeking a Health Canada-licensed extraction facility partner to co-develop and document optimised extraction parameters for CBG, CBN, and THCV isolation from multi-cannabinoid cultivars. Data to be published under a joint research MTA.',
  'Health Canada extraction licence; CO2 or ethanol extraction with fraction separation capability; analytical HPLC capability or access; willingness to publish methodology under co-authorship framework.'
),

(
  'Israeli Cultivar Import Compliance Package for German Market',
  'israel-germany-import-compliance-package',
  'licensing_discussion',
  'public_summary',
  'open',
  'IL', 'Israel',
  'Developing a replicable compliance documentation package for IMCA-licensed Israeli cultivar export to German BfArM-authorised importers. Seeking a German-side import partner with narcotics import authorisation and experience with third-country EU-GMP recognition.',
  'BfArM-authorised German importer; experience with narcotics import certificates for non-EU-manufactured cannabis; willingness to co-develop import process documentation for future corridors.'
),

(
  'Hemp-Derived CBD Novel Food Dossier — EU Pathway',
  'hemp-cbd-novel-food-eu-dossier',
  'licensing_discussion',
  'public_summary',
  'open',
  'PT', 'Portugal / EU',
  'Seeking co-applicants for a joint EU Novel Food authorisation submission for standardised hemp-derived CBD isolate. Portuguese Infarmed and EFSA submission experience preferred. Open to consortium approach across 3–5 EU cultivators.',
  'EFSA submission experience or regulatory affairs partner with EU Novel Food track record; analytical data package for CBD isolate (identity, characterisation, stability, safety); EU-licensed cultivar origin documentation.'
),

(
  'New Zealand Balanced THC:CBD Export Feasibility Study',
  'nz-balanced-cultivar-export-feasibility',
  'verification_project',
  'public_summary',
  'open',
  'NZ', 'New Zealand',
  'Feasibility study for New Zealand near-1:1 balanced cultivar export to UK specials import pathway. Seeking a UK MHRA-registered importer or specials wholesaler to assess documentation requirements and co-develop export package.',
  'UK MHRA specials import authorisation; experience with Schedule 2 controlled drug import from non-EU countries; willingness to share import process documentation framework.'
),

(
  'GACP Certification Support for Thai Licensed Cultivators',
  'gacp-certification-thailand',
  'licensing_discussion',
  'public_summary',
  'open',
  'TH', 'Thailand',
  'Technical assistance project supporting Thai FDA-licensed cultivators in preparing for EU GACP certification. Seeking European GACP consultancy or certification body with experience in tropical-climate cultivation facilities.',
  'Demonstrated EU GACP inspection or audit experience; ability to conduct remote pre-inspection gap analysis; familiarity with Thai FDA cultivation licence framework.'
),

(
  'Cultivar Passport Cross-Registry Harmonisation Initiative',
  'cultivar-passport-cross-registry',
  'research_collaboration',
  'public_summary',
  'open',
  NULL, 'Global / Multi-jurisdiction',
  'Open initiative to develop a harmonised minimum data standard for cultivar passport registration across national genetics registries. Seeking participation from industry associations, national plant variety offices, and licensed breeder organisations across at least 3 jurisdictions.',
  'Institutional affiliation with a national plant variety office, breeders'' association, or accredited genetics research body; commitment to 3-meeting participation over 6 months; willingness to publish harmonised standard under Creative Commons.'
)

ON CONFLICT (slug) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623000002','seed_genetics_collaboration_projects','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623000002_seed_genetics_collaboration_projects.sql

-- RECOVERY BEGIN 20260623020935_clinical_education_readiness_unique_country.sql

-- Make the readiness seed idempotent: without a unique key, "on conflict do nothing"
-- never matches and re-running the seed would duplicate rows.
alter table public.clinical_education_country_readiness
  add constraint clinical_education_country_readiness_country_key unique (country);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623020935','clinical_education_readiness_unique_country','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623020935_clinical_education_readiness_unique_country.sql

-- RECOVERY BEGIN 20260623021714_document_public_dto_definer_views.sql

do $$
declare v text;
begin
  foreach v in array array[
    'marketplace_public_listings_v1','public_country_profile_dto','signals_intelligence_feed',
    'genetics_public_profiles','genetics_public_claims','genetics_public_cultivar_passports',
    'genetics_public_cultivar_aliases','genetics_public_country_opportunities',
    'genetics_public_evidence_summaries','genetics_public_collaboration_projects',
    'genetics_public_service_providers'
  ]
  loop
    execute format(
      'comment on view public.%I is %L', v,
      'Intentional SECURITY DEFINER public DTO: exposes only whitelisted columns of public rows. '
      || 'Do NOT convert to security_invoker without granting anon base-table SELECT (column over-exposure). Reviewed exception.'
    );
  end loop;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623021714','document_public_dto_definer_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623021714_document_public_dto_definer_views.sql

-- RECOVERY BEGIN 20260623021715_seed_clinical_education.sql
-- Seed clinical education content (idempotent). Generated from lib/fixtures/clinical-education.ts

insert into public.clinical_education_modules
 (id,slug,title,route,audience,module_status,risk_level,public_summary,education_themes,safe_language,restricted_language,research_status,professional_review_required,source_basis,reviewer_role_required,audience_boundary,last_reviewed,next_review_due,public_use_approved,medical_advice_boundary,country_relevance,format_relevance,disclaimer_type,cta_label,cta_href,sort_order)
values
  ($ce$clinical-overview$ce$, $ce$clinical-education$ce$, $ce$Harbourview Clinical Education$ce$, $ce$/network/clinical-education$ce$, array[$ce$doctors$ce$, $ce$pharmacists$ce$, $ce$clinics$ce$, $ce$regulated participants$ce$]::text[], $ce$Live$ce$, $ce$low$ce$, $ce$Medical cannabis access can expand faster than professional training. Harbourview Clinical Education organizes professional education themes for regulated markets.$ce$, array[$ce$professional education gap$ce$, $ce$product forms$ce$, $ce$country readiness$ce$, $ce$professional review$ce$]::text[], array[$ce$professional education$ce$, $ce$country readiness$ce$, $ce$documentation expectations$ce$]::text[], array[$ce$individualized instruction wording$ce$, $ce$treatment-direction wording$ce$]::text[], $ce$Live framework$ce$, false, $ce$professional-orientation$ce$, array[$ce$Harbourview editorial review$ce$]::text[], $ce$commercial-professional$ce$, $ce$2026-05-17$ce$::date, $ce$Before jurisdiction-specific publication or patient-facing reuse$ce$, true, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$all formats$ce$]::text[], $ce$standard$ce$, $ce$Request Education Support$ce$, $ce$/network/clinical-education/request$ce$, 0),
  ($ce$dosage-forms$ce$, $ce$dosage-forms$ce$, $ce$Dosage Forms & Routes$ce$, $ce$/network/clinical-education/dosage-forms$ce$, array[$ce$doctors$ce$, $ce$pharmacists$ce$, $ce$importers$ce$, $ce$licensed producers$ce$]::text[], $ce$Live$ce$, $ce$medium$ce$, $ce$A basic education module explaining product forms and routes at a professional overview level.$ce$, array[$ce$oral formats$ce$, $ce$capsules$ce$, $ce$softgels$ce$, $ce$dried formats$ce$, $ce$extracts$ce$, $ce$routes of administration$ce$]::text[], array[$ce$product forms$ce$, $ce$product formats$ce$, $ce$route of administration$ce$]::text[], array[$ce$individualized amount wording$ce$, $ce$prescribing instruction wording$ce$]::text[], $ce$Live basic format education$ce$, false, $ce$professional-orientation$ce$, array[$ce$Harbourview editorial review$ce$, $ce$Clinical/pharmacy reviewer before jurisdiction-specific use$ce$]::text[], $ce$professional-only$ce$, $ce$2026-05-17$ce$::date, $ce$Before any dose, condition, country or patient-facing adaptation$ce$, true, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$oils$ce$, $ce$capsules$ce$, $ce$softgels$ce$, $ce$flower$ce$, $ce$extracts$ce$]::text[], $ce$dosage$ce$, $ce$Request Format Education Support$ce$, $ce$/network/clinical-education/request$ce$, 1),
  ($ce$product-documentation$ce$, $ce$product-documentation$ce$, $ce$COAs, Potency & Product Documentation$ce$, $ce$/network/clinical-education/product-documentation$ce$, array[$ce$pharmacists$ce$, $ce$importers$ce$, $ce$licensed producers$ce$, $ce$compliance teams$ce$]::text[], $ce$Live$ce$, $ce$low$ce$, $ce$A basic documentation education module covering certificates, profiles, batch references, testing, storage conditions and documentation standards.$ce$, array[$ce$certificates$ce$, $ce$potency$ce$, $ce$batch documentation$ce$, $ce$testing$ce$, $ce$storage conditions$ce$]::text[], array[$ce$certificate basics$ce$, $ce$potency$ce$, $ce$documentation expectations$ce$]::text[], array[$ce$private document wording$ce$, $ce$inventory wording$ce$]::text[], $ce$Live basic documentation education$ce$, false, $ce$professional-orientation$ce$, array[$ce$Harbourview editorial review$ce$, $ce$QA/regulatory reviewer before route-specific reliance$ce$]::text[], $ce$commercial-professional$ce$, $ce$2026-05-17$ce$::date, $ce$Before batch-specific, country-specific or QP-facing adaptation$ce$, true, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$all formats$ce$]::text[], $ce$standard$ce$, $ce$Request Documentation Education Support$ce$, $ce$/network/clinical-education/request$ce$, 2),
  ($ce$formulas-ratios$ce$, $ce$formulas-ratios$ce$, $ce$Formulas & Ratios$ce$, $ce$/network/clinical-education/formulas-ratios$ce$, array[$ce$doctors$ce$, $ce$pharmacists$ce$, $ce$licensed producers$ce$, $ce$importers$ce$]::text[], $ce$Research in progress$ce$, $ce$high$ce$, $ce$A research-stage module for professional education around formulas and ratios.$ce$, array[$ce$formula considerations$ce$, $ce$ratio concepts$ce$, $ce$professional considerations$ce$]::text[], array[$ce$formula considerations$ce$, $ce$ratio concepts$ce$, $ce$professional considerations$ce$]::text[], array[$ce$patient-matching wording$ce$, $ce$condition-selection wording$ce$]::text[], $ce$Research in progress$ce$, true, $ce$research-in-progress$ce$, array[$ce$Qualified clinical reviewer$ce$, $ce$Regulatory/promotional review before external use$ce$]::text[], $ce$professional-only$ce$, $ce$2026-05-17$ce$::date, $ce$Before public detail expansion or external reuse$ce$, false, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$all formulas$ce$]::text[], $ce$dosage$ce$, $ce$Request Formula Education Support$ce$, $ce$/network/clinical-education/request$ce$, 3),
  ($ce$onset-duration$ce$, $ce$onset-duration$ce$, $ce$Onset, Duration & Format Differences$ce$, $ce$/network/clinical-education/onset-duration$ce$, array[$ce$doctors$ce$, $ce$pharmacists$ce$, $ce$clinics$ce$]::text[], $ce$Professional review required$ce$, $ce$high$ce$, $ce$A professional-review-required module for timing and format-difference education.$ce$, array[$ce$onset concepts$ce$, $ce$duration concepts$ce$, $ce$format differences$ce$, $ce$monitoring implications$ce$]::text[], array[$ce$onset$ce$, $ce$duration$ce$, $ce$monitoring considerations$ce$]::text[], array[$ce$effect-promise wording$ce$, $ce$outcome-claim wording$ce$]::text[], $ce$Professional review required$ce$, true, $ce$professional-review-required$ce$, array[$ce$Qualified clinical reviewer$ce$, $ce$Medical/legal/promotional review before external use$ce$]::text[], $ce$professional-only$ce$, $ce$2026-05-17$ce$::date, $ce$Before any public detail expansion or clinical-use adaptation$ce$, false, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$multiple formats$ce$]::text[], $ce$dosage$ce$, $ce$Request Professional Review Briefing$ce$, $ce$/network/clinical-education/request$ce$, 4),
  ($ce$effects-monitoring$ce$, $ce$effects-monitoring$ce$, $ce$Patient-Reported Effects & Monitoring$ce$, $ce$/network/clinical-education/effects-monitoring$ce$, array[$ce$doctors$ce$, $ce$pharmacists$ce$, $ce$clinics$ce$]::text[], $ce$Professional review required$ce$, $ce$high$ce$, $ce$A professional-review-required module for reported effects and monitoring themes.$ce$, array[$ce$reported effects$ce$, $ce$subjective effects$ce$, $ce$adverse-effect awareness$ce$, $ce$monitoring$ce$]::text[], array[$ce$patient-reported effects$ce$, $ce$subjective effects$ce$, $ce$monitoring considerations$ce$]::text[], array[$ce$feeling-promise wording$ce$, $ce$suitability-claim wording$ce$]::text[], $ce$Professional review required$ce$, true, $ce$professional-review-required$ce$, array[$ce$Qualified clinical reviewer$ce$, $ce$Pharmacovigilance/safety reviewer before external use$ce$]::text[], $ce$not-patient-facing$ce$, $ce$2026-05-17$ce$::date, $ce$Before public detail expansion, safety-language reuse or clinical-use adaptation$ce$, false, $ce$Professional education only. Not medical advice, prescribing advice, patient-specific guidance, product recommendation or treatment direction.$ce$, array[$ce$global$ce$]::text[], array[$ce$all formats$ce$]::text[], $ce$patient-boundary$ce$, $ce$Request Effects & Monitoring Briefing$ce$, $ce$/network/clinical-education/request$ce$, 5)
on conflict (id) do nothing;

insert into public.clinical_education_country_readiness
 (country,region,professional_education_readiness,known_training_gap,official_guidance_status,formats_requiring_education,pharmacist_relevance,clinician_relevance,research_status,professional_reviewer_needed,brief_availability,sort_order)
values
  ($ce$Italy$ce$, $ce$Europe$ce$, $ce$Research in progress$ce$, $ce$Professionals may require clearer education on formats, documentation and local context.$ce$, $ce$To be researched$ce$, array[$ce$oils$ce$, $ce$flower$ce$, $ce$capsules$ce$]::text[], $ce$High$ce$, $ce$High$ce$, $ce$Research in progress$ce$, true, $ce$Available by request$ce$, 0),
  ($ce$New Zealand$ce$, $ce$Oceania$ce$, $ce$Official guidance to be reviewed$ce$, $ce$Professionals may require support understanding product forms and documentation.$ce$, $ce$Official sources to be reviewed$ce$, array[$ce$oils$ce$, $ce$capsules$ce$, $ce$dried flower where applicable$ce$]::text[], $ce$High$ce$, $ce$High$ce$, $ce$Research in progress$ce$, true, $ce$Available by request$ce$, 1),
  ($ce$Germany$ce$, $ce$Europe$ce$, $ce$Professional education remains relevant$ce$, $ce$Product formats, pharmacy workflows and documentation remain important education areas.$ce$, $ce$Official and professional sources to be reviewed$ce$, array[$ce$flower$ce$, $ce$extracts$ce$, $ce$oils$ce$, $ce$capsules$ce$]::text[], $ce$High$ce$, $ce$High$ce$, $ce$Research in progress$ce$, true, $ce$Available by request$ce$, 2)
on conflict (country) do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623021715','seed_clinical_education','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623021715_seed_clinical_education.sql

-- RECOVERY BEGIN 20260623095753_seed_us_territories.sql
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'puerto-rico','state','US','US-PR','Medical Legal',
'Puerto Rico is an unincorporated US territory with significant self-governance. Medical cannabis has been legal in Puerto Rico since 2015 under Executive Order OE-2015-10 (signed by Governor García Padilla), subsequently codified into Act 42-2017 (the Puerto Rico Medical Cannabis Act). Adults with qualifying conditions may obtain medical cannabis cards and purchase from licensed dispensaries. A dispensary network of approximately 120–150 licensed dispensaries operated across the island as of mid-2026. Personal possession limits and cultivation rules follow the regulatory framework established by the Department of Health. Federal cannabis prohibition (CSA) technically applies but federal enforcement in the medical context has been consistent with Cole Memo-era non-intervention policy.',
'Puerto Rico patients access medical cannabis through licensed dispensaries upon obtaining a medical cannabis card from a registered physician. Qualifying conditions include cancer, HIV/AIDS, PTSD, chronic pain, multiple sclerosis, Parkinson''s disease, and over 20 other conditions. Online pre-ordering and curbside pickup are available at many dispensaries. Card holders may possess up to 2.5 ounces (71g) per 14-day period.',
'Puerto Rico-licensed physicians may recommend medical cannabis to patients with qualifying conditions after a medical consultation. Physicians must register with the Department of Health''s SIMETRIA system. The medical cannabis recommendation is not a prescription in the DEA sense but a physician recommendation under territorial law. Telehealth recommendations are available.',
'Puerto Rico''s medical cannabis market has grown substantially since 2015. The dispensary sector generates approximately $300–400M USD annually. Tourism interest in Puerto Rico''s cannabis program has increased following adult-use legalisation in the continental US. Several mainland US cannabis companies have entered the Puerto Rico market. Local cultivators and processors operate under Department of Health licensing.',
'Puerto Rico''s medical-only framework is stable. The Legislative Assembly has debated adult-use legalisation but has not enacted it as of mid-2026. Federal rescheduling of cannabis (if it occurs at the federal level) would significantly affect Puerto Rico''s framework given its territorial relationship with the US federal government. Congressional representation considerations are relevant to any federal reclassification.',
'Puerto Rico Department of Health (Departamento de Salud) — Cannabis Medicinal Division; Puerto Rico Police Bureau (PRPB) for enforcement',
'Puerto Rico Department of Health SIMETRIA system data; Act 42-2017 and amendments; dispensary licence registry',
'Current as of Q2 2026; verified against Puerto Rico Department of Health official publications',
'Quarterly','Full territory briefing on Puerto Rico''s medical cannabis framework, dispensary market, patient card system, and adult-use legislative outlook',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND state_iso2='US-PR');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guam','state','US','US-GU','Medical Legal',
'Guam is an unincorporated US territory in the western Pacific. Medical cannabis has been legal in Guam since the Joaquin "KC" Concepcion II Compassionate Cannabis Use Act of 2014 (Public Law 32-237). The program was operationalised and dispensaries opened in 2019–2020 following rulemaking completion. A small number of licensed dispensaries (approximately 5–10) operate on the island. Qualifying patients may possess up to 2.5 ounces of dried cannabis. Guam has also passed adult-use cannabis legislation (Adult Use Cannabis Safety Act, Bill 213-35) though full adult-use retail implementation was still in progress as of mid-2026.',
'Guam medical cannabis patients access dispensaries with a patient registration card from the Department of Public Health and Social Services (DPHSS). Qualifying conditions include cancer, PTSD, chronic pain, HIV/AIDS, and other serious conditions. Patient numbers are growing but remain modest given the island''s ~160,000 population.',
'Guam-licensed physicians may recommend medical cannabis to patients with qualifying conditions. Physicians must be licensed to practice in Guam. Telehealth recommendations are available for some providers.',
'Guam''s cannabis market is small given its population. The adult-use framework, when fully operational, is expected to expand the market significantly and capture tourism demand from the large Japanese and South Korean tourist base. Several local operators hold both medical and anticipated adult-use licences.',
'Guam is transitioning toward adult-use retail implementation. The DPHSS is developing the regulatory framework for adult-use sales. Japan and South Korea''s strict cannabis prohibition creates reputational sensitivity around cannabis-related tourism in Guam — the territory must balance tourism market development against diplomatic sensitivities.',
'Guam Department of Public Health and Social Services (DPHSS) — Cannabis Control Division; Guam Police Department (GPD) for enforcement',
'DPHSS Cannabis Control Division published data; Guam Legislature cannabis laws; DPHSS patient registry data',
'Current as of Q2 2026; verified against DPHSS official publications and Guam Legislature records',
'Quarterly','Full territory briefing on Guam''s medical cannabis framework, adult-use implementation progress, Japanese/Korean tourism sensitivity, and Pacific regulatory context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND state_iso2='US-GU');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'us-virgin-islands','state','US','US-VI','Adult-Use Legal; Medical Legal',
'The US Virgin Islands (USVI) — comprising St. Croix, St. Thomas, and St. John — enacted adult-use cannabis legalisation via the Cannabis Use Act (Act 8279) signed by Governor Albert Bryan Jr. in 2021. The USVI was one of the first US jurisdictions to legalise adult-use cannabis, enabling possession of up to 1 ounce by adults 21+. A licensing framework for retail dispensaries, cultivators, and processors was established through the Virgin Islands Cannabis Advisory Board (VICAB) and the Bureau of Economic Development. Cannabis retail shops began opening in 2023. The USVI also has an active medical cannabis program established in 2019.',
'USVI medical cannabis patients registered under the medical program access dispensaries with a patient card. Medical patients may possess up to 4 ounces — a higher limit than the adult-use 1-ounce possession limit. Medical patients have access to a broader range of products and higher-potency formulations.',
'USVI-licensed physicians may recommend medical cannabis. The USVI Medical Cannabis Patient Protection Act establishes the framework. Telehealth recommendations are available.',
'The USVI adult-use retail market is developing. A small number of licensed adult-use dispensaries operate on St. Thomas and St. Croix as of mid-2026. Tourism demand from the US mainland is a significant market driver — St. Thomas is a major Caribbean cruise destination with approximately 2M+ annual tourists. Revenue potential relative to population (~100,000 residents) is substantial.',
'The USVI adult-use framework is maturing. The VICAB and Bureau of Economic Development continue to issue licences. Federal rescheduling could accelerate market investment. The USVI''s relationship with the US federal government creates the same CSA-federal conflict as the continental states.',
'Virgin Islands Cannabis Advisory Board (VICAB); Bureau of Economic Development (BED); Virgin Islands Police Department (VIPD) for enforcement; Department of Health for medical program',
'VICAB published licence data; BED regulatory publications; USVI Legislature records; Act 8279 (Adult-Use) and Act 7950 (Medical)',
'Current as of Q2 2026; verified against VICAB official publications',
'Quarterly','Full territory briefing on USVI adult-use and medical cannabis frameworks, tourism-driven market dynamics, and federal relationship context',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND state_iso2='US-VI');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'northern-mariana-islands','state','US','US-MP','Adult-Use Legal; Medical Legal',
'The Commonwealth of the Northern Mariana Islands (CNMI) was the first US jurisdiction — state or territory — to enact adult-use cannabis legalisation, via the CNMI Cannabis Act (Public Law 20-36) signed in September 2018. This predated even Illinois and Michigan''s adult-use legalisation. Adults 21+ may possess up to 1 ounce of cannabis and grow up to 6 plants at home. A licensing framework for cannabis businesses was established. The CNMI also has a medical cannabis programme. The CNMI''s small population (~50,000) and its position as a Pacific island commonwealth (with significant ties to Japan and China tourism) create a unique market context.',
'CNMI medical cannabis patients access registered dispensaries with a patient card issued by the Department of Public Health (DPH). Medical patients have access to higher quantities and a broader product range than adult-use consumers.',
'CNMI-licensed physicians may recommend medical cannabis under the medical programme.',
'The CNMI adult-use market is very small due to the limited resident population. Tourism — primarily from Japan, South Korea, and China — represents a theoretical market driver but cannabis consumption by these tourists is culturally sensitive and legally precarious (cannabis is prohibited in their home countries). Licensed retailers serve primarily local residents. Revenue is modest by US cannabis market standards.',
'The CNMI''s adult-use framework is established and stable. As a pioneering US adult-use jurisdiction, the CNMI has operational experience. Federal rescheduling developments will affect the CNMI on the same timeline as continental states. Japan and Chinese tourism sensitivity remains a consideration for marketing and retail positioning.',
'CNMI Cannabis Licensing Board (CLB); Department of Public Health (DPH); CNMI Department of Public Safety (DPS) for enforcement',
'CNMI CLB published licence data; DPH publications; CNMI Legislature records; Public Law 20-36',
'Current as of Q2 2026; verified against CNMI CLB official publications',
'Quarterly','Full territory briefing on CNMI''s pioneering adult-use status (first US adult-use jurisdiction, 2018), medical programme, small-population market, and Pacific tourism sensitivity',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND state_iso2='US-MP');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'american-samoa','state','US','US-AS','Prohibited',
'American Samoa is an unincorporated US territory in the South Pacific. Cannabis is prohibited under both US federal law (Controlled Substances Act) and American Samoa territorial law. American Samoa has not enacted medical or adult-use cannabis legislation and has shown no legislative interest in doing so. The territory is governed by a highly conservative sociocultural environment strongly shaped by Samoan fa''asamoa (traditional culture) and Congregationalist/LDS church influence, which is deeply opposed to substance liberalisation. American Samoa is the only US territory that has restricted birthright US citizenship — territorial nationals are US nationals but not automatically citizens, creating a distinct political relationship with Washington.',
'No medical cannabis programme exists in American Samoa. Patients with serious conditions requiring cannabis-based treatments would need to access US mainland frameworks, which is logistically very challenging.',
'American Samoan physicians are not authorised to recommend cannabis under any territorial framework.',
'No cannabis market exists or is contemplated. American Samoa''s geographic isolation, small population (~56,000), conservative culture, and high poverty rates make it effectively irrelevant to commercial cannabis market planning.',
'No cannabis reform is under consideration. American Samoa''s traditional governance structures (including Matai chieftain system) and church influence create strong institutional resistance to any substance liberalisation. Federal rescheduling would not automatically create a territorial medical programme.',
'American Samoa Department of Health; Department of Public Safety (DPS) for enforcement',
'American Samoa Government health publications; US federal CSA for law reference',
'Current as of Q2 2026',
'Annually','Territory briefing on American Samoa''s full prohibition status, fa''asamoa cultural context, conservative institutional resistance to reform, and absence of any cannabis market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND state_iso2='US-AS');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623095753','seed_us_territories','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623095753_seed_us_territories.sql

-- RECOVERY BEGIN 20260623095846_seed_french_overseas.sql
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guadeloupe','state','FR','FR-GP','Prohibited (Civil Penalty for Simple Use)',
'Guadeloupe is a French overseas department and region (DROM) in the Caribbean. French law applies in full. Under the Loi du 31 décembre 1970 and the 2020 civil forfait amendment, simple cannabis use is subject to a fixed €200 civil penalty (amende forfaitaire délictuelle) rather than criminal prosecution, though the underlying legal classification remains a criminal offence. Cultivation, sale, and trafficking remain serious criminal offences. No medical cannabis programme exists under French law — France''s Expérimentation du cannabis à usage médical (ECUM), launched nationally in 2021 and extended through 2025–2026, applies to metropolitan France and does not extend to overseas departments. CBD products containing <0.3% THC are legally sold in shops across Guadeloupe as throughout France.',
'No medical cannabis access is available in Guadeloupe under a local programme. Guadeloupean patients enrolled in clinical trials or the ECUM would need access via metropolitan French channels, which is logistically impractical. No overseas extension of ECUM is in place.',
'Guadeloupean physicians are not authorised to prescribe medical cannabis under ECUM or any other framework in the overseas department.',
'No legal cannabis retail market exists. CBD product retail is a growing legal market across Guadeloupe, paralleling metropolitan France trends. The Caribbean geography creates some informal market dynamics from nearby countries (Dominica, other Caribbean islands).',
'French government policy applies uniformly across DROMs. No separate Guadeloupe cannabis policy is possible. If France advances full medical legalisation post-ECUM, it would extend to Guadeloupe as a full department.',
'Préfet de la Guadeloupe; Agence régionale de santé (ARS) Guadeloupe; Gendarmerie nationale and Police nationale for enforcement',
'French Légifrance legislation portal; ANSM ECUM publications; ARS Guadeloupe health data',
'Current as of Q2 2026; verified against French national legislation and ANSM ECUM documentation',
'Annually','Overseas department briefing on Guadeloupe''s application of French cannabis law, €200 civil penalty for simple use, ECUM non-extension, and CBD market legality',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-GP');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'martinique','state','FR','FR-MQ','Prohibited (Civil Penalty for Simple Use)',
'Martinique is a French overseas department and region (DROM) in the Caribbean. French national cannabis law applies in full. Simple cannabis use carries a €200 civil forfeit; cultivation, sale, and trafficking remain criminal offences. No medical cannabis programme exists in Martinique — France''s ECUM medical trial does not extend to overseas departments. CBD products (<0.3% THC) are legal across Martinique as throughout France.',
'No medical cannabis access exists in Martinique under any formal programme. Martinican patients cannot access ECUM.',
'Martinican physicians are not authorised to prescribe medical cannabis.',
'No legal cannabis retail market. CBD retail is growing. Caribbean market dynamics (proximity to Saint Lucia and other islands) are background factors.',
'French national policy applies. No separate Martinique cannabis framework is possible. ECUM extension to overseas departments would require specific national legislative action.',
'Préfet de la Martinique; ARS Martinique; Gendarmerie nationale and Police nationale',
'French Légifrance; ANSM ECUM data; ARS Martinique health publications',
'Current as of Q2 2026',
'Annually','Overseas department briefing on Martinique''s application of French cannabis law, civil penalty for use, and CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-MQ');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'reunion','state','FR','FR-RE','Prohibited (Civil Penalty for Simple Use)',
'Réunion is a French overseas department and region (DROM) in the Indian Ocean. French national cannabis law applies in full. Simple use carries a €200 civil forfeit; cultivation, sale, and trafficking are criminal. No medical cannabis programme exists — ECUM does not extend to Réunion. CBD products (<0.3% THC) are legal as throughout France.',
'No medical cannabis access in Réunion under any formal programme.',
'Réunion physicians are not authorised to prescribe medical cannabis.',
'No legal retail cannabis market. CBD retail is growing. Réunion''s Indian Ocean location creates different informal market dynamics than the Caribbean DROMs.',
'French national policy applies uniformly.',
'Préfet de La Réunion; ARS Océan Indien; Gendarmerie nationale and Police nationale',
'French Légifrance; ANSM data; ARS Océan Indien publications',
'Current as of Q2 2026',
'Annually','Overseas department briefing on Réunion''s application of French cannabis law and CBD market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-RE');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'french-guiana','state','FR','FR-GF','Prohibited (Civil Penalty for Simple Use)',
'French Guiana is a French overseas department and region (DROM) on the northeastern coast of South America. French national cannabis law applies in full. Simple use carries a €200 civil forfeit; cultivation, sale, and trafficking are criminal. French Guiana''s unique geographic position — sharing land borders with Suriname (where cannabis use is broadly tolerated) and Brazil (adult-use legalisation advancing) — creates significant cross-border cannabis flow dynamics. No medical cannabis programme exists under ECUM. French Guiana also hosts the Guiana Space Centre (Centre Spatial Guyanais), which brings a significant international workforce with varied cannabis law backgrounds.',
'No medical cannabis access exists in French Guiana under any formal programme.',
'French Guiana physicians are not authorised to prescribe medical cannabis.',
'No legal retail cannabis market. French Guiana''s porous borders with Suriname and Brazil create significant informal cannabis market dynamics that differ markedly from the Caribbean DROMs. The Space Centre international workforce represents a distinctive consumer demographic.',
'French national policy applies. Border control challenges are significant given French Guiana''s Amazon frontier geography.',
'Préfet de la Guyane; ARS Guyane; Gendarmerie nationale and Douanes françaises (customs) for border enforcement',
'French Légifrance; ANSM data; ARS Guyane publications; OFDT border data',
'Current as of Q2 2026',
'Annually','Overseas department briefing on French Guiana''s French cannabis law application, Suriname/Brazil border dynamics, Space Centre context, and absence of legal cannabis market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-GF');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'french-polynesia','state','FR','FR-PF','Prohibited',
'French Polynesia is a French overseas collectivity (collectivité d''outre-mer) with a significant degree of autonomy through its Statute of Autonomy (2004). Criminal law — including drug prohibition — falls under French state competence. Cannabis is prohibited under French law as applied in French Polynesia. French Polynesia''s cannabis context is shaped by traditional Polynesian culture and the significant tourism industry (primarily from France, the US, and Australia). The €200 civil forfeit for simple use that applies in metropolitan France and the DROMs may not apply in French Polynesia in the same way, as it is a collectivité rather than a DROM.',
'No medical cannabis programme exists. Access to French ECUM is not available in French Polynesia.',
'French Polynesian physicians follow French medical law in areas of state competence. No cannabis prescribing is authorised.',
'No legal cannabis market. Tourism (Bora Bora, Moorea, Tahiti) creates consumer awareness from visiting nationals of adult-use legal jurisdictions, but no legal market accommodates this.',
'French Polynesia''s semi-autonomous status creates some regulatory nuance, but cannabis prohibition under French state law remains firmly in effect. No reform is under consideration locally or in Paris.',
'Haut-Commissariat de la République en Polynésie française; Direction de la Santé Polynésie française; Gendarmerie nationale for enforcement',
'Direction de la Santé publications; French state legislation as applied in French Polynesia; Haut-Commissariat publications',
'Current as of Q2 2026',
'Annually','Overseas collectivity briefing on French Polynesia''s cannabis prohibition under French state law, autonomy framework context, tourism dynamics, and absence of legal market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-PF');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,state_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'new-caledonia','state','FR','FR-NC','Prohibited',
'New Caledonia (Nouvelle-Calédonie) is a French special collectivity (collectivité sui generis) in the southwestern Pacific with extensive autonomy including a distinct legal and governmental framework established by the Nouméa Accord (1998). Criminal law remains within French state competence, and cannabis is prohibited under French criminal law as applied in New Caledonia. New Caledonia''s political situation is complex — three independence referenda (2018, 2020, 2021) all resulted in votes for continued association with France, but by narrowing margins.',
'No medical cannabis programme exists in New Caledonia. ECUM does not extend to New Caledonia.',
'New Caledonian physicians (under French licensing) are not authorised to prescribe medical cannabis.',
'No legal cannabis market. New Caledonia''s nickel mining economy and Pacific position create a distinct economic context.',
'New Caledonia''s unique sui generis status creates constitutional complexity, but cannabis prohibition under French state law is not subject to local legislative override. No reform is under local or national consideration.',
'Haut-Commissariat de la République en Nouvelle-Calédonie; Direction des Affaires Sanitaires et Sociales (DASS-NC); Gendarmerie nationale and Police nationale for enforcement',
'DASS-NC publications; French state legislation; Haut-Commissariat publications; Nouméa Accord for constitutional context',
'Current as of Q2 2026',
'Annually','Special collectivity briefing on New Caledonia''s cannabis prohibition under French state law, Nouméa Accord political context, Kanak customary framework, and absence of legal market',DATE '2026-06-22','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='FR' AND state_iso2='FR-NC');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623095846','seed_french_overseas','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623095846_seed_french_overseas.sql

-- RECOVERY BEGIN 20260623100137_seed_content_depth_updates.sql
UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Australia operates a nationally regulated medical cannabis framework administered by the Therapeutic Goods Administration (TGA) and the Office of Drug Control (ODC). The Special Access Scheme (SAS) and Authorised Prescriber (AP) pathway enable patients to access unapproved cannabis medicines. The April 2021 SAS-B reforms were transformative — they streamlined prescriber approval, eliminated mandatory specialist referral for most products, and produced a rapid expansion of patient numbers from ~30,000 in early 2021 to over 350,000 registered patients nationally by mid-2026. Adult-use cannabis remains federally prohibited under the Criminal Code Act 1995, though the ACT territory enacted personal decriminalisation in 2020 (personal possession up to 50g, cultivation up to 2 plants). Australia is a net exporter of medical cannabis oil and dried flower, with licensed producers exporting to Germany, the UK, and New Zealand.',
  patient_access = 'Patients access medical cannabis through GP or specialist SAS-B approvals (most products) or through Authorised Prescriber arrangements. SAS-B approvals are now largely self-managed by practitioners via the TGA''s Electronic SAS portal. Patient registration is maintained by individual approved prescribers; there is no national patient card system. Products range from CBD isolates and THC/CBD oils to dried flower for vaporisation. Pharmacy dispensing is the standard delivery mechanism. Many patients use dedicated cannabis clinics for initial consultations; telehealth is widely used across all states and territories.',
  physician_access = 'Since the April 2021 SAS reforms, any Australian-registered medical practitioner (GP or specialist) may prescribe most medical cannabis products under SAS-B without prior TGA individual approval. Products on the Therapeutic Goods Register (TGR) — predominantly CBD products — require no SAS approval. High-THC products and novel formulations still require SAS-B application. Authorised Prescriber status, available to specialists treating defined patient populations, allows repeated prescribing without individual SAS applications.',
  market_dynamics = 'Australia''s medical cannabis market was valued at approximately A$750M–900M in 2025 and is growing at 25–35% annually. Approximately 180+ licensed producers, importers, and manufacturers hold ODC licences. Dominant domestic players include Little Green Pharma, Cannatrek, Cann Group, and BOD Science. International supply from Canada, the Netherlands, and Israel supplements domestic production. The dried flower segment has grown fastest since vaporisation-device availability expanded. Cost remains a significant patient access barrier: typical patient spend is A$150–400/month, largely uncovered by Medicare.',
  regulatory_outlook = 'The TGA continues to refine the SAS framework. A formal review of medical cannabis scheduling is underway; rescheduling THC from Schedule 8 to a lower schedule for medical products is under active policy consideration as of mid-2026. Adult-use legalisation at the federal level remains politically sensitive — the Greens advocate for it; Labor has not committed; the Coalition opposes it.',
  data_source_summary = 'TGA SAS patient and prescriber data; ODC licensed producer, importer, and manufacturer lists; TGA Therapeutic Goods Register; ABS health survey data; KPMG/Arcview Australia market research',
  verification_summary = 'Current as of Q2 2026; verified against TGA and ODC official data',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'AU' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Canada was the second country globally (after Uruguay) and the first G7 nation to legalise adult-use cannabis nationally, via the Cannabis Act (Bill C-45, in force October 17 2018). The federal framework establishes possession limits (up to 30g in public), home cultivation rights (up to 4 plants per household), and minimum standards for retail licensing, product safety, and packaging. Each of the 10 provinces and 3 territories regulates its own retail distribution model — ranging from government monopolies (Quebec SQDC, Nova Scotia NSLC) to fully private markets (Alberta, Newfoundland). Over 4,000 licensed retail storefronts operate nationally as of mid-2026, generating approximately $6.0–7.5B CAD in annual legal retail sales. Canada is also a major medical cannabis jurisdiction serving over 500,000 registered patients.',
  patient_access = 'Medical patients register directly with federally licensed producers (LPs) under the ACMPR framework. Physicians or nurse practitioners authorise medical cannabis documents (not prescriptions); patients choose their LP and order directly via mail. No physical dispensaries are dedicated to medical-only patients; however, many retail stores also serve medical patients. Most provincial drug plans do not cover cannabis; WorkSafeBC and some First Nations health programs are exceptions.',
  physician_access = 'Canadian physicians and nurse practitioners may authorise cannabis under Health Canada''s ACMPR framework. There are no caps on the volume or number of authorisations. The Canadian Medical Association has issued guidance recommending caution for patients under 25, but these are not regulatory restrictions. Practitioners must complete a standard medical document specifying daily quantity.',
  market_dynamics = 'Canada''s legal cannabis market is the world''s most mature regulated market by years of operation. Legal retail has captured an estimated 75–80% of total cannabis market share nationally by 2026, up from ~25% at legalisation. Price compression has been dramatic — legal flower retails for as low as $4–6 CAD/gram in competitive provincial markets (Alberta, Ontario). Major LPs include Tilray, Canopy Growth, Aurora, Cronos, and HEXO; the sector has undergone significant consolidation. Export to Germany and Australia has become a strategic revenue stream for leading LPs.',
  regulatory_outlook = 'Health Canada is reviewing the Cannabis Act framework — a mandatory five-year review was completed in 2023 with recommendations including edibles reform, social equity provisions, and medical access improvements. Indigenous cannabis sovereignty — self-government nations operating outside provincial frameworks — is an evolving legal frontier.',
  data_source_summary = 'Health Canada Cannabis Act annual reports; Statistics Canada retail sales data; provincial regulatory authority data (AGCO, LCRB, AGLC, SQDC, etc.); Cannabis Council of Canada industry data',
  verification_summary = 'Current as of Q2 2026; verified against Health Canada and Statistics Canada official data',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'CA' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Germany enacted the Cannabisgesetz (CanG) which came into force on April 1 2024, making Germany the largest cannabis market in Europe to implement adult-use reform (Phase 1). Under CanG Phase 1, adults 18+ may possess up to 25g in public and 50g at home, cultivate up to 3 plants, and join non-commercial Cannabis Social Clubs (Anbauvereinigungen / CSCs) of up to 500 members. No commercial cannabis retail is permitted under Phase 1. Phase 2 of CanG, establishing a regulated commercial retail pilot in select regions, is pending federal authorisation. Germany''s medical cannabis programme has been in place since 2017 and now serves approximately 250,000+ registered patients.',
  patient_access = 'Medical cannabis patients in Germany access products through licensed pharmacies following physician prescription. Since CanG, medical cannabis products are also covered by statutory health insurance (GKV) for approved indications. Products dispensed include dried flower (for vaporisation), oils, extracts, and capsules. BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte) oversees medical cannabis quality standards.',
  physician_access = 'German physicians (Fachärzte and general practitioners) may prescribe medical cannabis under SGB V (statutory insurance code). Following CanG, GKV reimbursement is available for serious conditions where other treatments have failed or are inappropriate. Private prescription (PKV) is also available without the GKV evidence threshold.',
  market_dynamics = 'Germany is Europe''s largest medical cannabis market, generating approximately €800M–1.2B EUR annually. Post-CanG Phase 1, CSC formation has been uneven across Länder — progressive city-states (Berlin, Hamburg, Bremen) have issued many permits; Bavaria has blocked most applications. Canada, the Netherlands, Portugal, and Australia are the dominant import suppliers.',
  regulatory_outlook = 'Germany''s cannabis regulatory outlook is the most consequential in Europe. Phase 2 commercial retail pilot implementation timing remains uncertain as of mid-2026. The CDU/CSU has stated it would repeal CanG if it returns to federal government. Medical cannabis is broadly supported and unlikely to be reversed. Germany''s approach is closely watched by France, Italy, Spain, Austria, and Switzerland.',
  data_source_summary = 'BfArM medical cannabis quarterly data; Cannabisgesetz (CanG) federal legislation; Bundesrat voting records; Länder health ministry publications; IMC industry data',
  verification_summary = 'Current as of Q2 2026; verified against BfArM official data and CanG federal legislation',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'DE' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'The Netherlands maintains its iconic gedoogbeleid (tolerance policy) for cannabis — technically illegal under the Opium Act but tolerated for personal use and retail via licensed coffeeshops since the 1970s. Approximately 570 licensed coffeeshops operate nationwide. The fundamental legal contradiction (tolerated retail but unregulated supply — the "back door problem") is being addressed by the Experiment Gesloten Coffeeshopketen (EGCC) — the closed cannabis supply chain experiment — which began in pilot municipalities (Breda, Tilburg, and others) in 2023. Cannabis for medical use is available through the Bureau for Medicinal Cannabis (BMC) at pharmacies via physician prescription.',
  patient_access = 'Dutch medical cannabis patients access products through pharmacies with a physician prescription. The BMC manages the supply of standardised medical cannabis products (dried flower varieties: Bedrocan, Bedrobinol, Bediol, Bedica, Bedrolite). Zorgverzekeringswet (ZVW) health insurance covers medical cannabis for certain indications (notably multiple sclerosis, chronic pain with specific failed treatments).',
  physician_access = 'Dutch physicians prescribe medical cannabis under standard prescription authority. No specialist-only restriction exists. The KNMG (Royal Dutch Medical Association) has issued practice guidance. Medical cannabis can be prescribed for pain, nausea (oncology/HIV), multiple sclerosis spasticity, Tourette syndrome, and other indications.',
  market_dynamics = 'The Netherlands'' coffeeshop market generates approximately €1.0–1.5B EUR annually. Amsterdam''s coffeeshops account for approximately 30–40% of national coffeeshop revenue. The EGCC supply chain experiment is transitioning supply from illicit to licensed domestic cultivators. The experiment''s success is being monitored as a potential model for full national legalisation.',
  regulatory_outlook = 'The Netherlands is at a pivotal regulatory juncture. The EGCC experiment is the most significant cannabis policy development in Dutch history since the coffeeshop system was established. If deemed successful, the Dutch government may proceed to full national commercial cannabis legalisation. Political consensus is fragile: the Schoof coalition has maintained the experiment but full legalisation is not yet committed.',
  data_source_summary = 'Dutch Ministry of Justice and Security cannabis policy documents; BMC official data; Trimbos Instituut cannabis monitor; EGCC experiment progress reports; CBS (Statistics Netherlands) data',
  verification_summary = 'Current as of Q2 2026; verified against BMC official data and EGCC published progress reports',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'NL' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Spain has a distinctive de facto cannabis tolerance system based on constitutional privacy rights. Cannabis for personal private use (consumo privado) is decriminalised by interpretation of Article 18 of the Spanish Constitution. This has produced the Cannabis Social Club (CSC) model — member-only private associations that cultivate and distribute cannabis collectively to adult members. Approximately 700–1,000 CSCs operate across Spain, concentrated in Catalonia (Barcelona), the Basque Country, and other regions. Medical cannabis in the formal pharmaceutical sense is not available in Spain; Sativex (nabiximols) is the only approved cannabis-based medicine.',
  patient_access = 'Formal medical cannabis access in Spain is extremely limited. Sativex (nabiximols spray) is approved for multiple sclerosis spasticity and is reimbursable through the SNS for this specific indication. No broader medical cannabis programme exists. Patients with other conditions who seek cannabis access do so through CSC membership.',
  physician_access = 'Spanish physicians may prescribe Sativex for approved indications through normal pharmaceutical prescribing channels. No broader cannabis prescribing authority exists. Spanish medical associations (OMC) have called for a regulated medical cannabis framework but no legislation has been enacted.',
  market_dynamics = 'Spain''s CSC market is one of the most developed informal cannabis markets in Europe. Barcelona alone has hundreds of CSCs. Annual market value through CSCs is estimated at €500M–800M. CSC legal status remains contested — the Supreme Court (Tribunal Supremo) has issued limiting decisions on the "shared consumption" doctrine.',
  regulatory_outlook = 'Spain''s cannabis regulatory status is in active evolution. The PSOE-Sumar governing coalition commissioned a parliamentary cannabis commission report (completed 2023) recommending a regulated framework, but no legislation has been enacted as of mid-2026. The Basque Country''s CSC regulation (Ley 1/2017) has survived constitutional challenge and provides the most stable subnational framework.',
  data_source_summary = 'Spanish Ministry of Health (MSCBS) drug policy publications; FAC (Federación de Asociaciones Cannábicas) data; EMCDDA Spain country report; Tribunal Supremo rulings',
  verification_summary = 'Current as of Q2 2026; verified against Spanish government official publications and EMCDDA data',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'ES' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Israel is a world leader in medical cannabis research and has one of the most developed medical cannabis access frameworks in the Middle East. Medical cannabis has been available since the early 2000s through a Health Ministry permit system. The programme underwent major reform in 2019 (Reform T2019) and again in 2022, shifting from specialist-only prescribing to a GP-accessible pathway and dramatically expanding patient numbers. Over 130,000 registered medical cannabis patients exist in Israel as of mid-2026 — one of the highest per-capita rates in the world. Israel also permits cannabis export to EU countries. Adult-use cannabis legalisation was advanced legislatively in 2022–2023 (the Edelstein bill) but the government collapsed before final passage.',
  patient_access = 'Israeli medical cannabis patients access cannabis via licensed pharmacies and dedicated medical cannabis pharmacies following a physician prescription. The permit system has been streamlined — initial approval now takes weeks rather than months. Products include dried flower, oils, capsules, and inhalers. Medical cannabis is not covered by Kupat Holim (HMO) health funds except for specific palliative care indications; most patients pay out-of-pocket (approximately ₪800–2,000/month).',
  physician_access = 'Following the 2022 reform, Israeli family physicians (GPs) can prescribe medical cannabis for an expanded list of indications without specialist referral. Physicians prescribe via the Ministry of Health''s digital prescription system. Israel has the highest physician familiarity with medical cannabis of any non-North American jurisdiction.',
  market_dynamics = 'Israel''s medical cannabis market generates approximately ₪2.5–3.5B ILS annually. Approximately 20–25 licensed producers operate, including Tikun Olam, InterCure, IM Cannabis, and Canndoc. Israel is a significant cannabis research hub tracing back to Prof. Raphael Mechoulam''s isolation of THC (1964). Cannabis export to Germany, Switzerland, and Australia generates foreign currency revenue.',
  regulatory_outlook = 'Israel''s regulatory posture is stable on the medical side. Adult-use legalisation has broad public support (~60–70% in polls) but faces political obstacles — coalition politics and security preoccupations have deprioritised it. The security situation (regional instability) affects regulatory bandwidth and political capacity for non-security legislation.',
  data_source_summary = 'Israel Ministry of Health (Misrad HaBriut) medical cannabis programme data; Israel Medical Cannabis (IMC) association industry data; Canndoc/InterCure investor disclosures; Hebrew University cannabis research publications',
  verification_summary = 'Current as of Q2 2026; verified against Israel Ministry of Health official patient data',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'IL' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Thailand made Southeast Asia''s most dramatic cannabis policy pivot in 2022, decriminalising cannabis by removing it from the Category 5 narcotics list (effective June 9 2022). This produced a rapid proliferation of cannabis shops estimated at 6,000–10,000 across the country by 2023. However, a significant legal gap emerged: recreational use was not explicitly legalised, only decriminalised by omission. The Narcotics Act provisions criminalising "intoxicating" cannabis use remained in force. The incoming Pheu Thai-led government (August 2023) announced intent to re-criminalise recreational cannabis. As of mid-2026, a revised Cannabis and Hemp Act is before parliament — the direction is toward a medical-only framework with stricter retail controls.',
  patient_access = 'Medical cannabis is available in Thailand through the Government Pharmaceutical Organisation (GPO) and licensed medical providers following physician recommendation. The TFDA regulates medical cannabis products. Selected public hospitals and private clinics offer cannabis-based consultations. Products include cannabis-infused herbal preparations rooted in traditional Thai medicine, oils, and standardised pharmaceutical products.',
  physician_access = 'Thai physicians registered with the Medical Council of Thailand may recommend cannabis for therapeutic purposes. Traditional Thai medicine practitioners (mor phaen boran) may also recommend cannabis in herbal medicine formulations. The regulatory framework for physician cannabis prescribing is still evolving as the Cannabis and Hemp Act progresses through parliament.',
  market_dynamics = 'The 2022 decriminalisation produced a chaotic but commercially vibrant market. Cannabis cafés and dispensaries proliferated in Bangkok, Chiang Mai, Koh Samui, and Phuket, heavily targeting the tourist market. Revenue estimates range widely ($1–3B USD annually at peak), though market compression is occurring as re-regulation uncertainty creates investor caution.',
  regulatory_outlook = 'Thailand''s cannabis regulatory environment is the most volatile of any major jurisdiction. The Cannabis and Hemp Act''s passage and final content will determine whether Thailand moves to a medical-only system or another framework. International regulatory watchers have significant interest in Thailand''s outcome as a precedent-setting emerging Asian market.',
  data_source_summary = 'Thailand Food and Drug Administration (TFDA) cannabis regulatory data; Thai government parliamentary records; Bangkok Post and The Nation reporting; EMCDDA global trends; WHO cannabis policy reviews',
  verification_summary = 'Current as of Q2 2026; verified against TFDA official publications and Thai government parliamentary records',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'TH' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'France applies one of the strictest cannabis prohibition frameworks among Western European nations. Under the Loi du 31 décembre 1970, cannabis use is a criminal offence, though a 2020 reform introduced a fixed civil penalty (amende forfaitaire délictuelle / AFD) of €200 for simple use. Cultivation, sale, and trafficking remain serious criminal offences. France is the largest cannabis consumer market in Europe by volume (approximately 5M regular users) despite full prohibition. A medical cannabis experiment (ECUM) was launched in 2021, later expanded and extended through 2025–2026. CBD products with <0.3% THC are legal following ECJ rulings (2020), producing a €500M+ CBD market.',
  patient_access = 'French medical cannabis access is limited to participants in the ECUM experiment — approximately 3,000–6,000 patients with specific serious conditions including treatment-resistant epilepsy, refractory pain, oncology/palliative care, multiple sclerosis spasticity, and oncology-related nausea. ECUM products are dispensed through participating hospital pharmacies at no cost to patients.',
  physician_access = 'Only ECUM-participating specialist physicians may recommend cannabis for ECUM patients. GPs are not authorised to participate. The ANSM (Agence nationale de sécurité du médicament et des produits de santé) oversees ECUM physician participation and product authorisation.',
  market_dynamics = 'France''s legal cannabis market is limited to CBD products and the ECUM experiment. The CBD retail market (flowers, oils, cosmetics) is valued at approximately €500M–700M annually. France is a significant illicit cannabis consumer market driven entirely by illicit supply (domestic cultivation and imports from Morocco, Spain, the Netherlands).',
  regulatory_outlook = 'France''s cannabis regulatory posture is slowly evolving. ECUM extension signals growing medical acceptance. The SENAT cannabis working group has produced reports recommending regulated adult-use legalisation, but no legislation has been introduced. France''s influence within the EU drug policy framework means its eventual policy change would have significant European ripple effects.',
  data_source_summary = 'ANSM ECUM official publications; OFDT annual report; Légifrance legislation; MILDECA policy documents',
  verification_summary = 'Current as of Q2 2026; verified against ANSM and OFDT official publications',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'FR' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'The United Kingdom operates a medical cannabis framework established in November 2018 when cannabis was rescheduled from Schedule 1 to Schedule 2 of the Misuse of Drugs Regulations, enabling specialist physician prescribing of cannabis-based products for medicinal use (CBPMs). Approximately 200,000+ patients have been prescribed CBPMs as of mid-2026. However, NHS prescribing of CBPMs remains extremely limited; the vast majority of UK patients access cannabis through private specialist clinics and pay privately (approximately £100–400/month). Adult-use cannabis remains a Class B controlled drug under the Misuse of Drugs Act 1971.',
  patient_access = 'UK patients access CBPMs exclusively through licensed private specialist clinics or via rare NHS prescribing (limited to specific paediatric epilepsy cases and multiple sclerosis spasticity via Sativex). The private clinic model (Curaleaf UK, Sapphire Medical, Releaf, and others) offers specialist consultations, CBPM prescription, and home delivery. UK medical cannabis products are classified as unlicensed specials sourced primarily from Canada, the Netherlands, Portugal, Australia, and Germany.',
  physician_access = 'CBPMs can only be prescribed by specialist physicians (Consultants) on the GMC Specialist Register — GPs are not authorised to initiate CBPM prescriptions. Qualifying specialties include neurology, oncology, pain medicine, psychiatry, and palliative care. NICE has issued limited guidance; the gap between NICE evidence standards and clinical reality has constrained NHS prescribing.',
  market_dynamics = 'The UK CBPM market is estimated at £400M–600M annually. Approximately 20–30 specialist cannabis clinic companies operate. Canadian, Australian, Portuguese, and Israeli LPs dominate UK supply. The UK has no significant domestic licensed cannabis production for medical purposes. The private pay model creates a significant access equity issue.',
  regulatory_outlook = 'UK cannabis regulatory posture is at a crossroads. Medical reform is widely viewed as incomplete given the NHS access gap. The Labour government elected in 2024 has not made cannabis reform a priority but has not excluded it. Adult-use legalisation polling shows growing public support (50–60% in 2024–2026 surveys).',
  data_source_summary = 'MHRA CBPM licensing data; NHS England prescribing statistics; UK Cannabis Industry Council (UKCIC) market data; Drug Science Project Twenty21 results; ACMD reports; Home Office controlled drugs statistics',
  verification_summary = 'Current as of Q2 2026; verified against MHRA and NHS England official data',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'GB' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'The United States has a bifurcated cannabis legal landscape: federal prohibition under the Controlled Substances Act (CSA, Schedule I) coexists with state-level adult-use legalisation in 24 states + DC + 2 territories (USVI, CNMI), medical-only programmes in an additional 14 states, and full prohibition in only a handful of states. The Biden Administration initiated federal rescheduling proceedings in 2023 (DEA proposed rescheduling to Schedule III); as of mid-2026 the process was still working through administrative and potential judicial challenges. Federal rescheduling to Schedule III would not legalise cannabis commercially but would meaningfully change tax treatment (280E repeal) and banking access.',
  patient_access = 'Medical cannabis patient access varies dramatically by state. In adult-use legal states, medical programmes often coexist with recreational retail — medical patients may benefit from lower tax rates and higher purchase limits. In medical-only states, patients register through state health department programmes. The number of medical cannabis patients nationally exceeds 5 million registered patients. Interstate commerce in cannabis remains federally illegal.',
  physician_access = 'US physicians recommend (not prescribe — Schedule I prohibition prevents DEA-registered prescribing) medical cannabis in states with medical programmes. Physicians issue written recommendations or certifications; patients then apply to the state health department for a medical cannabis card. Telehealth medical cannabis recommendations have become widely available since 2020.',
  market_dynamics = 'The US cannabis industry is the world''s largest legal market by revenue — estimated at $30–35B USD in total legal cannabis sales in 2025. The industry remains profoundly fragmented by state-level isolation (no interstate commerce), taxed at punishing rates due to federal 280E treatment, and denied normal banking access. Major multi-state operators (MSOs) include Curaleaf, Green Thumb Industries (GTI), Trulieve, Verano, and Cresco Labs.',
  regulatory_outlook = 'Federal rescheduling to Schedule III is the most consequential near-term regulatory development. If finalised, it would end 280E disallowance, potentially enable SAFE Banking Act passage, and open research pathways. It would NOT legalise interstate commerce or enable national brands. The 2026 and 2028 election cycles will shape the federal regulatory trajectory significantly.',
  data_source_summary = 'DEA rescheduling docket; MJBizDaily US market data; BDSA/Headset state market analytics; Congressional Research Service cannabis reports; FinCEN cannabis banking reports; individual state cannabis authority data',
  verification_summary = 'Current as of Q2 2026; verified against DEA federal register, state cannabis authority data, and MJBizDaily industry research',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'US' AND jurisdiction_type = 'country';

UPDATE cc_jurisdiction_briefings SET
  public_summary = 'Colombia was the first country in Latin America to establish a comprehensive regulated medical cannabis framework. Law 1787 of 2016 legalised medical cannabis, and Decree 631 of 2020 created the export licensing framework that has made Colombia a significant global medical cannabis producer. Colombia benefits from ideal growing conditions (tropical climate, near-equatorial light cycles, low-cost labour), making it one of the lowest-cost producers globally. Domestic adult-use remains legally ambiguous — the Constitutional Court decriminalised personal possession (up to 20g) in 1994 (Sentence C-221/94), but selling, buying, and public use remain prohibited. A 2023 bill to legalise adult-use cannabis passed the Senate but not the House; the Petro government has expressed support for adult-use legalisation.',
  patient_access = 'Colombian medical cannabis patients access products through licensed pharmacies and medical dispensaries authorised under the Law 1787 framework. The Ministry of Health (MinSalud) administers patient access. Products include standardised oils, capsules, and dried flower. Domestic medical cannabis is very affordably priced given Colombia''s low production costs. Patient registration is managed through the INVIMA regulatory framework.',
  physician_access = 'Colombian physicians may recommend medical cannabis for qualified patients under the Law 1787 framework. INVIMA oversees product approvals. The Colombian Medical Federation has engaged with cannabis prescribing guidelines. No specialist-only restriction exists at the national level.',
  market_dynamics = 'Colombia is primarily an export market for medical cannabis. Over 1,000 cultivation and production licences have been issued. Major Colombian cannabis companies include Clever Leaves, Khiron Life Sciences, Flora Growth, and PharmaLeaf Colombia. Export destinations include Germany, the UK, Australia, Brazil, and Mexico. Colombia''s cost advantage (production cost as low as $0.10–0.30/gram dried flower) makes it highly competitive globally.',
  regulatory_outlook = 'Colombia''s Petro government (2022–2026) has been the most cannabis-supportive in the country''s history. Adult-use legalisation faces legislative obstacles from conservative parties. If it passes, Colombia would become the first country in South America to fully legalise cannabis. The export framework is stable and well-regarded by importing countries'' regulators.',
  data_source_summary = 'Colombia Ministry of Justice cannabis policy data; INVIMA licensing registry; Colombia Ministerio de Salud y Protección Social publications; Clever Leaves/Khiron investor disclosures; EMCDDA Colombia country data',
  verification_summary = 'Current as of Q2 2026; verified against INVIMA and Colombian government official publications',
  update_cadence = 'Quarterly',
  last_reviewed_date = DATE '2026-06-22'
WHERE country_iso2 = 'CO' AND jurisdiction_type = 'country';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623100137','seed_content_depth_updates','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623100137_seed_content_depth_updates.sql

-- RECOVERY BEGIN 20260623151340_restore_public_dto_definer_views.sql

-- REGRESSION FIX: 20260622151411_fix_security_definer_views_to_invoker flipped these public
-- DTO views to security_invoker WITHOUT granting anon base-table SELECT, which broke the public
-- marketplace/signals (hard errors) and emptied the country-profile/genetics pages (0 rows for anon).
-- These are intentional curated public DTOs (see comments on each view); restore SECURITY DEFINER.
alter view public.public_country_profile_dto            set (security_invoker = false);
alter view public.marketplace_public_listings_v1        set (security_invoker = false);
alter view public.signals_intelligence_feed             set (security_invoker = false);
alter view public.platform_coverage_summary             set (security_invoker = false);
alter view public.genetics_public_profiles              set (security_invoker = false);
alter view public.genetics_public_cultivar_passports    set (security_invoker = false);
alter view public.genetics_public_cultivar_aliases      set (security_invoker = false);
alter view public.genetics_public_country_opportunities set (security_invoker = false);
alter view public.genetics_public_evidence_summaries    set (security_invoker = false);
alter view public.genetics_public_claims                set (security_invoker = false);
alter view public.genetics_public_collaboration_projects set (security_invoker = false);
alter view public.genetics_public_service_providers     set (security_invoker = false);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623151340','restore_public_dto_definer_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623151340_restore_public_dto_definer_views.sql

-- RECOVERY BEGIN 20260623192021_intelligence_worker_v2_distributed_safety_part2.sql
create or replace function public.is_hv_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator', 'analyst')
  );
$$;

revoke all on function public.is_hv_staff() from public, authenticated;
grant execute on function public.is_hv_staff() to service_role;

create table if not exists public.crawl_domain_circuit_state (
  domain text primary key,
  consecutive_failures int not null default 0,
  locked_until timestamptz,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.crawl_domain_circuit_state enable row level security;

drop policy if exists crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state;
create policy crawl_domain_circuit_state_staff_read on public.crawl_domain_circuit_state
  for select using (is_hv_staff());

create index if not exists idx_crawl_domain_circuit_state_locked
  on public.crawl_domain_circuit_state (locked_until)
  where locked_until is not null;

create table if not exists public.worker_heartbeats (
  worker_id text primary key,
  status text not null default 'starting',
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  targets_processed_total bigint not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.worker_heartbeats enable row level security;

drop policy if exists worker_heartbeats_staff_read on public.worker_heartbeats;
create policy worker_heartbeats_staff_read on public.worker_heartbeats
  for select using (is_hv_staff());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623192021','intelligence_worker_v2_distributed_safety_part2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623192021_intelligence_worker_v2_distributed_safety_part2.sql
