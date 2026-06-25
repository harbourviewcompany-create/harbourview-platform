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
