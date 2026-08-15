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
