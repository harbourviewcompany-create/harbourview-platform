
-- RECOVERY BEGIN 20260714190100_jurisdiction_playbooks_batch22b_content.sql
-- Playbook content + market metrics for batch 22 (part B of B, see batch22a
-- for source_registry entries this migration references by source_url).

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 18,
  estimated_cost_range = 'No standard published fee schedule; production licences are granted exclusively to public entities and certified laboratories, not private commercial applicants, making cost estimation moot for most business models. Import/trade licences (open to individuals and legal entities) and artisanal cultivation licences (patient associations only) have separate, uncatalogued cost structures',
  legal_framework_summary = 'Peru operates one of the most state-controlled medical cannabis frameworks in Latin America, alongside a newer and considerably more commercially accessible industrial hemp track. Law No. 30681, enacted November 2017, authorizes medical and therapeutic use, research, production, import, and commercialization of cannabis and its derivatives — but as a general legal default, growing, importing, and commercializing cannabis remain exclusively reserved for the Peruvian state, with private participation permitted only through specific licence categories. The current regulatory framework, Supreme Decree No. 004-2023-SA, took effect 1 September 2023 and distinguishes psychoactive cannabis (THC content 1% or greater) from non-psychoactive cannabis (THC under 1%, legally termed "cáñamo" or hemp), with both usable for medical and therapeutic purposes but under different licensing tracks. Four private-sector-relevant licence categories exist: scientific investigation licences (universities and agriculture/health research institutions only); import and trade licences (open to individuals and legal entities — the most commercially accessible category, though these entities cannot themselves import, only market derivatives already brought in by licensed importers); production licences (restricted exclusively to public entities and certified laboratories, effectively excluding standard private commercial cultivators); and artisanal cultivation licences (restricted to registered, certified associations of patients). Pharmaceutical laboratories and "droguerías" (a Peru-specific legal category for pharmaceutical distribution, import, and quality-control establishments) are the entities eligible to obtain licences to import and/or market cannabis derivatives, and must certify they will sell only to other licensed entities such as pharmacies. Patients access product through the National Registry of Cannabis and Derivatives Users Patients for Medical and Therapeutic Purposes (RENPUC), requiring a prescription from a physician specifically trained and registered in cannabinoid therapeutics — a foreign medical cannabis card does not grant any legal access in Peru. Penalties for unlicensed activity are severe: cultivating, promoting, or financing cannabis production without a licence carries 8 to 15 years imprisonment plus fines and professional disqualification; unlicensed seed trading carries 5 to 10 years. Recreational use is not legal, though Article 299 of the Penal Code provides a non-punishable personal-possession threshold of 8 grams of cannabis or 2 grams of derivatives, a legal defense against prosecution rather than a right to buy or sell. Separately and more commercially promising, Law No. 32195, enacted December 2024, establishes a distinct legal and considerably more open framework for industrial hemp (under 1% THC dry weight) covering agricultural and industrial applications in cosmetics, food, textiles, and construction — individuals and businesses researching, producing, importing, or commercializing hemp under this law are explicitly not required to obtain the licences that govern psychoactive cannabis. As of the most recent regulatory review, 27 cannabis-derived products were registered for the Peruvian market (4 as medicines, 23 under the more accessible "natural products" registration category), reflecting a regulatory system industry analysts describe as increasingly adaptable, though direct private-sector cultivation of psychoactive cannabis remains effectively state-gated.',
  steps = '[{"step":"Determine whether the intended activity falls under psychoactive cannabis or industrial hemp","detail":"These are two structurally different legal tracks under Peruvian law — hemp (under 1% THC) under Law 32195 has a materially more open licensing path than psychoactive cannabis (1%+ THC) under Law 30681/Decree 004-2023-SA"},{"step":"For psychoactive cannabis, identify the correct licence category","detail":"Private commercial applicants realistically qualify only for import/trade licences (as individuals or legal entities) or, if operating as a pharmaceutical laboratory/droguería, for derivative-marketing licences — production licences are reserved exclusively for public entities and certified laboratories"},{"step":"Register any imports through DIGEMID","detail":"Import of psychoactive cannabis products requires an Import Official Certificate and an Analysis Certificate from DIGEMID; non-psychoactive imports require only an Analysis Certificate"},{"step":"For hemp-specific ventures, engage directly with the Law 32195 framework","detail":"This December 2024 law is the more commercially accessible route for cosmetics, food, textile, and construction applications and does not require the licences that gate psychoactive cannabis"},{"step":"Budget for the natural-products registration pathway if pursuing derivative products","detail":"23 of 27 currently registered cannabis-derived products in Peru used the natural-products category rather than full medicine registration — a materially faster and less burdensome route worth evaluating against the medicines pathway"}]'::jsonb,
  key_regulators = '["DIGEMID (Dirección General de Medicamentos, Insumos y Drogas) — product registration, manufacturing licences, import authorizations, under MINSA","MINSA (Ministry of Health) — overall regulatory authority for medical cannabis framework","DEVIDA (National Commission for Development and Life without Drugs) — cultivation licence application evaluation"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming a standard business licence permits cannabis cultivation — production licences are reserved exclusively for public entities and certified laboratories; a private commercial cultivator without this specific qualification cannot legally obtain one',
    'Conflating the hemp framework (Law 32195, Dec 2024) with the psychoactive cannabis framework (Law 30681/Decree 004-2023-SA) — these have materially different licensing requirements, and hemp''s comparative openness does not extend to THC-dominant cannabis',
    'Assuming a foreign medical cannabis card provides any legal access in Peru — patients must register with RENPUC and obtain a prescription from a Peru-registered, cannabinoid-therapeutics-trained physician; foreign documentation has no legal standing'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a CMS Expert Guide, the International Bar Association''s 2026 regulatory review (citing the exact registered-product counts), Harris Sliwoski''s specialist Canna Law Blog, and Wikipedia''s well-cited overview, all consistent on the licence category structure, the 2023 and 2024 regulatory milestones, and the state-reservation default',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ibanet.org/medicinal-cannabis-regulations-peru')
WHERE country_iso2 = 'PE';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'No standard licensing fee schedule has been published as of the most recent reporting; the Medicinal Cannabis Authority was only formally launched in April 2025 and permit/licence application forms were only made available in April 2026, meaning the licensing programme is at an application-intake stage rather than an established fee structure stage. Personal possession/cultivation permits and Rastafari religious registration carry a nominal annual fee (EC$100, waived for early registrants through December 2026)',
  legal_framework_summary = 'Saint Kitts and Nevis has taken a distinctively cautious, incremental approach to cannabis reform compared to most Caribbean neighbours, and — critically — its Attorney General has publicly and explicitly stated in the National Assembly why full commercial legalization is not currently feasible, a structural constraint that should shape any market-entry assessment. Reform began with a May 2019 High Court ruling (Ventose J.) that found provisions of the 1986 Drugs Act unconstitutional as applied to Rastafari religious practice, followed by the National Assembly formally decriminalizing up to 15 grams in July 2019. In 2023, the government passed two targeted laws rather than pursuing broad decriminalization: the Rastafari Rights Recognition Act, which allows registered Rastafari groups to cultivate, possess, and use cannabis sacramentally at registered places of assembly, and the Freedom of Conscience (Cannabis) Act, which created an individual permit system allowing licence holders aged 18+ to possess up to 56 grams of cannabis or 15 grams of resin and cultivate up to 5 plants in a secured area of their private residence. Separately, the Cannabis Act (approved by the legislature in April 2020) established the Medicinal Cannabis Authority to regulate a licensed medical cannabis industry — cultivation, transport, manufacture, research, testing, import, export, and dispensing all require a licence under this framework — with oversight transferred from the Prime Minister''s direct authority to the Minister of Agriculture in November 2023. The Medicinal Cannabis Authority was formally launched in April 2025, and permit and licence application forms were made available in April 2026, indicating the programme is still in its early operational rollout rather than an established licensing regime. Most significantly for any commercial assessment: on 31 March 2026, Attorney General and Minister of Justice Garth Wilkin delivered a detailed statement to the National Assembly explaining that full cannabis legalization for non-medicinal, non-religious purposes remains infeasible because of St. Kitts and Nevis''s dependence on correspondent banking relationships with U.S. and European financial institutions, where cannabis remains federally illegal — Wilkin stated directly that if those institutions perceived Kittitians could legally profit from cannabis, "they would cut off our banking system from the International Finance System." This is a structural, treaty- and banking-driven constraint on the pace and scope of reform, not merely political caution, and it explains why the country has pursued narrow, carefully scoped legal categories (religious use, personal permits, medical licensing) rather than a broader commercial framework. There are currently no dispensaries offering walk-in retail purchase; the framework is built around registered Rastafari practitioners and individual permit holders, not general commercial retail or tourist access.',
  steps = '[{"step":"Understand the banking-relationship constraint before assuming any commercial cannabis revenue model is viable","detail":"The Attorney General has explicitly stated that visible commercial cannabis profit-making risks the country''s correspondent banking relationships with US/European institutions — any business plan should account for this as a binding structural constraint, not a temporary political position"},{"step":"Distinguish the three separate legal tracks","detail":"(1) Rastafari sacramental use under the Rastafari Rights Recognition Act 2023, (2) individual personal-use permits under the Freedom of Conscience (Cannabis) Act 2023, and (3) commercial/medicinal licensing under the Cannabis Act via the Medicinal Cannabis Authority — these have different eligibility criteria and do not overlap"},{"step":"Monitor Medicinal Cannabis Authority licence application processing","detail":"Application forms only became available in April 2026 — this is a very early-stage licensing rollout; confirm current processing timelines and requirements directly with the Authority before committing resources"},{"step":"Do not assume tourist or casual-visitor access exists","detail":"There are no walk-in dispensaries; the current framework serves registered Rastafari practitioners and individual permit holders only, unlike more tourism-oriented Caribbean markets such as Jamaica"}]'::jsonb,
  key_regulators = '["Medicinal Cannabis Authority — commercial/medical licensing under the Cannabis Act, launched April 2025, under the Ministry of Agriculture since Nov 2023","Ministry of Ecclesiastical and Faith-Based Affairs — Rastafari group registration under the Rastafari Rights Recognition Act 2023","Cannabis Board — directs the Medicinal Cannabis Authority, established 2021"]'::jsonb,
  common_pitfalls = ARRAY[
    'Underestimating the correspondent-banking constraint as a structural (not merely political) limit on how far and how fast commercial cannabis reform can go — the Attorney General has been explicit and public about this risk as of March 2026',
    'Assuming St. Kitts and Nevis offers tourist-accessible cannabis commerce similar to Jamaica — there are no walk-in dispensaries or visitor permit programmes; the current legal framework serves registered residents (Rastafari practitioners, individual permit holders) only',
    'Treating the 2023 Acts (Rastafari Rights, Freedom of Conscience) as equivalent to a commercial licensing framework — they govern personal and religious use only; commercial activity requires a separate Medicinal Cannabis Authority licence under the Cannabis Act, a programme still in early rollout as of April 2026'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by an official government statement (SKNIS, the St. Kitts-Nevis Information Service, reporting the Attorney General''s National Assembly remarks verbatim), the government''s own public education portal (Cannabis Clarity SKN), and multiple independent legal-analysis sources (CannaCarib, Leafwell) consistent on the 2019-2023 regulatory timeline',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://sknis.gov.kn/2026/03/31/attorney-general-wilkin-explains-why-cannabis-cannot-be-fully-legalized-amid-global-banking-risks/')
WHERE country_iso2 = 'KN';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 15,
  estimated_cost_range = 'Manufacturing licences are valid for two years; specific fee schedules are not uniformly published across sources, though regulatory inspection and compliance costs (specialized legal/consulting support is commonly recommended) are described as significant. Panamanian-majority ownership is required for cultivation licences specifically',
  legal_framework_summary = 'Panama was the first Central American country to legalize medical cannabis, but spent nearly four years in a slow-motion implementation gap before the programme became genuinely operational in 2026, and understanding that timeline is essential to correctly gauging market maturity. Law 242, signed 13 October 2021 following a unanimous National Assembly vote, established the legal framework for medicinal, therapeutic, veterinary, and scientific cannabis use, authorizing seven licence categories: cultivation, manufacturing, research, import, export, distribution, and dispensing. Executive Decree 121 (September 2022) established the initial licensing framework and a dedicated oversight body — the National Directorate for the Monitoring of Activities Related to Medicinal Cannabis, under the Ministry of Public Safety, responsible for licensing production, setting security protocols, and coordinating with law enforcement — but implementation proceeded slowly for over two years, with patients lacking formal access to cannabis-based treatments throughout. The turning point came with Executive Decree No. 6 (April 2025), which completely rewrote the medical cannabis regulations, replacing the 2022 framework with a streamlined multi-agency approach: it eliminated the requirement for mandatory specialized training courses for prescribing physicians and pharmacists (any authorized health professional can now prescribe medical cannabis under the same rules as other controlled medications), removed the closed list of qualifying medical conditions (leaving prescribing to medical discretion), and relaxed technical requirements to let companies begin operating. Resolution No. 212 (September 2025) then established formal requirements for an exemption from full sanitary product registration for both THC- and CBD-containing medical cannabis products, provided they are physician-prescribed and, for THC products, dispensed only to patients registered under the National Program for the Use of Medical Cannabis. These changes catalyzed rapid, visible progress: Panama''s first cannabis-exclusive pharmacy opened 22 January 2026, and the Ministry of Health has granted seven commercialization licences. Critically, all medicinal cannabis products currently on the Panamanian market are imported — domestic cultivation has not yet begun, though licensed companies have a two-year transition period from licensing to begin local cultivation and manufacturing, meaning a genuine domestic supply chain is not expected before roughly 2027-2028. Cultivation licences specifically require Panamanian-majority ownership; import/export and distribution licences are more accessible to foreign-linked entities. Separately, Panama passed Law 464 in March 2025, legalizing hemp-derived CBD with a 1% THC threshold for hemp itself, though specific consumer-product THC limits are still being clarified through implementing regulations as of the most recent reporting. Recreational cannabis remains illegal, prosecuted under Law 13 of 1994 and the Penal Code, though enforcement of simple possession is inconsistently applied in practice.',
  steps = '[{"step":"Confirm current status under Decree No. 6 (April 2025) rather than the original 2021-2022 framework","detail":"The regulatory landscape changed substantially in 2025 — mandatory physician training courses were eliminated, the closed qualifying-conditions list was removed, and a multi-agency licensing approach replaced the original single-directorate model; verify which requirements are currently in force before building any compliance plan"},{"step":"Select the appropriate licence category for the intended activity","detail":"Seven categories exist under Law 242: cultivation, manufacturing, research, import, export, distribution, and dispensing — import/export and distribution licences do not carry the Panamanian-majority ownership requirement that applies specifically to cultivation"},{"step":"Plan around the two-year domestic cultivation transition period","detail":"All product on the Panamanian market is currently imported; licensed companies have a two-year window post-licensing to establish domestic cultivation and manufacturing — factor this into any supply chain or vertical integration plan"},{"step":"Evaluate the Resolution 212 sanitary registration exemption pathway","detail":"This September 2025 resolution offers a faster route to market for both THC and CBD products than full sanitary registration, provided prescription and (for THC) patient-registry requirements are met"},{"step":"Track Law 464 (hemp/CBD) implementing regulations separately from the medical cannabis framework","detail":"Hemp-derived CBD legalization (March 2025) operates under a distinct legal basis from Law 242 medical cannabis, with its own still-developing consumer product rules"}]'::jsonb,
  key_regulators = '["Ministry of Health (MINSA) — lead authority, prescribing rules, National Program for the Use of Medical Cannabis patient registry, licence issuance","Ministry of Agricultural Development (MIDA) — cultivation and seed regulation, joint oversight with MINSA","National Directorate for the Monitoring of Activities Related to Medicinal Cannabis — under Ministry of Public Safety, security protocols and production licensing","National Customs Authority (ANA) — import/export control","National Directorate of Pharmacy and Drugs — finished medicine registration"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Panama''s "first in Central America" 2021 legalization means a mature market — genuine implementation only began in 2025-2026 after Decree No. 6''s rewrite; the practical market is very young despite the multi-year-old law',
    'Planning around domestic cultivation without accounting for the two-year transition period — all current market supply is imported, and licensed companies are only now beginning to establish domestic growing operations',
    'Assuming cultivation licence eligibility applies uniformly across all seven licence categories — the Panamanian-majority ownership requirement applies specifically to cultivation, not to import, export, distribution, or dispensing licences'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a detailed April 2026 Herb.co regulatory timeline, Wikipedia''s well-cited entry (confirming the January 2026 pharmacy opening and seven-licence figure via TVN reporting), Lexology''s legal-industry coverage of Resolution 212, and Harris Sliwoski''s specialist Canna Law Blog, all consistent on the Decree 6 reforms and 2026 implementation milestones',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-panama')
WHERE country_iso2 = 'PA';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 9,
  estimated_cost_range = 'Application processing fees: US$300 for individuals, US$500 for companies or cooperatives. Annual licence fees: commercial cultivation US$2,000-3,000 depending on tier and acreage; herb house/therapeutic retail licences US$2,500 annually. Standardized licence tenure is now 3 years (as of April 2026 reforms) rather than annual renewal. A new Special Community Permit carries no application fee, specifically designed to lower barriers for small and traditional farmers',
  legal_framework_summary = 'Jamaica operates the most mature and actively evolving licensed cannabis regime among the Caribbean jurisdictions in this dataset, with a regulator that has been publicly and iteratively reforming its own rules to improve accessibility. The Dangerous Drugs (Amendment) Act 2015 decriminalized personal possession, established the Cannabis Licensing Authority (CLA) under the Ministry of Industry, Commerce, Agriculture and Fisheries, and created the legal foundation for a licensed medical, therapeutic, and scientific cannabis industry. Possession of 2 ounces (56.7 grams) or less is a non-arrestable petty offence carrying a JMD $500 ticket, with no criminal record; households may cultivate up to 5 plants for personal use without a licence (6 or more requires CLA authorization and falls under criminal cultivation provisions). The CLA issues licences across five categories — cultivation, processing, retail ("herb houses"), transport, and research — and as of 2025-2026 has issued over 90 licences and 100+ conditional approvals. The regulatory framework has been under active, iterative reform through 2026: in March 2026, Minister of Industry, Investment and Commerce Aubyn Hill told the House of Representatives'' Standing Finance Committee that amendments to the Dangerous Drugs (Cannabis Licensing) (Interim) Regulations were being finalized specifically to improve access for small and legacy cultivators, including a proposed community cultivation model allowing farmer groups to collectively cultivate up to 10 acres. Those amendments were formally launched in April 2026 at an event where CLA CEO Farrah Blake detailed the specific changes: standardization of licence tenure to 3 years (up from shorter renewal cycles), provisions allowing continued operation during licence renewal periods, flexible payment options, uniform fencing standards, permission for authorized retailers to deliver product to clients and caregivers, employee identification cards enabling easier movement between licensed employers, and — most significantly for small-scale entry — a new Special Community Permit with no application fee, allowing farmers to organize collectively (as a registered friendly society, association, or company) and access CLA technical support and legal sale within the licensed space. A separate Cultivators (Transitional) Special Permit was also introduced to ease legacy growers into the formal system. Despite this genuine regulatory momentum, a persistent structural constraint remains unresolved: commercial banks in Jamaica will not accept deposits from cannabis companies or individuals, a banking-access gap industry figures (Ganja Growers and Producers Association) continue to flag as an active grievance as of March 2026, driven by the same international correspondent-banking risk dynamics affecting other jurisdictions in this region. Tourist access operates through the Therapeutic Cannabis Permit for Visitors, allowing adults 18+ to obtain same-day medical authorization (around US$10, roughly 10 minutes) at a licensed herb house and purchase up to 2 oz for the duration of a stay (up to 30 days) — this authorizes on-island purchase and consumption only; carrying cannabis through Jamaican international airports remains a criminal offence regardless of permit status. No bill for full adult-use recreational legalization has advanced as of May 2026.',
  steps = '[{"step":"Select the appropriate licence category and consider the new Special Community Permit if entering at small scale","detail":"Five categories exist: cultivation, processing, retail (herb houses), transport, and research; the April 2026 Special Community Permit specifically removes application fees for small/traditional farmers organizing as a collective entity"},{"step":"Register as the correct entity type for community-model participation","detail":"The Special Community Permit requires organizing as a registered friendly society, association, or company — individual small farmers cannot access this specific low-barrier pathway without collective organization"},{"step":"Apply through the CLA''s Licensing and Applications Division","detail":"Process involves desk verification, due diligence checks, conditional approval, pre-licensing site inspection, and licence issuance; budget for the application processing fee (US$300 individual / US$500 company) plus the annual category-specific licence fee"},{"step":"Plan for the banking-access gap from day one","detail":"Commercial banks in Jamaica do not accept deposits from cannabis businesses — cash-management and financial infrastructure planning must account for this unresolved structural constraint rather than assuming standard banking access"},{"step":"For tourism-facing retail models, understand the Therapeutic Cannabis Permit for Visitors as a demand driver","detail":"This same-day visitor authorization pathway (roughly US$10, ~10 minutes) is a distinct product from resident/patient access and represents a meaningful part of licensed herb house commercial activity"}]'::jsonb,
  key_regulators = '["Cannabis Licensing Authority (CLA) — licensing, permits, authorizations, enforcement and monitoring, under the Ministry of Industry, Commerce, Agriculture and Fisheries (MICAF)","Ministry of Justice — jurisdiction over Rastafari religious cannabis use (outside CLA remit)","National Council on Drug Abuse (NCDA) — education and counseling referral pathway"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming standard commercial banking access — Jamaican commercial banks will not accept deposits from cannabis companies or individuals; this remains an active, unresolved industry grievance as of March 2026 and must be planned around, not assumed away',
    'Missing the April 2026 regulatory reforms and applying under outdated licence-tenure or fee assumptions — licence tenure was standardized to 3 years, new permit categories were introduced, and operational requirements (fencing, delivery provisions) changed; confirm current rules directly with the CLA rather than relying on pre-2026 sources',
    'Assuming the Therapeutic Cannabis Permit for Visitors allows cannabis to leave Jamaica — it authorizes on-island purchase and consumption only; carrying any cannabis through Norman Manley or Sangster International airports is a criminal offence regardless of permit status'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated directly by the CLA''s own official site, on-record April 2026 statements from CLA CEO Farrah Blake and Minister Aubyn Hill (Jamaica Observer, Jamaica Gleaner), and multiple independent legal/tourism-focused sources (LegalClarity, CannaCarib) consistent on licence categories, fee figures, and the 2015 statutory foundation',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.jamaicaobserver.com/2026/04/18/new-cannabis-rules-remove-barriers-small-farmers-says-cla-head/')
WHERE country_iso2 = 'JM';

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('PE', 'Registered Cannabis-Derived Products', 27, 'products', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'International Bar Association', 'https://www.ibanet.org/medicinal-cannabis-regulations-peru', '2025-12-04', '4 registered as medicines, 23 under the natural-products category; illustrates the natural-products pathway as the dominant route to market'),
  ('PE', 'Personal Possession Decriminalization Threshold', 8, 'grams', '2017-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'CMS Expert Guides', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/peru', '2024-06-18', 'Non-punishable personal-use threshold under Article 299 of the Penal Code; 2 grams for derivatives'),
  ('KN', 'Personal Possession Threshold', 56, 'grams', '2023-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Cannabis Clarity SKN (official government portal)', 'https://cannabisclarityskn.com/', '2026-01-01', 'Under the Freedom of Conscience (Cannabis) Act 2023, for permit holders aged 18+; 15 grams for cannabis resin'),
  ('KN', 'Maximum Personal Cultivation Plants', 5, 'plants', '2023-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'CannaCarib', 'https://www.cannacarib.net/saint-kitts-and-nevis/', '2026-04-13', 'Per licensed individual in a secured area of a private residence under the Freedom of Conscience (Cannabis) Act 2023'),
  ('PA', 'Commercialization Licenses Issued', 7, 'licences', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Wikipedia (citing TVN reporting)', 'https://en.wikipedia.org/wiki/Cannabis_in_Panama', '2026-04-02', 'Issued by MINSA as of the January 2026 opening of Panama''s first dedicated medical cannabis pharmacy'),
  ('PA', 'Domestic Cultivation Transition Period', 2, 'years', '2025-04-01', '2027-04-01', 'point_in_time', 'observed', 'high', 'Herb.co', 'https://herb.co/city-guides/buy-weed-panama', '2026-04-24', 'Window granted to licensed companies to establish domestic cultivation/manufacturing, from Decree No. 6 (April 2025); all current market supply is imported'),
  ('JM', 'CLA Licences and Conditional Approvals Issued', 90, 'licences', '2025-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Cannabisregulations.ai', 'https://www.cannabisregulations.ai/country-legality/jamaica-marijuana', '2026-06-01', 'Over 90 licences issued plus 100+ conditional approvals across cultivation, processing, retail, transport, and research categories'),
  ('JM', 'Community Cultivation Model Maximum Acreage', 10, 'acres', '2026-03-01', '2026-12-31', 'point_in_time', 'observed', 'medium', 'Jamaica Gleaner', 'https://www.jamaica-gleaner.com/article/news/20260706/clarendon-ganja-growers-urged-tap-new-licensing-arrangements', '2026-03-11', 'Proposed maximum for groups of small farmers cultivating collectively for medicinal purposes under the community model discussed in the March 2026 amendments')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('PE','KN','PA','JM');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714190100','jurisdiction_playbooks_batch22b_content','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714190100_jurisdiction_playbooks_batch22b_content.sql

-- RECOVERY BEGIN 20260714192255_expose_regulatory_pathways_intel_tier.sql
-- Exposes regulatory_pathways + pathway_format_rules (the per-country,
-- per-product-format legal-viability data -- legal basis, qualifying
-- conditions, THC/CBD limits, possession limits per format) through the api
-- schema for the first time, gated on the intel/operator tier.
--
-- Both tables previously had a fully public read policy (`using (true)` for
-- anon + authenticated) -- reasonable while nothing consumed them, but not
-- the intended access level now that this is the paid-tier product surface.
-- product_formats (the 17-row format taxonomy: flower/extract/oil/edible/
-- etc.) is deliberately left public -- it's a reference list, not the
-- proprietary analysis; gating it would just be friction with no
-- commercial purpose.
--
-- Applied directly first given this touches the current subscription/RLS
-- boundary; this commits the matching file. Tested: policy content and view
-- reloptions confirmed directly against pg_policies/pg_class before writing
-- this file, not just asserted.

drop policy if exists regulatory_pathways_public_read on public.regulatory_pathways;
create policy regulatory_pathways_tier_read on public.regulatory_pathways
  for select
  using (public.current_user_tier() in ('intel','operator'));

drop policy if exists pathway_format_rules_public_read on public.pathway_format_rules;
create policy pathway_format_rules_tier_read on public.pathway_format_rules
  for select
  using (public.current_user_tier() in ('intel','operator'));

-- anon can never pass current_user_tier() (no auth.uid()), so it could never
-- read a row even with the grant -- revoked anyway so the grant list
-- reflects actual intent, not just what RLS happens to block.
revoke select on public.regulatory_pathways from anon;
revoke select on public.pathway_format_rules from anon;
grant select on public.regulatory_pathways to authenticated;
grant select on public.pathway_format_rules to authenticated;

create or replace view api.regulatory_pathways
with (security_invoker = true) as
select id, iso_alpha2, name, pathway_type, status, legal_basis, regulator,
       effective_date, sunset_date, qualifying_conditions, prescriber_scope,
       min_age, reimbursement, summary, verification, last_verified_at
from public.regulatory_pathways;

create or replace view api.pathway_format_rules
with (security_invoker = true) as
select id, pathway_id, format_id, status, thc_limit, cbd_limit, conditions,
       notes, possession_limit, unit_dose_limit, packaging_labelling,
       verification, last_verified_at, effective_date
from public.pathway_format_rules;

grant select on api.regulatory_pathways to authenticated;
grant select on api.pathway_format_rules to authenticated;

-- product_formats had no api exposure at all yet (found via
-- get_tables_missing_from_api_schema) -- needed so the format picker can
-- query it through the same client. Public, matching its role as a
-- reference taxonomy rather than gated intelligence.
create or replace view api.product_formats
with (security_invoker = true) as
select id, slug, name, category, description, sort_order
from public.product_formats;

grant select on api.product_formats to anon, authenticated;

-- security_invoker = true is set explicitly above rather than relying solely
-- on the enforce_api_view_security_invoker_trigger event trigger from
-- 20260713070355 -- belt and suspenders, since RLS enforcement is the entire
-- point of this migration.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714192255','expose_regulatory_pathways_intel_tier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714192255_expose_regulatory_pathways_intel_tier.sql

-- RECOVERY BEGIN 20260714213221_dedupe_market_metrics_title_case_collisions.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714213221.
--
-- Rewriting this file cannot affect production: 20260714213221 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Cleanup: parallel-session inserts created duplicate facts under Title Case metric_name
-- variants alongside the snake_case rows this project otherwise uses. Same underlying value,
-- same unit, just a different name string -- so the (country_iso2, metric_name, period_start,
-- period_end) unique constraint didn't catch them. Keeping the snake_case row in each pair.

DELETE FROM public.market_metrics
WHERE country_iso2 = 'UA' AND metric_name IN ('INCB Import Quota 2026', 'Estimated Addressable Patient Population');

DELETE FROM public.market_metrics
WHERE country_iso2 = 'SI' AND metric_name = 'Projected Medical Cannabis Market Size 2029';

DELETE FROM public.market_metrics
WHERE country_iso2 = 'GD' AND metric_name IN ('Legal Personal Possession Threshold', 'Maximum Household Cultivation Plants');

DELETE FROM public.market_metrics
WHERE country_iso2 = 'IE' AND metric_name IN ('2025 Customs Cannabis Seizure Value', 'MCAP Ministerial-Approval Route Patients');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714213221','dedupe_market_metrics_title_case_collisions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714213221_dedupe_market_metrics_title_case_collisions.sql

-- RECOVERY BEGIN 20260714213619_batch_14_playbooks_metrics_overlay_se_lk_ae_zw.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714213619.
--
-- Rewriting this file cannot affect production: 20260714213619 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Batch 14: jurisdiction_playbooks + market_metrics + country_education_overlay for SE, LK, AE, ZW
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- SE: one of Europe's strictest regimes -- even personal consumption itself is criminalized; 2019
--     Supreme Court ruling makes any detectable THC in CBD a narcotics offense; no reform on the agenda.
-- LK: narrow centuries-old Ayurvedic carve-out, now overlaid with a brand-new (Aug 2025) export-only
--     BOI cultivation scheme for 7 foreign investors -- explicit zero tolerance for domestic leakage.
-- AE: firm prohibition with real criminal exposure, softened 2021 first-offense procedure, now layered
--     with a brand-new (1-Jan-2026) industrial hemp licensing framework whose flower/CBD-extraction
--     treatment remains explicitly unresolved pending implementing regulations.
-- ZW: 2018 medical legalization (2nd in Africa after Lesotho); steep license fees have limited uptake
--     to 15 of 57 issued licenses actually activated; private personal use/cultivation still criminal.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Herb -- How to Buy Weed in Sweden: Stockholm''s Zero-Tolerance Laws (2026)',
   'https://herb.co/city-guides/buy-weed-sweden',
   'industry_press', 2, 'Sweden', 'SE', 'Europe', 'html_snapshot', 'monthly', 'active', true, true,
   '2026 synthesis: no reform on the political agenda, Germany-contrast framing, 2026 academic decriminalization-modeling study'),
  ('Wikipedia -- Cannabis in Sweden',
   'https://en.wikipedia.org/wiki/Cannabis_in_Sweden',
   'reference', 2, 'Sweden', 'SE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Special-license growth (8 in 2016 to 63 in 2018); 2017 Supreme Court cultivation-as-minor-offense ruling'),
  ('Cannigma -- Is Weed Legal in Sweden? Cannabis Laws & CBD Rules 2026',
   'https://cannigma.com/regulation/sweden-marijuana-laws/',
   'legal_analysis', 2, 'Sweden', 'SE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '2012/2017 Sativex and Bedrocan approval history; 2019 CBD Supreme Court ruling detail'),
  ('MyCannabis.com -- Is Weed Legal in Sweden? 2026',
   'https://www.mycannabis.com/is-weed-legal-in-sweden/',
   'legal_analysis', 2, 'Sweden', 'SE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Special-licence application process detail; 2021 survey opposition figure (67%)'),
  ('cannabisregulations.ai -- Is Weed Legal in Sweden? 2026 Cannabis Laws & Penalties',
   'https://www.cannabisregulations.ai/country-legality/sweden-marijuana',
   'legal_analysis', 2, 'Sweden', 'SE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Smuggling Act penalty detail; 2023 Narkotikautredningen (SOU 2023:62) inquiry reference'),

  ('OneWorld SouthAsia -- Sri Lanka Grants First-Ever Licences for Cannabis Cultivation for Export',
   'https://owsa.in/sri-lanka-grants-first-ever-licences-for-cannabis-cultivation-for-export/',
   'news', 1, 'Sri Lanka', 'LK', 'Asia', 'html_snapshot', 'weekly', 'active', true, true,
   'August 2025 BOI licensing detail: 7 of 37 investors, $5M/$2M figures, 6-month license terms'),
  ('Leafwell -- Is Marijuana Legal in Sri Lanka?',
   'https://leafwell.com/blog/is-marijuana-legal-in-sri-lanka',
   'legal_analysis', 2, 'Sri Lanka', 'LK', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Ayurveda Act framework; historical reliance on police-seized cannabis for Ayurvedic supply'),
  ('Wikipedia -- Cannabis in Sri Lanka',
   'https://en.wikipedia.org/wiki/Cannabis_in_Sri_Lanka',
   'reference', 2, 'Sri Lanka', 'LK', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   '2017 Ingiriya plantation proposal; estimated 600,000 domestic users'),
  ('MJBizDaily -- Sri Lanka to allow strictly regulated cannabis cultivation',
   'https://www.mmjdaily.com/article/9756232/sri-lanka-to-allow-strictly-regulated-cannabis-cultivation/',
   'news', 2, 'Sri Lanka', 'LK', 'Asia', 'html_snapshot', 'weekly', 'active', true, true,
   'BOI/Department of Ayurveda joint oversight confirmation'),
  ('Grokipedia -- Cannabis in Sri Lanka',
   'https://grokipedia.com/page/Cannabis_in_Sri_Lanka',
   'reference', 2, 'Sri Lanka', 'LK', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   '2022 debt default and IMF bailout context for the export-scheme pivot; domestic opposition detail'),

  ('Wikipedia -- Cannabis in the United Arab Emirates',
   'https://en.wikipedia.org/wiki/Cannabis_in_the_United_Arab_Emirates',
   'reference', 2, 'United Arab Emirates', 'AE', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Trafficking/possession sentence figures; UAE transshipment-hub role for Pakistan/Afghanistan cannabis'),
  ('LYLAW -- Possession of Cannabis in the UAE',
   'https://lylawyers.com/blog/possession-of-cannabis-in-the-uae',
   'legal_analysis', 1, 'United Arab Emirates', 'AE', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Article 96 entry-point mechanism and Resolution 43 substance-quantity table; documented acquittal case'),
  ('MIO & Partners -- UAE Hemp Decree-Law Explained',
   'https://www.miopartners.ae/uae-issues-federal-decree-law-regulating-industrial-and-medical-uses-of-industrial-hemp/',
   'legal_analysis', 1, 'United Arab Emirates', 'AE', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Full Industrial Hemp Decree-Law structure: THC ceiling, licensing, compliance obligations, effective date'),
  ('Hemp Today -- What is the UAE doing with its new hemp policy?',
   'https://hemptoday.net/what-is-the-uae-doing-with-its-new-hemp-policy-and-who-is-driving-the-strategy/',
   'industry_press', 2, 'United Arab Emirates', 'AE', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Analysis of unresolved flower/CBD-extraction treatment and top-down industrial strategy framing'),
  ('StartDXB -- Cannabis Laws Dubai 2026: What Tourists Must Know',
   'https://www.startdxb.ae/article/cannabis-laws-in-dubai-2026-what-changed-and-what-tourists-should-still-know',
   'legal_analysis', 2, 'United Arab Emirates', 'AE', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   '2021 Decree-Law 30 rehab-pathway detail; THC vape/residue enforcement practice'),

  ('Wikipedia -- Cannabis in Zimbabwe',
   'https://en.wikipedia.org/wiki/Cannabis_in_Zimbabwe',
   'reference', 2, 'Zimbabwe', 'ZW', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   '27-April-2018 legalization date; corporate-capture and agrarian-change academic citation'),
  ('Cannavigia -- Cannabis Compliance in Zimbabwe',
   'https://www.cannavigia.com/blog-posts/cannabis-country-report-zimbabwe-how-to-get-a-license',
   'industry_press', 2, 'Zimbabwe', 'ZW', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Full licensing-fee structure: initial, annual, research-component, and 5-year renewal figures'),
  ('The Exchange (Africa) -- Zimbabwe licensing cannabis farmers to tap medical marijuana potential',
   'https://theexchange.africa/industry-and-trade/zimbabwe-medicinal-cannabis-farming/',
   'news', 2, 'Zimbabwe', 'ZW', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   '57-licenses-issued/15-activated figure, citing Reuters reporting; Lesotho-first regional context'),
  ('Lex Africa / Scanlen & Holderness -- The unconstitutional criminalisation of private cannabis use in Zimbabwe',
   'https://lexafrica.com/2021/08/the-unconstitutional-incarceration-of-cannabis-in-zimbabwe/',
   'legal_analysis', 2, 'Zimbabwe', 'ZW', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Statutory text of Sections 155-157 of the Criminal Law (Codification and Reform) Act; framed as legal argument, not a decided ruling'),
  ('Sensi Seeds -- Cannabis in Zimbabwe: Laws, Use, Attitudes',
   'https://sensiseeds.com/en/blog/countries/cannabis-in-zimbabwe-laws-use-history/',
   'legal_analysis', 2, 'Zimbabwe', 'ZW', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Zimbabwe Industrial Hemp Trust context; tobacco-export economic comparator')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'SE', 'Sweden', 'very_high', 0,
  'Not applicable for cultivation, processing, or retail sale of any kind -- fully illegal; the only lawful cannabis-derived medicines are dispensed through ordinary pharmacies under prescription, with no commercial cultivation or dispensing license framework of any kind',
  'Sweden enforces one of Europe''s strictest cannabis regimes under the Narcotic Drugs Criminal Act (Narkotikastrafflagen, 1968:64), which classifies cannabis as a Schedule I narcotic and, unusually even by regional standards, criminalizes the act of consumption itself, not merely possession, sale, or cultivation. There is no decriminalized threshold, no tolerance zone, and no personal-use exemption anywhere in the country. Penalties are tiered by quantity and circumstance: minor offenses (possession of roughly under 50 grams, "ringa narkotikabrott") typically draw day-fines (dagsboter) of SEK 1,500 to 15,000 depending on income, or up to six months'' imprisonment for consumption/use specifically; ordinary drug offenses carry up to 3 years; serious offenses 2 to 7 years; and aggravated offenses up to 10 years. Import or export of cannabis for non-medical purposes is separately prosecuted as smuggling under the Smuggling Act (Lag om straff for smuggling, 2000:1225), carrying up to 10 years for aggravated cases; Swedish Customs (Tullverket) routinely seizes cannabis shipments, including from travelers arriving from jurisdictions where cannabis is legal, and refers cases for prosecution. Medical cannabis access is extremely narrow: Sativex (nabiximols) has been the only routinely authorized cannabis-based medicine since 2012/2017, approved specifically for multiple sclerosis-related spasticity, and is dispensed like any other prescription drug through ordinary pharmacies -- there are no medical dispensaries. Where an approved medicine is unsuitable, a prescribing doctor can apply to the Swedish Medical Products Agency (Lakemedelsverket) for a case-by-case special licence to dispense an otherwise-unauthorized preparation, including cannabis flower, but this route is rare and narrow: special licences for non-approved cannabis preparations grew from just 8 in 2016 to 63 in 2018, and cannabis flower is approved only occasionally. Patients cannot legally cultivate cannabis even under a medical licence, and patient collectives are prohibited; Sweden''s Supreme Court has ruled that unlicensed cultivation for personal medical use is treated as a minor drug offense rather than being exempted, meaning it remains a criminal matter, just a less severe one. CBD is subject to an especially strict regime: a landmark 18 June 2019 Supreme Court ruling held that any cannabis preparation containing detectable THC is a narcotic under Swedish law regardless of source (including industrial hemp) or concentration, which in practice makes zero-THC content the real bar for lawful CBD, a materially stricter standard than the roughly 0.2% THC tolerance common elsewhere in the EU; the Swedish Medical Products Agency additionally classifies CBD as a medicinal product sellable only in pharmacies with a prescription. A government-commissioned drug-policy inquiry (Narkotikautredningen, SOU 2023:62) examined reform options and reaffirmed the restrictive status quo, and the governing center-right coalition has shown no appetite for change as of 2026; only the Left Party clearly backed decriminalization heading into the 2022 general election, though youth wings of several other parties (Centre, Moderate, Liberal) have voiced support for reform, and a 2026 academic study in the Journal of Cannabis Research has begun modeling the effects of a hypothetical decriminalization, signaling growing academic interest even as legislation lags well behind.',
  '[]'::jsonb,
  '["Swedish Medical Products Agency (Lakemedelsverket) -- approves cannabis-based medicines and decides case-by-case special licence applications", "Public Health Agency of Sweden (Folkhalsomyndigheten) -- drug policy and public health guidance", "Swedish Customs (Tullverket) -- enforcement of import/export smuggling provisions"]'::jsonb,
  ARRAY[
    'Assuming Sweden''s reputation as a progressive Nordic social democracy extends to drug policy -- it holds one of Europe''s strictest cannabis regimes, criminalizing even personal consumption itself, a step most countries do not take',
    'Assuming a foreign medical cannabis prescription or an EU-standard ~0.2% THC CBD tolerance applies in Sweden -- a 2019 Supreme Court ruling makes any detectable THC in a CBD product a narcotics offense, and foreign medical documentation carries no legal weight',
    'Treating the 2023 government drug-policy inquiry (Narkotikautredningen) as a sign of imminent reform -- the inquiry reaffirmed the restrictive approach, and the governing coalition has shown no appetite for legislative change'
  ],
  'published',
  'high -- the core statutory framework, penalty structure, and 2019 CBD Supreme Court ruling are consistently corroborated across Herb''s 2026 guide, Wikipedia, Cannigma, MyCannabis.com, and a specialized compliance guide; public-opinion figures vary somewhat by survey year and methodology (67% opposed per a 2021 survey vs. 83% per 2018 polling) and are presented as reported rather than reconciled',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-sweden'),
  CURRENT_DATE, now()
),
(
  'LK', 'Sri Lanka', 'high', 6,
  'For the August 2025 export-only cultivation scheme: minimum USD 5 million capital investment plus a USD 2 million performance-guarantee bond deposited with the Central Bank of Sri Lanka, per investor; the domestic Ayurvedic-medicine channel involves no comparable commercial licensing cost since only the state Ayurvedic Drugs Corporation may lawfully supply that channel',
  'Sri Lanka maintains a narrow, centuries-old exception to an otherwise strict prohibition, now overlaid with a brand-new export-oriented commercial scheme. Recreational cannabis is fully illegal under the Poisons, Opium and Dangerous Drugs Ordinance of 1935 (the modern iteration of colonial-era 1897 and 1905 restrictions), which prohibits using, possessing, selling, and cultivating any part of the cannabis plant -- a prohibition Sri Lankan authorities interpret to cover industrial hemp and CBD products as well, since both are treated as part of the "marijuana plant." The sole domestic legal channel runs through Ayurvedic medicine: the Ayurveda Act (1980s) permits the state Ayurvedic Drugs Corporation to be the exclusive lawful source of cannabis-based preparations, which roughly 16,000 licensed Ayurvedic physicians may then dispense to patients for conditions such as digestive issues, pain, and anxiety. For decades this supply chain has run on an unusual and constrained input: cannabis seized by police in raids on illicit growers, which is pulverized into powder for use in Ayurvedic formulations -- material that is often old and degraded in potency by the time lengthy court cases conclude and it becomes available. A 2017 government plan to establish a dedicated 400-hectare cannabis plantation near Ingiriya to supply Ayurvedic practitioners (and potentially export to the United States) stalled for years over unresolved cultivation regulations. The picture changed decisively in August 2025: following Sri Lanka''s 2022 sovereign debt default and a subsequent USD 2.9 billion IMF bailout, the Board of Investment (BOI), acting jointly with the Department of Ayurveda, Ministry of Public Security, and Ministry of Environment, approved cannabis cultivation licenses for seven foreign investors -- selected from a pool of 37 proposals -- to grow cannabis strictly for export as a pharmaceutical-grade product, explicitly not for any domestic market. Each investor must commit a minimum USD 5 million capital investment and deposit a USD 2 million performance-guarantee bond with the Central Bank of Sri Lanka; licenses are initially granted for six months, renewable based on compliance and progress reports; and cultivation sites must be securely fenced with Special Task Force or police protection. Then-Cabinet Spokesman and Health Minister Nalinda Jayatissa noted the policy process "began in 2004 and has now reached the implementation stage" -- a 21-year gap between initial policy intent and first licenses. Officials have stressed "zero tolerance for leakage into the domestic market," but the scheme has drawn public criticism: religious leaders (including prominent Buddhist clergy) and health advocates have opposed it as a potential gateway to broader substance use, and the chairman of Sri Lanka''s National Dangerous Drugs Control Board (NDDCB) -- the country''s legal authority bound to report cannabis exports to the International Narcotics Control Board -- has publicly warned that global cannabis oversupply may undercut the scheme''s economics and that export-only cannabis programs elsewhere have historically leaked into domestic black markets. Outside these two narrow channels, cannabis possession, use, and cultivation remain criminal offenses: possession of 5 kilograms or less typically draws a fine or short prison term, while larger quantities and sale/distribution draw substantially harsher penalties (up to roughly 10 years for distribution); Sri Lanka retains the death penalty and life imprisonment on the books for large-scale trafficking of major narcotics generally, though a de facto moratorium has held since the last execution in 1976. An estimated 600,000 people use cannabis in Sri Lanka, reportedly concentrated among higher socio-economic strata.',
  '[
    {"step": "Recognize that Sri Lanka now has two entirely separate legal cannabis channels", "detail": "The Ayurvedic domestic-medicine supply chain and the new export-only BOI cultivation scheme are distinct, with no domestic recreational or general retail pathway of any kind"},
    {"step": "If pursuing the export cultivation route, prepare for a capital-intensive, competitive selection process", "detail": "The first round drew 37 proposals for only 7 approved licenses, each requiring a minimum USD 5 million investment plus a USD 2 million performance bond with the Central Bank"},
    {"step": "Budget for security infrastructure and multi-agency oversight from the outset", "detail": "Licensed export sites require secure fencing and Special Task Force/police protection, with joint oversight from the BOI, Department of Ayurveda, Ministry of Public Security, and Ministry of Environment"},
    {"step": "Treat the initial six-month license term as a compliance-tested trial period, not a settled long-term grant", "detail": "Renewal explicitly depends on progress reports and adherence to guidelines"},
    {"step": "Do not assume any pathway exists for domestic sale, broader medical patient access, or personal cultivation", "detail": "Officials have been explicit that there is zero tolerance for leakage into the domestic market"}
  ]'::jsonb,
  '["Board of Investment (BOI) -- approves and oversees the 2025 export-only cannabis cultivation scheme", "Department of Ayurveda / Ayurvedic Drugs Corporation -- sole lawful domestic source of cannabis-based Ayurvedic preparations", "National Dangerous Drugs Control Board (NDDCB) -- legal authority for narcotics control, reports cannabis exports to the INCB"]'::jsonb,
  ARRAY[
    'Assuming the August 2025 export licenses create any domestic market opening -- officials have been explicit that cultivation is exclusively for export, with zero tolerance for domestic leakage, and existing Ayurvedic-channel access is unaffected and separate',
    'Assuming CBD or industrial hemp occupies a lighter legal category than cannabis flower -- Sri Lankan law treats both as part of the "marijuana plant" and prohibits them outside the licensed Ayurvedic and export-scheme channels',
    'Underestimating the political and institutional friction facing the export scheme -- religious leaders, health advocates, and even the NDDCB''s own chairman have publicly questioned its economics and social risks, and the 21-year gap between initial 2004 policy intent and 2025 implementation illustrates how slowly this process has historically moved'
  ],
  'published',
  'high -- the Ayurvedic-channel framework and its historical reliance on police-seized cannabis are corroborated across Leafwell, Wikipedia, and Sensi Seeds; the August 2025 BOI export licensing (investor count, capital/bond figures, license terms) is corroborated across OneWorld SouthAsia, MJBizDaily, and a recent Grokipedia synthesis; the scheme is new enough that its actual operational and export outcomes have not yet been independently verified in follow-up reporting',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://owsa.in/sri-lanka-grants-first-ever-licences-for-cannabis-cultivation-for-export/'),
  CURRENT_DATE, now()
),
(
  'AE', 'United Arab Emirates', 'very_high', 0,
  'Not applicable for cannabis/THC products in any form -- fully prohibited with real criminal exposure; the new industrial hemp licensing framework (effective January 1, 2026) requires federal and local approvals plus security-clearance and facility conditions, but no public fee schedule had been published as of this review pending implementing regulations',
  'The United Arab Emirates maintains a firm prohibition on cannabis, now layered with two distinct 2020s-era reforms: a 2021 softening of personal-use criminal procedure, and a brand-new, narrowly scoped industrial hemp framework taking effect in 2026. The core law, Federal Decree-Law No. 30 of 2021 on Combating Narcotics and Psychotropic Substances, replaced the earlier Federal Law No. 14 of 1995 and is jointly administered by the Ministry of Interior, the Anti-Narcotics General Directorate, the Ministry of Health and Prevention (MOHAP), and emirate-level authorities such as Dubai Health Authority and the Department of Health Abu Dhabi. Trafficking carries a minimum five-year sentence and can extend to life imprisonment or, in defined cases, death, and sale or possession with intent to distribute remains subject to the harshest penalties in UAE law. The 2021 reform meaningfully changed the treatment of first-time, low-quantity personal use and possession: automatic prison time and the prior mandatory minimum sentence were removed for qualifying first offenses, replaced with a rehabilitation/treatment pathway, and prosecutors gained discretion to decline charges; Wikipedia records a reduced minimum sentence around three months for qualifying use/possession cases post-reform, down from a considerably harsher prior baseline. Separately, Article 96 of the framework (as clarified by Cabinet Resolution 43) decriminalized possession of cannabis-based products specifically at UAE entry points under defined conditions: authorities seize the product, file an administrative report, and deny entry, without pursuing criminal charges, for both tourists and residents -- though this is an entry-point administrative mechanism, not a personal-use legalization, and Resolution 43''s substance-quantity table (covering items like CBD and low-THC products) still allows prosecution where thresholds are exceeded or labeling is misleading. None of this extends to a medical-cannabis pathway: the UAE does not recognize foreign medical cannabis prescriptions in any form, and CBD consumer products remain, in practice, treated the same as cannabis -- even trace THC detected in an ostensibly "CBD-only" product can trigger seizure, investigation, or prosecution, and intent is legally irrelevant to a possession charge. The most significant recent development is a new Industrial Hemp Decree-Law, scheduled to enter into force 1 January 2026, which for the first time creates a federal licensing framework for industrial hemp -- defined as cannabis with total THC not exceeding 0.3% on a dry-weight basis (anything above remains fully subject to narcotics law) -- covering cultivation in designated secured zones, import/export of hemp seeds (though import/export of seedlings is expressly prohibited), manufacturing, and use of industrial hemp in authorized medical products, with oversight shared between federal and local authorities and each Emirate retaining the right to impose additional local restrictions. Compliance obligations include mandatory activity-specific licensing, security clearance for cultivation and storage personnel, fenced and monitored cultivation zones, periodic THC testing throughout production, minimum five-year record-keeping, and participation in a new national tracking system and unified electronic registry. The Decree-Law explicitly permits hemp-derived compounds to be used in "legally authorized medical products" (potentially including pharmaceutical CBD) through the UAE''s separate medical-products and pharmacy regulatory channel, but this is a licensed-manufacturer pathway, not a consumer retail or personal-import allowance, and the law does not legalize consumer CBD oil, gummies, vapes, or capsules in any form. A genuinely unresolved question -- left to future implementing regulations and Cabinet decisions -- is how cannabis flower itself (as opposed to seeds/fiber) will be treated: the law does not explicitly ban flower cultivation, but its security- and narcotics-oriented framing suggests flower-based activity, including for CBD extraction, will face the highest regulatory scrutiny and may in practice be constrained or blocked. Industry analysis frames the reform as a top-down, state-driven industrial and pharmaceutical strategy rather than a farmer- or consumer-brand-oriented opening, and notes that the UAE''s arid climate and irrigation costs will likely constrain any actual cultivation regardless of legal permission. Separately, the UAE is not considered a significant cannabis producer or consumer in its own right, but functions as a major transshipment point for cannabis trafficked from Pakistan and Afghanistan, owing to its free ports and diverse population.',
  '[
    {"step": "Do not conflate the 2021 personal-use reform with any form of legalization", "detail": "It changed criminal procedure and first-offense treatment for personal cannabis, not the underlying prohibition, and trafficking/sale penalties remain severe"},
    {"step": "Treat the Article 96 entry-point mechanism as a border-administrative process, not a travel allowance", "detail": "It results in seizure and denial of entry without criminal charges for qualifying cases, but bringing any cannabis or THC product into the UAE remains a serious legal risk"},
    {"step": "Track the Industrial Hemp Decree-Law''s implementing regulations closely before assuming any specific business model is viable", "detail": "Key questions, especially the treatment of cannabis flower and CBD extraction, were still unresolved as of this review and depend on forthcoming Cabinet decisions"},
    {"step": "Pursue any hemp-derived medical product strictly through the licensed pharmaceutical/medical-products channel", "detail": "There is no consumer CBD retail, personal-import, or online-order pathway under the new law"},
    {"step": "Confirm activity-specific licensing requirements with both federal authorities and the relevant Emirate before beginning any hemp-related activity", "detail": "Licensing is shared between federal and local authorities, and individual Emirates may impose additional restrictions"}
  ]'::jsonb,
  '["Ministry of Interior / Anti-Narcotics General Directorate -- narcotics enforcement under Federal Decree-Law No. 30 of 2021", "Ministry of Health and Prevention (MOHAP), with Dubai Health Authority and Department of Health Abu Dhabi -- medical products and emirate-level health regulation", "Federal and local authorities jointly (per the Industrial Hemp Decree-Law) -- licensing for hemp cultivation, manufacturing, and trade"]'::jsonb,
  ARRAY[
    'Assuming the 2021 criminal-procedure reforms or the Article 96 entry-point mechanism amount to decriminalization -- both preserve the underlying prohibition and its severe trafficking/sale penalties, and even a documented UAE court acquittal in a first-offense THC vape case turned on the specific facts of that case, not a general legal change',
    'Assuming a hemp-derived or "CBD-only" product is automatically safe to possess or import -- Emirati enforcement treats any detectable THC as controlling regardless of labeling or intent, and consumer CBD retail remains outside the new hemp law''s scope entirely',
    'Assuming the January 2026 Industrial Hemp Decree-Law opens a general cannabis cultivation or CBD-extraction business -- it is a tightly scoped, security-heavy industrial/medical framework with the treatment of flower-based cultivation still unresolved pending implementing regulations'
  ],
  'published',
  'high on the core 2021 narcotics law reform and its documented case application (corroborated across Wikipedia, LYLAW, Leafwell, and a 2026 Dubai-focused travel-law guide describing a specific acquittal case); high on the Industrial Hemp Decree-Law''s structure (corroborated in detail by MIO & Partners'' legal analysis); the practical treatment of cannabis flower and CBD extraction under that law is explicitly unresolved as of this review per independent industry analysis (Hemp Today), and should not be assumed either way pending implementing regulations',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.miopartners.ae/uae-issues-federal-decree-law-regulating-industrial-and-medical-uses-of-industrial-hemp/'),
  CURRENT_DATE, now()
),
(
  'ZW', 'Zimbabwe', 'high', 9,
  'Standard cultivation license fees are cited in the USD 40,000-50,000+ range depending on source, plus an additional roughly USD 15,000 annual fee and a separate USD 5,000 research-component fee where applicable; five-year renewal costs approximately USD 20,000 (standard) plus USD 2,500 (research-component renewal) -- fees that one licensing guide notes run roughly 50 times Zimbabwe''s per-capita income, effectively excluding most domestic growers',
  'Zimbabwe became the second African country (after Lesotho) to legalize cannabis cultivation for medical and scientific purposes, when then-Health Minister David Parirenyatwa published enabling regulations on 27 April 2018. Outside this licensed channel, cannabis -- known locally as mbanje -- remains tightly criminalized under the Criminal Law (Codification and Reform) Act (Chapter 9:23): Section 156 broadly criminalizes "dealing in" cannabis, a term defined to cover essentially any act connected with its cultivation, production, procurement, or transmission, while Section 157 separately criminalizes simple possession, use/consumption, and cultivation -- including, per legal commentary, cultivation or use by an adult in private for personal consumption, not merely commercial activity. Penalties are severe: sources cite maximum prison terms of 10 to 12 years for possession or use, plus fines, and it is separately illegal to manage premises where cannabis is consumed or to possess cannabis-related paraphernalia. The 2018 licensing framework grants five-year, renewable cultivation licenses permitting the possession, transport, and sale of fresh or dried cannabis and cannabis oil, restricted to sale to "authorized" patients, though the enabling regulations do not clearly specify how a patient becomes "authorized." Applicants must submit a compliant cultivation-site plan, and fees are substantial relative to the domestic economy: sources cite an initial standard licensing fee in the USD 40,000-50,000+ range, an additional roughly USD 15,000 annual fee, and an optional USD 5,000 research-component fee, with five-year renewal costing roughly USD 20,000 (standard) plus USD 2,500 (research renewal) -- one licensing guide notes this is roughly 50 times Zimbabwe''s per-capita income, a threshold that has functionally excluded most domestic growers, including existing informal cultivators, in favor of better-capitalized foreign and local investors. In September 2018 the government designated a specific port of entry/exit for managing medicinal cannabis shipments, and in May 2020 it offered cannabis growers 100% farm ownership as a further investment incentive. Uptake has been substantial on paper but limited in practice: by 2022 the government had issued 57 cultivation licenses since 2018, but only 15 of those had actually been activated into operating cultivation sites, raising concerns that some license holders are holding permits speculatively rather than producing. A peer-reviewed 2024 study in the Journal of Peasant Studies concluded that Zimbabwe''s cannabis reform was primarily designed to attract foreign and local investment and build a new legal economic sector, rather than to formalize or benefit existing illicit cultivators, many of whom remain excluded from the legal market by the high license costs; the same study and other observers have flagged a risk of "corporate capture" of the sector and undermining of smallholder agribusiness. Zimbabwe has no single government agency dedicated specifically to drug-control strategy; cannabis licensing runs through the Ministry of Health and Child Care. Government officials, including former Finance Minister Mthuli Ncube, have repeatedly framed the reform in economic terms, drawing comparisons to Zimbabwe''s roughly USD 827 million-per-year tobacco export industry as an aspirational benchmark for a future legal cannabis export sector; separate advocacy from groups like the Zimbabwe Industrial Hemp Trust continues to push for industrial hemp to be developed as a distinct track from medical cannabis. Religious leaders and some civil-society voices have opposed the reform, arguing that licensed cultivation risks fueling illicit trade and broader drug use.',
  '[
    {"step": "Prepare a compliant cultivation-site plan before applying", "detail": "The license application requires site plans demonstrating regulatory compliance, alongside details of intended production quantity and period"},
    {"step": "Budget for the full fee structure, not just the headline license cost", "detail": "Initial licensing fees (cited in the USD 40,000-50,000+ range) are followed by an annual fee (roughly USD 15,000) and, where relevant, a research-component fee (roughly USD 5,000), with five-year renewal costing roughly USD 20,000 plus USD 2,500 for the research component"},
    {"step": "Clarify the authorized patient definition directly with the Ministry of Health and Child Care before finalizing a sales/distribution plan", "detail": "The enabling regulations do not clearly specify how a patient becomes authorized to purchase licensed product"},
    {"step": "Benchmark realistic uptake expectations against the 2018-2022 track record", "detail": "Only 15 of 57 licenses issued had been activated as of the most recent count, so licensing alone is a weak signal of operational viability"},
    {"step": "Treat any cannabis activity outside the licensed medical/scientific framework, including private personal cultivation or use, as a serious criminal matter", "detail": "Zimbabwean law criminalizes private adult use and cultivation, not only commercial dealing, with penalties up to 10-12 years depending on the source"}
  ]'::jsonb,
  '["Ministry of Health and Child Care -- issues and administers cannabis cultivation licenses", "Designated medicinal-cannabis port of entry/exit (established September 2018) -- oversight of shipment logistics", "Zimbabwe Industrial Hemp Trust -- advocacy body pushing for a distinct industrial hemp track (non-governmental)"]'::jsonb,
  ARRAY[
    'Assuming a cultivation license alone guarantees a viable business -- only about a quarter of licenses issued since 2018 had been activated as of the most recent count, and license holders report real difficulty with production costs and regulatory/market hurdles even after securing a license',
    'Treating the 2018 medical legalization as extending to private personal use or cultivation -- Zimbabwean law separately and explicitly criminalizes private adult possession, use, and cultivation outside the licensed commercial framework, with penalties as severe as 10-12 years',
    'Underestimating how the fee structure shapes who can participate -- licensing costs cited at roughly 50 times per-capita income have been widely noted, including in peer-reviewed research, as excluding most Zimbabwean smallholders and existing informal cultivators from the legal market, raising documented concerns about corporate capture of the sector'
  ],
  'published',
  'high -- the 2018 legalization, license structure, and fee figures are corroborated across Wikipedia, Sensi Seeds, Cannavigia, and MJBizDaily/The Exchange, with fee figures showing only minor cross-source variance (USD 40K vs. 50K+ initial fee, likely reflecting different reporting dates as fees were adjusted); the 57-licenses/15-activated figure and the corporate-capture critique are corroborated by a peer-reviewed 2024 Journal of Peasant Studies study, a substantially more rigorous source than most cannabis-market blogs; the private-use criminalization argument draws on a legal-commentary source explicitly framed as argument/opinion rather than a decided court ruling, and is presented as such',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Zimbabwe'),
  CURRENT_DATE, now()
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  difficulty = EXCLUDED.difficulty,
  typical_timeline_months = EXCLUDED.typical_timeline_months,
  estimated_cost_range = EXCLUDED.estimated_cost_range,
  legal_framework_summary = EXCLUDED.legal_framework_summary,
  steps = EXCLUDED.steps,
  key_regulators = EXCLUDED.key_regulators,
  common_pitfalls = EXCLUDED.common_pitfalls,
  status = EXCLUDED.status,
  confidence_label = EXCLUDED.confidence_label,
  source_id = EXCLUDED.source_id,
  last_reviewed = EXCLUDED.last_reviewed,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO public.market_metrics
  (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('SE', 'lifetime_cannabis_use_prevalence_2019', 8, 'percent', '2019-01-01', '2019-12-31', 'point_in_time', 'observed', 'medium',
   'legalitylens (citing EMCDDA)', 'https://legalitylens.com/is-cannabis-legal-in-sweden/', '2024-01-08',
   'Share of Swedes aged 15-64 reporting lifetime cannabis use per a 2019 EMCDDA survey, versus a 27.2% European average for the same measure'),
  ('SE', 'special_medical_licenses_granted_2018', 63, 'licenses', '2018-01-01', '2018-12-31', 'annual', 'observed', 'high',
   'Wikipedia -- Cannabis in Sweden (citing Lakartidningen)', 'https://en.wikipedia.org/wiki/Cannabis_in_Sweden', '2026-05-09',
   'Special licences issued by Lakemedelsverket for non-approved cannabis preparations in 2018, up from 8 in 2016'),
  ('SE', 'max_aggravated_smuggling_sentence', 10, 'years', '2000-01-01', '2026-12-31', 'point_in_time', 'observed', 'high',
   'cannabisregulations.ai -- Sweden Marijuana Laws', 'https://www.cannabisregulations.ai/country-legality/sweden-marijuana', '2026-05-29',
   'Maximum sentence for aggravated drug smuggling under the Smuggling Act (Lag om straff for smuggling, 2000:1225)'),

  ('LK', 'export_scheme_investors_approved_2025', 7, 'investors', '2025-08-01', '2025-08-31', 'point_in_time', 'observed', 'high',
   'OneWorld SouthAsia -- Sri Lanka Grants First-Ever Licences for Cannabis Cultivation for Export',
   'https://owsa.in/sri-lanka-grants-first-ever-licences-for-cannabis-cultivation-for-export/', '2025-08-22',
   'Selected from a pool of 37 proposals under the BOI export-only cultivation scheme'),
  ('LK', 'export_scheme_minimum_capital_investment', 5000000, 'USD', '2025-08-01', '2025-08-31', 'point_in_time', 'observed', 'high',
   'OneWorld SouthAsia -- Sri Lanka Grants First-Ever Licences for Cannabis Cultivation for Export',
   'https://owsa.in/sri-lanka-grants-first-ever-licences-for-cannabis-cultivation-for-export/', '2025-08-22',
   'Minimum required capital investment per investor, alongside a separate USD 2 million performance bond with the Central Bank of Sri Lanka'),
  ('LK', 'estimated_cannabis_users', 600000, 'people', '2025-01-01', '2025-12-31', 'point_in_time', 'estimated', 'medium',
   'Wikipedia -- Cannabis in Sri Lanka', 'https://en.wikipedia.org/wiki/Cannabis_in_Sri_Lanka', '2025-10-28',
   'Estimated current cannabis users in Sri Lanka, reportedly concentrated among higher socio-economic strata'),

  ('AE', 'industrial_hemp_thc_ceiling', 0.3, 'percent', '2026-01-01', '2026-01-01', 'point_in_time', 'observed', 'high',
   'MIO & Partners -- UAE Hemp Decree-Law Explained',
   'https://www.miopartners.ae/uae-issues-federal-decree-law-regulating-industrial-and-medical-uses-of-industrial-hemp/', '2026-02-04',
   'Maximum total THC concentration (dry-weight basis, flowering heads and leaves) for material to qualify as regulated industrial hemp rather than narcotics-controlled cannabis'),
  ('AE', 'hemp_record_keeping_minimum_period', 5, 'years', '2026-01-01', '2026-01-01', 'point_in_time', 'observed', 'high',
   'MIO & Partners -- UAE Hemp Decree-Law Explained',
   'https://www.miopartners.ae/uae-issues-federal-decree-law-regulating-industrial-and-medical-uses-of-industrial-hemp/', '2026-02-04',
   'Minimum record-keeping period required of licensed industrial hemp operators under the Decree-Law'),
  ('AE', 'trafficking_minimum_sentence', 5, 'years', '2021-11-01', '2026-12-31', 'point_in_time', 'observed', 'high',
   'Wikipedia -- Cannabis in the United Arab Emirates', 'https://en.wikipedia.org/wiki/Cannabis_in_the_United_Arab_Emirates', '2026-06-03',
   'Minimum sentence for cannabis trafficking; sale/possession-with-intent can extend to life imprisonment or death in defined cases'),

  ('ZW', 'cultivation_licenses_issued_since_2018', 57, 'licenses', '2018-01-01', '2022-05-31', 'point_in_time', 'observed', 'high',
   'The Exchange (Africa) -- Zimbabwe licensing cannabis farmers to tap medical marijuana potential',
   'https://theexchange.africa/industry-and-trade/zimbabwe-medicinal-cannabis-farming/', '2022-05-20',
   'Total cultivation licenses issued by the Zimbabwean government since the 2018 legalization, per Reuters reporting (11-May-2022)'),
  ('ZW', 'cultivation_licenses_activated', 15, 'licenses', '2018-01-01', '2022-05-31', 'point_in_time', 'observed', 'high',
   'The Exchange (Africa) -- Zimbabwe licensing cannabis farmers to tap medical marijuana potential',
   'https://theexchange.africa/industry-and-trade/zimbabwe-medicinal-cannabis-farming/', '2022-05-20',
   'Of the 57 licenses issued since 2018, the number actually activated into operating cultivation sites as of the same 2022 reporting'),
  ('ZW', 'standard_cultivation_license_fee', 50000, 'USD', '2020-01-01', '2026-12-31', 'point_in_time', 'observed', 'medium',
   'Cannavigia -- Cannabis Compliance in Zimbabwe',
   'https://www.cannavigia.com/blog-posts/cannabis-country-report-zimbabwe-how-to-get-a-license', '2023-01-01',
   'Initial standard cultivation license fee; a separate MJBizDaily-sourced guide cites a USD 40,000+ figure, likely reflecting a different reporting date as fees were adjusted over time')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('SE', 'prohibition-risk-map', 'general',
   '["Sweden criminalizes cannabis consumption itself, not just possession or sale -- one of the few countries to take this step -- with no decriminalized threshold anywhere in the country", "Medical cannabis access is limited to Sativex for MS spasticity plus a rare, case-by-case special-licence route (63 granted in 2018, up from 8 in 2016); patients cannot legally cultivate even under a medical licence", "A 2019 Supreme Court ruling makes any detectable THC in a CBD product a narcotics offense regardless of source or concentration -- far stricter than the ~0.2% THC tolerance common elsewhere in the EU", "A 2023 government drug-policy inquiry reaffirmed the restrictive approach, and the governing coalition has shown no appetite for reform as of 2026"]'::jsonb,
   'Read the Sweden jurisdiction playbook -- one of Europe''s strictest regimes with no reform currently on the agenda',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-sweden')],
   'verified_secondary_source'),

  ('LK', 'market-access-strategy', 'investor_operator',
   '["In August 2025, Sri Lanka approved its first-ever cannabis cultivation licenses -- 7 foreign investors selected from 37 proposals -- but strictly for pharmaceutical-grade export, with zero tolerance for domestic market leakage", "Each licensed investor must commit a minimum USD 5 million capital investment plus a USD 2 million performance bond with the Central Bank of Sri Lanka; licenses run 6 months initially, renewable on compliance", "This sits alongside Sri Lanka''s much older Ayurveda Act framework, under which the state Ayurvedic Drugs Corporation remains the sole lawful domestic source of cannabis-based medicine", "The export scheme faces real domestic friction -- religious leaders, health advocates, and even Sri Lanka''s own National Dangerous Drugs Control Board chairman have publicly questioned its economics and social risks"]'::jsonb,
   'Read the Sri Lanka jurisdiction playbook before evaluating the new export-only cultivation scheme',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://owsa.in/sri-lanka-grants-first-ever-licences-for-cannabis-cultivation-for-export/')],
   'verified_secondary_source'),

  ('AE', 'market-access-strategy', 'investor_operator',
   '["UAE cannabis/THC prohibition remains firm and heavily enforced, with real criminal exposure for possession, trafficking, and even trace-THC CBD products -- foreign medical cannabis prescriptions carry no legal weight", "A 2021 reform (Federal Decree-Law 30) softened first-offense personal-use criminal procedure (rehab pathway, no automatic prison time) but did not legalize anything", "A new Industrial Hemp Decree-Law took effect 1 January 2026, creating the UAE''s first federal licensing framework for industrial hemp (THC capped at 0.3% dry-weight) covering cultivation, processing, and authorized medical-product use", "How cannabis flower and CBD extraction will actually be treated under the new hemp law remains explicitly unresolved, pending future implementing regulations and Cabinet decisions"]'::jsonb,
   'Read the UAE jurisdiction playbook before assuming any hemp business model is viable under the new 2026 framework',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.miopartners.ae/uae-issues-federal-decree-law-regulating-industrial-and-medical-uses-of-industrial-hemp/')],
   'verified_secondary_source'),

  ('ZW', 'licence-class-guide', 'cultivator_producer',
   '["Zimbabwe legalized medical/scientific cannabis cultivation in April 2018 (Africa''s 2nd country to do so), issuing five-year renewable licenses through the Ministry of Health and Child Care", "Standard licensing fees run USD 40,000-50,000+ initially, plus roughly USD 15,000 annually and a USD 5,000 research-component fee where applicable -- costs a licensing guide notes run roughly 50x Zimbabwe''s per-capita income", "Only 15 of 57 licenses issued since 2018 had actually been activated as of the most recent count, and peer-reviewed research has flagged a risk of corporate capture excluding smallholders and existing informal cultivators", "Private personal cultivation, possession, or use outside the licensed commercial framework remains a separate, serious criminal offense carrying up to 10-12 years"]'::jsonb,
   'Read the Zimbabwe jurisdiction playbook before budgeting a cultivation license application',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Zimbabwe')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('SE','LK','AE','ZW');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714213619','batch_14_playbooks_metrics_overlay_se_lk_ae_zw','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714213619_batch_14_playbooks_metrics_overlay_se_lk_ae_zw.sql

-- RECOVERY BEGIN 20260714230853_add_intel_eval_structural_crosscheck.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714230853.
--
-- Rewriting this file cannot affect production: 20260714230853 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 0 hardening: an INDEPENDENT, non-LLM structural heuristic that predicts
-- junk-vs-content from surface features of the snapshot text, computed in SQL.
-- Purpose: it is a second "annotator" whose errors are UNCORRELATED with the
-- assistant's semantic labels. Where the two agree, confidence is high; where
-- they disagree, the row is genuinely ambiguous and is the priority human-review
-- queue. This is how the set is graded rather than self-asserted (spec §9.2),
-- given human labeling is deferred.
-- Additive columns on intel_eval_set. Reversible:
--   alter table public.intel_eval_set drop column struct_is_junk, drop column struct_reason, drop column needs_human;

alter table public.intel_eval_set
  add column if not exists struct_is_junk boolean,
  add column if not exists struct_reason  text,
  add column if not exists needs_human    boolean not null default false;

comment on column public.intel_eval_set.struct_is_junk is
  'Independent non-LLM heuristic: does surface structure look like nav/boilerplate/spam (true) vs real content (false)? Errors uncorrelated with the assistant semantic label by construction.';
comment on column public.intel_eval_set.needs_human is
  'true = the structural heuristic disagrees with the assistant quality label (junk vs signal). Priority human-adjudication queue; small + high-leverage.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714230853','add_intel_eval_structural_crosscheck','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714230853_add_intel_eval_structural_crosscheck.sql

-- RECOVERY BEGIN 20260714232829_add_reviewer_tracking_to_signals.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260714232829.
--
-- Rewriting this file cannot affect production: 20260714232829 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Supports the new SOURCE_ENGINE review queue: tracks who reviewed a
-- signal and when, matching the accountability pattern already used in
-- regulatory_signals.signals (reviewed_by/last_reviewed_at).
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.signals.action IS
  'Review decision for SOURCE_ENGINE signals: approved | rejected | null (not yet reviewed). Set via the engine review queue at /admin/signals/queue.';
COMMENT ON COLUMN public.signals.reviewed_by IS 'Admin user id who last reviewed this signal.';
COMMENT ON COLUMN public.signals.reviewed_at IS 'When this signal was last reviewed (approved or rejected).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260714232829','add_reviewer_tracking_to_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260714232829_add_reviewer_tracking_to_signals.sql

-- RECOVERY BEGIN 20260715085540_fix_stale_api_signals_view_missing_reviewer_columns.sql
-- The SOURCE_ENGINE review queue (app/admin/(protected)/signals/queue/page.tsx,
-- lib/signals-engine/admin.ts, merged this morning in eb293d0) is completely
-- non-functional in production: api.signals (the PostgREST-exposed view that
-- fetchAdminSupabaseJson/adminRequest hit via bare /rest/v1/signals) was never
-- refreshed after 20260713090000_signals_reviewer_tracking_stub.sql added
-- reviewed_by/reviewed_at to the base public.signals table. Every call the
-- new queue makes -- listEngineReviewQueue, countEngineReviewQueue,
-- listDistinctEngineCountries (all SELECT reviewed_by,reviewed_at),
-- approveEngineSignal/rejectEngineSignal/bulkApproveEngineQueue (all PATCH
-- reviewed_by/reviewed_at) -- 400s with "column does not exist". Confirmed
-- live: `select id, reviewed_by, reviewed_at from api.signals` errors with
-- exactly that message pre-fix.
--
-- Same bug class, same fix pattern as
-- 20260713223057_fix_stale_regulatory_signals_signals_api_view.sql earlier
-- this week: the view just needs the new columns added to its SELECT list.
-- No RLS/security posture change -- api.signals is already read/write for
-- authenticated + service_role (this is an admin-only surface gated by
-- requireAdminAuth() at the route level, not by this view).
-- Converted to a no-op stub on 2026-07-20: re-running the CREATE OR
-- REPLACE VIEW below fails ("cannot drop columns from view") because a
-- later migration added editorial_title/editorial_blurb columns to the
-- live view that this file's SELECT list predates -- confirmed live via
-- information_schema.columns that api.signals already has all 31 columns
-- including reviewed_by/reviewed_at (this file's fix) plus those 2 more.
-- The real work was already applied to production under the neighboring
-- version 20260715085610 (same filename, 30 seconds later).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715085540','fix_stale_api_signals_view_missing_reviewer_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715085540_fix_stale_api_signals_view_missing_reviewer_columns.sql

-- RECOVERY BEGIN 20260715120000_jurisdiction_playbooks_batch23a_sources.sql
-- Sources for jurisdiction_playbooks batch 23 (part A of B, see batch23b for
-- playbook content + market metrics). Split across two files due to payload size.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Cannabisregulations.ai — Is Weed Legal in Laos? 2026 Cannabis Laws & Penalties', 'https://www.cannabisregulations.ai/country-legality/laos-marijuana', 'Laos', 'LA', 'Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Article 146 Penal Code graduated penalties, 3kg death-penalty threshold, LCDC enforcement at Wattay airport and Friendship Bridge crossings'),
  ('CMS Expert Guides — Cannabis law and legislation in Laos', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/laos', 'Laos', 'LA', 'Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Decision 3789/MOH Dec 2022 hemp control framework, TRIPS patent transition period context'),
  ('Tilleke & Gibbins — Laos Approves Hemp-Related Activities', 'https://www.tilleke.com/insights/laos-approves-hemp-related-activities/', 'Laos', 'LA', 'Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'THC analysis process and feasibility-study requirements still unclarified as of most recent review, ad hoc committee history since 2019'),
  ('WSR Law Group — Laos Allows Controlled Activities of Hemp and Cannabis Sativa L. for Medical Use', 'https://wsrlawgroup.com/laos-allows-controlled-activities-of-hemp-and-cannabis-stiva-l-for-medical-use/', 'Laos', 'LA', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'THC limited to 0.2% raw/processed, not exceeding 1% by weight; seed registration and origin-authorization requirements'),
  ('Herb.co — How to Buy Weed in Malaysia: 2026 Laws, Penalties & Tourist Guide', 'https://herb.co/city-guides/buy-weed-malaysia', 'Malaysia', 'MY', 'Asia', 1, 'html_snapshot', 'quarterly', 'news', 'No cannabis-based product registered for medical use as of latest MOH guidance, no foreign-national exemption from prosecution, mandatory death penalty abolished July 2023 (Act 846) but death remains available'),
  ('Tripbase — Malaysia Drug Laws: What''s Legal & the Penalties (2026)', 'https://www.tripbase.com/drug-laws/malaysia/cannabis/', 'Malaysia', 'MY', 'Asia', 1, 'html_snapshot', 'quarterly', 'legal_analysis', '200g cannabis statutory trafficking presumption threshold under s.37 Dangerous Drugs Act, narrow 2019 0%-THC CBD pharmaceutical allowance for conditions like epilepsy'),
  ('Leafwell — Is Marijuana Legal in Malaysia?', 'https://leafwell.com/blog/is-marijuana-legal-in-malaysia', 'Malaysia', 'MY', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Malaysian Drug Control Authority registration requirement, Malaysian-based study location requirement for research, watching Thailand model'),
  ('Wikipedia — Cannabis in Malaysia', 'https://en.wikipedia.org/wiki/Cannabis_in_Malaysia', 'Malaysia', 'MY', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2021 Khairy Jamaluddin ministerial statement on conditional medical marijuana import/use pathway'),
  ('Herb.co — How to Buy Weed in St. Lucia: 2026 Cannabis Guide', 'https://herb.co/city-guides/buy-weed-st-lucia', 'Saint Lucia', 'LC', 'Americas', 1, 'html_snapshot', 'quarterly', 'news', 'April 2026 GrowerIQ seed-to-sale traceability platform selection, 2021 automatic expungement and PM Pierre Rastafarian apology, Cannabis and Industrial Hemp Bill 2025 context'),
  ('LegalClarity — Is Weed Legal in St. Lucia? Rules and Penalties', 'https://legalclarity.org/is-weed-legal-in-st-lucia-local-laws-explained/', 'Saint Lucia', 'LC', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Regulated Substances Act No. 26 of 2023 creating Regulated Substances Authority, two-tier Class One/Two product system in pending Cannabis and Industrial Hemp Bill, 4-plant household cultivation limit'),
  ('Hemp Gazette — Saint Lucia Cannabis Legislation Moving Ahead', 'https://hempgazette.com/news/saint-lucia-cannabis-hg2392/', 'Saint Lucia', 'LC', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'Cannabis Advisory Council and dispensary licence provisions in draft bill, regional green-climate-agenda cannabis cultivation discussions'),
  ('Leafwell — Is Marijuana Legal in Saint Lucia?', 'https://leafwell.com/blog/is-marijuana-legal-in-saint-lucia', 'Saint Lucia', 'LC', 'Americas', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2021 Criminal Records and Rehabilitation Amendment Bill, 2019 cannabis commission report, Cannabis Task Force formation history'),
  ('IndicaOnline — Puerto Rico Marijuana Laws 2026', 'https://indicaonline.com/blog/puerto-rico-marijuana-laws/', 'Puerto Rico', 'PR', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Over 150 operational dispensaries, vertical integration permitted, Act 20/22 tax incentive relocation driver, Act 42-2017 Medical Cannabis Act framework'),
  ('Cannabisregulations.ai — Puerto Rico Hemp Enforcement in 2026', 'https://www.cannabisregulations.ai/cannabis-and-hemp-regulations-compliance-ai-blog/puerto-rico-2025-mislabeled-hemp-crackdown', 'Puerto Rico', 'PR', 'Americas', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'OLIC hemp licensing oversight, 677+ authorized product SKUs as of 2025, Delta-8/synthetic cannabinoid enforcement crackdown'),
  ('Herb.co — How to Buy Weed in Puerto Rico in 2026', 'https://herb.co/city-guides/buy-weed-puerto-rico', 'Puerto Rico', 'PR', 'Americas', 2, 'html_snapshot', 'quarterly', 'news', 'MCRB/JRCM licensing scope, tourism reciprocity rule, smoking/combustion ban in favor of vaporized and non-combustible forms'),
  ('Puerto Rico Cannabis Club — Cannabis Laws in Puerto Rico 2026', 'https://puertoricocannabisclub.com/puerto-rico/medical-card-visitor-info/cannabis-laws-puerto-rico-2026', 'Puerto Rico', 'PR', 'Americas', 1, 'html_snapshot', 'quarterly', 'reference', 'Executive Order 2015-10 origin, no home cultivation permitted, tourism-oriented telehealth clinic ecosystem, JRCM public licensee registry')
ON CONFLICT DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715120000','jurisdiction_playbooks_batch23a_sources','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715120000_jurisdiction_playbooks_batch23a_sources.sql

-- RECOVERY BEGIN 20260715120100_jurisdiction_playbooks_batch23b_content.sql
-- Playbook content + market metrics for batch 23 (part B of B, see batch23a
-- for source_registry entries this migration references by source_url).

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 24,
  estimated_cost_range = 'No standard fee schedule has been published, and several core procedural elements remain unclarified as of the most recent legal review — including the exact process for analyzing THC percentages, ongoing reporting requirements, and the contents of required feasibility studies. Any cost estimate at this stage would be speculative; specialized Lao legal counsel engagement is a prerequisite, not an optional cost',
  legal_framework_summary = 'Laos maintains one of the strictest cannabis regimes in Southeast Asia for anything above a narrow hemp carve-out, and any market-entry assessment must sharply distinguish that carve-out from the much larger space of activity that remains a serious criminal matter carrying penalties up to death. Cannabis (marijuana) is classified as a Category I narcotic under the Law on Narcotics No. 50/NA (2007, amended 2008) and the Decree on the Implementation of the Law on Narcotics No. 076/PM (2009), which declares the cannabis plant a narcotic-producing plant and prohibits its cultivation and possession outright; the Penal Code No. 26/NA (2017, revised as Article 146 in later consolidations) sets graduated penalties ranging from 3 months to life imprisonment and fines of LAK 500,000 to 200 million (roughly USD 52-21,200) depending on the quantity and nature of the offense, with trafficking of 500 grams or more carrying 10 years to life imprisonment and quantities above 3 kilograms carrying the death penalty. Enforcement is active at international entry points including Vientiane''s Wattay International Airport, Thai-Lao Friendship Bridge crossings, and the Boten border with China. Within this otherwise absolute prohibition, a narrow and relatively recent carve-out exists: in 2019 the Lao government established an ad hoc committee to study cannabis legalization potential and permitted select local companies to grow cannabis in specific pilot zones, while continuing to strictly prohibit use, commercialization, and consumption of any cannabis-related product regardless of THC content. This culminated in Decision No. 3789/MOH (28 December 2022), issued by the Ministry of Health, which approves regulated cultivation, extraction, production, processing, storage, distribution, utilization, import-export, and transport of hemp specifically — defined with a THC content limit of 0.2% for raw and processed products, not exceeding 1% by weight under Ministry permission — and authorizes use of hemp and hemp-related products by the general population, with certain products restricted to medical prescription. Seeds must be registered with authorized, traceable sources of origin. Critically, several operational aspects of this 2022 framework remain unclarified in practice as of the most recent legal commentary, including the precise procedure for THC percentage analysis, ongoing reporting obligations, and the required contents of feasibility studies companies must submit to the Ministry of Health — legal analysts anticipate these gaps will be resolved through administrative practice over time rather than through further formal regulation, meaning practical implementation guidance is still emerging. There is no indication of imminent broader liberalization: independent tourism-focused legal guides note no known law changes are anticipated in the near term regarding medical or recreational cannabis beyond the existing hemp decision.',
  steps = '[{"step":"Confirm the activity falls strictly within the hemp definition (0.2% THC raw/processed, capped at 1% by weight)","detail":"Decision 3789/MOH covers hemp specifically, not cannabis broadly — any product or activity involving higher-THC material remains prosecutable as a Category I narcotic offense with penalties up to death for large quantities"},{"step":"Engage specialized Lao legal counsel before any cultivation or import planning","detail":"Multiple procedural elements of the 2022 Decision — THC testing methodology, reporting cadence, feasibility study requirements — remain unclarified in publicly available guidance; local counsel with direct Ministry of Health relationships is necessary to navigate this ambiguity"},{"step":"Register seeds with authorized, traceable origin documentation","detail":"The Decision requires cannabis sativa L. seeds used for hemp production to be registered and have their source of origin authorized — build this into procurement planning from the outset"},{"step":"Prepare for likely administrative-practice-based implementation rather than further formal rulemaking","detail":"Legal analysts expect remaining gaps to be clarified through how the Ministry of Health applies the Decision in practice, not through new published regulations — ongoing direct engagement with the regulator is more valuable than waiting for clearer written rules"}]'::jsonb,
  key_regulators = '["Ministry of Health — Decision 3789/MOH hemp licensing, feasibility study review, THC compliance oversight","Lao National Commission for Drug Control and Supervision (LCDC) — narcotics enforcement, anti-narcotics police coordination","Ministry of Public Security — border and domestic narcotics enforcement"]'::jsonb,
  common_pitfalls = ARRAY[
    'Conflating the narrow 2022 hemp allowance with any broader cannabis legalization — Decision 3789/MOH applies specifically to hemp (0.2%-1% THC ceiling); THC-dominant cannabis remains a Category I narcotic with penalties up to death for large-quantity trafficking',
    'Assuming publicly visible informal tolerance (tourist-area "happy pizza" establishments) reflects actual legal status — possession and use remain criminal offenses regardless of casual local enforcement patterns, and this should never inform a compliance assessment',
    'Underestimating procedural ambiguity in the hemp framework — THC testing methodology, reporting requirements, and feasibility study standards are not fully published; treat early engagement with the Ministry of Health as essential rather than assuming a straightforward paper-only application process'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across a CMS Expert Guide, two separate Tilleke & Gibbins legal analyses (a Lao/Southeast Asia-focused firm) written at different points in the framework''s development, and WSR Law Group''s regulatory summary, all consistent on the Decision 3789/MOH THC thresholds and the narrow scope of the hemp carve-out relative to the broader narcotics prohibition',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/laos')
WHERE country_iso2 = 'LA';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'high', typical_timeline_months = 30,
  estimated_cost_range = 'Not applicable in practical terms — as of the latest Ministry of Health guidance, no cannabis-based product for human medical treatment is registered in Malaysia at all, and the narrow 2019 allowance covers only specific 0%-THC CBD-based pharmaceutical medicines for conditions such as epilepsy under prescription. There is no established commercial licensing fee structure because there is effectively no operating commercial pathway',
  legal_framework_summary = 'Malaysia maintains one of the world''s strictest drug law regimes, and cannabis in any commercial or recreational form remains fully illegal with no meaningful market-entry pathway as of 2026, despite periodic government statements floating conditional future access. Cannabis, cannabis resin, extracts, and tinctures are controlled substances under the Dangerous Drugs Act 1952, with recreational and medical use both prohibited outright for the general population. Malaysia''s statutory presumption-of-trafficking thresholds are severe: possession of 200 grams or more of cannabis triggers a presumption of trafficking under Section 37 of the Dangerous Drugs Act, carrying the death penalty or life imprisonment plus whipping. The Abolition of Mandatory Death Penalty Act 2023 (Act 846, in force July 2023) removed the mandatory death sentence for trafficking, giving courts discretion to impose life imprisonment plus whipping instead — but death remains a lawful sentence within judicial discretion for the most serious trafficking cases, and the government has stated no plans to remove it from the Act entirely; separately, mandatory caning for possession above 20 grams was unaffected by this reform. There is no foreign-national exception: tourists, students, and business travelers face identical prosecution risk as citizens and permanent residents, and consular access does not affect sentencing outcomes. A narrow medical allowance exists in principle: in November 2021, then-Health Minister Khairy Jamaluddin stated that import and use of medical marijuana would be allowed in rare cases, provided a patient has a doctor''s prescription and the product is registered and licensed by the Malaysian Drug Control Authority — but as of the latest available Ministry of Health guidance, no cannabis-based product for human medical treatment is actually registered in Malaysia, making this a theoretical rather than operational pathway. Companies seeking to bring a medical cannabis product to market face a structurally difficult bar: they must scientifically prove safety and efficacy based on evidence from a Malaysian-based study location, and because of cannabis''s criminalized status, conducting that research domestically is itself extremely difficult — a circular barrier that legal analysts describe as keeping the country in "the earliest phases of its potential end to prohibition." Malaysian officials have publicly referenced watching how neighboring Thailand handles its (subsequently reversed) legalization experiment to inform Malaysia''s own future policy direction, suggesting any material change remains speculative and distant rather than imminent. No CBD or hemp-derived product may legally be imported or possessed, including products legal in the traveler''s home country; customs enforcement includes urine testing at entry points.',
  steps = '[{"step":"Recognize there is no operational commercial pathway as of 2026","detail":"Despite a 2021 ministerial statement floating conditional medical marijuana access, no cannabis-based product is currently registered for medical use in Malaysia — there is no application process to enter because no product has successfully navigated it yet"},{"step":"If pursuing the theoretical medical pathway, budget for the domestic-research circularity problem","detail":"Registration requires proving safety/efficacy via a Malaysian-based study, but cannabis''s criminalized status makes conducting that research within Malaysia extremely difficult — this is a structural barrier, not merely a bureaucratic delay"},{"step":"Monitor Malaysia''s policy response to regional developments, particularly Thailand","detail":"Malaysian officials have publicly stated they are watching how Thailand''s cannabis policy evolves to inform Malaysia''s own approach — regional regulatory shifts are a more useful signal to track than domestic legislative activity, which has been minimal"},{"step":"Treat any hemp/CBD product plans as categorically prohibited, not merely restricted","detail":"Unlike many jurisdictions with a hemp/THC distinction, Malaysia draws no such line for import or possession purposes — all cannabis-derived products, including CBD, are illegal to bring into the country regardless of source-country legality"}]'::jsonb,
  key_regulators = '["Ministry of Health — medical product registration and licensing (currently zero products registered)","Malaysian Drug Control Authority — pharmaceutical licensing for any future medical cannabis product","Royal Malaysia Police and National Anti-Drugs Agency (AADK) — enforcement","Attorney General''s Chambers — prosecution"]'::jsonb,
  common_pitfalls = ARRAY[
    'Treating the 2021 ministerial statement on medical marijuana as an operational program — no cannabis-based product is registered for medical use in Malaysia as of the latest Ministry of Health guidance; this remains a theoretical allowance, not a functioning pathway',
    'Assuming any foreign medical cannabis card, CBD product legality in the traveler''s home country, or declared importation provides any protection — Malaysian law includes no foreign-national exception, and declaring a product at customs does not prevent prosecution',
    'Underestimating the domestic-research circularity barrier — bringing a medical cannabis product to market requires Malaysian-based clinical evidence, but the substance''s fully criminalized status makes that research exceptionally difficult to conduct, a structural chokepoint independent of any paperwork process'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across Herb.co''s May 2026 regulatory guide, Tripbase''s detailed penalty-threshold breakdown citing the Dangerous Drugs Act and Act 846 reforms, Leafwell''s policy-history summary quoting the 2021 ministerial statement directly, and Wikipedia''s cited entry, all consistent on the absence of any registered medical product and the 200g trafficking-presumption threshold',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-malaysia')
WHERE country_iso2 = 'MY';

INSERT INTO public.market_metrics (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
VALUES
  ('LA', 'Death Penalty Trafficking Threshold', 3, 'kilograms', '2017-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Cannabisregulations.ai', 'https://www.cannabisregulations.ai/country-legality/laos-marijuana', '2026-01-01', 'Quantity threshold above which cannabis trafficking carries the death penalty under Article 146 of the Penal Code'),
  ('LA', 'Hemp THC Ceiling (Processed, Ministry-Permitted)', 1.0, 'percent', '2022-12-28', '2026-12-31', 'point_in_time', 'observed', 'high', 'WSR Law Group', 'https://wsrlawgroup.com/laos-allows-controlled-activities-of-hemp-and-cannabis-stiva-l-for-medical-use/', '2023-01-15', 'Maximum THC by weight for processed hemp products under Ministry of Health special permission; raw/processed default ceiling is 0.2%'),
  ('MY', 'Cannabis Trafficking Presumption Threshold', 200, 'grams', '1952-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Tripbase', 'https://www.tripbase.com/drug-laws/malaysia/cannabis/', '2026-01-01', 'Quantity above which Section 37 of the Dangerous Drugs Act 1952 creates a statutory presumption of trafficking, carrying death penalty or life imprisonment plus whipping within judicial discretion since Act 846 (2023)'),
  ('MY', 'Registered Medical Cannabis Products', 0, 'products', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'Herb.co', 'https://herb.co/city-guides/buy-weed-malaysia', '2026-05-01', 'No cannabis-based product for human medical treatment registered as of the latest Ministry of Health guidance, despite a 2021 ministerial statement floating conditional access'),
  ('LC', 'Personal Possession Decriminalization Threshold', 30, 'grams', '2021-09-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'LegalClarity', 'https://legalclarity.org/is-weed-legal-in-st-lucia-local-laws-explained/', '2026-01-01', 'Decriminalized threshold under the amended Drugs (Prevention of Misuse) Act, alongside 4-plant household cultivation allowance'),
  ('LC', 'Prior Convictions Automatically Expunged', 30, 'grams', '2021-08-01', '2021-08-31', 'point_in_time', 'observed', 'high', 'Leafwell', 'https://leafwell.com/blog/is-marijuana-legal-in-saint-lucia', '2026-01-01', 'Threshold for automatic expungement under the Criminal Records and Rehabilitation Amendment Bill, passed unanimously August 2021'),
  ('PR', 'Operational Dispensaries', 150, 'dispensaries', '2026-01-01', '2026-12-31', 'point_in_time', 'observed', 'high', 'IndicaOnline', 'https://indicaonline.com/blog/puerto-rico-marijuana-laws/', '2026-01-01', 'Over 150 dispensaries operational island-wide as of the most recent count, among the most mature medical cannabis retail networks per capita in the Caribbean/Latin America region'),
  ('PR', 'Authorized Hemp Product SKUs', 677, 'products', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'high', 'Cannabisregulations.ai', 'https://www.cannabisregulations.ai/cannabis-and-hemp-regulations-compliance-ai-blog/puerto-rico-2025-mislabeled-hemp-crackdown', '2025-11-01', 'Hemp product SKUs authorized by the Office of Cannabis Regulation (OLIC) as of 2025, ahead of 2026 enforcement action against mislabeled high-THC products marketed as compliant hemp')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('LA','MY','LC','PR');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715120100','jurisdiction_playbooks_batch23b_content','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715120100_jurisdiction_playbooks_batch23b_content.sql

-- RECOVERY BEGIN 20260715120200_jurisdiction_playbooks_batch23c_lc_pr_content.sql
-- Saint Lucia and Puerto Rico playbook content, committed separately from
-- batch23b due to a mid-session syntax error that required a standalone
-- re-application. Both UPDATEs below are idempotent (WHERE country_iso2 = X)
-- and safe to run even though the underlying rows are already live.

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 15,
  estimated_cost_range = 'No commercial licensing fee schedule exists yet because the Cannabis and Industrial Hemp Bill 2025 — the legislation that would create the dispensary and commercial licensing regime — remained before Cabinet as of late 2025 and had not been enacted. Personal decriminalization carries no fee; commercial market entry costs cannot be estimated until the Bill passes and implementing regulations follow',
  legal_framework_summary = 'Saint Lucia has moved further than most Eastern Caribbean neighbours toward a genuine commercial cannabis framework, but — as of the most recent reporting — has not yet crossed the line from decriminalization and active preparation into actual licensed commercial operation, a distinction that matters considerably for market-entry timing. In August 2021, Parliament unanimously passed the Criminal Records and Rehabilitation Amendment Bill, automatically expunging the records of anyone previously convicted for possessing 30 grams of cannabis or less, and the following month the government amended the Drugs (Prevention of Misuse) Act to decriminalize private adult possession of up to 30 grams, alongside household cultivation of up to 4 plants. Prime Minister Philip J. Pierre paired this reform with a public apology to the Rastafarian community for decades of enforcement harm — a notable political gesture reflecting the historical role of Rastafari advocacy in driving the reform. Recreational sale, trafficking, and public consumption remain illegal, and cannabis import (from outside the decriminalized personal-possession context) carries serious criminal penalties. In December 2023, Parliament passed the Regulated Substances Act (Act No. 26 of 2023), establishing the Regulated Substances Authority and granting the Minister power to formally declare specific substances as "regulated substances" subject to licensing requirements — a structural building block for the eventual commercial framework, though not itself a complete licensing regime. The substantive commercial legislation, the Cannabis and Industrial Hemp Bill, was released for public comment in early 2025 and proposes a two-tier medicinal product system: Class One products (CBD-focused or low-THC) would be available without a prescription, while presumably higher-THC or Class Two products would require one — alongside provisions for a Cannabis Advisory Council and formal cultivation, processing, and dispensary licences. As of late 2025 the Bill remained before Cabinet with a stated target of passage before year-end, meaning the commercial side of the industry remains formally on hold pending enactment. A concrete signal of continued forward momentum: in April 2026, Saint Lucia selected GrowerIQ to build a national seed-to-sale cannabis traceability platform, indicating active infrastructure construction ahead of formal licensing — this kind of pre-legislative technical investment suggests government confidence the Bill will pass, though it does not itself constitute legal authorization to operate. No licensed dispensaries have opened as of the most recent reporting, though an informal cannabis market operates visibly in tourist areas without active enforcement against personal-amount possession.',
  steps = '[{"step":"Track the Cannabis and Industrial Hemp Bill 2025''s passage through Cabinet and Parliament","detail":"This is the legislation that will create the actual commercial licensing regime (cultivation, processing, dispensary) — as of the most recent reporting it remained before Cabinet, meaning no commercial licence category currently exists to apply for"},{"step":"Monitor GrowerIQ traceability platform rollout as a leading indicator","detail":"The April 2026 selection of a national seed-to-sale platform signals active government preparation for a licensed market and may provide earlier visibility into technical/compliance requirements than the legislative text alone"},{"step":"Understand the proposed two-tier product classification","detail":"The draft Bill distinguishes Class One (CBD-focused/low-THC, non-prescription) from a second, more restricted tier — business models should be structured with awareness of which tier they would fall into once the framework is finalized"},{"step":"Engage with the Regulated Substances Authority''s formal substance-declaration process","detail":"Established under the Regulated Substances Act 2023, this body has the power to declare cannabis a regulated substance subject to licensing — its rulemaking activity is a more immediate, currently-operative channel to monitor than the pending Bill itself"}]'::jsonb,
  key_regulators = '["Regulated Substances Authority — established under Act No. 26 of 2023, substance declaration and licensing framework","Ministry of Commerce, Manufacturing, Business Development, Cooperatives and Consumer Affairs — drafted and submitted the Cannabis and Industrial Hemp Bill 2025","Cannabis Advisory Council — proposed under the pending Bill, not yet operational"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalization (2021) is equivalent to commercial legalization — personal possession up to 30g and 4-plant household cultivation are decriminalized, but sale, trafficking, and commercial dispensing remain illegal pending the Cannabis and Industrial Hemp Bill''s passage',
    'Treating the visible informal cannabis market in tourist areas as a sign of de facto commercial legality — this reflects non-enforcement of personal-possession rules, not any licensed commercial pathway; sale itself remains a criminal offense',
    'Assuming the GrowerIQ traceability platform selection means licensing has begun — this is pre-legislative infrastructure investment signaling government intent, not an operative licensing program; the underlying Bill must still pass before any commercial licence can be issued'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across Herb.co''s April/June 2026 regulatory guide (confirming the GrowerIQ platform selection), LegalClarity''s detailed breakdown of the Regulated Substances Act and pending Bill structure, Hemp Gazette''s industry-focused legislative tracking, and Leafwell''s historical policy summary, all consistent on the 2021 decriminalization terms and the Bill''s pre-Cabinet status',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-st-lucia')
WHERE country_iso2 = 'LC';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 9,
  estimated_cost_range = 'Patient registration carries a modest one-time/annual fee (approximately $25 for the medical card application). Commercial licensing costs for cultivation, manufacturing, or dispensing are not uniformly published in available sources, but the market supports vertically integrated operations (a single entity holding cultivation, processing, and dispensing licences simultaneously) and has attracted mainland US cannabis companies via Act 20/22 tax relocation incentives, suggesting a commercially navigable — if not cheap — licensing environment relative to mainland US state markets',
  legal_framework_summary = 'Puerto Rico operates the most mature and commercially developed medical cannabis market of any jurisdiction in this dataset, combining a decade of regulatory continuity with distinctive US-territory advantages that make it structurally different from both mainland US state markets and other Caribbean jurisdictions. The program traces to Executive Order OE-2015-010, issued by Governor Alejandro García Padilla in May 2015, directing the Secretary of Health to authorize medical cannabis use for resident patients; Department of Health Administrative Order No. 352 established initial operational directives. Act 42-2017 (the Medicinal Cannabis Act, signed July 2017) replaced the executive order with a permanent legislative framework, creating the Medical Cannabis Regulatory Board (MCRB, known locally as the JRCM), now under the Puerto Rico Department of Health, which handles licensing for cultivation, manufacturing, dispensing, laboratory testing, and transportation. Regulation 9038 (July 2018) further specified requirements for authorized prescribing physicians and — notably — enabled Puerto Rican dispensaries to serve registered patients from US states or other countries where medical marijuana is legal, a reciprocity provision that drives meaningful tourist patient traffic and distinguishes Puerto Rico from medical-only programs with strict residency requirements. As of the most recent count, over 150 dispensaries are operational island-wide, and vertical integration is explicitly permitted — a single licensed entity can hold cultivation, processing, and dispensing licences simultaneously, a structural advantage over jurisdictions requiring separate ownership across the supply chain. Qualifying conditions are broadly defined, including a catch-all "any condition causing cachexia" category that gives physicians substantial prescribing discretion in practice. Registered patients (21+) may possess up to 1 ounce (28 grams) of flower or 8 grams of concentrate/edible THC per day, up to a 30-day supply; home cultivation is not permitted, and smoking/combustion of flower is banned in favor of vaporization and non-combustible product forms (tinctures, oils, topicals, edibles). Separately, industrial hemp is regulated under its own framework aligned with the federal 2018 Farm Bill''s 0.3% THC threshold, overseen by the Office of Cannabis Regulation (OLIC), which has authorized over 677 hemp product SKUs as of 2025 — though Department of Health regulations apply a stricter "total-THC" interpretation in practice (capturing THCA that would convert to Delta-9 THC on testing) rather than the federal delta-9-only standard, and 2026 enforcement activity has specifically targeted mislabeled high-THC products, including Delta-8 and other chemically converted intoxicating cannabinoids, marketed as compliant hemp. Puerto Rico''s Act 20/22 tax incentive regime (offering significant tax relief for qualifying businesses and individuals relocating to the territory) has been a documented driver attracting several mainland US cannabis-adjacent companies to establish Puerto Rico operations, layered on top of the island''s natural tropical, year-round cultivation climate. The core constraint shared with every other jurisdiction touching the US cannabis industry remains federal illegality: despite Puerto Rico''s territorial program maturity, federal banking restrictions create the same cash-management and financial-services friction documented in mainland US state markets. There is no adult-use/recreational program, and cannabis cannot be transported across any federal border, including between Puerto Rico and the US mainland, regardless of medical patient status.',
  steps = '[{"step":"Register with the JRCM (Medical Cannabis Regulatory Board) for the appropriate licence category","detail":"Cultivation, manufacturing, dispensing, laboratory testing, and transportation licences are all available and can be held individually or combined under Puerto Rico''s vertical integration allowance"},{"step":"Evaluate Act 20/22 tax incentive eligibility as part of the entity structuring decision","detail":"This has been a documented factor in mainland US cannabis companies choosing to establish Puerto Rico operations — assess eligibility criteria early since it materially affects overall project economics"},{"step":"If pursuing hemp rather than medical cannabis, register with OLIC and confirm total-THC (not just delta-9) compliance","detail":"Puerto Rico applies a stricter total-THC interpretation than the federal delta-9-only standard, and 2026 enforcement has actively targeted products non-compliant with this interpretation, including Delta-8 and other converted cannabinoids marketed as hemp"},{"step":"Plan for federal banking constraints from the outset","detail":"Despite Puerto Rico''s territorial program maturity, federal cannabis illegality still creates the same banking access friction found in mainland US state-legal markets — this is not resolved by territorial status"},{"step":"Structure product lines around the smoking/combustion ban","detail":"Flower combustion is prohibited; commercial product planning should prioritize vaporization-compatible flower, plus tinctures, oils, topicals, and edibles, consistent with the regulatory framework''s consumption-method restrictions"}]'::jsonb,
  key_regulators = '["Medical Cannabis Regulatory Board (MCRB / JRCM) — under the Puerto Rico Department of Health; licensing for cultivation, manufacturing, dispensing, lab testing, transportation","Office of Cannabis Regulation (OLIC) — industrial hemp licensing, import oversight, product SKU authorization","Puerto Rico Department of Health — overall program administration, physician authorization, patient card issuance"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming mainland US state cannabis experience translates directly without adjustment — Puerto Rico''s reciprocity provisions, vertical integration allowance, and Act 20/22 tax structure create a materially different operating environment from most single-state US markets',
    'Treating federal 0.3% delta-9 THC hemp compliance as sufficient — Puerto Rico''s Department of Health applies a stricter total-THC interpretation in practice, and 2026 enforcement has specifically targeted products compliant with federal delta-9 standards but not the stricter territorial interpretation',
    'Assuming any product can be transported between Puerto Rico and the US mainland — cannabis cannot cross this or any federal border regardless of medical patient status or product compliance, since Puerto Rico remains subject to federal law as a US territory'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated across IndicaOnline''s detailed 2026 market overview (dispensary count, vertical integration, Act 20/22 driver), Cannabisregulations.ai''s hemp enforcement coverage (OLIC SKU counts, total-THC interpretation), Herb.co and Puerto Rico Cannabis Club''s consumer-facing but detailed regulatory guides, all consistent on the Act 42-2017 framework and reciprocity provisions',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://indicaonline.com/blog/puerto-rico-marijuana-laws/')
WHERE country_iso2 = 'PR';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715120200','jurisdiction_playbooks_batch23c_lc_pr_content','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715120200_jurisdiction_playbooks_batch23c_lc_pr_content.sql

-- RECOVERY BEGIN 20260715130000_stage1_add_content_type_to_source_registry.sql
-- Stage 1 (INTELLIGENCE_ARCHITECTURE_SPEC.md): unified source registry.
-- Owner-approved decision: EXTEND existing live source_registry (1,471 rows, already
-- has language/tier/country/cadence) rather than create a new intel_sources table —
-- avoids a 3rd parallel estate, honoring the spec's "one registry" principle.
-- Adds only the missing routing dimension. Reversible: drop column content_type.
alter table public.source_registry add column if not exists content_type text[];
comment on column public.source_registry.content_type is
  'Stage 1 routing dimension: regulatory|market|story|equipment|research (spec 4.3). NULL = unclassified.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715130000','stage1_add_content_type_to_source_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715130000_stage1_add_content_type_to_source_registry.sql

-- RECOVERY BEGIN 20260715130100_stage1_backfill_content_type.sql
-- Stage 1: backfill content_type for the 1,471 existing intelligence sources,
-- derived from source_type. Reversible: set content_type=null where source_type<>'marketplace'.
-- Debatable buckets (owner may flip): reference->regulatory (could be research);
-- market_research->market (could be research).
update public.source_registry set content_type =
  case
    when source_type in ('regulator','regulator_official','government_official',
      'government_release','regulatory_filing','primary_legislation',
      'legislative_tracking','ngo_policy_tracker','legal_analysis','reference') then array['regulatory']
    when source_type in ('trade','trade_press','industry_press','market_research') then array['market']
    when source_type in ('news','mainstream_media') then array['story']
    when source_type in ('academic') then array['research']
    else array['regulatory']
  end
where content_type is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715130100','stage1_backfill_content_type','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715130100_stage1_backfill_content_type.sql

-- RECOVERY BEGIN 20260715130200_stage1_import_marketplace_sources_dormant.sql
-- Stage 1: import 311 marketplace sources from lib/scrapers/sources.ts into
-- source_registry, DORMANT (is_active=false, relevance_status='needs_review') so the
-- crawler (source-engine-fetch: .eq('is_active',true).eq('relevance_status','active'))
-- never fetches them = ZERO pipeline behavior change (spec Stage 1 + guardrail #7).
-- source_type='marketplace'; content_type from category (equipment vs market);
-- language='en'; slug preserved in notes. Deduped by hv_normalize_source_url against
-- existing rows AND within the file (sources.ts has 51 duplicate entries; 20 more
-- already existed as intelligence sources) -> 240 of 260 distinct URLs inserted.
-- Reversible: delete from source_registry where source_type='marketplace';
insert into public.source_registry (id,source_name,source_url,region,country,language,source_type,content_type,is_active,relevance_status,crawl_allowed,notes,created_at,updated_at) select gen_random_uuid(),v.name,v.url,v.region,null,'en','marketplace',array[v.ct],false,'needs_review',false,v.note,now(),now() from (values ('Aaron Equipment Company','https://www.aaronequipment.com/listing/pharmaceutical-processing-equipment/','north_america','equipment','mkt import; slug=aaron-equipment; cat=used_surplus; cadence=24h'),('Federal Equipment Company','https://www.fedequip.com/extraction-and-growing-technologies','north_america','equipment','mkt import; slug=federal-equipment; cat=used_surplus; cadence=24h'),('Surplus Record — Cannabis Processing','https://www.surplusrecord.com/machinery-equipment/cannabis-processing-machinery/','north_america','equipment','mkt import; slug=surplus-record-cannabis; cat=used_surplus; cadence=12h'),('420Equipment.com','https://www.420equipment.com/listings','north_america','equipment','mkt import; slug=420equipment; cat=used_surplus; cadence=12h'),('Urth & Fyre Equipment','https://www.urthfyre.com/listings','north_america','equipment','mkt import; slug=urth-fyre; cat=used_surplus; cadence=24h'),('BidSpotter — Cannabis & Processing Auctions','https://www.bidspotter.com/en-us/auction-catalogues?q=cannabis+extraction','north_america','equipment','mkt import; slug=bidspotter-cannabis; cat=processing_equipment; cadence=12h'),('Machinio — Extraction Equipment','https://www.machinio.com/search?q=extraction+equipment&subcategory=cannabis','global','equipment','mkt import; slug=machinio-extraction; cat=processing_equipment; cadence=24h'),('Horticulture Source — Commercial Grow Equipment','https://www.horticulture-source.com/commercial','north_america','equipment','mkt import; slug=horticulture-source; cat=cultivation_equipment; cadence=48h'),('Growers House — Commercial Grow','https://growershouse.com/collections/commercial-grow-equipment','north_america','equipment','mkt import; slug=growershouse; cat=cultivation_equipment; cadence=48h'),('Dragon Chewer Wholesale Packaging','https://www.dragonchewer.com/wholesale','north_america','equipment','mkt import; slug=dragon-chewer; cat=packaging; cadence=48h'),('MJ Wholesale — Packaging','https://mjwholesale.com/collections/packaging','north_america','equipment','mkt import; slug=mj-wholesale-packaging; cat=packaging; cadence=48h'),('MedLock (CannaLock) — Pharmaceutical Packaging','https://www.medlockglobal.com/cannabis','north_america','equipment','mkt import; slug=medlock-canada; cat=packaging; cadence=72h'),('ANAB ISO 17025 Cannabis Lab Directory','https://search.anab.org/search?q=cannabis&accreditation=ISO+17025','north_america','equipment','mkt import; slug=anab-cannabis-labs; cat=labs_testing; cadence=168h'),('Labstat — Certified Group','https://www.labstat.com/services/cannabis-testing','north_america','equipment','mkt import; slug=labstat-certified-group; cat=labs_testing; cadence=168h'),('Certified Laboratories','https://www.certifiedlabs.com/cannabis-testing','north_america','equipment','mkt import; slug=certified-laboratories; cat=labs_testing; cadence=168h'),('MMM Transport — Cannabis Logistics','https://www.mmmtransport.com/services','north_america','market','mkt import; slug=mmm-transport; cat=logistics; cadence=168h'),('Ziing — Cannabis Logistics','https://www.ziing.com/cannabis','north_america','market','mkt import; slug=ziing-cannabis; cat=logistics; cadence=168h'),('Verdant Strategies — Cannabis Advisory','https://www.verdantstrategies.com/services','north_america','market','mkt import; slug=verdant-strategies; cat=professional_services; cadence=168h'),('New Holland Group — Market Access','https://www.newhollandgroup.com/services','global','market','mkt import; slug=new-holland-group; cat=professional_services; cadence=168h'),('MJBizDirectory — Licensed Producers','https://mjbizdirectory.com/category/cultivators-growers/','global','market','mkt import; slug=mjbizdirectory-producers; cat=cannabis_inventory; cadence=168h'),('EMA EudraGMDP — EU GMP Certified Cannabis Producers','https://eudragmdp.ema.europa.eu/inspections/view/searchGMPNonCompliance.xhtml','europe','market','mkt import; slug=eu-gmp-database; cat=export_ready; cadence=168h'),('Michigan CRA — Cannabis Licensee Search','https://michigan.gov/cra/0,9548,7-406-98178_98834---,00.html','north_america','market','mkt import; slug=michigan-cra-licensees; cat=cannabis_inventory; cadence=168h'),('Massachusetts CCC — License Directory','https://masscannabiscontrol.com/licensing/license-type-directory/','north_america','market','mkt import; slug=massachusetts-ccc-licensees; cat=cannabis_inventory; cadence=168h'),('New York OCM — Active Licensees','https://cannabis.ny.gov/licensing','north_america','market','mkt import; slug=new-york-ocm-licensees; cat=cannabis_inventory; cadence=168h'),('Illinois CCB — Cannabis License Lookup','https://idfpr.illinois.gov/LicenseLookup/licenseelookup.asp','north_america','market','mkt import; slug=illinois-ccb-licensees; cat=cannabis_inventory; cadence=168h'),('Nevada CCB — Active License List','https://ccb.nv.gov/list-of-licensed-establishments/','north_america','market','mkt import; slug=nevada-ccb-licensees; cat=cannabis_inventory; cadence=168h'),('Washington LCB — Cannabis Licensee Map','https://lcb.wa.gov/licensing/cannabis-licensing','north_america','market','mkt import; slug=washington-lcb-licensees; cat=cannabis_inventory; cadence=168h'),('Arizona ADHS — Cannabis Licensee Registry','https://azdhs.gov/licensing/medical-marijuana/index.php','north_america','market','mkt import; slug=arizona-adhs-licensees; cat=cannabis_inventory; cadence=168h'),('Oklahoma OMMA — License Search','https://omma.ok.gov/licensing/license-search/','north_america','market','mkt import; slug=oklahoma-omma-licensees; cat=cannabis_inventory; cadence=168h'),('Missouri DHSS — Cannabis License Lookup','https://cannabis.mo.gov/resources/licensee-information/','north_america','market','mkt import; slug=missouri-dhss-licensees; cat=cannabis_inventory; cadence=168h'),('Maryland MCA — License Registry','https://cannabis.maryland.gov/pages/licensing','north_america','market','mkt import; slug=maryland-mca-licensees; cat=cannabis_inventory; cadence=168h'),('New Jersey CRC — Approved Licenses','https://www.nj.gov/cannabis/businesses/recreational/approved-licenses/','north_america','market','mkt import; slug=new-jersey-crc-licensees; cat=cannabis_inventory; cadence=168h'),('Connecticut DCP — Cannabis Licensees','https://portal.ct.gov/DCP/Medical-Marijuana-Program/Medical-Marijuana---Program-Overview','north_america','market','mkt import; slug=connecticut-dcp-licensees; cat=cannabis_inventory; cadence=168h'),('Florida OMMU — Licensed Dispensing Organizations','https://knowthefactsmmj.com/mmtc/','north_america','market','mkt import; slug=florida-ommu-dispensaries; cat=cannabis_inventory; cadence=168h'),('New Mexico RLD — Cannabis License Registry','https://www.rld.nm.gov/cannabis/','north_america','market','mkt import; slug=new-mexico-ccd-licensees; cat=cannabis_inventory; cadence=168h'),('Pennsylvania DOH — Medical Cannabis Dispensaries','https://www.pa.gov/en/agencies/doh/programs-and-services/medical-marijuana.html','north_america','market','mkt import; slug=pennsylvania-doh-dispensaries; cat=cannabis_inventory; cadence=168h'),('AGLC — Alberta Cannabis Wholesale','https://aglc.ca/cannabis/cannabis-industry/cannabis-suppliers','north_america','market','mkt import; slug=aglc-cannabis-wholesale; cat=cannabis_inventory; cadence=168h'),('OCS — Ontario Cannabis Store Wholesale','https://ocs.ca/pages/cannabis-retailers','north_america','market','mkt import; slug=ocs-ontario-wholesale; cat=cannabis_inventory; cadence=168h'),('BC Cannabis Secretariat — Wholesale','https://www2.gov.bc.ca/gov/content/employment-business/business/liquor-regulation-licensing/cannabis','north_america','market','mkt import; slug=bcldb-cannabis-wholesale; cat=cannabis_inventory; cadence=168h'),('SQDC — Quebec Cannabis Product Catalogue','https://www.sqdc.ca/en-CA/products','north_america','market','mkt import; slug=sqdc-quebec-products; cat=cannabis_inventory; cadence=168h'),('SLGA — Saskatchewan Cannabis Licensees','https://www.slga.com/cannabis','north_america','market','mkt import; slug=slga-saskatchewan-cannabis; cat=cannabis_inventory; cadence=168h'),('MHRA — UK Cannabis Licences','https://www.gov.uk/guidance/cannabis-based-products-for-medicinal-use-in-humans','europe','market','mkt import; slug=mhra-uk-cannabis; cat=import_demand; cadence=168h'),('OMC — Netherlands Bureau for Medicinal Cannabis','https://www.cannabisbureau.nl/en/','europe','market','mkt import; slug=omc-netherlands; cat=import_demand; cadence=168h'),('Israel MOH — Medical Cannabis Import/Export','https://www.health.gov.il/English/Topics/Cannabis/Pages/default.aspx','middle_east_africa','market','mkt import; slug=israel-moh-cannabis; cat=import_demand; cadence=168h'),('Swissmedic — Swiss Cannabis Authorisations','https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/authorisation--hma-/cannabishaltige-arzneimittel.html','europe','market','mkt import; slug=swissmedic-cannabis; cat=import_demand; cadence=168h'),('INFARMED — Portugal Cannabis Authorisations','https://www.infarmed.pt/web/infarmed-en/canabinoides','europe','market','mkt import; slug=infarmed-portugal-cannabis; cat=import_demand; cadence=168h'),('ISS — Italian Medical Cannabis Programme','https://www.iss.it/en/web/guest/cannabis-medica','europe','market','mkt import; slug=iss-italy-cannabis; cat=import_demand; cadence=168h'),('DKMA — Danish Cannabis Pilot Programme','https://laegemiddelstyrelsen.dk/en/special-initiatives/medical-cannabis-pilot-programme/','europe','market','mkt import; slug=dkma-denmark-cannabis; cat=import_demand; cadence=168h'),('SÚKL — Czech Cannabis Authorised Products','https://www.sukl.eu/en/special-medicinal-products/cannabis','europe','market','mkt import; slug=sukl-czech-cannabis; cat=import_demand; cadence=168h'),('Malta Medicines Authority — Cannabis Licences','https://medicinesauthority.gov.mt/cannabis','europe','market','mkt import; slug=malta-medicines-authority; cat=import_demand; cadence=168h'),('SAHPRA — South Africa Cannabis Licences','https://www.sahpra.org.za/complementary-medicines/cannabis/','middle_east_africa','market','mkt import; slug=sahpra-south-africa; cat=export_ready; cadence=168h'),('ANVISA — Brazil Cannabis RDC 327','https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/legislacao/produtos-derivados-da-cannabis','latin_america','market','mkt import; slug=anvisa-brazil-cannabis; cat=import_demand; cadence=168h'),('Jamaica Cannabis Licensing Authority','https://www.cla.gov.jm/licensed-operators','latin_america','market','mkt import; slug=jamaica-cla-licences; cat=export_ready; cadence=168h'),('Thai FDA — Cannabis Licences','https://www.fda.moph.go.th/sites/Drug/Pages/Cannabis.aspx','asia_pacific','market','mkt import; slug=thailand-fda-cannabis; cat=import_demand; cadence=168h'),('Colombia MinJusticia — Cannabis Export Licences','https://www.minjusticia.gov.co/programas-co/politica-de-drogas/cannabis-medicinal','latin_america','market','mkt import; slug=colombia-minjusticia-cannabis; cat=export_ready; cadence=168h'),('EOF — Greek National Cannabis Register','https://www.eof.gr/web/guest/cannabis','europe','market','mkt import; slug=eof-greece-cannabis; cat=import_demand; cadence=168h'),('NOMA — Norwegian Cannabis Medicines','https://legemiddelverket.no/english/medical-cannabis','europe','market','mkt import; slug=noma-norway-cannabis; cat=import_demand; cadence=168h'),('Confident Cannabis — Wholesale Marketplace','https://confidentcannabis.com/wholesale','north_america','market','mkt import; slug=confident-cannabis; cat=cannabis_inventory; cadence=24h'),('NABIS — California Wholesale Distributor','https://www.nabis.com/brands','north_america','market','mkt import; slug=nabis-wholesale; cat=cannabis_inventory; cadence=48h'),('Dutchie — Dispensary Wholesale Menus','https://dutchie.com/dispensary-map','north_america','market','mkt import; slug=dutchie-wholesale-menus; cat=cannabis_inventory; cadence=48h'),('Meadow — California B2B Listings','https://getmeadow.com/brands','north_america','market','mkt import; slug=meadow-california-b2b; cat=cannabis_inventory; cadence=48h'),('SEC EDGAR — Cannabis Company Filings','https://efts.sec.gov/LATEST/search-index?q=%22cannabis%22&dateRange=custom&startdt=2024-01-01&forms=8-K,10-Q,10-K','north_america','market','mkt import; slug=sec-edgar-cannabis; cat=business_opportunities; cadence=24h'),('SEDAR+ — Canadian LP Regulatory Filings','https://www.sedarplus.ca/landingpage/','north_america','market','mkt import; slug=sedar-canadian-lp-filings; cat=business_opportunities; cadence=48h'),('Viridian Capital Advisors — Deal Tracker','https://viridiancapitaladvisors.com/cannabis-deal-tracker/','global','market','mkt import; slug=viridian-capital-deals; cat=business_opportunities; cadence=48h'),('CourtListener — Cannabis Bankruptcy Filings','https://www.courtlistener.com/?q=%22cannabis%22+%22chapter+11%22&type=r&order_by=score+desc','north_america','market','mkt import; slug=pacer-cannabis-bankruptcy; cat=distressed_businesses; cadence=48h')) as v(name,url,region,ct,note) where not exists (select 1 from public.source_registry sr where hv_normalize_source_url(sr.source_url)=hv_normalize_source_url(v.url));
insert into public.source_registry (id,source_name,source_url,region,country,language,source_type,content_type,is_active,relevance_status,crawl_allowed,notes,created_at,updated_at) select gen_random_uuid(),v.name,v.url,v.region,null,'en','marketplace',array[v.ct],false,'needs_review',false,v.note,now(),now() from (values ('MJBizCon — Exhibitor Directory','https://mjbizconference.com/exhibitors/','global','market','mkt import; slug=mjbizcon-exhibitors; cat=professional_services; cadence=168h'),('Hall of Flowers — Brand Directory','https://hallofflowers.com/brands/','north_america','market','mkt import; slug=hall-of-flowers-exhibitors; cat=cannabis_inventory; cadence=168h'),('NECANN — Northeast Cannabis Business Conference','https://necann.com/exhibitors/','north_america','market','mkt import; slug=necann-exhibitors; cat=professional_services; cadence=168h'),('Google Patents — Cannabis Patent Filings','https://patents.google.com/?q=cannabis+cultivation+extraction&after=priority:20220101&assignee=','global','equipment','mkt import; slug=google-patents-cannabis; cat=new_products; cadence=168h'),('CIPO — Canadian Cannabis Patent Database','https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en','north_america','equipment','mkt import; slug=cipo-cannabis-patents; cat=new_products; cadence=168h'),('Marijuana Moment — Policy & Legislation','https://www.marijuanamoment.net/feed/','global','equipment','mkt import; slug=marijuana-moment-news; cat=new_products; cadence=6h'),('Cannabis Wire — Investigative News','https://cannabiswire.com/feed/','north_america','equipment','mkt import; slug=cannabis-wire-news; cat=new_products; cadence=12h'),('Headset — Public Cannabis Market Reports','https://headset.io/insights/','north_america','equipment','mkt import; slug=headset-market-data; cat=new_products; cadence=168h'),('New Frontier Data — Public Research','https://newfrontierdata.com/cannabis-reports/','global','equipment','mkt import; slug=new-frontier-data-reports; cat=new_products; cadence=168h'),('Prohibition Partners — EU/APAC Research','https://prohibitionpartners.com/reports/','europe','equipment','mkt import; slug=prohibition-partners-reports; cat=new_products; cadence=168h'),('MJ Wholesale — Consumables & Supplies','https://mjwholesale.com/collections/vaporizers','north_america','equipment','mkt import; slug=mjwholesale-consumables; cat=consumables; cadence=48h'),('Pure Hemp Shop — B2B Cones & Pre-roll Supplies','https://purehempshop.com/collections/bulk-wholesale','north_america','equipment','mkt import; slug=pure-hemp-shop-b2b; cat=consumables; cadence=72h'),('Kush Supply Co — Cannabis Operations Supplies','https://kushsupplyco.com/collections/all','north_america','equipment','mkt import; slug=kush-supply-co; cat=consumables; cadence=48h'),('Greenlane — Wholesale Vaporizer & Accessories','https://www.greenlane.com/wholesale','north_america','equipment','mkt import; slug=greenlane-wholesale; cat=consumables; cadence=72h'),('Kannastor — Grinders & Accessories Wholesale','https://kannastor.com/pages/wholesale','north_america','equipment','mkt import; slug=kannastor-wholesale; cat=consumables; cadence=168h'),('Harvest Right — Cannabis Freeze Dryers','https://harvestright.com/cannabis','north_america','equipment','mkt import; slug=harvest-right-freeze-dry; cat=consumables; cadence=168h'),('Bhogart — Extraction Supplies & Consumables','https://www.bhogart.com/collections/all','north_america','equipment','mkt import; slug=bhogart-extraction-supplies; cat=consumables; cadence=48h'),('ExtractCraft — Ethanol Extraction Supplies','https://extractcraft.com/collections/all','north_america','equipment','mkt import; slug=extractcraft-supplies; cat=consumables; cadence=168h'),('AICPA — Cannabis CPA Finder','https://www.aicpa.org/resources/toolkit/cannabis-cannabis-accounting-resources','north_america','market','mkt import; slug=cannabis-cpa-directory; cat=professional_services; cadence=168h'),('MJBizDirectory — Cannabis Attorneys','https://mjbizdirectory.com/category/legal-services/','global','market','mkt import; slug=mjbizdirectory-lawyers; cat=professional_services; cadence=168h'),('Cannabis Consulting Hub — Service Directory','https://www.cannabisconsultinghub.com/consultants','global','market','mkt import; slug=cannabis-consulting-hub; cat=professional_services; cadence=168h'),('Dama Financial — Cannabis Banking & Finance','https://www.damafinancial.com/services','north_america','market','mkt import; slug=dama-financial; cat=professional_services; cadence=168h'),('Safe Harbor Financial — Cannabis Lending','https://www.shfinancial.org/cannabis-lending','north_america','market','mkt import; slug=safe-harbor-financial; cat=professional_services; cadence=168h'),('Cannasure — Cannabis Insurance','https://www.cannasure.com/cannabis-insurance/','north_america','market','mkt import; slug=cannasure-insurance; cat=professional_services; cadence=168h'),('MJ Freight — Cannabis Freight Logistics','https://mjfreight.com/services','north_america','market','mkt import; slug=mjfreight-logistics; cat=logistics; cadence=168h'),('California DCC — Cannabis License Search','https://cannabis.ca.gov/licensees/licensed-cannabis-businesses/','north_america','market','mkt import; slug=california-dcc-licensees; cat=cannabis_inventory; cadence=72h'),('California DCC — Active License CSV Export','https://cannabis.ca.gov/wp-content/uploads/sites/2/2024/07/Active_licenses_PublicList.csv','north_america','market','mkt import; slug=california-dcc-license-csv; cat=cannabis_inventory; cadence=72h'),('Colorado MED — Cannabis License Database','https://sbg.colorado.gov/med/licensed-facilities','north_america','market','mkt import; slug=colorado-med-licensees; cat=cannabis_inventory; cadence=168h'),('Oregon OLCC — Cannabis License Registry','https://www.oregon.gov/olcc/marijuana/pages/recreational-marijuana-licensing.aspx','north_america','market','mkt import; slug=oregon-olcc-cannabis; cat=cannabis_inventory; cadence=168h'),('Montana DOR — Cannabis License Registry','https://mtrevenue.gov/cannabis/','north_america','market','mkt import; slug=montana-cannabis-licensees; cat=cannabis_inventory; cadence=168h'),('Minnesota OCM — Cannabis License Registry','https://mn.gov/ocm/businesses/licenses/','north_america','market','mkt import; slug=minnesota-ocm-cannabis; cat=cannabis_inventory; cadence=48h'),('Ohio DCC — Cannabis License Directory','https://cannabis.ohio.gov/licensing/applying-for-a-license','north_america','market','mkt import; slug=ohio-dcc-cannabis; cat=cannabis_inventory; cadence=48h'),('Virginia ABC — Cannabis Retail License Registry','https://www.abc.virginia.gov/licenses/cannabis','north_america','market','mkt import; slug=virginia-abc-cannabis; cat=cannabis_inventory; cadence=168h'),('Alaska AMCO — Cannabis License Registry','https://www.commerce.alaska.gov/web/amco/marijuanainfo.aspx','north_america','market','mkt import; slug=alaska-amco-cannabis; cat=cannabis_inventory; cadence=168h'),('Hawaii DOH — Medical Cannabis Dispensary Registry','https://health.hawaii.gov/medicalmarijuanaregistry/','north_america','market','mkt import; slug=hawaii-dph-cannabis; cat=cannabis_inventory; cadence=168h'),('Maine OCP — Cannabis Licensee List','https://www.maine.gov/dafs/ocp/adult-use/about-adult-use/licensee-list','north_america','market','mkt import; slug=maine-ocp-cannabis; cat=cannabis_inventory; cadence=168h'),('Vermont CCB — Cannabis License Registry','https://liquorcontrol.vermont.gov/cannabis','north_america','market','mkt import; slug=vermont-ccb-cannabis; cat=cannabis_inventory; cadence=168h'),('Rhode Island DBR — Cannabis License Registry','https://dbr.ri.gov/cannabis','north_america','market','mkt import; slug=rhode-island-dbr-cannabis; cat=cannabis_inventory; cadence=168h'),('Delaware Cannabis Commissioner — License Registry','https://cannabis.delaware.gov/licensing/','north_america','market','mkt import; slug=delaware-cannabis-commissioner; cat=cannabis_inventory; cadence=72h'),('DC ABCA — Cannabis Business License Registry','https://abca.dc.gov/service/cannabis','north_america','market','mkt import; slug=dc-abca-cannabis; cat=cannabis_inventory; cadence=168h'),('Arkansas ABC — Medical Cannabis Licenses','https://www.dfa.arkansas.gov/office-of-excise-tax/alcohol-control-division/medical-cannabis','north_america','market','mkt import; slug=arkansas-abc-medical; cat=cannabis_inventory; cadence=168h'),('Louisiana BOP — Medical Cannabis Licenses','https://www.lsbop.gov/pharmacies/medical-marijuana-pharmacies','north_america','market','mkt import; slug=louisiana-bop-medical; cat=cannabis_inventory; cadence=168h'),('Mississippi MDOH — Medical Cannabis License Registry','https://msdh.ms.gov/msdhsite/_static/14,0,420.html','north_america','market','mkt import; slug=mississippi-mdoh-medical; cat=cannabis_inventory; cadence=168h'),('West Virginia OMP — Medical Cannabis License Registry','https://omp.wv.gov/license/','north_america','market','mkt import; slug=west-virginia-omp-medical; cat=cannabis_inventory; cadence=168h'),('Cannabis NB — New Brunswick Product Catalogue','https://www.cannabis-nb.com/brands','north_america','market','mkt import; slug=cannabis-nb-new-brunswick; cat=cannabis_inventory; cadence=168h'),('NSLC — Nova Scotia Cannabis Catalogue','https://www.mynslc.com/en/Products/Cannabis','north_america','market','mkt import; slug=nslc-nova-scotia; cat=cannabis_inventory; cadence=168h'),('LGCA — Manitoba Cannabis Wholesale','https://www.lgcamb.ca/cannabis/for-retailers/','north_america','market','mkt import; slug=lgca-manitoba-cannabis; cat=cannabis_inventory; cadence=168h'),('NLC — Newfoundland Cannabis Catalogue','https://www.newfoundlandliquor.com/cannabis','north_america','market','mkt import; slug=nlc-newfoundland-cannabis; cat=cannabis_inventory; cadence=168h'),('PEI Cannabis — Prince Edward Island Catalogue','https://www.peicannabis.ca/brands/','north_america','market','mkt import; slug=pei-cannabis; cat=cannabis_inventory; cadence=168h'),('Health Canada — Licensed Producers Open Data (JSON API)','https://health-products.canada.ca/api/opendata-donneesouvertes/v1/datastore_search?resource_id=16f64c0e-4f98-4d9a-b735-1a5b0e766c42&limit=1000','north_america','market','mkt import; slug=health-canada-lp-api; cat=cannabis_inventory; cadence=24h'),('BfArM — Germany Medical Cannabis (Cannabisagentur)','https://www.bfarm.de/EN/Federal-Opium-Agency/Narcotic-Drugs/Cannabis/Medical-Cannabis/_node.html','europe','market','mkt import; slug=bfarm-germany-cannabis; cat=import_demand; cadence=24h'),('Bundesanzeiger — Germany Cannabis Supply Tenders','https://www.bundesanzeiger.de/pub/de/suchen?search=cannabis+anbau&kategorie=bekanntmachungen','europe','market','mkt import; slug=bundesanzeiger-cannabis-tenders; cat=import_demand; cadence=12h'),('ANSM — France Medical Cannabis Authorisations','https://ansm.sante.fr/dossiers-thematiques/cannabis-medical','europe','market','mkt import; slug=ansm-france-cannabis; cat=import_demand; cadence=48h'),('AEMPS — Spain Cannabis Authorisations','https://www.aemps.gob.es/medicamentos-de-uso-humano/especiales/cannabis-medicinal/','europe','market','mkt import; slug=aemps-spain-cannabis; cat=import_demand; cadence=168h'),('URPL — Poland Cannabis Authorisations','https://www.urpl.gov.pl/en/products/special-authorisation','europe','market','mkt import; slug=urpl-poland-cannabis; cat=import_demand; cadence=48h'),('FAMHP — Belgium Medicinal Cannabis Programme','https://www.afmps.be/en/human/herbal_medicines/special_medical_needs','europe','market','mkt import; slug=famhp-belgium-cannabis; cat=import_demand; cadence=168h'),('AGES — Austria Cannabis Authorisations','https://www.ages.at/mensch/arzneimittel/cannabis','europe','market','mkt import; slug=ages-austria-cannabis; cat=import_demand; cadence=168h'),('Läkemedelsverket — Sweden Cannabis Approvals','https://www.lakemedelsverket.se/en/cannabis','europe','market','mkt import; slug=lakemedelsverket-sweden; cat=import_demand; cadence=168h'),('Fimea — Finland Cannabis Medicinal Products','https://www.fimea.fi/web/en/medicines/cannabinoids','europe','market','mkt import; slug=fimea-finland-cannabis; cat=import_demand; cadence=168h'),('Luxembourg Ministry of Health — Cannabis Regulation','https://sante.public.lu/fr/themes/drogues-addictions/cannabis-loi.html','europe','market','mkt import; slug=luxembourg-ministry-cannabis; cat=import_demand; cadence=168h'),('TED — EU Cannabis & Narcotics Procurement Tenders','https://ted.europa.eu/en/search/result?query=cannabis&scope=NOTICE','europe','market','mkt import; slug=ted-eu-cannabis-tenders; cat=import_demand; cadence=12h'),('EUR-Lex — EU Official Journal Cannabis Legislation','https://eur-lex.europa.eu/search.html?type=advanced&qid=cannabis&DB_LEGBASE=LEGBASE','europe','market','mkt import; slug=eu-official-journal-cannabis; cat=import_demand; cadence=24h'),('INCB — Annual Narcotic Drugs Statistics','https://www.incb.org/incb/en/narcotic-drugs/publications_events/narcotic-drugs.html','global','market','mkt import; slug=incb-annual-statistics; cat=import_demand; cadence=168h'),('INCB — Press Releases & Alerts','https://www.incb.org/incb/en/news/press_releases.html','global','market','mkt import; slug=incb-press-releases; cat=import_demand; cadence=24h'),('EMCDDA — European Drug Monitoring Reports','https://www.emcdda.europa.eu/publications/drug-reports_en','europe','market','mkt import; slug=emcdda-drug-monitoring; cat=import_demand; cadence=24h')) as v(name,url,region,ct,note) where not exists (select 1 from public.source_registry sr where hv_normalize_source_url(sr.source_url)=hv_normalize_source_url(v.url));
insert into public.source_registry (id,source_name,source_url,region,country,language,source_type,content_type,is_active,relevance_status,crawl_allowed,notes,created_at,updated_at) select gen_random_uuid(),v.name,v.url,v.region,null,'en','marketplace',array[v.ct],false,'needs_review',false,v.note,now(),now() from (values ('UNODC — World Drug Report','https://www.unodc.org/unodc/en/data-and-analysis/world-drug-report.html','global','market','mkt import; slug=unodc-world-drug-report; cat=import_demand; cadence=168h'),('WHO ECDD — Cannabis Scheduling & Expert Reviews','https://www.who.int/groups/expert-committee-on-drug-dependence','global','market','mkt import; slug=who-ecdd-cannabis; cat=import_demand; cadence=168h'),('IRCCA — Uruguay Cannabis Institute','https://www.ircca.gub.uy/registro/','latin_america','market','mkt import; slug=ircca-uruguay; cat=export_ready; cadence=168h'),('COFEPRIS — Mexico Cannabis Authorisations','https://www.gob.mx/cofepris/documentos/cannabis','latin_america','market','mkt import; slug=cofepris-mexico-cannabis; cat=import_demand; cadence=72h'),('INVIMA — Colombia Cannabis Health Licences','https://www.invima.gov.co/medicamentos-cannabis','latin_america','market','mkt import; slug=invima-colombia-cannabis; cat=export_ready; cadence=48h'),('ANMAT — Argentina Cannabis Product Registry','https://www.argentina.gob.ar/anmat/cannabis','latin_america','market','mkt import; slug=anmat-argentina-cannabis; cat=import_demand; cadence=168h'),('ISP — Chile Cannabis Authorisations','https://www.ispch.cl/anamed/cannabis','latin_america','market','mkt import; slug=isp-chile-cannabis; cat=import_demand; cadence=168h'),('DIGEMID — Peru Medical Cannabis Registry','https://www.digemid.minsa.gob.pe/Main.asp?Seccion=3&IdItem=866','latin_america','market','mkt import; slug=digemid-peru-cannabis; cat=import_demand; cadence=168h'),('ARCSA — Ecuador Cannabis Registrations','https://www.controlsanitario.gob.ec/cannabis/','latin_america','market','mkt import; slug=cmed-ecuador-cannabis; cat=import_demand; cadence=168h'),('TGA — Australia Medicinal Cannabis Licences','https://www.tga.gov.au/products/cannabis/medicinal-cannabis/cultivators-and-manufacturers','asia_pacific','market','mkt import; slug=tga-australia-cannabis; cat=import_demand; cadence=48h'),('TGA — Australia SAS Access Scheme Annual Data','https://www.tga.gov.au/products/cannabis/medicinal-cannabis/access-to-medicinal-cannabis-products/sas-annual-data','asia_pacific','market','mkt import; slug=tga-australia-sas-data; cat=import_demand; cadence=168h'),('Medsafe — New Zealand Cannabis Products Register','https://www.medsafe.govt.nz/regulatory/Medicines/medicinalcannabis.asp','asia_pacific','market','mkt import; slug=medsafe-nz-cannabis; cat=import_demand; cadence=168h'),('MPI — New Zealand Industrial Hemp Register','https://www.mpi.govt.nz/plants-and-animals/plants/cannabis/industrial-hemp/','asia_pacific','market','mkt import; slug=mpi-nz-hemp; cat=cannabis_inventory; cadence=168h'),('MFDS — South Korea Cannabis Policy Updates','https://www.mfds.go.kr/eng/brd/m_60/view.do?seq=74629','asia_pacific','market','mkt import; slug=mfds-korea-cannabis; cat=import_demand; cadence=72h'),('MOPH — Lebanon Cannabis Cultivation Licences','https://www.moph.gov.lb/en/cannabis','middle_east_africa','market','mkt import; slug=moph-lebanon-cannabis; cat=export_ready; cadence=168h'),('MCAZ — Zimbabwe Cannabis Licence Registry','https://www.mcaz.co.zw/index.php/programmes/cannabis','middle_east_africa','market','mkt import; slug=mcaz-zimbabwe-cannabis; cat=export_ready; cadence=168h'),('Lesotho MoH — Cannabis Cultivation Licences','https://www.health.gov.ls/cannabis','middle_east_africa','market','mkt import; slug=cannabis-lesotho; cat=export_ready; cadence=168h'),('Rwanda FDA — Cannabis Export Licence Registry','https://www.rfa.rw/cannabis','middle_east_africa','market','mkt import; slug=rfa-rwanda-cannabis; cat=export_ready; cadence=168h'),('NAFDAC — Nigeria Cannabis/Hemp Regulatory Updates','https://www.nafdac.gov.ng/category/press-release/','middle_east_africa','market','mkt import; slug=nafdac-nigeria-cannabis; cat=import_demand; cadence=72h'),('SEC EDGAR — Cannabis 8-K Current Reports (JSON API)','https://efts.sec.gov/LATEST/search-index?q=%22cannabis%22&forms=8-K&dateRange=custom&startdt=2025-01-01','north_america','market','mkt import; slug=edgar-cannabis-8k-api; cat=business_opportunities; cadence=6h'),('SEC EDGAR — Cannabis 10-K Annual Reports (JSON API)','https://efts.sec.gov/LATEST/search-index?q=%22cannabis%22&forms=10-K','north_america','market','mkt import; slug=edgar-cannabis-10k-api; cat=business_opportunities; cadence=48h'),('SEC EDGAR — Cannabis Insider Transactions (Form 4 API)','https://efts.sec.gov/LATEST/search-index?q=%22cannabis%22&forms=4','north_america','market','mkt import; slug=edgar-cannabis-form4-api; cat=business_opportunities; cadence=24h'),('SEC EDGAR — Cannabis Activist Shareholder Filings (SC 13D/G API)','https://efts.sec.gov/LATEST/search-index?q=%22cannabis%22&forms=SC+13D,SC+13G','north_america','market','mkt import; slug=edgar-cannabis-sc13d-api; cat=business_opportunities; cadence=24h'),('SEDAR+ — TSX/TSXV Cannabis Quarterly Filings','https://www.sedarplus.ca/landingpage/filing-search.html','north_america','market','mkt import; slug=tsx-cannabis-filings; cat=business_opportunities; cadence=48h'),('ASX — Australian Cannabis Company Announcements','https://www2.asx.com.au/markets/market-resources/regulatory-resources/market-news-and-announcements?q=cannabis','asia_pacific','market','mkt import; slug=asx-cannabis-announcements; cat=business_opportunities; cadence=24h'),('London AIM — Cannabis Company Regulatory News','https://www.londonstockexchange.com/news?categories=Regulatory%20News&market=AIM&q=cannabis','europe','market','mkt import; slug=aim-cannabis-rns; cat=business_opportunities; cadence=24h'),('Viridian — Cannabis Capital Raises & M&A Weekly','https://viridiancapitaladvisors.com/cannabis-market-summary/','global','market','mkt import; slug=viridian-weekly-summary; cat=business_opportunities; cadence=48h'),('GlobeNewswire — Cannabis Press Release RSS','https://www.globenewswire.com/RssFeed/subjectcode/18-Cannabis','global','equipment','mkt import; slug=globenewswire-cannabis; cat=new_products; cadence=2h'),('Business Wire — Cannabis News RSS','https://www.businesswire.com/rss/home/?rss=G7&rssid=21737','global','equipment','mkt import; slug=businesswire-cannabis; cat=new_products; cadence=2h'),('PR Newswire — Cannabis Industry RSS','https://www.prnewswire.com/rss/news-releases-list.rss?tagAbbr=Cannabis','global','equipment','mkt import; slug=prnewswire-cannabis; cat=new_products; cadence=2h'),('AccessWire — Cannabis Emerging Market Announcements','https://www.accesswire.com/topics/cannabis','global','equipment','mkt import; slug=accesswire-cannabis; cat=new_products; cadence=6h'),('MJBizDaily — Cannabis Business News RSS','https://mjbizdaily.com/feed/','global','equipment','mkt import; slug=mjbizdaily-rss; cat=new_products; cadence=4h'),('Cannabis Business Times — Operations & Compliance RSS','https://www.cannabisbusinesstimes.com/rss','north_america','equipment','mkt import; slug=cannabis-business-times-rss; cat=new_products; cadence=12h'),('Green Market Report — Cannabis Finance RSS','https://www.greenmarketreport.com/feed/','north_america','market','mkt import; slug=green-market-report-rss; cat=business_opportunities; cadence=6h'),('New Cannabis Ventures — Investment Tracker RSS','https://www.newcannabisventures.com/feed/','global','market','mkt import; slug=new-cannabis-ventures-rss; cat=business_opportunities; cadence=6h'),('Ganjapreneur — SME Cannabis Industry RSS','https://www.ganjapreneur.com/feed/','global','equipment','mkt import; slug=ganjapreneur-rss; cat=new_products; cadence=24h'),('Leafly — Cannabis News & Consumer Trends RSS','https://www.leafly.com/news/feed','north_america','equipment','mkt import; slug=leafly-news-rss; cat=new_products; cadence=12h'),('Cannabis Retailer — Canada Retail Intelligence RSS','https://www.cannabisretailer.ca/feed/','north_america','equipment','mkt import; slug=cannabis-retailer-rss; cat=new_products; cadence=48h'),('Cannabis Health News — Medical & Clinical RSS','https://cannabishealthnews.co.uk/feed/','europe','market','mkt import; slug=cannabis-health-news-rss; cat=import_demand; cadence=24h'),('Prohibition Partners — EU/APAC Intelligence RSS','https://prohibitionpartners.com/feed/','europe','market','mkt import; slug=prohibition-partners-insights; cat=import_demand; cadence=24h'),('Apex Trading — Oregon/Washington B2B Wholesale','https://www.apextrading.com/products/','north_america','market','mkt import; slug=apex-trading-northwest; cat=cannabis_inventory; cadence=48h'),('Weedmaps — Cannabis Brand & Dispensary Directory','https://weedmaps.com/brands','north_america','market','mkt import; slug=weedmaps-brand-directory; cat=cannabis_inventory; cadence=48h'),('EPO Espacenet — European Cannabis Patent Database','https://worldwide.espacenet.com/patent/search?q=cannabis+AND+extraction&sf=pd&so=desc','europe','equipment','mkt import; slug=epo-espacenet-cannabis; cat=new_products; cadence=168h'),('WIPO PATENTSCOPE — Global Cannabis PCT Patents','https://patentscope.wipo.int/search/en/search.jsf?query=cannabis+extraction','global','equipment','mkt import; slug=wipo-patentscope-cannabis; cat=new_products; cadence=168h'),('Seedfinder — Cannabis Genetics & Strain Database','https://en.seedfinder.eu/database/strains/','global','market','mkt import; slug=seedfinder-strain-database; cat=genetics; cadence=168h'),('Leafly — Cannabis Strain Library','https://www.leafly.com/strains','global','market','mkt import; slug=leafly-strain-library; cat=genetics; cadence=168h'),('Dark Heart Nursery — Commercial Clone Catalogue','https://www.darkheart.com/strains/','north_america','market','mkt import; slug=dark-heart-nursery-clones; cat=genetics; cadence=168h'),('DEA — Drug Enforcement Press Releases','https://www.dea.gov/latest-news/press-releases','north_america','market','mkt import; slug=dea-press-releases; cat=distressed_businesses; cadence=24h'),('FDA — Cannabis & CBD Warning Letters','https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters?search=cannabis','north_america','market','mkt import; slug=fda-warning-letters-cannabis; cat=distressed_businesses; cadence=48h'),('Federal Register — Cannabis Rulemaking Pipeline','https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=cannabis&conditions%5Btype%5D%5B%5D=PROPOSED_RULE&conditions%5Btype%5D%5B%5D=RULE','north_america','market','mkt import; slug=federal-register-cannabis-rules; cat=import_demand; cadence=24h'),('FinCEN — Cannabis Banking Guidance & SAR Data','https://www.fincen.gov/resources/statutes-and-regulations/cannabis-related-businesses','north_america','market','mkt import; slug=fincen-cannabis-guidance; cat=business_opportunities; cadence=168h'),('MJ Job Network — Cannabis Industry Jobs','https://mjjobnetwork.com/jobs/','global','market','mkt import; slug=mjjobnetwork; cat=business_opportunities; cadence=48h'),('Vangst — Cannabis Executive & Leadership Hiring','https://vangst.com/jobs','north_america','market','mkt import; slug=vangst-cannabis-talent; cat=business_opportunities; cadence=72h'),('Crexi — Cannabis-Compliant Commercial Properties','https://www.crexi.com/properties?q=cannabis','north_america','market','mkt import; slug=crexi-cannabis-properties; cat=business_opportunities; cadence=48h'),('LoopNet — Cannabis Facility Listings','https://www.loopnet.com/search/cannabis-properties/usa/for-sale/','north_america','market','mkt import; slug=loopnet-cannabis-facilities; cat=business_opportunities; cadence=48h'),('ClinicalTrials.gov — Active Cannabis Clinical Studies','https://clinicaltrials.gov/search?cond=cannabis&status=RECRUITING%2CACTIVE_NOT_RECRUITING&sort=@relevance','global','equipment','mkt import; slug=clinicaltrials-cannabis; cat=new_products; cadence=168h'),('PubMed — Cannabis Research Publications RSS','https://pubmed.ncbi.nlm.nih.gov/rss/search/1oI3xPXUQfWLLPBJxF_4fjqoFHbnJ1BxNOPVdEhAatHvr6jMr9/?limit=20','global','equipment','mkt import; slug=pubmed-cannabis-rss; cat=new_products; cadence=24h'),('Alibaba — Cannabis Processing Equipment Suppliers (CN)','https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText=cannabis+extraction+equipment','asia_pacific','equipment','mkt import; slug=alibaba-cannabis-equipment; cat=processing_equipment; cadence=168h'),('Made-in-China — Cannabis Equipment Manufacturers (CN)','https://www.made-in-china.com/products-search/hot-china-products/Cannabis_Equipment.html','asia_pacific','equipment','mkt import; slug=made-in-china-cannabis; cat=cultivation_equipment; cadence=168h'),('Spannabis — European Cannabis Exhibitor Directory','https://www.spannabis.com/en/exhibitors/','europe','market','mkt import; slug=spannabis-exhibitors; cat=professional_services; cadence=168h'),('Cannabis Europa — European Policy Conference Directory','https://cannabiseuropa.com/speakers/','europe','market','mkt import; slug=cannabis-europa-speakers; cat=professional_services; cadence=168h'),('Indo Expo — Indoor Agriculture & Cannabis Show','https://www.indoexpo.com/exhibitors/','north_america','equipment','mkt import; slug=indo-expo-exhibitors; cat=cultivation_equipment; cadence=168h'),('World Cannabis Congress — International Conference','https://worldcannabiscongress.com/speakers/','global','market','mkt import; slug=wcc-world-cannabis-conference; cat=professional_services; cadence=168h'),('Next Insurance — Cannabis Business Insurance','https://www.nextinsurance.com/blog/cannabis-insurance/','north_america','market','mkt import; slug=next-insurance-cannabis; cat=professional_services; cadence=168h'),('Royal Queen Seeds Catalogue','https://www.royalqueenseeds.com/gb/content/7-cbd-seeds','europe','equipment','mkt import; slug=royal-queen-seeds; cat=product; cadence=168h')) as v(name,url,region,ct,note) where not exists (select 1 from public.source_registry sr where hv_normalize_source_url(sr.source_url)=hv_normalize_source_url(v.url));
insert into public.source_registry (id,source_name,source_url,region,country,language,source_type,content_type,is_active,relevance_status,crawl_allowed,notes,created_at,updated_at) select gen_random_uuid(),v.name,v.url,v.region,null,'en','marketplace',array[v.ct],false,'needs_review',false,v.note,now(),now() from (values ('Sensi Seeds Catalogue','https://sensiseeds.com/en/cannabis-seeds/','europe','equipment','mkt import; slug=sensi-seeds-catalogue; cat=product; cadence=168h'),('Dutch Passion Seeds Catalogue','https://dutch-passion.com/en/cannabis-seeds/','europe','equipment','mkt import; slug=dutch-passion-seeds; cat=product; cadence=168h'),('SC Labs Public COA Database','https://client.sclabs.com/public/','north_america','equipment','mkt import; slug=sc-labs-test-results; cat=product; cadence=24h'),('Steep Hill Labs Research and Data','https://steephill.com/research','north_america','equipment','mkt import; slug=steep-hill-labs; cat=product; cadence=72h'),('Orchid Cannabis Insurance','https://www.orchidinsurance.com/cannabis','north_america','market','mkt import; slug=orchid-cannabis-insurance; cat=professional_services; cadence=168h'),('Lloyd''s of London Cannabis Insurance Market','https://www.lloyds.com/news-and-insights/risk-insights/cannabis','global','market','mkt import; slug=lloyds-cannabis-market; cat=professional_services; cadence=168h'),('Extraction Magazine','https://extractionmagazine.com/feed/','north_america','equipment','mkt import; slug=extraction-magazine; cat=processing_equipment; cadence=48h'),('MCR Labs Massachusetts Test Results','https://www.mcrlabs.com/products/','north_america','equipment','mkt import; slug=mcr-labs-massachusetts; cat=labs_testing; cadence=24h'),('ProVerde Laboratories Cannabis Testing','https://www.proverde.com/cannabis-testing/','north_america','equipment','mkt import; slug=proverde-laboratories; cat=labs_testing; cadence=168h'),('Cannalysis California Cannabis Testing','https://www.cannalysis.com/coa-search','north_america','equipment','mkt import; slug=cannalysis-california; cat=labs_testing; cadence=24h'),('Digipath Labs Nevada Cannabis Testing','https://www.digipathlabs.com/test-results/','north_america','equipment','mkt import; slug=digipath-labs-nevada; cat=labs_testing; cadence=48h'),('Encore Labs California Cannabis Testing','https://www.encore-labs.com/results/','north_america','equipment','mkt import; slug=encore-labs-california; cat=labs_testing; cadence=24h'),('Green Scientific Labs Florida','https://www.greenscientificlabs.com/test-results/','north_america','equipment','mkt import; slug=green-scientific-labs-florida; cat=labs_testing; cadence=48h'),('Kaycha Labs Multi-State Cannabis Testing','https://www.kaychalabs.com/results/','north_america','equipment','mkt import; slug=kaycha-labs-multistate; cat=labs_testing; cadence=24h'),('Cannabis Science Conference','https://www.cannabisscienceconference.com/exhibitors/','north_america','equipment','mkt import; slug=cannabis-science-conference; cat=labs_testing; cadence=168h'),('Cannabis Beverage Association','https://www.cannabisbeverages.org/news/','north_america','equipment','mkt import; slug=cannabis-beverages-association; cat=product; cadence=168h'),('BevNET Cannabis and Hemp Drink Coverage','https://www.bevnet.com/category/cannabis/','north_america','equipment','mkt import; slug=bevnet-cannabis-drinks; cat=product; cadence=48h'),('420 Property — Cannabis Real Estate Marketplace','https://www.420property.com/listings/','north_america','market','mkt import; slug=420-property-cannabis; cat=business_opportunities; cadence=24h'),('CannabisBizSales — Cannabis Business Acquisitions','https://www.cannabisbizsales.com/listings/','north_america','market','mkt import; slug=cannabisbizsales; cat=distressed_businesses; cadence=24h'),('Cannabis License Exchange','https://www.cannabislicenseexchange.com','north_america','market','mkt import; slug=cannabis-license-exchange; cat=business_opportunities; cadence=48h'),('A2LA — Cannabis Testing Laboratory Accreditation','https://a2la.org/industry/cannabis/','north_america','equipment','mkt import; slug=a2la-cannabis-accreditation; cat=labs_testing; cadence=168h'),('Cannabis Bankruptcy & Receivership Tracker','https://mjbizdaily.com/tag/bankruptcy/','north_america','market','mkt import; slug=cannabis-bankruptcy-tracker; cat=distressed_businesses; cadence=24h'),('Mary — German Cannabis Trade Show','https://www.mary-expo.com','europe','market','mkt import; slug=mary-expo-germany; cat=services; cadence=168h'),('Canna Biz Conference Europe','https://www.cannabizconference.eu','europe','market','mkt import; slug=canna-biz-summit-europe; cat=services; cadence=168h'),('Cannabis Europa — Policy & Business Conference','https://www.cannabiseuropa.com','europe','market','mkt import; slug=cannabis-europa-conference; cat=services; cadence=168h'),('MedMen — Investor Relations','https://ir.medmen.com','north_america','market','mkt import; slug=medmen-ir; cat=distressed_businesses; cadence=48h'),('Eurofins Scientific — Cannabis & Hemp Testing','https://www.eurofins.com/food-testing/food-products-tested/cannabis-hemp-testing/','global','equipment','mkt import; slug=eurofins-cannabis-testing; cat=labs_testing; cadence=168h'),('SGS Group — Cannabis & Hemp Testing','https://www.sgs.com/en/industries/consumer-goods-retail/food-agri/cannabis-testing','global','equipment','mkt import; slug=sgs-cannabis-testing; cat=labs_testing; cadence=168h'),('Bureau Veritas — Cannabis & Hemp Testing','https://www.bureauveritas.com/services/testing-inspection/cannabis-testing','global','equipment','mkt import; slug=bureau-veritas-cannabis; cat=labs_testing; cadence=168h'),('Intertek Group — Cannabis & Hemp Testing','https://www.intertek.com/cannabis/','global','equipment','mkt import; slug=intertek-cannabis-testing; cat=labs_testing; cadence=168h'),('None','https://www.barneysfarm.com/seeds','europe','market','mkt import; slug=barneys-farm-seeds; cat=genetics; cadence=168h'),('Humboldt Seed Company — Genetics Catalogue','https://humboldtseeds.net/en/catalog','north_america','market','mkt import; slug=humboldt-seed-company; cat=genetics; cadence=168h'),('Ethos Genetics — Strain & Seed Catalogue','https://ethos-genetics.com/collections/seeds','north_america','market','mkt import; slug=ethos-genetics; cat=genetics; cadence=168h'),('Seed Stockers — Cannabis Seed Catalogue','https://www.seedstockers.com/en/feminised-seeds','europe','market','mkt import; slug=seed-stockers-catalogue; cat=genetics; cadence=168h'),('Fast Buds — Autoflower Genetics Catalogue','https://2fast4buds.com/seeds','europe','market','mkt import; slug=fastbuds-genetics; cat=genetics; cadence=168h'),('UFCW — Cannabis Workers Organizing','https://www.ufcw.org/cannabis/','north_america','market','mkt import; slug=ufcw-cannabis-workers; cat=professional_services; cadence=72h'),('National Cannabis Workers Coalition','https://www.cannabisworkers.org','north_america','market','mkt import; slug=cannabis-workers-coalition; cat=professional_services; cadence=168h'),('Distru — Cannabis Wholesale Ordering Platform','https://www.distru.com','north_america','market','mkt import; slug=distru-wholesale-platform; cat=cannabis_inventory; cadence=48h'),('Expocannabis Uruguay — Latin American Cannabis Exhibition','https://www.expocannabis.com.uy','latin_america','market','mkt import; slug=expocannabis-latam; cat=services; cadence=168h'),('The Cannabist Company (CBUS) — Investor Relations','https://ir.thecannabistrebrands.com','north_america','market','mkt import; slug=cannabist-company-ir; cat=business_opportunities; cadence=48h'),('Jazz Pharmaceuticals (JAZZ) — Epidiolex / GW Pharma IR','https://investor.jazzpharma.com','global','market','mkt import; slug=jazz-pharmaceuticals-ir; cat=business_opportunities; cadence=168h'),('Cookies SF — Global Cannabis Brand Intelligence','https://www.cookiessf.com/pages/stores','global','market','mkt import; slug=cookies-sf-brand; cat=cannabis_inventory; cadence=168h'),('Canix — Cannabis ERP & Track-and-Trace Platform','https://www.canix.com/blog/','north_america','market','mkt import; slug=canix-cannabis-erp; cat=professional_services; cadence=168h'),('4Front Ventures (FFNTF) — Investor Relations','https://4frontventures.com/investors/','north_america','market','mkt import; slug=4front-ventures-ir; cat=business_opportunities; cadence=168h'),('Schwazze (SHWZ) — Colorado & New Mexico Operator IR','https://www.schwazze.com/investors','north_america','market','mkt import; slug=schwazze-ir; cat=business_opportunities; cadence=168h'),('PharmaCann / Verilife — Private MSO Intelligence','https://pharmacann.com/news/','north_america','market','mkt import; slug=pharmacann-verilife; cat=business_opportunities; cadence=168h'),('Greenlane Holdings (GNLN) — Cannabis Accessories Distributor IR','https://investors.greenlane.com','north_america','market','mkt import; slug=greenlane-holdings-ir; cat=business_opportunities; cadence=168h'),('PharmaCielo (PCLO) — Colombian LP Investor Relations','https://www.pharmacielo.com/investors/','latin_america','market','mkt import; slug=pharmacielo-ir; cat=business_opportunities; cadence=168h'),('Flora Growth (FLGC) — Colombian / Global Cannabis IR','https://floragrowth.com/investor-relations/','latin_america','market','mkt import; slug=flora-growth-ir; cat=business_opportunities; cadence=168h'),('SC Labs — Cannabis Testing (California/Oregon)','https://client.sclabs.com','north_america','equipment','mkt import; slug=sc-labs-testing; cat=labs_testing; cadence=168h'),('ProVerde Laboratories — Northeast / Pharma-Grade Testing','https://www.proverdelabs.com/cannabis-testing/','north_america','equipment','mkt import; slug=proverde-laboratories; cat=labs_testing; cadence=168h'),('ILAC — International Laboratory Accreditation for Cannabis Testing','https://ilac.org/accreditation-bodies-and-laboratory-searches/','global','equipment','mkt import; slug=ilac-cannabis-lab-accreditation; cat=labs_testing; cadence=720h'),('Onfleet — Cannabis Last-Mile Delivery Platform','https://onfleet.com/blog/cannabis-delivery/','north_america','market','mkt import; slug=onfleet-cannabis-delivery; cat=logistics; cadence=168h'),('PAX Labs — Premium Vaporizer Product Intelligence','https://www.pax.com/blogs/news','global','equipment','mkt import; slug=pax-labs-products; cat=new_products; cadence=168h'),('CannaTrade Switzerland — European B2B Cannabis Exhibition','https://cannatrade.ch/en/exhibitors/','europe','market','mkt import; slug=cannatrade-switzerland; cat=professional_services; cadence=168h'),('Little Green Pharma (LGP) — ASX Cannabis LP Investor Relations','https://www.littlegreenpharma.com/investors/','asia_pacific','market','mkt import; slug=little-green-pharma-ir; cat=business_opportunities; cadence=168h'),('Cann Group (CAN) — First Australian Licensed Cannabis Producer IR','https://www.canngroup.com.au/investors/','asia_pacific','market','mkt import; slug=cann-group-ir; cat=business_opportunities; cadence=168h'),('Demecan — German Domestic Cannabis Cultivator','https://www.demecan.de/en/news/','europe','market','mkt import; slug=demecan-germany-lp; cat=business_opportunities; cadence=168h'),('Sanity Group — German Cannabis Distribution & Brands','https://www.sanitygroup.com/en/news','europe','market','mkt import; slug=sanity-group-germany; cat=business_opportunities; cadence=168h'),('Cannbit / Seach Medical Group — Israeli LP','https://www.cannbit.co.il','middle_east_africa','market','mkt import; slug=cannbit-israel-lp; cat=business_opportunities; cadence=168h'),('Rubicon Organics (ROMJ) — Certified Organic Canadian LP IR','https://www.rubiconorganics.com/investors/','north_america','market','mkt import; slug=rubicon-organics-ir; cat=business_opportunities; cadence=168h'),('Auxly Cannabis (XY) — Vaporizer & Accessories-Focused LP IR','https://auxly.com/investors/','north_america','market','mkt import; slug=auxly-cannabis-ir; cat=business_opportunities; cadence=168h'),('Surna Inc. (SRNA) — Cannabis HVAC & Climate Control IR','https://ir.surna.com','north_america','equipment','mkt import; slug=surna-inc-ir; cat=cultivation_equipment; cadence=168h'),('Fluence Bioengineering (Signify) — Cannabis LED Grow Lighting','https://fluence.science/resources/','global','equipment','mkt import; slug=fluence-bioengineering-lighting; cat=cultivation_equipment; cadence=168h'),('Women Grow — Cannabis Industry Diversity Network','https://www.womengrow.com/events/','north_america','market','mkt import; slug=women-grow-network; cat=professional_services; cadence=168h')) as v(name,url,region,ct,note) where not exists (select 1 from public.source_registry sr where hv_normalize_source_url(sr.source_url)=hv_normalize_source_url(v.url));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715130200','stage1_import_marketplace_sources_dormant','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715130200_stage1_import_marketplace_sources_dormant.sql

-- RECOVERY BEGIN 20260715150000_stage2_intel_eval_predictions.sql
-- Stage 2 (INTELLIGENCE_ARCHITECTURE_SPEC.md): the classifier validation harness.
-- Stores hv-classify predictions and grades them against the human-labelled
-- intel_eval_set. VALIDATION ONLY — nothing here touches the promotion path.
-- Additive + reversible. Rollback:
--   drop view if exists api.intel_eval_scoring;
--   drop function if exists api.intel_eval_rows_needing_prediction(text,int);
--   drop table if exists public.intel_eval_predictions;

-- Converted to a no-op stub on 2026-07-21: re-running the CREATE TABLE
-- below fails ("relation already exists"). Confirmed live via
-- information_schema.columns that public.intel_eval_predictions already
-- exists with exactly the 10 columns this file defines -- the real work
-- was already applied to production under the neighboring version
-- 20260718074506 (same filename, applied ~2.5 days later).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715150000','stage2_intel_eval_predictions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715150000_stage2_intel_eval_predictions.sql

-- RECOVERY BEGIN 20260715160000_stage2_api_views_for_classify.sql
-- Follow-up to Stage 2: hv-classify's supabase-js client uses schema 'api' (repo
-- convention — PostgREST exposes only 'api'). Expose the two new public tables via
-- api views so the function can insert into them. Reversible: drop the views.
-- Converted to a no-op stub on 2026-07-22: re-running the CREATE VIEW
-- below fails ("relation already exists"). Confirmed live via
-- information_schema.tables that both api.intel_eval_predictions and
-- api.intel_classify_review_queue already exist as views over their
-- public.* base tables -- this work was already applied to production.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715160000','stage2_api_views_for_classify','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715160000_stage2_api_views_for_classify.sql

-- RECOVERY BEGIN 20260715170000_stage3_classifier_promotion.sql
-- Stage 3 (INTELLIGENCE_ARCHITECTURE_SPEC.md): the CORRECT promotion path.
-- Replaces score-driven publishing (the inverted score_signal_from_snapshot) with
-- promotion driven by the validated Stage 2 classifier. Two invariants, enforced
-- structurally:
--   (1) PROMOTION ONLY EVER PROMOTES. The only write is reviewed false->true. No code
--       path here sets reviewed=false or deletes. (guardrail: promotion only promotes)
--   (2) VALIDATION-GATED. Publishing is DRY-RUN by default; a real publish requires an
--       explicit p_dry_run=false AND is meant to run only after the classifier clears the
--       eval-set bar (spec 6.2). Not wired to any cron. (guardrail: validate before wiring)
-- Additive + reversible. Rollback:
--   drop function if exists api.promote_classified_signals(numeric,boolean,int);
--   drop table if exists public.signal_classifications;

-- Production classifier output for the live signal pool (distinct from the 202-row
-- intel_eval_predictions, which is validation-only). Populated by hv-classify's pool run.
-- Converted to a no-op stub on 2026-07-22: re-running the CREATE TABLE
-- below fails ("relation already exists"). Confirmed live: both
-- public.signal_classifications and api.promote_classified_signals
-- already exist -- this work was already applied to production under the
-- neighboring version 20260718135702 (same filename).
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260715170000','stage3_classifier_promotion','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260715170000_stage3_classifier_promotion.sql

-- RECOVERY BEGIN 20260716195743_signals_country_iso_resolution.sql
-- Signals arrive with a free-text `country` (display name, regional aggregate, or 'Global').
-- This resolves that into a joinable ISO code + an explicit geographic scope, so the
-- signals feed can finally join public.countries (globe, country pages, tier filters).

alter table public.signals add column if not exists country_iso2 text;
alter table public.signals add column if not exists geo_scope   text;
alter table public.signals add column if not exists geo_region  text;

comment on column public.signals.country_iso2 is 'Resolved ISO alpha-2. NULL for region/global/unresolved signals. Set by trg_signals_resolve_geo.';
comment on column public.signals.geo_scope   is 'country | region | global | unknown. Explicit scope so supra-national signals are not silently dropped from country views.';
comment on column public.signals.geo_region  is 'For scope=region (and denormalised for scope=country): matches public.countries.region taxonomy.';

create table if not exists public.signal_geo_labels (
  label      text primary key,
  scope      text not null check (scope in ('region','global')),
  region     text,
  created_at timestamptz not null default now()
);
comment on table public.signal_geo_labels is 'Maps supra-national signal `country` labels (Europe, LATAM, Global...) to a scope and, where applicable, a public.countries.region value.';

insert into public.signal_geo_labels (label, scope, region) values
  ('Global','global',null),
  ('Europe','region','Europe'),
  ('European Union','region','Europe'),
  ('Eastern Europe/Central Asia','region','Europe'),
  ('LATAM','region','Americas'),
  ('Caribbean','region','Americas'),
  ('Africa','region','Africa'),
  ('Asia','region','Asia'),
  ('Middle East','region','Asia'),
  ('Pacific','region','Oceania')
on conflict (label) do nothing;

create or replace function public.resolve_signal_geo(p_country text)
returns table (iso text, scope text, region text)
language sql
stable
security definer
set search_path to ''
as $$
  with input as (select nullif(btrim(coalesce(p_country,'')), '') as raw),
  direct as (
    select c.iso_alpha2 as iso, 'country'::text as scope, c.region
    from public.countries c, input i
    where lower(c.country_name) = lower(i.raw)
    limit 1
  ),
  via_alias as (
    select c.iso_alpha2 as iso, 'country'::text as scope, c.region
    from public.country_name_aliases a
    join public.countries c on lower(c.country_name) = lower(a.canonical_name)
    , input i
    where lower(a.alias) = lower(i.raw)
    limit 1
  ),
  supra as (
    select null::text as iso, g.scope, g.region
    from public.signal_geo_labels g, input i
    where lower(g.label) = lower(i.raw)
    limit 1
  )
  select * from direct
  union all select * from via_alias where not exists (select 1 from direct)
  union all select * from supra
    where not exists (select 1 from direct) and not exists (select 1 from via_alias)
  union all select null::text, 'unknown'::text, null::text
    where not exists (select 1 from direct)
      and not exists (select 1 from via_alias)
      and not exists (select 1 from supra)
      and exists (select 1 from input where raw is not null);
$$;

comment on function public.resolve_signal_geo(text) is
  'Resolves a free-text signal country label to {iso, scope, region}. Returns no row for NULL/blank input.';

create or replace function public.signals_resolve_geo()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_iso text; v_scope text; v_region text;
begin
  if new.country is null or btrim(new.country) = '' then
    new.country_iso2 := null;
    new.geo_scope    := 'unknown';
    new.geo_region   := null;
    return new;
  end if;

  select r.iso, r.scope, r.region into v_iso, v_scope, v_region
  from public.resolve_signal_geo(new.country) r limit 1;

  new.country_iso2 := v_iso;
  new.geo_scope    := coalesce(v_scope, 'unknown');
  new.geo_region   := v_region;
  return new;
end;
$$;

drop trigger if exists trg_signals_resolve_geo on public.signals;
create trigger trg_signals_resolve_geo
before insert or update of country on public.signals
for each row execute function public.signals_resolve_geo();

-- Backfill existing rows (correlated subquery: UPDATE..FROM LATERAL cannot see the target table).
update public.signals s
set (country_iso2, geo_scope, geo_region) = (
  select r.iso, coalesce(r.scope,'unknown'), r.region
  from public.resolve_signal_geo(s.country) r limit 1
)
where s.country is not null and btrim(s.country) <> '';

update public.signals
set country_iso2 = null, geo_scope = 'unknown', geo_region = null
where country is null or btrim(country) = '';

create index if not exists idx_signals_iso_date    on public.signals (country_iso2, date desc) where country_iso2 is not null;
create index if not exists idx_signals_scope_date  on public.signals (geo_scope, date desc);
create index if not exists idx_signals_region_date on public.signals (geo_region, date desc) where geo_region is not null;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716195743','signals_country_iso_resolution','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716195743_signals_country_iso_resolution.sql

-- RECOVERY BEGIN 20260716200328_add_capital_markets_deal_tracker.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260716200328.
--
-- Rewriting this file cannot affect production: 20260716200328 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- ADR #20: Capital markets / deal-tracker layer
-- Closes competitive gap vs Viridian Capital Advisors (Cannabis Deal Tracker) and
-- Cannabiz Intelligence (M&A targeting/valuations). No fictional/seed data inserted —
-- schema only, to be populated via verified intake (analyst entry or sourced pipeline),
-- consistent with the supplier-seeding policy (no synthetic records in production tables).

create table if not exists public.deal_investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  investor_type text not null check (investor_type in
    ('vc','private_equity','family_office','corporate','institutional','individual','investment_bank','other')),
  hq_country_iso2 text,
  focus_areas text[],
  website text,
  notes text,
  source_name text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_capital_raises (
  id uuid primary key default gen_random_uuid(),
  company_operator_id uuid references public.cannabis_operators(id),
  company_name text not null,
  country_iso2 text,
  round_type text check (round_type in
    ('seed','series_a','series_b','series_c','series_d_plus','debt','convertible_note',
     'private_placement','public_offering','grant','other')),
  amount_usd numeric,
  amount_raw numeric,
  amount_currency text,
  announced_date date,
  closed_date date,
  deal_status text not null default 'announced' check (deal_status in
    ('announced','closed','withdrawn','rumored')),
  use_of_proceeds text,
  source_name text,
  source_url text,
  confidence text not null default 'reported' check (confidence in ('confirmed','reported','estimated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_ma_transactions (
  id uuid primary key default gen_random_uuid(),
  acquirer_operator_id uuid references public.cannabis_operators(id),
  acquirer_name text not null,
  target_operator_id uuid references public.cannabis_operators(id),
  target_name text not null,
  transaction_type text check (transaction_type in
    ('acquisition','merger','asset_purchase','license_acquisition','majority_stake',
     'minority_stake','reverse_merger','other')),
  country_iso2 text,
  deal_value_usd numeric,
  deal_value_raw numeric,
  deal_value_currency text,
  consideration_type text check (consideration_type in
    ('cash','stock','cash_and_stock','earnout','undisclosed')),
  announced_date date,
  closed_date date,
  deal_status text not null default 'announced' check (deal_status in
    ('announced','pending','closed','terminated','rumored')),
  source_name text,
  source_url text,
  confidence text not null default 'reported' check (confidence in ('confirmed','reported','estimated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_participants (
  id uuid primary key default gen_random_uuid(),
  capital_raise_id uuid references public.deal_capital_raises(id) on delete cascade,
  investor_id uuid references public.deal_investors(id),
  investor_name text not null,
  role text not null default 'participant' check (role in ('lead','co_lead','participant','advisor')),
  created_at timestamptz not null default now()
);

create index if not exists idx_deal_capital_raises_country on public.deal_capital_raises(country_iso2);
create index if not exists idx_deal_capital_raises_date on public.deal_capital_raises(announced_date);
create index if not exists idx_deal_capital_raises_company on public.deal_capital_raises(company_name);
create index if not exists idx_deal_ma_country on public.deal_ma_transactions(country_iso2);
create index if not exists idx_deal_ma_date on public.deal_ma_transactions(announced_date);
create index if not exists idx_deal_ma_acquirer on public.deal_ma_transactions(acquirer_name);
create index if not exists idx_deal_ma_target on public.deal_ma_transactions(target_name);
create index if not exists idx_deal_participants_raise on public.deal_participants(capital_raise_id);
create index if not exists idx_deal_participants_investor on public.deal_participants(investor_id);

alter table public.deal_investors enable row level security;
alter table public.deal_capital_raises enable row level security;
alter table public.deal_ma_transactions enable row level security;
alter table public.deal_participants enable row level security;

-- Public-reference read pattern, matching market_metrics/trade_flows convention.
create policy deal_investors_public_read on public.deal_investors for select using (true);
create policy deal_capital_raises_public_read on public.deal_capital_raises for select using (true);
create policy deal_ma_transactions_public_read on public.deal_ma_transactions for select using (true);
create policy deal_participants_public_read on public.deal_participants for select using (true);

create policy deal_investors_service_write on public.deal_investors for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_capital_raises_service_write on public.deal_capital_raises for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_ma_transactions_service_write on public.deal_ma_transactions for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_participants_service_write on public.deal_participants for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- api schema PostgREST-exposed views (plain SELECT, per established convention)
create or replace view api.deal_investors as select * from public.deal_investors;
create or replace view api.deal_capital_raises as select * from public.deal_capital_raises;
create or replace view api.deal_ma_transactions as select * from public.deal_ma_transactions;
create or replace view api.deal_participants as select * from public.deal_participants;

create or replace view api.deal_activity_by_country as
select
  country_iso2,
  extract(year from announced_date)::int as year,
  count(*) filter (where source = 'capital_raise') as capital_raise_count,
  sum(amount_usd) filter (where source = 'capital_raise') as capital_raised_usd,
  count(*) filter (where source = 'ma') as ma_transaction_count,
  sum(deal_value_usd) filter (where source = 'ma') as ma_value_usd
from (
  select country_iso2, announced_date, amount_usd, null::numeric as deal_value_usd, 'capital_raise' as source
  from public.deal_capital_raises
  union all
  select country_iso2, announced_date, null::numeric as amount_usd, deal_value_usd, 'ma' as source
  from public.deal_ma_transactions
) combined
group by country_iso2, extract(year from announced_date);

grant select on api.deal_investors, api.deal_capital_raises, api.deal_ma_transactions,
  api.deal_participants, api.deal_activity_by_country to anon, authenticated;
grant select, insert, update, delete on
  public.deal_investors, public.deal_capital_raises, public.deal_ma_transactions, public.deal_participants
  to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716200328','add_capital_markets_deal_tracker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716200328_add_capital_markets_deal_tracker.sql

-- RECOVERY BEGIN 20260716200514_signals_scored_visibility_gate.sql
-- Signal visibility: replace the binary `reviewed` gate with a scored gate.
--
-- Why: crawler inflow ~5,874/month vs human review ~95/month (62x mismatch) meant RLS
-- exposed only 170 of 7,840 signals to any non-admin user. The feed was invisible.
--
-- Model now:
--   anon + authenticated : score >= 60          (the product)
--   anon + authenticated : OR reviewed = true   (editorial badge; keeps hand-picked sub-60 items)
--   admin/operator/analyst : everything         (unchanged)
--   country_intel / digests remain the paid tier (unchanged, gated on user_profiles.tier)
--
-- NOTE ON SCALE: `signals.score` is 0-100 (observed range 15-99), NOT 0-10. The previous
-- policy's `score >= 6` therefore admitted 100% of rows and was dead code -- it was only
-- masked by the `reviewed = true` conjunct. Any future threshold MUST be on the 0-100 scale.

drop policy if exists signals_anon_high_quality on public.signals;

create policy signals_public_scored_select
  on public.signals
  for select
  to anon, authenticated
  using (score >= 60);

comment on policy signals_public_scored_select on public.signals is
  'Public signal gate: score >= 60 on the 0-100 scale. Replaced the dead score>=6 filter (0-10 assumption). OR-ed with signals_public_reviewed_select.';

-- Supports the gate + the country-page ordering pattern.
create index if not exists idx_signals_score_date on public.signals (score desc, date desc);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716200514','signals_scored_visibility_gate','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716200514_signals_scored_visibility_gate.sql

-- RECOVERY BEGIN 20260716205005_extend_quality_gate_to_gazette_category.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260716205005.
--
-- Rewriting this file cannot affect production: 20260716205005 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- GAZETTE has the identical profile to SOURCE_ENGINE (automated
-- government-portal extraction, same keyword-density-gaming failure mode)
-- but was never gated -- reviewed=true unconditionally on all 24 rows,
-- same as every non-SOURCE_ENGINE category, regardless of content quality.
-- Reviewed all 24 directly: score >= 70 is exclusively real headlines
-- (Jamaica hemp legislation, Mexico COFEPRIS); everything below is site
-- nav menus, portal homepage titles ("Frontpage | The Cannabis Licensing
-- Authority of Jamaica"), and in one case a fabricated date (2045),
-- confirming this is the same nav-chrome pollution pattern found in
-- SOURCE_ENGINE, just concentrated at a lower score range because
-- government portals are almost entirely nav-structured.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE (cat NOT IN ('SOURCE_ENGINE','GAZETTE'))
   OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90)
   OR (cat = 'GAZETTE' AND score >= 70);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716205005','extend_quality_gate_to_gazette_category','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716205005_extend_quality_gate_to_gazette_category.sql

-- RECOVERY BEGIN 20260716205117_add_signal_analysis_layer.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260716205117.
--
-- Rewriting this file cannot affect production: 20260716205117 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Adds the per-signal analysis layer: what changed, who's affected,
-- deadline if any, recommended action. This is what actually makes a
-- signal commercially useful vs a bare headline -- the gap identified
-- from live screenshots of the Mexico Intel tab (72% confidence next to
-- a vague headline, no synthesis, no "so what").
--
-- Structured as JSONB rather than separate columns for iteration speed;
-- can be normalized into columns later if query patterns demand it.
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS analysis JSONB,
  ADD COLUMN IF NOT EXISTS analysis_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis_backend TEXT;

COMMENT ON COLUMN public.signals.analysis IS
  'LLM-generated synthesis: {what_changed, who_is_affected, deadline, recommended_action, confidence_rationale}. Generated by the hv-signal-analysis Edge Function, run over reviewed=true signals lacking analysis. Null means not yet analyzed.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716205117','add_signal_analysis_layer','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716205117_add_signal_analysis_layer.sql

-- RECOVERY BEGIN 20260716205128_create_hv_signal_analysis_function_stub.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260716205128.
--
-- Rewriting this file cannot affect production: 20260716205128 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260716205128','create_hv_signal_analysis_function_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260716205128_create_hv_signal_analysis_function_stub.sql

-- RECOVERY BEGIN 20260718020048_stage1_add_content_type_to_source_registry.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260718020048.
--
-- Rewriting this file cannot affect production: 20260718020048 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Stage 1 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md: unified source registry.
-- Decision (owner-approved): EXTEND the existing live source_registry (1,471 rows,
-- already has language/tier/country/cadence) in place rather than create a new
-- intel_sources table — avoids spawning a third parallel estate, honoring the
-- spec's "one registry" principle. This migration adds ONLY the missing dimension:
-- content_type[] (the routing dimension). No backfill, no behavior change here.
-- Verified safe: source-engine-fetch crawls only is_active=true AND
-- relevance_status='active' rows, so this nullable column changes nothing until
-- populated. Additive + reversible. Rollback:
--   alter table public.source_registry drop column content_type;

alter table public.source_registry
  add column if not exists content_type text[];

comment on column public.source_registry.content_type is
  'Stage 1 routing dimension: one or more of regulatory|market|story|equipment|research. Drives Signals/Digest/Market routing (spec 4.3). NULL = not yet classified.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718020048','stage1_add_content_type_to_source_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718020048_stage1_add_content_type_to_source_registry.sql

-- RECOVERY BEGIN 20260718074506_stage2_intel_eval_predictions.sql
-- Restore the exact production-owned body for migration 20260718074506.
-- The previous stub omitted public.intel_eval_predictions and
-- public.intel_classify_review_queue, which 20260720200000 dereferences.

create table public.intel_eval_predictions (
  id            uuid primary key default gen_random_uuid(),
  run_id        text not null,
  signal_id     text not null references public.signals(id) on delete cascade,
  quality_label text not null check (quality_label in ('signal','boilerplate','spam','nav','duplicate')),
  content_type  text check (content_type in ('regulatory','market','story','research','noise')),
  impact        text check (impact in ('high','medium','low')),
  confidence    double precision,
  reason        text,
  model         text,
  created_at    timestamptz not null default now(),
  unique (run_id, signal_id)
);
alter table public.intel_eval_predictions enable row level security;
comment on table public.intel_eval_predictions is
  'Stage 2: hv-classify outputs, graded against intel_eval_set. Validation only; never drives promotion.';
create index intel_eval_predictions_run_idx on public.intel_eval_predictions (run_id);

create function api.intel_eval_rows_needing_prediction(p_run_id text, p_limit int default 250)
returns table (signal_id text, headline text, summary text)
language sql security definer set search_path = public, pg_temp
as $$
  select e.signal_id, s.headline, s.summary
  from public.intel_eval_set e
  join public.signals s on s.id = e.signal_id
  where not exists (select 1 from public.intel_eval_predictions p where p.run_id = p_run_id and p.signal_id = e.signal_id)
  order by e.sample_stratum, e.signal_id
  limit p_limit;
$$;

create view api.intel_eval_scoring as
with graded as (
  select p.run_id, p.signal_id, p.quality_label as pred_quality, p.content_type as pred_content,
    case when e.label_status in ('confirmed','corrected') then e.quality_label else e.draft_quality_label end as truth_quality,
    case when e.label_status in ('confirmed','corrected') then e.content_type else e.draft_content_type end as truth_content,
    (e.label_status in ('confirmed','corrected')) as is_human_truth
  from public.intel_eval_predictions p join public.intel_eval_set e on e.signal_id = p.signal_id
)
select run_id, count(*) as n, count(*) filter (where is_human_truth) as n_human_truth,
  round(avg((pred_quality = truth_quality)::int)::numeric, 3) as quality_accuracy,
  count(*) filter (where pred_quality='signal' and truth_quality='signal') as tp_signal,
  count(*) filter (where pred_quality='signal' and truth_quality<>'signal') as fp_signal,
  count(*) filter (where pred_quality<>'signal' and truth_quality='signal') as fn_signal,
  round((count(*) filter (where pred_quality='signal' and truth_quality='signal'))::numeric / nullif(count(*) filter (where pred_quality='signal'),0), 3) as signal_precision,
  round((count(*) filter (where pred_quality='signal' and truth_quality='signal'))::numeric / nullif(count(*) filter (where truth_quality='signal'),0), 3) as signal_recall,
  round(avg((pred_content = truth_content)::int) filter (where truth_quality='signal' and pred_quality='signal')::numeric, 3) as content_type_accuracy_on_signals
from graded group by run_id;
comment on view api.intel_eval_scoring is 'Stage 2 gate metrics per classifier run. Human-truth-weighted; provisional vs drafts until labelled. spec §6.2.';

revoke all on api.intel_eval_scoring from public;
revoke all on function api.intel_eval_rows_needing_prediction(text,int) from public;
grant select on api.intel_eval_scoring to service_role;
grant execute on function api.intel_eval_rows_needing_prediction(text,int) to service_role;
grant select, insert on public.intel_eval_predictions to service_role;

create table public.intel_classify_review_queue (
  signal_id  text primary key references public.signals(id) on delete cascade,
  headline   text, summary text, reason text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.intel_classify_review_queue enable row level security;
comment on table public.intel_classify_review_queue is 'Stage 2 manual-review fallback: signals no LLM provider could classify. Populated by hv-classify.';
grant select, insert, update on public.intel_classify_review_queue to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718074506','stage2_intel_eval_predictions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718074506_stage2_intel_eval_predictions.sql

-- RECOVERY BEGIN 20260718075738_create_signal_analysis_rpc_functions.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260718075738.
--
-- Rewriting this file cannot affect production: 20260718075738 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Workaround for a PostgREST schema-cache lag on the newly-added analysis
-- columns (NOTIFY pgrst reload + a DDL comment both failed to make the
-- REST API recognize them after multiple attempts). RPC functions access
-- columns via direct SQL inside the function body, not through PostgREST's
-- per-column REST introspection, so this sidesteps the cache issue
-- entirely regardless of its root cause.

CREATE OR REPLACE FUNCTION public.get_signals_pending_analysis(p_limit INT DEFAULT 20, p_signal_id TEXT DEFAULT NULL)
RETURNS TABLE(id TEXT, date TIMESTAMPTZ, cat TEXT, headline TEXT, summary TEXT, source TEXT, country TEXT, score INT, verification TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_signal_analysis(p_signal_id TEXT, p_analysis JSONB, p_backend TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;

COMMENT ON FUNCTION public.get_signals_pending_analysis IS 'Used by the hv-signal-analysis Edge Function to fetch reviewed signals lacking analysis. RPC-based to sidestep a PostgREST column-cache lag on the analysis columns.';
COMMENT ON FUNCTION public.save_signal_analysis IS 'Used by the hv-signal-analysis Edge Function to write generated analysis back to a signal.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718075738','create_signal_analysis_rpc_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718075738_create_signal_analysis_rpc_functions.sql

-- RECOVERY BEGIN 20260718080010_move_signal_analysis_rpcs_to_api_schema.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260718080010.
--
-- Rewriting this file cannot affect production: 20260718080010 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Root cause finally found: this project's PostgREST only exposes the
-- 'api' and 'graphql_public' schemas (confirmed directly: "Only the
-- following schemas are exposed: api, graphql_public"). public is NOT
-- reachable via REST at all, under any header combination. This matches
-- and explains the api-schema-views architecture found and fixed for RLS
-- earlier this session -- the whole app's REST surface goes through api,
-- never public directly.
--
-- Moving these RPC functions into api (rather than public) so they're
-- actually callable via PostgREST. The function bodies still reach
-- public.signals via schema-qualified SQL internally.

DROP FUNCTION IF EXISTS public.get_signals_pending_analysis(INT, TEXT);
DROP FUNCTION IF EXISTS public.save_signal_analysis(TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION api.get_signals_pending_analysis(p_limit INT DEFAULT 20, p_signal_id TEXT DEFAULT NULL)
RETURNS TABLE(id TEXT, date TIMESTAMPTZ, cat TEXT, headline TEXT, summary TEXT, source TEXT, country TEXT, score INT, verification TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.country, s.score, s.verification
  FROM public.signals s
  WHERE s.reviewed = true
    AND s.analysis IS NULL
    AND s.headline IS NOT NULL
    AND (p_signal_id IS NULL OR s.id = p_signal_id)
  ORDER BY s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION api.save_signal_analysis(p_signal_id TEXT, p_analysis JSONB, p_backend TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals
  SET analysis = p_analysis,
      analysis_generated_at = now(),
      analysis_backend = p_backend
  WHERE id = p_signal_id;
  RETURN FOUND;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.get_signals_pending_analysis TO service_role;
GRANT EXECUTE ON FUNCTION api.save_signal_analysis TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718080010','move_signal_analysis_rpcs_to_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718080010_move_signal_analysis_rpcs_to_api_schema.sql

-- RECOVERY BEGIN 20260718080340_expose_operator_licences_intel_tier.sql
-- Extends the same pattern as 20260714192255 to the competitor/operator
-- side: operator_licences (licence_class, gmp_certified, gacp_certified,
-- authorized_activities per named company) existed with zero api exposure
-- and a fully-public RLS policy, same as regulatory_pathways was.
--
-- cannabis_operators itself (the base company listing: name, type, country)
-- is already live and public -- shown today in MarketplacePage's "Verified
-- Operators" sidebar. That stays public. What's gated here is the specific
-- competitive intelligence layer on top of it: which licence class, GMP/GACP
-- certification, authorized activities -- the detail that turns "this
-- company exists" into "this company is a verified, certified match for
-- this exact corridor."
--
-- operator_countries (bare presence: headquarters/subsidiary/distribution)
-- stays public too -- lower incremental value to gate, since
-- cannabis_operators.country_iso2 already discloses primary-country
-- presence today.

drop policy if exists public_select_operator_licences on public.operator_licences;
create policy operator_licences_tier_read on public.operator_licences
  for select
  using (public.current_user_tier() in ('intel','operator'));

revoke select on public.operator_licences from anon;
grant select on public.operator_licences to authenticated;

create or replace view api.operator_licences
with (security_invoker = true) as
select id, operator_id, licence_class, issuing_regulator, authorized_activities,
       licence_status, gmp_certified, gacp_certified, facility_city,
       facility_province_state, last_verified
from public.operator_licences;

grant select on api.operator_licences to authenticated;

-- operator_countries had zero api exposure at all (found via
-- get_tables_missing_from_api_schema), same gap as product_formats had.
create or replace view api.operator_countries
with (security_invoker = true) as
select id, operator_id, country_iso2, presence_type
from public.operator_countries;

grant select on api.operator_countries to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718080340','expose_operator_licences_intel_tier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718080340_expose_operator_licences_intel_tier.sql

-- RECOVERY BEGIN 20260718124230_add_workspaces_select_policy.sql
-- ADR follow-up to #21: workspaces had RLS enabled with zero SELECT policies —
-- meaning even an org's own owner/members could never read their own workspace
-- row client-side (only service_role could). Uses the same hv_is_org_member /
-- hv_is_platform_staff helpers already used for hv_passports, for consistency.

-- Replay guard. In production this policy did not exist when this migration
-- ran, so the CREATE was unconditional. Zero-state replay differs:
-- 20260611103000_workspace_foundation_replay.sql, a repository-only
-- reconciliation migration with no ledger entry, already creates a policy of
-- the same name on the same table five weeks earlier in replay order, so the
-- unguarded CREATE fails with:
--   policy "workspaces_member_select" for table "workspaces"
--   already exists (SQLSTATE 42710)
-- The definition below still wins, and it is identical to the earlier one.
drop policy if exists workspaces_member_select on public.workspaces;

create policy workspaces_member_select on public.workspaces
  for select
  using (hv_is_org_member(id) or hv_is_platform_staff());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718124230','add_workspaces_select_policy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718124230_add_workspaces_select_policy.sql

-- RECOVERY BEGIN 20260718135702_stage3_classifier_promotion.sql
-- Restore the exact production-owned body for migration 20260718135702.
-- The previous stub omitted public.signal_classifications, which later
-- migrations depend on.

create table public.signal_classifications (
  id            uuid primary key default gen_random_uuid(),
  signal_id     text not null references public.signals(id) on delete cascade,
  quality_label text not null check (quality_label in ('signal','boilerplate','spam','nav','duplicate')),
  content_type  text check (content_type in ('regulatory','market','story','research','noise')),
  impact        text check (impact in ('high','medium','low')),
  confidence    double precision,
  model         text,
  created_at    timestamptz not null default now()
);
alter table public.signal_classifications enable row level security;
comment on table public.signal_classifications is
  'Stage 3: hv-classify output for the live signal pool. Drives promotion via api.promote_classified_signals. Latest row per signal wins.';
create index signal_classifications_signal_idx on public.signal_classifications (signal_id, created_at desc);
grant select, insert on public.signal_classifications to service_role;

create function api.promote_classified_signals(
  p_min_confidence numeric default 0.70,
  p_dry_run        boolean default true,
  p_limit          int     default 500
)
returns table (candidate_count bigint, promoted bigint, dry_run boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_candidates bigint; v_promoted bigint := 0;
begin
  create temporary table _promote_batch on commit drop as
  select distinct on (c.signal_id) c.signal_id, c.content_type, c.confidence
  from public.signal_classifications c
  join public.signals s on s.id = c.signal_id
  where s.reviewed = false and c.quality_label = 'signal'
    and coalesce(c.confidence, 0) >= p_min_confidence
  order by c.signal_id, c.created_at desc
  limit p_limit;

  select count(*) into v_candidates from _promote_batch;
  if p_dry_run then
    return query select v_candidates, 0::bigint, true; return;
  end if;

  update public.signals s set
    reviewed = true,
    top_lane = case b.content_type when 'regulatory' then 'Regulatory'
                 when 'market' then 'Economic' else 'Trade' end,
    action = 'Promoted by classifier (Stage 3)'
  from _promote_batch b
  where s.id = b.signal_id and s.reviewed = false;
  get diagnostics v_promoted = row_count;
  return query select v_candidates, v_promoted, false;
end;
$$;
comment on function api.promote_classified_signals is
  'Stage 3 promotion. Publishes classifier-confirmed signals above p_min_confidence. DRY-RUN default; only ever promotes; not wired to cron. spec §6.2/§10.';
revoke all on function api.promote_classified_signals(numeric,boolean,int) from public;
grant execute on function api.promote_classified_signals(numeric,boolean,int) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718135702','stage3_classifier_promotion','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718135702_stage3_classifier_promotion.sql

-- RECOVERY BEGIN 20260718184353_playbook_null_fabricated_timelines.sql
-- Root cause: typical_timeline_months is NOT NULL, so every playbook was forced to carry a
-- number even when the timeline is unknown -- producing placeholder 0s and blanket 12s that
-- render as fabricated fact. Allow "unknown", then strip the placeholders.
-- Conservative: only removes values that are unambiguously not real; anything with evidence
-- (source_id OR a substantive confidence_label) keeps its timeline.
--
-- This file's SQL matches what was actually applied directly to production via
-- apply_migration (version 20260718184353) -- see PR #1076. An earlier stub
-- ("SELECT 1; no DDL executed by this file") landed on main from a separate
-- migration-drift reconciliation pass that didn't have the real SQL text
-- available at the time; replaced here with the authoritative content.

alter table public.jurisdiction_playbooks alter column typical_timeline_months drop not null;

comment on column public.jurisdiction_playbooks.typical_timeline_months is
  'Estimated months to market entry. NULL = not yet assessed (do not display a number). Never store 0 as a placeholder.';

-- (1) "0 months" is a null-placeholder displayed as fact. Never valid. Remove everywhere.
update public.jurisdiction_playbooks
set typical_timeline_months = null
where typical_timeline_months = 0;

-- (2) Untouched templated defaults: draft, zero evidence, blanket 12-month placeholder, no cost.
update public.jurisdiction_playbooks
set typical_timeline_months = null
where status = 'draft'
  and source_id is null
  and confidence_label is null
  and typical_timeline_months = 12
  and estimated_cost_range is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718184353','playbook_null_fabricated_timelines','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718184353_playbook_null_fabricated_timelines.sql

-- RECOVERY BEGIN 20260718191722_create_engine_review_queue_api_rpcs.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260718191722.
--
-- Rewriting this file cannot affect production: 20260718191722 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fixes the same root-cause bug found in hv-signal-analysis: the engine
-- review queue (lib/signals-engine/admin.ts, built earlier this session)
-- makes raw REST calls to /rest/v1/signals with no schema qualification.
-- Since public is not an exposed PostgREST schema for this project (only
-- api and graphql_public are), those calls have been silently failing in
-- production the whole time -- the queue page has never actually worked.
-- These RPC functions, in the api schema, are the fix.

CREATE OR REPLACE FUNCTION api.list_engine_review_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0, p_limit INT DEFAULT 50)
RETURNS TABLE(id TEXT, date TIMESTAMPTZ, cat TEXT, headline TEXT, summary TEXT, source TEXT, url TEXT, verification TEXT, tier TEXT, lang TEXT, country TEXT, score INT, reviewed BOOLEAN, action TEXT, reviewed_by TEXT, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.date, s.cat, s.headline, s.summary, s.source, s.url, s.verification, s.tier, s.lang, s.country, s.score, s.reviewed, s.action, s.reviewed_by, s.reviewed_at, s.created_at
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY s.score DESC NULLS LAST, s.date DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION api.count_engine_review_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE'
    AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION api.list_engine_review_countries()
RETURNS TABLE(country TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT s.country FROM public.signals s
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.country IS NOT NULL
  ORDER BY s.country ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION api.approve_engine_signal(p_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.reject_engine_signal(p_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  UPDATE public.signals SET reviewed = false, action = 'rejected', reviewed_by = p_user_id, reviewed_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION api.bulk_approve_engine_queue(p_country TEXT DEFAULT NULL, p_min_score INT DEFAULT 0, p_user_id TEXT DEFAULT NULL)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE v_count INT;
BEGIN
  UPDATE public.signals s SET reviewed = true, action = 'approved', reviewed_by = p_user_id, reviewed_at = now()
  WHERE s.cat = 'SOURCE_ENGINE' AND s.reviewed IS NOT TRUE
    AND (s.action IS NULL OR s.action <> 'rejected')
    AND s.score >= p_min_score
    AND (p_country IS NULL OR s.country = p_country);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

GRANT EXECUTE ON FUNCTION api.list_engine_review_queue TO service_role;
GRANT EXECUTE ON FUNCTION api.count_engine_review_queue TO service_role;
GRANT EXECUTE ON FUNCTION api.list_engine_review_countries TO service_role;
GRANT EXECUTE ON FUNCTION api.approve_engine_signal TO service_role;
GRANT EXECUTE ON FUNCTION api.reject_engine_signal TO service_role;
GRANT EXECUTE ON FUNCTION api.bulk_approve_engine_queue TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718191722','create_engine_review_queue_api_rpcs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718191722_create_engine_review_queue_api_rpcs.sql

-- RECOVERY BEGIN 20260718200000_signal_analysis_layer_and_postgrest_schema_fix_stub.sql
-- Applied directly to production via Supabase MCP (Jul 18 2026 session).
-- Covers everything from this turn: the GAZETTE quality gate extension,
-- the new per-signal analysis layer, and a critical schema-exposure fix
-- discovered while building it.
--
-- 1. GAZETTE quality gate: reviewed=true was unconditional on every
--    non-SOURCE_ENGINE category, including GAZETTE -- an automated
--    government-portal extraction pathway with the identical nav-menu-
--    pollution failure mode as SOURCE_ENGINE, just never gated. Reviewed
--    all 24 rows directly: score >= 70 is exclusively real headlines
--    (Jamaica hemp legislation, Mexico COFEPRIS); everything below is
--    site nav menus, portal homepage titles, and one fabricated date
--    (2045). signals_quality now gates GAZETTE the same way.
--
-- 2. Signal analysis layer: added analysis/analysis_generated_at/
--    analysis_backend columns to public.signals. New hv-signal-analysis
--    Edge Function (Claude Haiku 4.5 primary, Gemini then OpenAI
--    fallback -- reusing hv-extract's exact multi-provider pattern)
--    generates what_changed / who_is_affected / deadline /
--    recommended_action / confidence_rationale for every reviewed=true
--    signal lacking analysis. Wired into pg_cron every 30 min
--    (hv-signal-analysis-every-30min). First batch: 16 signals analyzed
--    live, 0 failures, verified against the actual Mexico COFEPRIS
--    signal from live product screenshots.
--
-- 3. CRITICAL DISCOVERY: this project's PostgREST only exposes the `api`
--    and `graphql_public` schemas -- confirmed directly via a 406
--    response: "Only the following schemas are exposed: api,
--    graphql_public". `public` is NOT reachable via REST under any
--    header combination. This silently broke two things:
--      a) The hv-signal-analysis Edge Function's initial raw REST calls
--         to /rest/v1/signals (caught before ever going live -- fixed
--         during this same build by moving to api-schema RPC functions).
--      b) The engine review queue (lib/signals-engine/admin.ts, built
--         earlier this session) -- its raw /rest/v1/signals calls have
--         been silently failing in production the entire time it's
--         existed. Fixed in the same commit as this migration by adding
--         api-schema RPC functions (list_engine_review_queue,
--         approve_engine_signal, reject_engine_signal,
--         bulk_approve_engine_queue, count_engine_review_queue,
--         list_engine_review_countries) and rewriting admin.ts to call
--         them instead of raw table REST paths.
--    All RPC functions (get_signals_pending_analysis, save_signal_analysis,
--    and the six engine-review-queue ones) live in the `api` schema with
--    SECURITY DEFINER + SET search_path=public, reaching public.signals
--    via schema-qualified SQL inside the function body -- sidesteps the
--    REST exposure restriction entirely regardless of its root cause.
--    Every RPC verified directly via net.http_post before being wired
--    into application code.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260718200000','signal_analysis_layer_and_postgrest_schema_fix_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260718200000_signal_analysis_layer_and_postgrest_schema_fix_stub.sql

-- RECOVERY BEGIN 20260719014123_expose_regulatory_pending_changes_teaser_feed.sql
-- Partially-public feed for regulatory_pending_changes (previously dark: no api path).
-- Teaser (always visible): country, change_type, entity_type, confidence, coarse year,
--   and that details exist + whether they're locked. Drives signups.
-- Specifics (current/expected value, note, exact effective date, source) gated to intel/operator.
--
-- Resolution note (merge conflict, 2026-07-20): a separate concurrent session's
-- migration-ledger reconciliation pass created a stub version of this same
-- filename ("Applied directly to production... No DDL executed. SELECT 1;")
-- without the real function body. This version is the real, live-verified
-- function -- confirmed via pg_get_functiondef against production to match
-- exactly what is currently deployed. Kept over the stub.

create or replace function api.regulatory_pending_changes_feed()
returns table (
  id uuid, country_iso2 text, change_type text, entity_type text, confidence text,
  timeframe_hint text, has_details boolean, locked boolean,
  current_value text, expected_value text, expected_note text,
  expected_effective_date date, source_url text
)
language plpgsql stable security definer set search_path to ''
as $function$
declare v_paid boolean;
begin
  v_paid := exists (select 1 from public.user_profiles up
    where up.id = (select auth.uid()) and up.tier = any(array['intel','operator']));
  return query
  select
    r.id,
    (select rp.iso_alpha2 from public.regulatory_pathways rp where rp.id = r.entity_id),
    r.change_type::text, r.entity_type::text, r.confidence::text,
    case when r.expected_effective_date is not null then to_char(r.expected_effective_date,'YYYY') else null end,
    (r.expected_value is not null or nullif(btrim(coalesce(r.expected_note,'')),'') is not null),
    (not v_paid),
    case when v_paid then r.current_value end,
    case when v_paid then r.expected_value end,
    case when v_paid then r.expected_note end,
    case when v_paid then r.expected_effective_date end,
    case when v_paid then r.source_url end
  from public.regulatory_pending_changes r
  where r.status::text is distinct from 'retracted'
  order by case r.confidence::text
    when 'enacted_pending_force' then 1 when 'announced' then 2 when 'draft' then 3 else 4 end,
    (select rp.iso_alpha2 from public.regulatory_pathways rp where rp.id = r.entity_id);
end;
$function$;

comment on function api.regulatory_pending_changes_feed() is
  'Partially-public regulatory-change feed. Teaser fields (country, change_type, confidence, coarse year) visible to all; specifics gated to intel/operator tiers. Surfaces the previously-dark public.regulatory_pending_changes.';

revoke all on function api.regulatory_pending_changes_feed() from public;
grant execute on function api.regulatory_pending_changes_feed() to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719014123','expose_regulatory_pending_changes_teaser_feed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719014123_expose_regulatory_pending_changes_teaser_feed.sql

-- RECOVERY BEGIN 20260719021217_add_analysis_columns_to_signals_quality_view.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719021217.
--
-- Rewriting this file cannot affect production: 20260719021217 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- signals_quality was never updated to include the new analysis columns
-- after they were added to the underlying table -- the view's SELECT list
-- needs to explicitly list them too, or the frontend can never read them
-- even once schema/RPC access is otherwise correct.
CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at,
       analysis, analysis_generated_at, analysis_backend
FROM public.signals
WHERE (cat NOT IN ('SOURCE_ENGINE','GAZETTE'))
   OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90)
   OR (cat = 'GAZETTE' AND score >= 70);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719021217','add_analysis_columns_to_signals_quality_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719021217_add_analysis_columns_to_signals_quality_view.sql

-- RECOVERY BEGIN 20260719022347_revert_intel_tier_gating.sql
-- Reverts the intel/operator tier gating added in 20260714192255 and
-- 20260718080340. Not a pause -- a correction.
--
-- Note on sequencing: a separate, concurrent session independently reached
-- the same conclusion at the application-code layer -- both
-- getCountryPathwayMatrix and getOperatorLicenceMatrix now have their tier
-- check commented out (not deleted, restorable) rather than removed. This
-- migration is the missing other half: the RLS policy itself, applied live
-- via execute_sql before that concurrent work was discovered, and only now
-- being committed to close the drift gap between what's live and what's in
-- the repo. Confirmed both changes are complementary, not conflicting,
-- before writing this file -- checked pg_policies directly and found the
-- policy names below already active.
--
-- Two things surfaced together that make user_profiles.tier ('free' /
-- 'intel' / 'operator') the wrong gate to keep, not just the wrong gate to
-- enable right now:
--
-- 1. North Star v1.4/v1.5 (docs/MARKET_ENTRY_OS_NORTH_STAR.md, decided the
--    same day as this revert): business model is per-report, one-time
--    payment. Tyler explicitly rejected subscription tiers. Neither tier
--    vocabulary in this codebase -- this one, or entitlements.ts's
--    free/starter/professional/enterprise -- is where entitlement checks
--    are actually headed. The real gate will be "did you pay for this
--    specific report," once a report/corridor-plan data model and its
--    one-time Stripe Checkout path exist (neither does yet).
-- 2. entitlements.ts + require-auth.ts is a second, separate,
--    already-built, Stripe-webhook-wired tier system (checked: webhook
--    writes user.app_metadata.subscription_tier on real events) that
--    FEATURE_TIER_MAP already lists 'compliance' under, at 'starter'
--    minimum -- but requireAuth(), the function that would enforce it, is
--    never called anywhere in app/. Fully dead. A one-shot backfill script
--    (app/api/admin/backfill-tier-metadata/route.ts) attempts to copy
--    user_profiles.tier values into that field, but 'intel'/'operator'
--    aren't valid SubscriptionTier values there -- silently broken if it
--    were ever run (getTierLevel('intel') returns -1, below free).
--
-- Net: keeping this gate active meant maintaining a tier system nobody's
-- enforcing consistently, in a vocabulary the real entitlements code
-- doesn't recognize, gating a business model that's already been turned
-- down. Reverting the RLS itself (not just bypassing it in application
-- code) because there's no coherent tier state here worth preserving for
-- an easy re-enable later -- the real gate, when it's built, will look
-- nothing like this one.

drop policy if exists regulatory_pathways_tier_read on public.regulatory_pathways;
create policy regulatory_pathways_public_read on public.regulatory_pathways for select using (true);
grant select on public.regulatory_pathways to anon, authenticated;

drop policy if exists pathway_format_rules_tier_read on public.pathway_format_rules;
create policy pathway_format_rules_public_read on public.pathway_format_rules for select using (true);
grant select on public.pathway_format_rules to anon, authenticated;

drop policy if exists operator_licences_tier_read on public.operator_licences;
drop policy if exists operator_licences_public_read on public.operator_licences;
create policy operator_licences_public_read on public.operator_licences for select using (true);
grant select on public.operator_licences to anon, authenticated;

grant select on api.regulatory_pathways to anon;
grant select on api.pathway_format_rules to anon;
grant select on api.operator_licences to anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719022347','revert_intel_tier_gating','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719022347_revert_intel_tier_gating.sql

-- RECOVERY BEGIN 20260719023453_fix_digest_fallback_blind_to_pg_net_pruning.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719023453.
--
-- Rewriting this file cannot affect production: 20260719023453 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- idempotency check only, content already verified live; re-applying the same file to confirm no drift
select 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719023453','fix_digest_fallback_blind_to_pg_net_pruning','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719023453_fix_digest_fallback_blind_to_pg_net_pruning.sql

-- RECOVERY BEGIN 20260719023516_fix_digest_fallback_blind_to_pg_net_pruning_v2.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719023516.
--
-- Rewriting this file cannot affect production: 20260719023516 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


alter table public._digest_jobs add column if not exists status_code int;
alter table public._editorial_digest_jobs add column if not exists status_code int;

comment on column public._digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';
comment on column public._editorial_digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';

select 1 as idempotency_confirmed;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719023516','fix_digest_fallback_blind_to_pg_net_pruning_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719023516_fix_digest_fallback_blind_to_pg_net_pruning_v2.sql

-- RECOVERY BEGIN 20260719083250_add_clinical_signoff_gate_to_education_modules.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719083250.
--
-- Rewriting this file cannot affect production: 20260719083250 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

alter table public.education_modules
  add column requires_clinical_signoff boolean not null default false;

comment on column public.education_modules.requires_clinical_signoff is
  'True for modules containing clinical/pharmacological guidance (dosing, interactions, contraindications) that must be reviewed by a licensed clinician (reviewed_by set) before being publicly readable, regardless of publication_state.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719083250','add_clinical_signoff_gate_to_education_modules','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719083250_add_clinical_signoff_gate_to_education_modules.sql

-- RECOVERY BEGIN 20260719083305_replay_education_policy_identities.sql
-- Replay-only fail-closed reconstruction of policy identities that existed in production
-- before 20260719083306. The next migration immediately replaces both USING clauses
-- with the exact production-recorded predicates. This file exists only in the temporary
-- production-faithful replay workspace and is never a production migration.

do $replay_policy_identity$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'education_modules'
      and policyname = 'education_modules_public_select'
  ) then
    create policy "education_modules_public_select"
      on public.education_modules
      for select
      using (false);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'education_module_sections'
      and policyname = 'public read sections of published modules'
  ) then
    create policy "public read sections of published modules"
      on public.education_module_sections
      for select
      using (false);
  end if;
end
$replay_policy_identity$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719083305','replay_education_policy_identities','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719083305_replay_education_policy_identities.sql

-- RECOVERY BEGIN 20260719083306_enforce_clinical_signoff_gate_in_rls.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719083306.
--
-- Rewriting this file cannot affect production: 20260719083306 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Repository-only addendum (not part of the verbatim production statements
-- above): education_modules_public_select has no CREATE POLICY anywhere in
-- the tracked migration history -- it was evidently created directly against
-- production outside a migration (dashboard, or an untracked psql session).
-- A from-scratch replay reaches this ALTER with the policy never having
-- existed, and fails with "policy ... does not exist" (42704).
--
-- The FOR/TO scope below is not recoverable from history, but is not a
-- guess: 20260831012629_consolidate_redundant_rls_policies_batch1.sql
-- (six weeks later) drops this exact policy and folds it into
-- education_modules_select with `for select to anon, authenticated` and a
-- USING clause whose first disjunct is byte-identical to the one this file
-- sets below -- confirming both the role scope and that this policy's
-- lifetime ends at that consolidation regardless. See
-- docs/control/RECONSTRUCTED_MIGRATION_IDEMPOTENCY_AUDIT_2026-08-31.md,
-- instance 4.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education_modules'
      and policyname = 'education_modules_public_select'
  ) then
    create policy "education_modules_public_select" on public.education_modules
      for select to anon, authenticated
      using (true);
  end if;
end $$;

alter policy "education_modules_public_select" on public.education_modules
  using (
    publication_state = 'published'
    and (requires_clinical_signoff = false or reviewed_by is not null)
  );

alter policy "public read sections of published modules" on public.education_module_sections
  using (
    exists (
      select 1 from education_modules m
      where m.id = education_module_sections.module_id
        and m.publication_state = 'published'
        and (m.requires_clinical_signoff = false or m.reviewed_by is not null)
    )
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719083306','enforce_clinical_signoff_gate_in_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719083306_enforce_clinical_signoff_gate_in_rls.sql

-- RECOVERY BEGIN 20260719092425_create_playbook_staleness_queue.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719092425.
--
-- Rewriting this file cannot affect production: 20260719092425 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Connects the signals pipeline to jurisdiction_playbooks so playbooks don't silently age into
-- stale reference copy. Surfaces two cases:
--   1. 'stale' / 'never_reviewed': a published playbook where a real regulatory signal postdates
--      (or the playbook has never had) a last_reviewed date.
--   2. 'unresearched_with_live_signal': a draft (unresearched) country that already has a live
--      regulatory signal -- a prioritization bump for the research queue.
-- Filtered to the meaningful signal categories (regulatory/GAZETTE/PARLIAMENTARY/LICENSING) at
-- score >= 60 to exclude SOURCE_ENGINE ingestion noise (8,255 of 8,330 signal rows, avg score 41).

CREATE OR REPLACE VIEW public.playbook_staleness_queue AS
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.status AS playbook_status,
  jp.last_reviewed,
  jp.confidence_label,
  s.date::date AS signal_date,
  s.score AS signal_score,
  s.cat AS signal_category,
  s.headline AS signal_headline,
  s.url AS signal_url,
  CASE
    WHEN jp.status = 'draft' THEN 'unresearched_with_live_signal'
    WHEN jp.last_reviewed IS NULL THEN 'never_reviewed'
    WHEN s.date::date > jp.last_reviewed THEN 'stale'
    ELSE 'current'
  END AS staleness_flag
FROM public.jurisdiction_playbooks jp
JOIN public.signals s ON s.country_iso2 = jp.country_iso2
WHERE s.cat IN ('regulatory', 'GAZETTE', 'PARLIAMENTARY', 'LICENSING')
  AND s.score >= 60
  AND (jp.status = 'draft' OR jp.last_reviewed IS NULL OR s.date::date > jp.last_reviewed)
ORDER BY s.score DESC, s.date::date DESC;

COMMENT ON VIEW public.playbook_staleness_queue IS
  'Signals-to-playbooks refresh queue. Re-run after each signals ingestion pass or before starting a new jurisdiction_playbooks batch to catch drift.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719092425','create_playbook_staleness_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719092425_create_playbook_staleness_queue.sql

-- RECOVERY BEGIN 20260719092904_populate_deal_tables_batch1_curaleaf_tilray_canopy.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719092904.
--
-- Rewriting this file cannot affect production: 20260719092904 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- First real population of the deal/capital tables (previously 0 rows across the board).
-- Every figure below is sourced to an SEC filing or the company's own investor-relations
-- press release -- the highest-confidence tier available for corporate financial data.
-- Scoped to operators already in cannabis_operators (Curaleaf International, Canopy Growth)
-- plus the two other parties (Tilray/Aphria) where the deal itself is the notable fact.
-- This is a first tranche, not exhaustive -- flagged as such in the closing summary.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES
(
  NULL, 'Tilray, Inc.',
  NULL, 'Aphria Inc.',
  'merger', 'CA', 3381289000, 'stock',
  '2020-12-16', '2021-04-30', 'closed',
  'Tilray, Inc. SEC Form 8-K / DEFA14A merger proxy filings',
  'https://www.sec.gov/Archives/edgar/data/1731348/000119312521055831/d105344dex991.htm',
  'confirmed',
  'Structured as a plan of arrangement under the Business Corporations Act (Ontario); Tilray is the legal acquirer but the deal was accounted for as a reverse acquisition with Aphria as accounting acquirer. Deal value shown is the SEC-filed estimated purchase price ($3,381,289 thousand as of the Feb 3, 2021 measurement date) -- the filing itself notes this figure moves with Aphria''s share price; press coverage commonly cites the deal as "~$3.9 billion." The combined company (renamed Tilray, Nasdaq: TLRY) had a market cap of approximately $8.2 billion at close on April 30, 2021 -- a related but distinct figure from the purchase price.'
),
(
  NULL, 'Curaleaf Holdings, Inc.',
  NULL, 'EMMAC Life Sciences Limited',
  'acquisition', 'GB', 286000000, 'cash_and_stock',
  '2021-03-09', '2021-04-07', 'closed',
  'Curaleaf Holdings Investor Relations',
  'https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor',
  'confirmed',
  'Base consideration of ~US$286M (85% Curaleaf subordinate voting shares, 15% cash), with up to an additional US$57M in contingent consideration tied to performance milestones (total deal commonly cited at up to $343M). Curaleaf''s first UK/EU transaction; EMMAC was Europe''s largest vertically integrated independent cannabis company, with cultivation in Portugal and a distribution presence across the UK, Germany, Italy, Spain and Portugal. The combined entity now operates as Curaleaf International Holdings Ltd (see cannabis_operators, GB) -- EMMAC as a standalone legal entity no longer exists.'
);

INSERT INTO public.deal_capital_raises
  (company_operator_id, company_name, country_iso2, round_type, amount_usd, amount_currency,
   announced_date, closed_date, deal_status, use_of_proceeds, source_name, source_url, confidence, notes)
VALUES
(
  'a6000006-0000-0000-0000-000000000001', 'Curaleaf International Holdings Ltd', 'GB',
  'private_placement', 130000000, 'USD',
  '2021-04-07', '2021-04-07', 'closed',
  'Fund Curaleaf International''s European expansion and rollout, including funding the cash portion of the EMMAC acquisition',
  'Curaleaf Holdings Investor Relations',
  'https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor',
  'confirmed',
  'Single (unnamed in source) strategic institutional investor took a 31.5% equity stake in the newly formed Curaleaf International Holdings Limited, implying a ~$413M post-money valuation. Closed simultaneously with the EMMAC acquisition.'
),
(
  NULL, 'Canopy Growth Corporation', 'CA',
  'convertible_note', 50000000, 'USD',
  '2024-05-02', NULL, 'announced',
  'Balance sheet strengthening; C$27.5M of existing debt (maturing Sept 2025) exchanged into a new senior unsecured convertible debenture maturing 2029',
  'Canopy Growth Corp SEC Form 8-K',
  'https://www.sec.gov/Archives/edgar/data/1737927/000110465924057446/tm2413548d1_ex99-1.htm',
  'confirmed',
  'Single unnamed institutional investor; investor also received 3.35M common share purchase warrants (5-year term, CAD $16.18 strike). closed_date left null -- the 8-K describes proceeds as "expected," and no separate closing confirmation was located.'
),
(
  NULL, 'Canopy Growth Corporation', 'CA',
  'debt', 150000000, 'USD',
  '2026-01-08', '2026-01-08', 'closed',
  'Retire ~US$101M of existing senior secured debt due September 2027; working capital and general corporate purposes; tied to the pending MTL Cannabis acquisition',
  'Canopy Growth Corporation Investor Relations',
  'https://canopygrowth.com/investors/news-releases/canopy-growth-announces-strategic-recapitalization-transactions/',
  'confirmed',
  'New senior secured term loan led by JGB Management Inc., maturing January 2031, priced at Term SOFR + 6.25% (3.25% floor). Part of a broader recapitalization pushing Canopy''s debt maturities out to 2031. Described in the source as "finalized" on this date.'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.deal_investors (name, investor_type, hq_country_iso2, focus_areas, website, notes, source_name, source_url)
VALUES (
  'JGB Management Inc.', 'institutional', 'US',
  ARRAY['private_credit', 'structured_finance'],
  NULL,
  'Led the lender consortium on Canopy Growth''s January 2026 US$150M senior secured term loan.',
  'Canopy Growth Corporation Investor Relations',
  'https://canopygrowth.com/investors/news-releases/canopy-growth-announces-strategic-recapitalization-transactions/'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.deal_participants (capital_raise_id, investor_id, investor_name, role)
SELECT
  (SELECT id FROM public.deal_capital_raises WHERE company_name = 'Canopy Growth Corporation' AND announced_date = '2026-01-08'),
  (SELECT id FROM public.deal_investors WHERE name = 'JGB Management Inc.'),
  'JGB Management Inc.', 'lead'
WHERE EXISTS (SELECT 1 FROM public.deal_capital_raises WHERE company_name = 'Canopy Growth Corporation' AND announced_date = '2026-01-08')
  AND EXISTS (SELECT 1 FROM public.deal_investors WHERE name = 'JGB Management Inc.');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719092904','populate_deal_tables_batch1_curaleaf_tilray_canopy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719092904_populate_deal_tables_batch1_curaleaf_tilray_canopy.sql

-- RECOVERY BEGIN 20260719140626_revert_bulk_junk_and_fixture_signals.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719140626.
--
-- Rewriting this file cannot affect production: 20260719140626 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: update public.signals set reviewed = true, action = 'approved' where action = 'reverted_bulk_junk_2026_07_19' and id not like 'sig-%';
--          update public.signals set reviewed = true where id like 'sig-%' and action = 'reverted_bulk_junk_2026_07_19';
-- (original action values were 'approved' for the bulk-fragment batch, '' for the sig-* fixture rows;
--  this migration only flips reviewed and stamps action for traceability, no rows deleted)

update public.signals
set reviewed = false,
    action = 'reverted_bulk_junk_2026_07_19'
where reviewed = true
  and (
    (action = 'approved' and created_at = '2026-07-15 06:50:00.133216+00')
    or id like 'sig-%'
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719140626','revert_bulk_junk_and_fixture_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719140626_revert_bulk_junk_and_fixture_signals.sql

-- RECOVERY BEGIN 20260719140702_revert_nav_chrome_junk_signals.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719140702.
--
-- Rewriting this file cannot affect production: 20260719140702 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: update public.signals set reviewed = true, action = '' where action = 'reverted_navchrome_junk_2026_07_19';

update public.signals
set reviewed = false,
    action = 'reverted_navchrome_junk_2026_07_19'
where reviewed = true
  and (action = '' or action is null)
  and (
    headline ilike '%&nbsp%'
    or headline ilike '%Follow Us%'
    or headline ilike '%Posted by :%'
    or headline ilike 'Consultar %'
    or headline ilike 'Acceso %'
    or headline ilike 'Texte %'
    or headline ~ '^\['
    or (length(headline) - length(replace(headline,'|',''))) >= 2
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719140702','revert_nav_chrome_junk_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719140702_revert_nav_chrome_junk_signals.sql

-- RECOVERY BEGIN 20260719140825_replay_pg_trgm_extension.sql
-- Replay-only restoration of production's pg_trgm prerequisite.
-- The immediately-following reconstructed migration calls similarity(text, text),
-- but no recorded repository migration installs pg_trgm. This file exists only in
-- the temporary production-faithful replay workspace and is never a production
-- migration or migration-ledger entry.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719140825','replay_pg_trgm_extension','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719140825_replay_pg_trgm_extension.sql

-- RECOVERY BEGIN 20260719140826_stage4_dedup_near_duplicate_signals.sql
-- Reconstructed from production.
--
-- Repository-only replay-fidelity repair. Production already records version
-- 20260719140826, so changing this file cannot re-apply it to production.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

with grp as (
  select id, headline, country, date_trunc('day', created_at) as day
  from public.signals
  where reviewed = true
),
dupes as (
  select a.id as dup_id
  from grp a
  join grp b on a.country is not distinct from b.country
    and a.day = b.day
    and a.id <> b.id
    and b.id < a.id
    and similarity(left(a.headline,80), left(b.headline,80)) > 0.30
  group by a.id
)
update public.signals
set reviewed = false,
    action = 'reverted_stage4_dedup_2026_07_19'
where id in (select dup_id from dupes);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719140826','stage4_dedup_near_duplicate_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719140826_stage4_dedup_near_duplicate_signals.sql

-- RECOVERY BEGIN 20260719142245_clean_duplicated_source_headlines.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719142245.
--
-- Rewriting this file cannot affect production: 20260719142245 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Rollback: original raw headline text is preserved in the `summary` column for every
-- affected row (summary held the same duplicated raw scrape text), so a prior value
-- can be recovered from summary if needed. No backup column added since this is a
-- narrow, easily-verified string transform on 14 rows.

update public.signals
set headline = trim(split_part(headline, ' - ', 1))
where reviewed = true
  and headline ilike '%&nbsp%';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719142245','clean_duplicated_source_headlines','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719142245_clean_duplicated_source_headlines.sql

-- RECOVERY BEGIN 20260719160000_fix_signals_quality_rejected_action_stub.sql
-- Applied directly to production via Supabase MCP (Jul 19 2026 session).
-- Found via live screenshot review of the actual Intel tab (Australia).
--
-- 1. List-view analysis rendering gap: the analysis layer built earlier
--    this session was only wired into the signal DETAIL view. The scrollable
--    LIST of stacked cards -- what a user sees first -- only ever rendered
--    commercialImpact (generic templated filler: "Likely trade or
--    market-access relevance"). Confirmed via SQL: signals visible in the
--    screenshots already had real analysis in the database, invisible on
--    screen. Fixed in the same session's app-code commits (4 list-card
--    render sites in MobileCommandCentre.tsx).
--
-- 2. Truncation/nav-fragment pollution within the passing score range:
--    11 SOURCE_ENGINE signals matching a "Read More / View Report /
--    truncated mid-sentence" pattern were passing the score>=50 gate
--    (scores 52-62) despite being blog-roll fragments, board-meeting nav
--    menus, and cut-off market-report numbers, not real headlines.
--    Reviewed all 11 directly, confirmed genuinely bad, rejected via the
--    review queue's action field.
--
-- 3. CRITICAL: rejecting them via action='rejected' had NO EFFECT on
--    visibility. signals_quality's SOURCE_ENGINE/GAZETTE branches checked
--    only score, never action/reviewed -- meaning the review queue's
--    reject button (built earlier this session, thought complete) has
--    been non-functional for any signal whose score already fell in the
--    passing range, this whole time. Two features that looked complete
--    independently but never actually composed together. Fixed by adding
--    "(action IS NULL OR action <> 'rejected')" as a blanket condition
--    across every branch of the view. Verified: the 11 truncated signals
--    are now gone from signals_quality.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719160000','fix_signals_quality_rejected_action_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719160000_fix_signals_quality_rejected_action_stub.sql

-- RECOVERY BEGIN 20260719171320_fix_digest_fallback_status_code_durability.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719171320.
--
-- Rewriting this file cannot affect production: 20260719171320 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Fixes a bug in the Anthropic -> OpenAI -> Gemini fallback chain added by
-- 20260713213101_digest_llm_fallback_and_manual_review_queue.sql: every tier
-- check joined directly against net._http_response to count recent failures.
-- pg_net prunes that table automatically (observed retention: well under an
-- hour, ~150 rows at any given time), so by the next cron tick the evidence
-- of the previous failure was usually already gone, v_attempts stayed 0, and
-- the chain kept retrying anthropic indefinitely instead of falling through.
--
-- Fix: persist status_code directly on _digest_jobs / _editorial_digest_jobs
-- at collection time -- durable, survives net._http_response pruning -- and
-- have the tier checks read that column instead of re-joining the ephemeral
-- response log.

alter table public._digest_jobs add column if not exists status_code int;
alter table public._editorial_digest_jobs add column if not exists status_code int;

comment on column public._digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';
comment on column public._editorial_digest_jobs.status_code is
  'HTTP status of the collected LLM response, persisted at collection time so tier-degradation checks survive net._http_response pruning. 0 = no response ever arrived (timed out / lost).';

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := 'You are the editor of a daily B2B cannabis industry intelligence briefing. Below is a JSON array of qualified intelligence signals. Select the ~8 most commercially important (fewer if fewer are given), rewrite each as a sharp headline (max 110 chars) plus ONE editorial "why_it_matters" sentence a cannabis operator/investor would value. Group logically by market. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string, "why_it_matters": string, "market": string, "signal_id": string (the id field from the input signal you used)}. Order by importance.';
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = 0
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as claude_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update ia_signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used))
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  select jsonb_agg(jsonb_build_object(
           'id', s.id, 'title', s.title, 'market', s.market, 'type', s.type,
           'confidence', s.confidence, 'commercial_impact', s.commercial_impact,
           'summary', s.summary, 'detected_at', s.detected_at)),
         array_agg(s.id)
  into v_signals, v_signal_ids
  from (
    select * from ia_signals
    where stage = 'qualified' and used_in_digest_at is null
      and created_at > now() - interval '7 days'
    order by (commercial_impact = 'high') desc, confidence desc, created_at desc
    limit 20
  ) s;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused qualified signals in last 7 days',
      'available', coalesce(jsonb_array_length(v_signals),0));
  end if;

  if v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='anthropic' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='openai' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider='gemini' and created_at > now() - interval '2 hours' and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values ('daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals)))
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals));
  end if;

  if v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key', v_anthropic_key, 'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',2500,
          'messages', jsonb_build_array(jsonb_build_object('role','user','content',
            v_pre || E'\n\nSIGNALS:\n' || v_signals::text))),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'anthropic'
    );
  elsif v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object('model','gpt-4o-mini','max_tokens',2500,'temperature',0,
          'messages', jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content', E'SIGNALS:\n' || v_signals::text)
          )),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'openai'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
          'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)))),
          'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',2500)
        ),
        timeout_milliseconds := 60000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object('ok',true,'phase','fire','provider',v_provider,'degraded',(v_provider <> 'anthropic'),'signals_sent',jsonb_array_length(v_signals));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719171320','fix_digest_fallback_status_code_durability','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719171320_fix_digest_fallback_status_code_durability.sql

-- RECOVERY BEGIN 20260719190928_reconcile_marketplace_candidates_price_amount.sql
-- Production already had marketplace_candidates.price_amount when the
-- junk-routing backfill was applied, but repository zero-state never recorded
-- its creator. Restore only that prerequisite column immediately before the
-- production-recorded migration whose WHERE clause reads it.
--
-- 20260719190929 fails without it during zero-state replay with:
--   column "price_amount" does not exist (SQLSTATE 42703)
--
-- Same shape as 20260615091139_restore_marketplace_candidates_discovered_at.sql,
-- which restored a different prerequisite column on this table for the same
-- reason. marketplace_candidates is built during replay by the pinned
-- candidate assembler, whose column set differs from production's; a check
-- across every migration that reads this table shows price_amount is the only
-- production column referenced that replay does not already have.

alter table public.marketplace_candidates
  add column if not exists price_amount numeric;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719190928','reconcile_marketplace_candidates_price_amount','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719190928_reconcile_marketplace_candidates_price_amount.sql

-- RECOVERY BEGIN 20260719190929_route_junk_scraped_candidates_to_needs_enrichment.sql
-- Backfill: scraped marketplace candidates that reached needs_review without
-- the basics a reviewer needs (price, real title) are reclassified to
-- needs_enrichment. This clears the human review queue of ~527 rows that were
-- never actually reviewable -- confirmed via status history that status had
-- never once moved past needs_review for any row in this table.
--
-- Idempotent: only touches rows still in needs_review matching the junk
-- criteria, so re-running this after lib/scrapers/ingestor.ts's matching code
-- fix (same session, prevents recurrence) is a safe no-op.
update marketplace_candidates
set status = 'needs_enrichment'
where status = 'needs_review'
  and candidate_type = 'scraped'
  and (price_amount is null or title_public_draft is null or length(title_public_draft) < 5);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719190929','route_junk_scraped_candidates_to_needs_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719190929_route_junk_scraped_candidates_to_needs_enrichment.sql

-- RECOVERY BEGIN 20260719211255_add_translation_stage.sql
-- Restore the exact production-owned body for migration 20260719211255.
-- The previous stub omitted public.hv_translation_jobs, which later
-- migrations dereference.

-- §5 pipeline stage: NORMALIZE + DETECT LANGUAGE → translate → title_en/summary_en, BEFORE classify.
-- Root cause of classifier recall 0.40 on non-English: it reads raw foreign text. This stage fixes that.

alter table public.signals
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists lang_detected text,
  add column if not exists translated_at timestamptz,
  add column if not exists translation_model text;

create table if not exists public.hv_translation_jobs (
  request_id  bigint primary key,
  signal_id   text not null,
  dispatched_at timestamptz not null default now(),
  harvested   boolean not null default false
);
create index if not exists hv_translation_jobs_unharvested on public.hv_translation_jobs (harvested) where not harvested;

-- Fire translation calls (async via pg_net) for non-English, untranslated signals.
create or replace function public.hv_translate_dispatch(p_limit int default 30, p_eval_only boolean default false)
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_rid bigint; v_key text; n int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';
  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url := 'https://api.openai.com/v1/chat/completions',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body := jsonb_build_object(
        'model','gpt-4o-mini','temperature',0,
        'response_format', jsonb_build_object('type','json_object'),
        'messages', jsonb_build_array(
          jsonb_build_object('role','system','content','You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".'),
          jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
        )
      ),
      timeout_milliseconds := 30000
    ) into v_rid;
    insert into public.hv_translation_jobs(request_id, signal_id) values (v_rid, r.id)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end$fn$;

-- Collect completed responses; write title_en/summary_en/lang_detected back to signals.
create or replace function public.hv_translate_harvest()
returns int language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_out jsonb; n int := 0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_translation_jobs j
    join net._http_response resp on resp.id = j.request_id
    where not j.harvested
  loop
    if r.status_code = 200 then
      begin
        v_out := (r.content::jsonb->'choices'->0->'message'->>'content')::jsonb;
        update public.signals s set
          title_en   = nullif(btrim(v_out->>'title_en'),''),
          summary_en = nullif(btrim(v_out->>'summary_en'),''),
          lang_detected = nullif(btrim(v_out->>'lang'),''),
          translated_at = now(),
          translation_model = 'gpt-4o-mini'
        where s.id = r.signal_id;
        n := n + 1;
      exception when others then null;
      end;
    end if;
    update public.hv_translation_jobs set harvested = true where request_id = r.request_id;
  end loop;
  return n;
end$fn$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719211255','add_translation_stage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719211255_add_translation_stage.sql

-- RECOVERY BEGIN 20260719215904_fix_signals_quality_to_respect_rejected_action.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260719215904.
--
-- Rewriting this file cannot affect production: 20260719215904 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Found via live testing: signals_quality's SOURCE_ENGINE/GAZETTE branches
-- only checked score, never action/reviewed. This meant the review
-- queue's reject button (built earlier this session) had zero actual
-- effect on visibility for any signal whose score already fell in the
-- passing range -- rejecting it set action='rejected' but the view kept
-- showing it anyway. Real gap between two features that looked complete
-- independently but didn't compose. Fixed by adding the rejected-action
-- exclusion to every branch, not just the manually-curated categories
-- that already had it implicitly (via reviewed=true always being set for
-- those, with no reject path to begin with).

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at,
       analysis, analysis_generated_at, analysis_backend
FROM public.signals
WHERE (action IS NULL OR action <> 'rejected')
  AND (
    (cat NOT IN ('SOURCE_ENGINE','GAZETTE'))
    OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90)
    OR (cat = 'GAZETTE' AND score >= 70)
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260719215904','fix_signals_quality_to_respect_rejected_action','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260719215904_fix_signals_quality_to_respect_rejected_action.sql
