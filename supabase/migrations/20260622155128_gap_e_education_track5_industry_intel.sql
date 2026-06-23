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
