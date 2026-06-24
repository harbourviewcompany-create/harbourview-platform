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
