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
-- version 20260711030217.
--
-- Rewriting this file cannot affect production: 20260711030217 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Batch 11: jurisdiction_playbooks + market_metrics + country_education_overlay for TR, MK, NA, KE
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- TR: new 2025 pharma-only medical law + Jan 2026 implementing regulations, still-forming market.
-- MK: mature (2016) free-market medical cultivation/export regime; GMP-recognition bottleneck flagged.
-- NA: full apartheid-era prohibition; live unresolved constitutional case + 2025 LRDC policy review.
-- KE: full prohibition with 2022 penalty-tier reform + live Rastafarian religious-exemption case
--     (judgment date has shifted three times; most recent reporting points to 15 Jul 2026).

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Daily Sabah -- New cannabis law to boost pain relief, Turkiye''s competitiveness',
   'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness',
   'news', 1, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Direct quotes from AK Party sponsor on the 2025 pharmacy-sale law; confirms Agriculture/Health ministry split'),
  ('Business of Cannabis -- Landmark Turkish Bill Legalises Low-THC Cannabis Sales in Pharmacies',
   'https://businessofcannabis.com/landmark-turkish-bill-legalises-low-thc-cannabis-sales-in-pharmacies/',
   'industry_press', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'monthly', 'active', true, true,
   'Confirms electronic monitoring system and 19-of-81-province industrial hemp licensing history'),
  ('International CBC -- Turkey Sets Hemp Quota For Medical Products',
   'https://internationalcbc.com/turkey-sets-hemp-quota-for-medical-products/',
   'industry_press', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Oct 2024 presidential decree: 120,000-plant / 5,000sqm annual national cultivation quota for pharma API use'),
  ('Coherent Market Insights -- Turkey Medical Cannabis Market Forecast 2026-2033',
   'https://www.coherentmarketinsights.com/industry-reports/turkey-medical-cannabis-market',
   'market_research', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'USD 140.7M (2025) to USD 430.2M (2032) market forecast; also references a 2025 Curaleaf operating license'),
  ('Wikipedia -- Cannabis in Turkey',
   'https://en.wikipedia.org/wiki/Cannabis_in_Turkey',
   'reference', 2, 'Turkiye', 'TR', 'Asia', 'html_snapshot', 'quarterly', 'active', true, true,
   'Background on the 2016 Sativex approval pathway and 19-province hemp cultivation history'),

  ('Invest North Macedonia -- Pharmaceuticals and Medical Devices',
   'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/',
   'government_official', 1, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Official government investment-promotion page; cultivation facility and licensing requirements'),
  ('CMS Expert Guides -- Cannabis law and legislation in North Macedonia',
   'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/north-macedonia',
   'legal_analysis', 1, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Statutory basis (Law on Control of Narcotic Drugs and Psychotropic Substances); penalty range 6mo-10yr'),
  ('Lalicic & Partners Law Firm -- Medical Cannabis in North Macedonia',
   'https://lblaw.com.mk/en/medical-cannabis-in-north-macedonia/',
   'legal_analysis', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'EUR 300,000 bank guarantee requirement and full cultivation-application document checklist'),
  ('Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/',
   'industry_press', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '2025 Germany export volume (5,765kg) and approximate 100-licensed-processor figure'),
  ('Cannavigia -- Cannabis Compliance in North Macedonia',
   'https://www.cannavigia.com/blog-posts/cannabis-country-report-north-macedonia-background-info-how-to-checklist-free-licensing-guide',
   'industry_press', 2, 'North Macedonia', 'MK', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'GMP non-recognition bottleneck and MAKKANABIS trade-association context; 2022 Strumica seizure'),

  ('The Namibian -- High Court judge wants cannabis legalisation issues trimmed',
   'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/',
   'news', 1, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current status (Mar 2026) of the GUN/RUF constitutional case and the state''s LRDC-review defense'),
  ('MMJ Daily -- Namibia does not want to let courts rule on cannabis policy',
   'https://www.mmjdaily.com/article/9834450/namibia-doesn-t-want-to-let-courts-rule-on-cannabis-policy/',
   'industry_press', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms the May 5-8 2026 special-plea hearing date'),
  ('Hemp Today -- Namibia''s hemp future depends on dismantling cannabis prohibition, advocates urge',
   'https://hemptoday.net/namibias-hemp-future-depends-on-dismantling-cannabis-prohibition-advocates-urge/',
   'industry_press', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'June 2025 joint CHAN/GUN/RUF/Medical Marijuana Association of Namibia submission to the Ministry of Justice'),
  ('Leafwell -- Is Marijuana Legal in Namibia?',
   'https://leafwell.com/blog/is-marijuana-legal-in-namibia',
   'legal_analysis', 2, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   '2006 Combating of the Abuse of Drugs Bill penalty figures (N$500,000 / up to 40yr)'),

  ('Herb -- How to Buy Weed in Kenya: Nairobi, Mombasa & East Africa''s Cannabis Scene',
   'https://herb.co/city-guides/buy-weed-kenya',
   'industry_press', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'monthly', 'active', true, true,
   'April 2026 synthesis: 2022 penalty-tier amendment figures, NACADA addiction-rate data, regional comparison'),
  ('Cannabis Law Report -- Kenya Rastafarian Use of Bhang Case',
   'https://cannabislaw.report/kenya-rastafarian-use-of-bhang-case-hear-nov-2025-thru-jan-2026-court-videos-testimonies-come-online/',
   'legal_analysis', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'RSK v. State case background and the February 2026 evidentiary ruling'),
  ('Switch News -- Kenya''s Rastafarians Await Landmark Court Ruling on Cannabis Rights',
   'https://news.switchtv.ke/2026/07/kenyas-rastafarians-await-landmark-court-ruling-on-cannabis-rights/',
   'news', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current confirmation (early Jul 2026) that judgment has shifted again, now expected 15 Jul 2026'),
  ('Wikipedia -- Cannabis in Kenya',
   'https://en.wikipedia.org/wiki/Cannabis_in_Kenya',
   'reference', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'quarterly', 'active', true, true,
   'Statutory and historical background, the 1994 Act, UNODC cultivation-hub data')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'TR', 'Turkiye', 'high', 18,
  'No standardized public fee schedule identified; national cultivation is capped at a fixed 120,000-plant / 5,000 sqm annual quota reserved for pharmaceutical API production, so the binding constraint is licensed capacity rather than budget',
  'Turkiye legalized regulated, pharmacy-only sale of low-THC (under 0.3%) medical cannabis products under a health-law package ("Amendments to Certain Health-Related Laws and Decree Law No. 663") passed by Parliament in mid-2025, ending a regime that since 2016 had permitted only sublingual cannabinoid sprays such as Sativex via a specialist-issued "red prescription." Under the new law, the Ministry of Agriculture and Forestry oversees cultivation and harvesting while the Ministry of Health controls processing, licensing, export and pharmacy sales, with every unit tracked through an electronic monitoring system; products are dispensed exclusively through licensed pharmacies on prescription, and officials (including AK Party deputy group chair Leyla Sahin Usta) have been explicit that the law does not open any recreational pathway. Implementing detail followed in the Regulation on Cultivation and Control of Cannabis and the Regulation on Products Derived from Cannabis, both published in the Official Gazette on 31 January 2026 -- meaning the operational rulebook is only months old at time of review. Separately, an October 2024 presidential decree fixed a national annual hemp cultivation quota of 120,000 plants across 5,000 sqm exclusively for pharmaceutical active-ingredient production, administered by the Ministry of Agriculture and Forestry, with universities and permitted research institutes exempted from the cap for R&D. A global medical-cannabis industry report notes Curaleaf was awarded an operating license in Turkiye''s nascent medical market in 2025, among the first such licenses issued. Outside this narrow pharma channel, Turkiye maintains one of the strictest cannabis regimes in the region: whole-plant cannabis is a Schedule I substance under the Turkish Penal Code, and 2023 amendments raised the minimum mandatory sentence for possession of up to 5 grams from six months to one year, with tiered fines and vigorous, undifferentiated enforcement against citizens and tourists alike at borders and in major cities. Industrial hemp cultivation for fiber, textile and construction use is a separate, older track: legalized in 19 of Turkiye''s 81 provinces since 2016 under Ministry of Agriculture and Forestry permits (maximum three-year validity, extendable to other provinces with permission). CBD sits in an unsettled middle position -- one consumer-facing source cites a 0.2% THC administrative tolerance, but no personal-import or general retail-CBD exemption is published, and pharmacy-channel cannabinoid medicines are regulated as medicines, not consumer goods.',
  '[
    {"step": "Distinguish the pharmacy-only medical channel from all other cannabis activity", "detail": "Patient access runs exclusively through Ministry of Health-licensed pharmacies on physician prescription; there is no dispensary, retail, or personal-cultivation model, and whole-plant cannabis outside this channel remains a Schedule I criminal matter"},
    {"step": "Apply for cultivation-quota allocation through the Ministry of Agriculture and Forestry", "detail": "National hemp cultivation for pharmaceutical API use is capped at 120,000 plants / 5,000 sqm per year under an October 2024 presidential decree; universities and permitted research institutes are exempted from the cap for R&D purposes"},
    {"step": "Verify current procedural detail directly with regulators", "detail": "The two implementing regulations (Cultivation and Control of Cannabis; Products Derived from Cannabis) were only published in the Official Gazette on 31 January 2026, so application forms, timelines, and fee schedules should be confirmed directly rather than assumed from the primary law alone"},
    {"step": "Build for electronic traceability from day one", "detail": "All licensed product must be logged through the Ministry of Health''s electronic monitoring system across cultivation, processing, and pharmacy dispensing"},
    {"step": "Treat industrial hemp-for-fiber licensing (19 of 81 provinces, Ministry of Agriculture, 3-year permits) as a wholly separate regime from the 2025 medical-pharma law", "detail": "The two tracks have different regulators, purposes, and product scopes; conflating them risks applying under the wrong framework"}
  ]'::jsonb,
  '["Ministry of Health -- processing, licensing, pharmacy distribution and prescription oversight", "Ministry of Agriculture and Forestry -- cultivation quota, harvesting and industrial hemp permits", "Turkish Medicines and Medical Devices Agency -- clinical trials and product registration"]'::jsonb,
  ARRAY[
    'Assuming the 2025 law created any recreational or general retail opening -- officials have explicitly and repeatedly stated it does not, and whole-plant cannabis remains a Schedule I substance with 2023-enhanced minimum sentences enforced against citizens and tourists alike',
    'Assuming the 120,000-plant / 5,000 sqm national cultivation quota is expandable per-operator on request -- it is a fixed national ceiling reserved for pharmaceutical API production, meaning realistic near-term supply capacity is small and any licensing process is likely to be competitive',
    'Treating the January 2026 implementing regulations as a mature, precedent-tested framework -- they are only months old at time of review, and the Curaleaf 2025 license is among the first issued, so procedural precedent remains thin'
  ],
  'published',
  'medium-high -- the underlying 2025 law and its 2025 first-license issuance are corroborated across Daily Sabah, Ganjapreneur, Business of Cannabis, and a global medical-cannabis industry report; the 31 January 2026 implementing-regulation date traces to a single legal-industry blog and should be verified against the Official Gazette directly; two independent market-forecast providers (Coherent Market Insights vs. Statista) give materially different market-size estimates for the same market, flagged rather than silently resolved',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness'),
  CURRENT_DATE, now()
),
(
  'MK', 'North Macedonia', 'moderate', 12,
  'A EUR 300,000 bank guarantee (MKD-equivalent) is a documented application requirement, and licensed cultivators must additionally commit a share of net annual profit (10-20% depending on source) to the state budget; beyond these fixed items, published fee schedules are otherwise sparse, and the largest real cost driver is GMP re-certification, since EU markets do not recognize Macedonian-issued GMP certificates and licensees must separately contract foreign GMP auditors',
  'North Macedonia legalized medical cannabis cultivation on 9 February 2016 through amendments to the Law on Control of Narcotic Drugs and Psychotropic Substances, and has since operated one of Europe''s few genuinely free-market cannabis regimes: private companies, not a state monopoly, cultivate and export, a structure the government has explicitly modeled on Canada. Cultivation requires prior consent from the Government of the Republic of North Macedonia, after which the Ministry of Health issues a cultivation approval within 30 days; the licensed entity must then separately obtain a sowing/planting approval from the Ministry of Agriculture, Forestry and Water Economy (MAFWE) within 15 days, before any planting begins. Facility requirements are strict and security-driven: a minimum four-metre perimeter fence topped with barbed wire and fronted with coiled razor wire, 24-hour video surveillance of the entire site, and mandatory staffing including a pharmacist with at least three years'' experience and an agronomist with at least three years'' experience. A 2021 amendment to the law, undertaken to better align with EU conventions, extended export authorization to include dried flower (previously only finished extracts, oils and similar processed products could be exported); export permits are issued by the Agency for Medicines and Medical Devices (AMMD) and are valid for three months. The sector has scaled meaningfully: as of 2025 approximately 100 companies were licensed to process cannabis, and North Macedonia exported 5,765 kg of cannabis to Germany across the first three quarters of 2025 alone -- up 116% from 2,666 kg over the same period in 2024 -- placing it fourth among Germany''s cannabis import sources behind only Canada, Portugal and Denmark. However, licensing has not been friction-free: of roughly 67 cultivation licenses granted between 2016 and 2022, 35 had lapsed or been invalidated by the most recent reporting, and in 2022 police seized approximately 1.5 tons of undeclared marijuana from a licensed company in Strumica, illustrating real compliance and enforcement exposure inside the legal framework. The trade association MAKKANABIS, formed in 2020, has specifically flagged that Macedonian-issued GMP certificates are not recognized in the EU, forcing exporters into a separate, slow and costly foreign GMP re-certification process -- widely cited as the sector''s central operational bottleneck -- and has also lobbied (without success to date) for a single dedicated cannabis regulatory agency to replace the current split between the Ministry of Health and Ministry of Agriculture. Recreational use remains fully illegal, punishable under the Macedonian Criminal Code by 6 months to 10 years'' imprisonment. CBD and low-THC products (0.2% THC or below) may be sold without prescription; products above that threshold require a physician''s prescription, with prescribing reportedly limited to specific conditions such as certain cancers, epilepsy, HIV and multiple sclerosis.',
  '[
    {"step": "Assemble a compliant legal entity, facility plan and security arrangement", "detail": "Requirements include Central Register proof of registration, proof of ownership or lease of the cultivation site, a physical security plan or contract with a licensed security company, and a formal cultivation study/plan"},
    {"step": "Secure the EUR 300,000 bank guarantee and profit-share commitment", "detail": "A bank guarantee in MKD-equivalent and a formal commitment to remit a share of net annual profit (sources give 10-20%) to the state budget are documented application components"},
    {"step": "Obtain Government of North Macedonia consent, then Ministry of Health cultivation approval", "detail": "The Ministry of Health issues its approval within 30 days of receiving the Government''s prior consent"},
    {"step": "Obtain the separate Ministry of Agriculture, Forestry and Water Economy (MAFWE) sowing/planting approval", "detail": "Required before any planting begins; issued within 15 days of application, and cannot be skipped even after Ministry of Health approval is granted"},
    {"step": "Plan for the GMP-recognition bottleneck from the outset", "detail": "EU markets do not recognize Macedonian-issued GMP certificates, so any operator planning to export finished extracts or oils into the EU must separately budget for foreign GMP re-certification -- flagged by MAKKANABIS as the sector''s central obstacle"},
    {"step": "Underwrite for high license attrition when modeling the opportunity", "detail": "Of the roughly 67 cultivation licenses issued between 2016 and 2022, 35 had lapsed by the most recent reporting -- licensing alone does not guarantee a durable operation"}
  ]'::jsonb,
  '["Ministry of Health -- cultivation, processing and extraction licensing", "Ministry of Agriculture, Forestry and Water Economy (MAFWE) -- sowing/planting approval", "Government of the Republic of North Macedonia -- prior consent required for every cultivation license", "Agency for Medicines and Medical Devices (AMMD) -- export permits"]'::jsonb,
  ARRAY[
    'Underestimating the GMP-recognition gap -- a Macedonian GMP certificate is not accepted in the EU, so any export-oriented operator must budget separately, and substantially, for foreign GMP re-certification, which the industry association MAKKANABIS identifies as the sector''s central bottleneck',
    'Treating a Ministry of Health cultivation approval as sufficient on its own -- a separate MAFWE sowing/planting approval is mandatory before planting, and the Government-consent, Ministry of Health, and MAFWE steps must be sequenced correctly and in order',
    'Assuming license issuance guarantees a durable business -- roughly half of the cultivation licenses granted in the sector''s first six years (2016-2022) had lapsed by the most recent reporting, and a licensed company was subject to a 1.5-ton undeclared-cannabis seizure in 2022, underscoring real compliance and enforcement risk even within the legal framework'
  ],
  'published',
  'high -- the licensing framework, facility requirements and free-market structure are consistently corroborated across CMS Expert Guides, a North Macedonian law firm (Lalicic & Partners), the government''s own Invest North Macedonia investment-promotion site, and multiple industry sources (Cannavigia, Cannabusinessplans.com); the profit-share percentage shows an unresolved 10% vs. 20% conflict across sources and is flagged rather than silently resolved; 2025 export-volume figures are corroborated via reporting on German import statistics',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/'),
  CURRENT_DATE, now()
),
(
  'NA', 'Namibia', 'very_high', 0,
  'Not applicable -- no legal pathway exists for cultivation, processing, sale, or medical use of cannabis in any form',
  'Namibia maintains full prohibition of cannabis for both recreational and medical use under the apartheid-era Abuse of Dependence-Producing Substances and Rehabilitation Centres Act, No. 41 of 1971 (inherited from South African colonial administration) as supplemented by the 2006 Combating of the Abuse of Drugs Bill. No legal medical, industrial-hemp, or adult-use pathway exists in current law, and the Ministry of Health and Social Services has explicitly and formally rejected proposals for commercial medical cannabis cultivation, most recently in June 2024. That said, two genuinely live and unresolved reform channels are worth active monitoring rather than being treated as settled: first, a coalition of advocacy groups (the Cannabis and Hemp Association of Namibia, Ganja Users of Namibia, the Medical Marijuana Association of Namibia, and the Rastafari United Front) submitted a fresh joint decriminalization and hemp-legalization proposal to the Ministry of Justice and Labour Relations in June 2025, in direct response to a government call for public input on "obsolete and discriminatory legislation"; second, a constitutional challenge filed in August 2021 by Ganja Users of Namibia president Brian Jaftha and secretary-general Borro Ndungula, seeking to have the cannabis prohibition declared unconstitutional and struck from the 1971 Act, remains active in the Windhoek High Court. The government''s defense in that case has consistently argued the matter is premature because the Law Reform and Development Commission (LRDC) is separately conducting its own review of Namibia''s cannabis laws, and that reform is properly a legislative rather than judicial matter; a special-plea hearing on that jurisdictional question was scheduled for 5-8 May 2026, and no publicly reported outcome had been located as of this review -- this is a genuinely unresolved, live case rather than a settled one. Penalty figures conflict materially across sources: reported maximum fines range from roughly N$200,000 (about $14,000) to N$500,000 (about $27,000), and reported maximum imprisonment terms range from 20 to 40 years depending on the specific source and offense category (simple possession vs. cultivation vs. dealing); any single cited figure should be treated as indicative rather than definitive pending confirmation of the exact charge against the current statute. Cannabis (locally "dagga") is reported as the most commonly used illicit drug in the country, and Namibia is a documented regional trafficking transit point. CBD carries no express legal carve-out and is generally treated as illegal by extension of the general cannabis prohibition, notwithstanding its growing commercial availability elsewhere.',
  '[]'::jsonb,
  '["Ministry of Health and Social Services -- has explicitly declined proposals for medical cannabis licensing, most recently in June 2024", "Namibian Police Force (NAMPOL) and the Office of the Prosecutor-General -- enforcement of the 1971 Act", "Law Reform and Development Commission (LRDC) -- conducting an official review of Namibia''s cannabis laws, cited by the government as the appropriate reform channel rather than the courts"]'::jsonb,
  ARRAY[
    'Assuming the active High Court constitutional challenge or the June 2025 advocacy submission to the Ministry of Justice signals imminent legal change -- both are live, unresolved processes; the government has consistently resisted judicial intervention on the merits, arguing reform is a legislative/LRDC matter, and no resolution timeline is confirmed',
    'Treating any single cited penalty figure (fine amount or maximum sentence) as authoritative -- available sources conflict materially on both dimensions (N$200,000 vs. N$500,000; 20 years vs. 40 years); confirm the specific statute and offense category with Namibian counsel before relying on any number',
    'Assuming CBD or hemp-derived products carry any distinct legal status in Namibia -- no such carve-out exists; CBD is treated as illegal by extension of the general cannabis prohibition'
  ],
  'published',
  'high on the core prohibition status (corroborated across Wikipedia, Leafwell, Accomplit, and The Namibian''s ongoing court coverage), medium on specific penalty figures (fine and maximum-sentence figures conflict materially across sources), and explicitly unresolved on litigation outcome -- the GUN/RUF constitutional case and the LRDC legislative review were both still pending as of the most recent reporting located, with a special-plea hearing scheduled for May 2026 and no confirmed result found',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/'),
  CURRENT_DATE, now()
),
(
  'KE', 'Kenya', 'high', 0,
  'Not applicable for commercial cultivation, processing, or sale -- no operational licensing pathway exists; the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994 nominally provides for medical and scientific use, but no functioning license-issuance process for that carve-out was identified in available sources',
  'Cannabis (locally "bhang") is illegal in Kenya under the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994 (Cap 245), Kenya''s primary drug law, which replaced the 1933 colonial-era Dangerous Drugs Act. NACADA (the National Authority for the Campaign Against Alcohol and Drug Abuse) has repeatedly and publicly reaffirmed that recreational and commercial cannabis trade remain prohibited notwithstanding periodic political reform calls; the Act nominally provides for medical and scientific use, but no operational commercial licensing pathway for that provision was identified in available sources. A significant 2022 amendment introduced quantity-based, tiered penalties distinguishing personal-use possession from trafficking by weight: under the current framework, possession for personal consumption carries up to 5 years'' imprisonment or a fine of up to KSh 100,000 (roughly $770) -- a substantial reduction from the pre-amendment regime, under which simple possession could draw a minimum 10-year term and cultivation or dealing could draw 20 years to life plus fines of KSh 1 million or three times market value. Kenya has seen a decade of stalled reform attempts: the late Kibra MP Ken Okoth''s 2018 Marijuana Control Bill never advanced, and 2022 presidential candidate George Wajackoyah (Roots Party), who made legalization the centerpiece of his campaign, announced in February 2026 that he intends to run again in the 2027 presidential election on the same platform. The most consequential live development is a religious-freedom constitutional case: the Rastafari Society of Kenya has litigated since 2021 before Justice Bahati Mwamuye at the Milimani Law Courts to have cannabis use for sacramental worship exempted from Sections 3, 5 and 6 of the 1994 Act. The case has been repeatedly adjourned -- judgment dates were successively set for 12 March, then 27/28 May, and as of the most recent reporting located (early July 2026) had shifted again to 15 July 2026 -- with no ruling found as of this review; this is a live, closely watched, genuinely unresolved case, and even a favorable outcome would establish only a narrow religious-worship exemption, not broad legalization. NACADA reports that cannabis use rose roughly 90% over five years and that 47.4% of current cannabis users in its surveys met its criteria for problematic use ("addiction"). Regionally, Kenya sits in a fast-shifting landscape: Uganda issued its first experimental medicinal cannabis license in July 2025, Rwanda has operated a licensed medical framework since a 2021 ministerial order, and Ghana launched a licensed medicinal/industrial program in February 2026, while Kenya and Tanzania remain the region''s more restrictive holdouts. CBD is not legally distinguished from THC-containing cannabis under current Kenyan law.',
  '[]'::jsonb,
  '["National Authority for the Campaign Against Alcohol and Drug Abuse (NACADA) -- primary enforcement-messaging and drug-policy body, has repeatedly reaffirmed prohibition", "Directorate of Criminal Investigations and the Kenya Police Service -- enforcement", "Judiciary (Milimani Law Courts) -- actively adjudicating the pending Rastafari Society of Kenya constitutional/religious-freedom case"]'::jsonb,
  ARRAY[
    'Assuming the 1994 Act''s nominal medical/scientific use provision means a functioning medical cannabis program exists -- no operational licensing pathway for that carve-out was identified in available sources; treat Kenya as fully prohibited in practice',
    'Treating the pending Rastafari Society of Kenya case as a broad legalization proceeding -- even a favorable ruling (most recently expected around 15 July 2026, though the date has already shifted three times) would establish a narrow religious-worship exemption only, not commercial or general recreational legality',
    'Citing pre-2022 penalty figures (minimum 10-year terms, life imprisonment for dealing) as current law -- the 2022 amendment introduced materially lower, quantity-tiered penalties specifically for personal-use possession; confirm which offense category and which version of the law applies before relying on any single penalty figure'
  ],
  'published',
  'high on the core prohibition status and the 2022 penalty-tier amendment (corroborated across Herb''s April 2026 reporting, Leafwell, Wikipedia, and NACADA''s own public statements); the Rastafari Society case timeline is well-documented across multiple 2025-2026 Kenyan news sources (Nation, The Star, Capital News, Cannabis Law Report) but its outcome is explicitly unresolved as of this review, and the judgment date has already shifted three times, so it should not be treated as settled',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-kenya'),
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
  ('TR', 'medical_cannabis_market_value_2025', 140700000, 'USD', '2025-01-01', '2025-12-31', 'annual', 'estimated', 'medium',
   'Coherent Market Insights -- Turkey Medical Cannabis Market Forecast 2026-2033',
   'https://www.coherentmarketinsights.com/industry-reports/turkey-medical-cannabis-market', '2026-01-01',
   'Projects growth to USD 430.2M by 2032 (16.5% CAGR); a separate Statista forecast gives a materially lower USD 58.64M figure for 2024, an unresolved cross-provider discrepancy typical of very new, thinly-covered markets'),
  ('TR', 'annual_hemp_cultivation_quota_2025', 120000, 'plants', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high',
   'International CBC -- Turkey Sets Hemp Quota For Medical Products',
   'https://internationalcbc.com/turkey-sets-hemp-quota-for-medical-products/', '2024-11-04',
   'Fixed national ceiling (also expressed as 5,000 sqm) set by an October 2024 presidential decree, reserved exclusively for pharmaceutical active-ingredient production; universities and permitted research institutes are exempt from the cap'),
  ('TR', 'industrial_hemp_licensed_provinces', 19, 'provinces', '2016-01-01', '2016-12-31', 'point_in_time', 'observed', 'high',
   'Wikipedia -- Cannabis in Turkey', 'https://en.wikipedia.org/wiki/Cannabis_in_Turkey', '2026-03-11',
   'Of Turkiye''s 81 provinces, 19 have been licensed for industrial/medical hemp cultivation since 2016, corroborated by Sensi Seeds and Business of Cannabis reporting'),

  ('MK', 'cannabis_exports_to_germany_2025_ytd_q3', 5765, 'kg', '2025-01-01', '2025-09-30', 'point_in_time', 'observed', 'high',
   'Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/', '2025-12-01',
   'Up 116% from 2,666 kg over the same Jan-Sep period in 2024; ranks North Macedonia fourth among Germany''s cannabis import sources, behind Canada, Portugal and Denmark'),
  ('MK', 'licensed_cannabis_processing_companies_2025', 100, 'companies', '2025-01-01', '2025-12-31', 'point_in_time', 'estimated', 'medium',
   'Cannabusinessplans.com -- Cannabis Market in North Macedonia',
   'https://cannabusinessplans.com/cannabis-market-macedonia/', '2025-12-01',
   'Approximate figure; of the roughly 67 cultivation licenses issued 2016-2022, 35 had lapsed by the most recent reporting, indicating meaningful churn beneath the headline count'),
  ('MK', 'cultivation_license_bank_guarantee_requirement', 300000, 'EUR', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'high',
   'Lalicic & Partners Law Firm -- Medical Cannabis in North Macedonia',
   'https://lblaw.com.mk/en/medical-cannabis-in-north-macedonia/', '2025-04-01',
   'Bank guarantee (MKD-equivalent) required as part of the cultivation-license application; sources conflict on whether the associated state profit-share is 10% or 20% of net annual profit'),

  ('NA', 'annual_cannabis_use_prevalence_rate', 3.9, 'percent', '2000-01-01', '2000-12-31', 'point_in_time', 'observed', 'low',
   'UNODC (via Leafwell and Wikipedia)', 'https://en.wikipedia.org/wiki/Cannabis_in_Namibia', '2011-01-01',
   'Figure originates from year-2000 data reported in a 2011 UNODC report; no more recent official prevalence estimate was located, so treat as dated background context rather than a current figure'),
  ('NA', 'maximum_cultivation_fine_2006_bill', 500000, 'NAD', '2006-01-01', '2006-12-31', 'point_in_time', 'observed', 'medium',
   'Leafwell -- Is Marijuana Legal in Namibia?', 'https://leafwell.com/blog/is-marijuana-legal-in-namibia', '2025-10-03',
   'Per the 2006 Combating of the Abuse of Drugs Bill (cultivation offense, paired with up to 40 years'' imprisonment in the same source); other sources cite a lower N$200,000 fine and a 20-year maximum term for the underlying 1971 Act -- an unresolved cross-source conflict, flagged rather than resolved'),

  ('KE', 'personal_possession_max_fine_2022_amendment', 100000, 'KES', '2022-01-01', '2026-12-31', 'annual', 'observed', 'high',
   'Herb -- How to Buy Weed in Kenya', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Maximum fine for personal-consumption possession under the 2022 quantity-tiered amendment to the Narcotic Drugs and Psychotropic Substances (Control) Act, 1994; paired with up to 5 years'' imprisonment as an alternative or concurrent penalty'),
  ('KE', 'cannabis_use_disorder_rate_among_users', 47.4, 'percent', '2025-01-01', '2026-04-01', 'point_in_time', 'observed', 'medium',
   'NACADA (via Herb -- How to Buy Weed in Kenya)', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Share of current cannabis users classified by NACADA surveys as meeting its criteria for problematic/addictive use; methodology not independently verified'),
  ('KE', 'five_year_cannabis_use_increase', 90, 'percent', '2021-01-01', '2026-04-01', 'point_in_time', 'observed', 'medium',
   'NACADA (via Herb -- How to Buy Weed in Kenya)', 'https://herb.co/city-guides/buy-weed-kenya', '2026-04-01',
   'Reported increase in cannabis use over a five-year window per NACADA; underlying survey methodology not independently verified')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('TR', 'market-access-strategy', 'investor_operator',
   '["Turkiye legalized pharmacy-only, prescription-based sale of low-THC (under 0.3%) medical cannabis products in mid-2025 -- there is no retail, dispensary, or recreational pathway", "National cultivation is capped at a fixed 120,000-plant / 5,000 sqm annual quota reserved for pharmaceutical active-ingredient production, set by an October 2024 presidential decree", "Implementing regulations were only published in the Official Gazette on 31 January 2026, so the operational rulebook is still very new", "Curaleaf was awarded an operating license in 2025, among the first issued under the new framework"]'::jsonb,
   'Read the Turkiye jurisdiction playbook before assuming any retail or cultivation-capacity opportunity',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.dailysabah.com/politics/legislation/new-cannabis-law-to-boost-pain-relief-turkiyes-competitiveness')],
   'verified_secondary_source'),

  ('MK', 'licence-class-guide', 'cultivator_producer',
   '["North Macedonia has operated a free-market medical cannabis cultivation and export regime since February 2016 -- private companies, not a state monopoly, hold licenses", "A EUR 300,000 bank guarantee and a share of net annual profit (10-20% depending on source) to the state budget are documented licensing requirements", "Cultivation requires sequential approval: Government of North Macedonia consent, then Ministry of Health approval (30 days), then a separate Ministry of Agriculture sowing/planting approval (15 days)", "The sector''s central operational bottleneck is that EU markets do not recognize Macedonian-issued GMP certificates, forcing exporters into costly foreign re-certification", "Roughly half of cultivation licenses issued 2016-2022 had lapsed by the most recent reporting -- licensing alone does not guarantee a durable operation"]'::jsonb,
   'Read the North Macedonia jurisdiction playbook before budgeting a cultivation or export license application',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://investnorthmacedonia.gov.mk/invest-pharmaceuticals/')],
   'verified_secondary_source'),

  ('NA', 'prohibition-risk-map', 'general',
   '["Namibia maintains full prohibition of cannabis for both recreational and medical use under an apartheid-era 1971 Act -- there is no legal pathway of any kind", "The Ministry of Health and Social Services has explicitly rejected commercial medical cannabis cultivation proposals, most recently in June 2024", "A constitutional challenge to the prohibition has been active in the Windhoek High Court since 2021 and remains unresolved, with a special-plea hearing held in May 2026 and no confirmed outcome located", "A coalition of advocacy groups submitted a fresh decriminalization proposal to the Ministry of Justice in June 2025 -- a live policy-review channel, not yet law", "Reported penalty figures conflict materially across sources (N$200,000-N$500,000 fines; 20-40 year maximum terms) -- do not rely on a single cited figure"]'::jsonb,
   'Read the Namibia jurisdiction playbook -- full prohibition with live, unresolved litigation to monitor',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/high-court-judge-wants-cannabis-legalisation-issues-trimmed/')],
   'verified_secondary_source'),

  ('KE', 'prohibition-risk-map', 'general',
   '["Cannabis remains fully illegal in Kenya under the 1994 Narcotic Drugs and Psychotropic Substances (Control) Act, with no operational medical or commercial licensing pathway despite a nominal statutory carve-out", "A 2022 amendment substantially reduced personal-use possession penalties (now up to 5 years / KSh 100,000 fine) compared to the pre-amendment regime", "The Rastafari Society of Kenya has an active religious-freedom case before the High Court seeking a narrow sacramental-use exemption -- judgment has been repeatedly postponed and was most recently expected 15 July 2026, with no ruling confirmed as of this review", "Even a favorable ruling in that case would not create any commercial or broad recreational legality", "Regional neighbors (Uganda, Rwanda, Ghana) have moved to licensed medical frameworks in 2025-2026, leaving Kenya and Tanzania as regional holdouts"]'::jsonb,
   'Read the Kenya jurisdiction playbook -- monitor the pending Rastafarian case but do not treat it as a legalization proceeding',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://herb.co/city-guides/buy-weed-kenya')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('TR','MK','NA','KE');
