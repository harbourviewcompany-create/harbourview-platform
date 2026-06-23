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
