BEGIN;

-- =============================================================================
-- Gap E: Harbourview Education System Seed Migration
-- Generated: 2026-06-22
-- Description: Seeds 5 education tracks with modules and articles covering
--              international market access, regulatory compliance, country
--              intelligence, clinical/medical cannabis, and industry intelligence.
-- Idempotent: ON CONFLICT (slug) DO NOTHING on all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TRACK 1: International Market Access
-- ---------------------------------------------------------------------------
WITH t1 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'market-access-pathways',
        'International Market Access',
        'How to export and import cannabis products internationally. Covers regulatory frameworks, permit requirements, GMP standards, and country-specific pathways.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t1_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'market-access-pathways'
),
t1_id AS (
    SELECT id FROM t1
    UNION ALL
    SELECT id FROM t1_existing
    LIMIT 1
),

-- Module: eu-import-requirements
m_eu_import AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'eu-import-requirements',
        'European Import Requirements',
        ARRAY['supplier','buyer_importer','licensed_producer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_eu_import_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'eu-import-requirements'
),
m_eu_import_id AS (
    SELECT id FROM m_eu_import
    UNION ALL
    SELECT id FROM m_eu_import_existing
    LIMIT 1
),

-- Module: german-market-entry
m_germany AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'german-market-entry',
        'German Market Entry Guide',
        ARRAY['supplier','buyer_importer','licensed_producer','investor'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_germany_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'german-market-entry'
),
m_germany_id AS (
    SELECT id FROM m_germany
    UNION ALL
    SELECT id FROM m_germany_existing
    LIMIT 1
),

-- Module: australian-tga-pathways
m_tga AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'australian-tga-pathways',
        'Australian TGA Import Pathways',
        ARRAY['supplier','buyer_importer','licensed_producer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_tga_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'australian-tga-pathways'
),
m_tga_id AS (
    SELECT id FROM m_tga
    UNION ALL
    SELECT id FROM m_tga_existing
    LIMIT 1
),

-- Module: uk-mhra-pathways
m_mhra AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'uk-mhra-pathways',
        'UK MHRA Import Framework',
        ARRAY['supplier','buyer_importer'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_mhra_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'uk-mhra-pathways'
),
m_mhra_id AS (
    SELECT id FROM m_mhra
    UNION ALL
    SELECT id FROM m_mhra_existing
    LIMIT 1
),

-- Module: canada-export-health-canada
m_hc_export AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t1_id),
        'canada-export-health-canada',
        'Health Canada Export Requirements',
        ARRAY['licensed_producer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_hc_export_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'canada-export-health-canada'
),
m_hc_export_id AS (
    SELECT id FROM m_hc_export
    UNION ALL
    SELECT id FROM m_hc_export_existing
    LIMIT 1
),

-- Articles: eu-import-requirements
a1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_import_id),
        'eu-import-reqs-overview',
        'EU Import Requirements Overview',
        'All medicinal cannabis products entering the European Union must comply with Directive 2001/83/EC and be imported by a company holding a valid Wholesale Dealer Authorisation (WDA) issued by the competent authority in the importing member state. The importing entity must verify that the exporting country''s manufacturing site holds a current EU-GMP certificate or an equivalent certificate recognised under a Mutual Recognition Agreement (MRA). Import permits are required for Schedule I or II narcotic substances under the 1961 Single Convention, and each shipment must be accompanied by a corresponding export authorisation issued by the competent authority of the exporting country.',
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
a2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_import_id),
        'eu-import-narcotic-controls',
        'Narcotic Control Obligations for EU Cannabis Imports',
        'Under the UN Single Convention on Narcotic Drugs 1961, cannabis and cannabis resin are listed in Schedules I and IV, requiring importing member states to issue import certificates before each shipment. Most EU member states process import certificate applications through their national competent authority (e.g., BfArM in Germany, FAMHP in Belgium, ANSM in France), with processing times ranging from two to eight weeks. Importers must maintain detailed narcotic registers and submit annual statistical reports to their national authority and to the International Narcotics Control Board (INCB).',
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

-- Articles: german-market-entry
a3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_germany_id),
        'germany-bfarm-import-permit',
        'BfArM Import Permit Process for Cannabis',
        'The Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM) is Germany''s federal authority responsible for issuing import permits for narcotic cannabis under the Betäubungsmittelgesetz (BtMG). Importers must hold a valid narcotics trade licence (§ 3 BtMG) and submit a per-shipment import application including supplier EU-GMP certificate, certificate of analysis, and the exporting country''s export authorisation. Germany is the largest medicinal cannabis market in Europe, with annual import volumes exceeding 30,000 kg of dried flower equivalents as of 2024.',
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
a4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_germany_id),
        'germany-cannabis-act-2024',
        'Germany Cannabis Act 2024: Market Implications',
        'The German Cannabis Act (Cannabisgesetz, CanG) that came into force on 1 April 2024 partially legalised adult-use cannabis for personal possession and home cultivation, while establishing a second pillar for regulated commercial supply through licensed non-profit associations (Anbauvereinigungen). Medical cannabis supply pathways remain governed by the existing BtMG framework, preserving the prescription-based import model for licensed producers. Investors and suppliers should monitor the implementation timeline for the commercial supply pilot regions announced under the CanG, as these may open additional distribution channels from 2025 onward.',
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

-- Articles: australian-tga-pathways
a5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tga_id),
        'tga-odb-import-process',
        'TGA Office of Drug Control Import Authorisation',
        'The Therapeutic Goods Administration (TGA) Office of Drug Control (ODC) administers import permits for medicinal cannabis under the Narcotic Drugs Act 1967 and the Therapeutic Goods Act 1989. Foreign manufacturers supplying the Australian market must hold a TGA Manufacturing Licence or demonstrate compliance via an acceptable overseas GMP certification (e.g., EU-GMP, WHO-GMP, or PIC/S-compliant certificate). The importer of record must hold both an ODC import permit (per shipment) and an ODC dealer licence, with applications processed through the TGA Business Services portal.',
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
a6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tga_id),
        'tga-artg-registration-pathways',
        'ARTG Registration and SAS Pathways for Cannabis Products',
        'Medicinal cannabis products can enter the Australian market via three TGA pathways: full registration on the Australian Register of Therapeutic Goods (ARTG), the Authorised Prescriber (AP) scheme, or the Special Access Scheme Category B (SAS-B). The vast majority of products currently access the market through SAS-B, which requires prescriber application per patient but does not require full ARTG registration of the product. As of 2024, TGA has registered a small number of cannabis products on the ARTG, including nabiximols (Sativex) and cannabidiol (Epidyolex), setting a precedent for full registration pathways.',
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

-- Articles: uk-mhra-pathways
a7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_mhra_id),
        'uk-mhra-import-licence',
        'MHRA Manufacturer Import Licence for Cannabis',
        'The Medicines and Healthcare products Regulatory Agency (MHRA) requires overseas manufacturers of unlicensed cannabis-based products for human use (CBPMs) to supply only to UK importers holding a Manufacturer''s Licence (Import) under the Human Medicines Regulations 2012. Each imported batch must be accompanied by a full analytical certificate and a Qualified Person (QP) declaration confirming the batch meets the agreed specification and has been manufactured to EU-GMP or equivalent standards. The UK Home Office additionally requires a Schedule 1 import licence under the Misuse of Drugs Regulations 2001 for each consignment of cannabis flower or resin.',
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
a8 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_mhra_id),
        'uk-cbpm-prescribing-framework',
        'UK CBPM Prescribing and Supply Framework',
        'Cannabis-based products for medicinal use (CBPMs) in the UK may only be prescribed by specialist clinicians on the General Medical Council''s Specialist Register, following the November 2018 rescheduling of cannabis from Schedule 1 to Schedule 2 of the Misuse of Drugs Regulations 2001. Unlicensed CBPMs are supplied as "specials" under a Named Patient supply model, meaning each product requires a patient-specific prescription and the importer must hold appropriate Home Office and MHRA licences. The MHRA does not proactively regulate unlicensed specials for efficacy, but enforcement action can be taken if a product is found unsafe or the supply chain is non-compliant.',
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

-- Articles: canada-export-health-canada
a9 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_hc_export_id),
        'health-canada-export-permits',
        'Health Canada Export Permit Requirements for Cannabis',
        'Canadian licensed producers (LPs) seeking to export cannabis must obtain an export permit from Health Canada under section 62 of the Cannabis Act, in addition to satisfying the import requirements of the destination country. Export permits are issued on a per-shipment basis and require confirmation that the receiving country has issued an import permit or equivalent authorisation, that the LP holds a valid Processing or Cultivation licence with export permissions, and that the product meets Canadian Good Production Practices (GPP) requirements. Health Canada has bilateral information-sharing arrangements with several jurisdictions including Germany, Australia, and the UK to facilitate permit processing.',
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
a10 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_hc_export_id),
        'health-canada-gpp-export-quality',
        'Good Production Practices and Export Quality Standards',
        'Health Canada''s Good Production Practices (GPP), outlined in Part 5 of the Cannabis Regulations, set out the minimum quality standards for cannabis products exported from Canada, including requirements for sanitation, pest control, and record-keeping. For exports to regulated pharmaceutical markets (EU, Australia, UK), receiving importers typically require additional EU-GMP certification beyond Canadian GPP, meaning many LPs maintain dual certification to remain competitive in international tenders. Health Canada''s Cannabis Tracking System (CTS) records all export transactions, and LPs must report shipment details within two business days of export.',
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

SELECT 'Track 1: market-access-pathways seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 2: Regulatory Compliance
-- ---------------------------------------------------------------------------
WITH t2 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'regulatory-compliance',
        'Regulatory Compliance',
        'GMP, GACP, and quality standards for cannabis operators. Licensing requirements, audit preparation, and compliance management across key markets.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t2_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'regulatory-compliance'
),
t2_id AS (
    SELECT id FROM t2
    UNION ALL
    SELECT id FROM t2_existing
    LIMIT 1
),

-- Module: eu-gmp-cannabis
m_eu_gmp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'eu-gmp-cannabis',
        'EU-GMP for Cannabis Products',
        ARRAY['licensed_producer','lab','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_eu_gmp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'eu-gmp-cannabis'
),
m_eu_gmp_id AS (
    SELECT id FROM m_eu_gmp
    UNION ALL
    SELECT id FROM m_eu_gmp_existing
    LIMIT 1
),

-- Module: gacp-cultivation-standards
m_gacp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'gacp-cultivation-standards',
        'GACP Cultivation Standards',
        ARRAY['licensed_producer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_gacp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'gacp-cultivation-standards'
),
m_gacp_id AS (
    SELECT id FROM m_gacp
    UNION ALL
    SELECT id FROM m_gacp_existing
    LIMIT 1
),

-- Module: who-gmp-pharmaceutical
m_who_gmp AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'who-gmp-pharmaceutical',
        'WHO-GMP for Pharmaceutical Cannabis',
        ARRAY['licensed_producer','lab'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_who_gmp_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'who-gmp-pharmaceutical'
),
m_who_gmp_id AS (
    SELECT id FROM m_who_gmp
    UNION ALL
    SELECT id FROM m_who_gmp_existing
    LIMIT 1
),

-- Module: licence-class-guide
m_licence AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t2_id),
        'licence-class-guide',
        'Licence Class Navigator',
        ARRAY['licensed_producer','investor','regulator_policy'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_licence_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'licence-class-guide'
),
m_licence_id AS (
    SELECT id FROM m_licence
    UNION ALL
    SELECT id FROM m_licence_existing
    LIMIT 1
),

-- Articles: eu-gmp-cannabis
b1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_gmp_id),
        'eu-gmp-cannabis-certification',
        'EU-GMP Certification for Medicinal Cannabis',
        'European Union Good Manufacturing Practice (EU-GMP) certification is mandatory for all medicinal cannabis products imported or sold in EU member states. The certification covers facility design, quality management systems, batch record documentation, and analytical testing standards. Importers must hold a Wholesale Dealer Authorisation (WDA) and work only with EU-GMP-certified suppliers.',
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
b2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_eu_gmp_id),
        'eu-gmp-annex-1-sterile',
        'EU-GMP Annex 1 and Cannabis Extract Manufacturing',
        'EU-GMP Annex 1 (Manufacture of Sterile Medicinal Products, revised 2022) applies to cannabis-derived extracts and oils that are intended for sterile final dosage forms, imposing strict contamination control strategy (CCS) requirements. For non-sterile cannabis flower products, EU-GMP Chapter 3 (Premises and Equipment) and Chapter 4 (Documentation) are the primary applicable chapters, requiring cleanroom-grade drying and packaging areas and comprehensive batch manufacturing records. Inspections are conducted by the national competent authority of the EU member state in which the manufacturing site is located, with certificates published on the EudraGMDP database.',
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

-- Articles: gacp-cultivation-standards
b3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_gacp_id),
        'gacp-ema-guideline',
        'EMA GACP Guideline for Medicinal Cannabis Cultivation',
        'The European Medicines Agency (EMA) Good Agricultural and Collection Practice (GACP) guideline (EMEA/HMPC/246816/2005) establishes minimum standards for the cultivation, collection, and primary processing of herbal substances used as starting materials for medicinal products. For cannabis, GACP compliance covers variety selection and documentation, growing conditions (soil, water, pesticide management), harvest procedures, and drying and storage conditions that prevent microbial contamination and preserve cannabinoid profile stability. GACP certification is a prerequisite for EU-GMP certification of cannabis-derived active pharmaceutical ingredients (APIs), as the GACP certificate covers the upstream botanical supply chain.',
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
b4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_gacp_id),
        'gacp-pest-residue-limits',
        'GACP Pesticide and Contaminant Limits for Cannabis',
        'EU pharmacopoeial limits for pesticide residues in herbal substances (European Pharmacopoeia 2.8.13) apply to cannabis flower destined for medicinal use, with maximum residue levels (MRLs) for hundreds of agricultural chemicals set far below those for food crops. Heavy metal limits (Ph. Eur. 2.4.27) require testing for lead, cadmium, mercury, and arsenic in each batch, with cultivation practice records demonstrating soil safety. Mycotoxin and microbial contamination limits (Ph. Eur. 5.1.4, 5.1.8) must also be met, with total aerobic microbial count (TAMC) typically not exceeding 10⁵ CFU/g and absence of specified pathogens confirmed per batch.',
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

-- Articles: who-gmp-pharmaceutical
b5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_who_gmp_id),
        'who-gmp-trs-cannabis',
        'WHO Technical Report Series GMP for Cannabis',
        'The World Health Organization''s GMP guidelines (WHO Technical Report Series No. 986, Annex 2) are recognised by many non-EU markets—including Australia (TGA), Canada (Health Canada), and several Latin American and Asian regulators—as an acceptable standard for pharmaceutical manufacturing, including cannabis-derived products. WHO-GMP inspections are conducted by national medicines regulatory authorities (NMRAs) or accredited third-party bodies, and certificates are issued for a defined scope of manufacturing activities. For cannabis producers seeking multi-market access, WHO-GMP certification provides a cost-effective foundation before pursuing market-specific certifications such as EU-GMP or TGA GMP.',
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

-- Articles: licence-class-guide
b6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_licence_id),
        'licence-classes-canada-overview',
        'Canada Cannabis Licence Classes Overview',
        'Health Canada issues seven primary licence classes under the Cannabis Regulations: Cultivation, Processing, Sale for Medical Purposes, Analytical Testing, Research, Cannabis Drug Licence, and Industrial Hemp. Licence classes determine which activities a holder may conduct, and operators performing multiple activities (e.g., cultivation and processing) must hold separate licences for each, unless they qualify for a micro-licence or a standard licence with multiple activity authorisations. Investors evaluating licensed producers should assess the breadth of licence authorisations held, as restrictions on permitted activities directly limit product categories and market access.',
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
b7 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_licence_id),
        'licence-classes-eu-country-comparison',
        'EU Member State Licence Class Comparison',
        'EU member states each issue their own national cannabis licences under the framework of Directive 2001/83/EC and the 1961 UN Single Convention, resulting in significant variation in licence categories, fees, and scope across jurisdictions. Germany (BtMG § 3), the Netherlands (Opiumwet), and Poland (Act on Counteracting Drug Addiction) each define distinct cultivation, manufacturing, and wholesale licence types, with Germany''s framework being the most extensively used for international medicinal cannabis supply. Operators planning multi-country operations must conduct jurisdiction-specific licence mapping, as holding a licence in one EU member state does not confer rights to manufacture or trade in another.',
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

SELECT 'Track 2: regulatory-compliance seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 3: Country Intelligence
-- ---------------------------------------------------------------------------
WITH t3 AS (
    INSERT INTO public.education_tracks (
        id, slug, title, description, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'country-intelligence',
        'Country Intelligence',
        'Jurisdiction-level briefings on cannabis legal frameworks, market access status, and regulatory developments for priority markets.',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
t3_existing AS (
    SELECT id FROM public.education_tracks WHERE slug = 'country-intelligence'
),
t3_id AS (
    SELECT id FROM t3
    UNION ALL
    SELECT id FROM t3_existing
    LIMIT 1
),

-- Module: country-intel-tier1
m_tier1 AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'country-intel-tier1',
        'Tier 1 Markets Deep Dive',
        ARRAY['general','investor','buyer_importer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_tier1_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'country-intel-tier1'
),
m_tier1_id AS (
    SELECT id FROM m_tier1
    UNION ALL
    SELECT id FROM m_tier1_existing
    LIMIT 1
),

-- Module: emerging-markets-watch
m_emerging AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'emerging-markets-watch',
        'Emerging Markets Watch',
        ARRAY['investor','regulator_policy'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_emerging_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'emerging-markets-watch'
),
m_emerging_id AS (
    SELECT id FROM m_emerging
    UNION ALL
    SELECT id FROM m_emerging_existing
    LIMIT 1
),

-- Module: prohibition-risk-map
m_prohibition AS (
    INSERT INTO public.education_modules (
        id, track_id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM t3_id),
        'prohibition-risk-map',
        'Prohibition & Restriction Risk Map',
        ARRAY['general','buyer_importer','supplier'],
        'standard',
        'published',
        now(), now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, slug
),
m_prohibition_existing AS (
    SELECT id FROM public.education_modules WHERE slug = 'prohibition-risk-map'
),
m_prohibition_id AS (
    SELECT id FROM m_prohibition
    UNION ALL
    SELECT id FROM m_prohibition_existing
    LIMIT 1
),

-- Articles: country-intel-tier1
c1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tier1_id),
        'tier1-germany-market-profile',
        'Germany: Tier 1 Market Profile',
        'Germany represents the largest regulated medicinal cannabis market in Europe, with over 4 million patient prescriptions dispensed in 2023 and annual import volumes estimated at 30,000–40,000 kg of dried flower equivalents. The market is characterised by a fragmented pharmacy-based dispensing model, a dominant dried flower product category, and strong demand for high-THC cultivars from established Canadian, Dutch, and Danish producers. The CanG reforms of 2024 have introduced adult-use possession rights but preserve the prescription-only import model for pharmaceutical-grade cannabis, sustaining demand for EU-GMP-certified international supply.',
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
c2 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_tier1_id),
        'tier1-australia-market-profile',
        'Australia: Tier 1 Market Profile',
        'Australia is the largest medical cannabis market in the Asia-Pacific region, with TGA approval data indicating over 700,000 patient approvals under the SAS-B and Authorised Prescriber pathways as of mid-2024. The Australian market is distinctive in its high per-patient expenditure, strong regulatory acceptance of overseas-manufactured products via TGA GMP clearance, and rapid growth in oral oil and capsule formats alongside dried flower. Domestic cultivation and manufacturing capacity has expanded significantly since 2020, increasing competitive pressure on international suppliers, though import volumes remain substantial due to variety diversity and capacity constraints.',
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

-- Articles: emerging-markets-watch
c3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_emerging_id),
        'emerging-markets-latam',
        'Latin America: Emerging Cannabis Markets Overview',
        'Colombia, Brazil, and Mexico represent the three most significant emerging cannabis markets in Latin America, each at different stages of regulatory maturity. Colombia has issued cultivation and export licences since 2017 under Law 1787 and Decree 613/2017, positioning itself as a low-cost cultivation hub for global supply chains, though export pathways remain limited by destination country requirements. Brazil''s ANVISA has permitted cannabis-derived medicine imports since 2015 and domestic manufacture since 2023, creating a large domestic market opportunity, while Mexico''s regulatory framework for adult-use cannabis remains pending full legislative implementation as of 2025.',
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
c4 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_emerging_id),
        'emerging-markets-asia-pacific',
        'Asia-Pacific: Emerging Cannabis Regulatory Developments',
        'Thailand made global headlines in 2022 by removing cannabis from its list of narcotics, enabling relatively liberal personal use, but subsequently moved toward re-restriction of recreational use in 2024 while maintaining a medical framework under the Thai FDA. South Korea permits the prescription of imported cannabis-derived medicines under specific conditions, and Japan has amended its Cannabis Control Act (2023) to permit cannabis-derived medicines containing THC, including Epidiolex, for the first time. Investors should monitor regulatory changes in New Zealand (where a medical scheme is established), Singapore (strictly prohibitionist), and the Philippines (medical only) as part of regional market access planning.',
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

-- Articles: prohibition-risk-map
c5 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prohibition_id),
        'prohibition-risk-high-risk-jurisdictions',
        'High-Risk Jurisdictions: Absolute Prohibition Markets',
        'A significant number of jurisdictions maintain absolute prohibition on cannabis in all forms, including medicinal use, creating severe legal risk for importers, suppliers, and travellers transiting through these countries. Singapore, Japan (for non-CBD, non-approved products), Indonesia, Malaysia, and the Philippines impose criminal penalties for cannabis possession that may include the death penalty or lengthy imprisonment. Supply chain actors must screen all transit routes and third-party logistics partners to ensure that cannabis consignments do not enter or pass through prohibition jurisdictions, as international treaty obligations do not shield commercial operators from domestic criminal law.',
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
c6 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_prohibition_id),
        'prohibition-risk-travel-transit',
        'Cannabis Travel and Transit Risk for Industry Professionals',
        'Industry professionals travelling with cannabis samples, product documentation, or even residual personal use products face serious legal risk when transiting through or entering jurisdictions where cannabis remains fully prohibited. Risk is highest in GCC (Gulf Cooperation Council) countries, several Southeast Asian nations, and parts of sub-Saharan Africa, where zero-tolerance enforcement applies regardless of origin jurisdiction or medical status. Companies should implement written travel compliance policies for employees, prohibit the transport of cannabis samples across international borders except under valid import/export permits, and require legal review before conducting business activities in any jurisdiction where cannabis status is uncertain.',
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

SELECT 'Track 3: country-intelligence seeded' AS result;


-- ---------------------------------------------------------------------------
-- TRACK 4: Clinical & Medical Cannabis
-- ---------------------------------------------------------------------------
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

-- Module: prescribing-frameworks
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

-- Module: patient-access-pathways
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

-- Module: cannabinoid-pharmacology
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

-- Module: drug-interactions
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

-- Articles: prescribing-frameworks
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
        'German physicians have been able to prescribe cannabis flowers, extracts, and cannabis medicines since the passage of the Medical Cannabis Act (BtMÄndG) in March 2017, which reclassified cannabis as a Schedule 3 narcotic (prescribable without restriction by indication). Prescriptions are written on narcotic prescription forms (BtM-Rezept) and dispensed by pharmacies, with statutory health insurers (GKV) required to cover costs if medical necessity is established—a provision that generated significant demand growth between 2017 and 2024. The CanG 2024 does not alter the prescription model for pharmaceutical cannabis, maintaining the BtM-Rezept requirement and GKV coverage pathway.',
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

-- Articles: patient-access-pathways
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
        'Despite legal frameworks permitting medical cannabis access, patients in many jurisdictions face practical barriers including high out-of-pocket costs (insurance non-coverage), limited specialist availability for prescription initiation, pharmacy stocking and dispensing gaps, and stigma from healthcare providers unfamiliar with cannabis medicine. In Germany, health insurer (GKV) prior authorisation rejections—reported at rates of 30–50% for initial applications in 2022–23—represent a significant access barrier, though rejection rates have trended downward following appeal mechanism improvements. Patient advocacy organisations in the UK, Australia, and Canada have documented that low-income and rural patients face disproportionate access challenges, calling for formulary inclusion and telehealth prescribing pathways.',
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

-- Articles: cannabinoid-pharmacology
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
        'The route of administration significantly affects cannabinoid pharmacokinetics: inhaled cannabis delivers THC to peak plasma concentrations within 3–10 minutes with bioavailability of 10–35%, while oral administration produces delayed peak concentrations (1–3 hours), lower and more variable bioavailability (4–12%), and first-pass hepatic conversion of THC to the more potent 11-hydroxy-THC. Sublingual and oromucosal routes (as used in nabiximols/Sativex) provide intermediate onset (15–45 minutes) and improved dose consistency compared to oral ingestion. Pharmacists counselling patients on cannabis medicines should account for route-of-administration differences when advising on dose titration, onset of effect, and duration, particularly for patients transitioning between formulation types.',
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

-- Articles: drug-interactions
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


-- ---------------------------------------------------------------------------
-- TRACK 5: Industry Intelligence
-- ---------------------------------------------------------------------------
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

-- Module: global-market-sizing
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

-- Module: ma-deal-analysis
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

-- Module: supply-chain-intelligence
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

-- Articles: global-market-sizing
e1 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_market_sizing_id),
        'global-medical-cannabis-market-2024',
        'Global Medical Cannabis Market Sizing 2024–2030',
        'The global legal cannabis market was valued at approximately USD 57 billion in 2023, with the medical segment accounting for an estimated USD 15–20 billion of that total, driven primarily by North American adult-use markets and European medical markets. Analysts project compound annual growth rates (CAGR) of 14–20% for the global medical cannabis market through 2030, with Europe—particularly Germany, the UK, and Poland—expected to account for the largest incremental volume growth in the forecast period. Market sizing estimates carry significant uncertainty due to illicit market displacement effects, regulatory volatility, and inconsistent national reporting standards for cannabis consumption data.',
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
        'Europe''s medical cannabis market is projected to grow from approximately EUR 600 million in 2023 to EUR 3–5 billion by 2028, with Germany, Poland, the Czech Republic, and Denmark identified as the highest-growth national markets. Product mix is shifting toward standardised pharmaceutical formats (oils, capsules, granules) and away from unprocessed dried flower as pharmacies develop more sophisticated dispensing capabilities and prescribers increase familiarity with dosing titration. Supply chain dynamics are being reshaped by growing EU domestic cultivation capacity (Portugal, Spain, Denmark, Greece, the Netherlands) reducing dependency on extra-EU imports, though GMP-certified import volumes are expected to remain significant through the forecast period.',
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

-- Articles: ma-deal-analysis
e3 AS (
    INSERT INTO public.education_articles (
        id, module_id, slug, title, summary, source_basis, publication_state,
        review_status, last_reviewed, next_review_due, publication_confidence,
        reviewer_type, controlled_topic, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM m_ma_id),
        'cannabis-ma-trends-2023-2025',
        'Cannabis M&A Trends 2023–2025',
        'Global cannabis M&A activity declined sharply from the peak levels of 2018–2021, with deal volumes in 2022–2024 characterised by distressed asset acquisitions, vertical integration plays, and strategic consolidation rather than growth-driven premium transactions. Notable deal archetypes include EU-GMP-certified supplier acquisitions by European distributors seeking supply security, licensed producer consolidations in Canada driven by cost pressure and excess cultivation capacity, and pharmaceutical company acquisitions of cannabis drug development assets with FDA/EMA orphan drug designations. Valuation multiples have compressed significantly from the 2019–2021 peak, with most public cannabis companies trading at EV/Revenue multiples of 1–3x by 2024, creating potential value opportunities for strategic acquirers with long investment horizons.',
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

-- Articles: supply-chain-intelligence
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
        'The international medical cannabis supply chain comprises four primary layers: cultivation and primary processing (licensed producers/cultivators), secondary manufacturing and extraction (GMP-certified processors), wholesale distribution and import (WDA/ODC licence holders), and final dispensing (pharmacies, clinics). Key supply origin countries for the global export market include Canada, the Netherlands, Denmark, Portugal, and Colombia, each offering different cost profiles, regulatory certifications, and product category strengths. Disruptions in the supply chain—including regulatory delays, batch failures, and logistics bottlenecks at customs—are common operational risks, with importers typically maintaining 3–6 month safety stock levels for high-demand SKUs.',
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
        'Medicinal cannabis products—particularly oils, capsules, and botanical drug substances—may require temperature-controlled logistics (2–8°C for some extracts) to preserve potency and prevent microbial proliferation during international transit. GDP (Good Distribution Practice) guidelines, as set out in the EU GDP Guidelines (2013/C 343/01), apply to pharmaceutical cannabis distribution in Europe and require qualified temperature mapping of storage and transport conditions, deviation reporting, and chain-of-custody documentation. Narcotic substance shipments additionally require secure controlled substance courier handling, with chain-of-custody documentation satisfying both GDP requirements and the traceability obligations of the 1961 UN Single Convention reporting framework.',
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

-- =============================================================================
-- End of Gap E Education Seed Migration
-- =============================================================================


COMMIT;
