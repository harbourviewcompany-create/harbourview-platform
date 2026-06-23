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
        'The World Health Organization''s GMP guidelines (WHO Technical Report Series No. 986, Annex 2) are recognised by many non-EU markets--including Australia (TGA), Canada (Health Canada), and several Latin American and Asian regulators--as an acceptable standard for pharmaceutical manufacturing, including cannabis-derived products. WHO-GMP inspections are conducted by national medicines regulatory authorities (NMRAs) or accredited third-party bodies, and certificates are issued for a defined scope of manufacturing activities. For cannabis producers seeking multi-market access, WHO-GMP certification provides a cost-effective foundation before pursuing market-specific certifications such as EU-GMP or TGA GMP.',
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
