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
        'Germany represents the largest regulated medicinal cannabis market in Europe, with over 4 million patient prescriptions dispensed in 2023 and annual import volumes estimated at 30,000-40,000 kg of dried flower equivalents. The market is characterised by a fragmented pharmacy-based dispensing model, a dominant dried flower product category, and strong demand for high-THC cultivars from established Canadian, Dutch, and Danish producers. The CanG reforms of 2024 have introduced adult-use possession rights but preserve the prescription-only import model for pharmaceutical-grade cannabis, sustaining demand for EU-GMP-certified international supply.',
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
