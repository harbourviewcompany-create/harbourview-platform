-- Batch 12: jurisdiction_playbooks + market_metrics + country_education_overlay for LI, TT, GD, IE
-- Real, sourced content closing all three content_coverage_queue gaps for these four countries.
-- LI: full, static prohibition since 1983; even industrial hemp banned since 2005; no reform movement.
-- TT: two-tier situation -- 2019 decriminalization is live; 2022 Cannabis Control Act is enacted
--     but had not been proclaimed into force as of the most recent reporting (days old at review).
-- GD: brand-new (Feb 2026) decriminalization + Rastafari sacramental framework; commercial/medical
--     licensing framework explicitly promised within 3-6 months of Jan 2026 but not yet published.
-- IE: fully illegal recreationally; narrow 3-condition MCAP under active April 2026 government review;
--     strong decriminalization reform momentum (Citizens' Assembly, Oireachtas Committee) not yet law.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('Wikipedia -- Cannabis in Liechtenstein',
   'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein',
   'reference', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   '1983 law, 1% THC statutory threshold, 2005 hemp ban, Minister Pedrazzini quote on rejecting liberalization'),
  ('Cannigma -- Cannabis laws in Liechtenstein',
   'https://cannigma.com/regulation/cannabis-laws-in-liechtenstein/',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'CBD legal-gray-zone analysis and non-EU status re: 2020 EU CJEU CBD ruling'),
  ('Leafwell -- Is Marijuana Legal in Liechtenstein?',
   'https://leafwell.com/blog/is-marijuana-legal-in-liechtenstein',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Sativex/Epidiolex prescription-only medical pathway detail'),
  ('CannaConnection -- Legal status of cannabis in Liechtenstein',
   'https://www.cannaconnection.com/blog/14675-legal-status-liechtenstein',
   'legal_analysis', 2, 'Liechtenstein', 'LI', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Confirms no anticipated near-term law changes'),

  ('Trinidad and Tobago Parliament -- The Cannabis Control Act, 2022',
   'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/',
   'government_official', 1, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Official record: Act No. 10 of 2022, assented 17-Jun-2022, gazetted 23-Jun-2022'),
  ('Jamaica Experiences -- Where is cannabis legal in the Caribbean: a guide',
   'https://www.jamaicaexperiences.com/blogs/details/article/where-is-cannabis-legal-in-the-caribbean-a-guide',
   'industry_press', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Most current confirmation that the Cannabis Control Act has yet to come into full effect'),
  ('Legal Aid and Advisory Authority (LAAA) -- The Decriminalization of Marijuana: Do''s and Don''ts',
   'https://laaa.org.tt/news-and-events/148-the-decriminalization-of-marijuana-the-dos-and-donts',
   'legal_analysis', 1, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   'Full tiered penalty schedule under the Dangerous Drugs Act as amended'),
  ('Marijuana Moment -- Trinidad And Tobago Government Introduces Marijuana Reform Bills',
   'https://www.marijuanamoment.net/trinidad-and-tobago-government-introduces-marijuana-reform-bills/',
   'news', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   '30% local-control licensing requirement, direct Al-Rawi quote'),
  ('nathuLAW -- Possession of cannabis decriminalised in Trinidad and Tobago',
   'https://nathulaw.com/possession-of-cannabis-decriminalised-in-trinidad-and-tobago/',
   'legal_analysis', 2, 'Trinidad and Tobago', 'TT', 'Americas', 'html_snapshot', 'quarterly', 'active', true, true,
   '2019 Act proclamation date and initial police-service offense guidance'),

  ('Cannabis Legalisation and Regulation Secretariat -- Government of Grenada',
   'https://www.cannabiscommission.gov.gd/',
   'government_official', 1, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'Official Grenadian government secretariat leading cannabis policy design and consultation'),
  ('International CBC -- Grenada Receives Governor-General Approval For Cannabis Reforms',
   'https://internationalcbc.com/grenada-receives-governor-general-approval-for-cannabis-reforms/',
   'industry_press', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms Feb 13 2026 assent and Feb 20 2026 Gazette Vol 144 No 9 publication'),
  ('Herb -- How to Buy Weed in Grenada: 2026 Visitor Guide',
   'https://herb.co/city-guides/buy-weed-grenada',
   'industry_press', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'monthly', 'active', true, true,
   'June 2026 on-the-ground confirmation of no licensed dispensaries yet operating'),
  ('Caribbean Today -- Grenada Parliament Approves Amendment to Marijuana Legislation',
   'https://caribbeantoday.com/sections/politics/grenada-parliament-approves-amendment-to-marijuana-legislation',
   'news', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'PM Mitchell and AG Joseph direct quotes from the parliamentary debate; 3-6 month framework commitment'),
  ('NOW Grenada -- Draft Bill and Policy Statement for the Decriminalisation of Cannabis in Grenada',
   'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/',
   'news', 2, 'Grenada', 'GD', 'Americas', 'html_snapshot', 'weekly', 'active', true, true,
   'Original draft Bill provisions ahead of the Jan 20 2026 Parliament tabling'),

  ('HPRA -- Medical Cannabis Access Programme (MCAP)',
   'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme',
   'government_official', 1, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'monthly', 'active', true, true,
   'Official regulator page: MCAP eligibility conditions and Ministerial Licence route'),
  ('Herb -- How to Buy Weed in Ireland in 2026: Laws, Medical Access & What''s Changing',
   'https://herb.co/city-guides/buy-weed-ireland',
   'industry_press', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'monthly', 'active', true, true,
   'May 2026 synthesis: April 2026 MCAP review, 2025 customs seizure data, reform timeline'),
  ('Cannigma -- Ireland Marijuana Laws 2026',
   'https://cannigma.com/regulation/ireland-marijuana-laws/',
   'legal_analysis', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'MCAP qualifying-conditions detail and Ministerial Licence patient count'),
  ('Business of Cannabis -- Ireland''s Cannabis Reform Gains Momentum',
   'https://businessofcannabis.com/irelands-cannabis-reform-gains-momentum-oireachtas-committee-pushes-decriminalisation-of-cannabis-in-ireland/',
   'industry_press', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Oireachtas Joint Committee interim report detail and cannabis social club model recommendation'),
  ('Wikipedia -- Cannabis in Ireland',
   'https://en.wikipedia.org/wiki/Cannabis_in_Ireland',
   'reference', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Legislative history, Citizens'' Assembly background, party-position tracking'),
  ('legalize.news -- Is Weed Legal in Ireland? 2026 Legal Status',
   'https://legalize.news/is-weed-legal-in-ireland',
   'legal_analysis', 2, 'Ireland', 'IE', 'Europe', 'html_snapshot', 'quarterly', 'active', true, true,
   'Full tiered possession-penalty schedule (1st/2nd/3rd offense) under the Misuse of Drugs Acts')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.jurisdiction_playbooks
  (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
   legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed, last_verified_at)
VALUES
(
  'LI', 'Liechtenstein', 'very_high', 0,
  'Not applicable -- no legal market-entry pathway exists for cultivation, processing, or sale of cannabis in any form; even industrial hemp has been banned since 2005',
  'Liechtenstein has maintained a stable, unreformed cannabis prohibition since the Law on Narcotics and Psychotropic Substances (Gesetz uber die Betaubungsmittel und die psychotropen Stoffe) was passed by the Landtag on 20 April 1983, which prohibits the cultivation, production, or sale of cannabis products with a THC content above 1%. Since a 2005 decree spearheaded by then-regent Prince Alois, industrial hemp has been banned for any use whatsoever, including as cattle feed, despite farmers having reported that European hemp feed calmed cows and increased milk yield. Liechtenstein has no medical marijuana program, but as a member of the European Medicines Agency framework it permits prescription-only access to the cannabinoid pharmaceuticals Sativex and Epidiolex (Epidyolex received its EU marketing authorization in September 2019). CBD sits in an unresolved gray zone: no law or regulation specifically bans CBD, and because cannabis is only legally defined as material above 1% THC, sub-threshold CBD products arguably fall outside the prohibition by implication rather than explicit exemption -- and because Liechtenstein is not an EU member, it is not bound by the EU Court of Justice''s 2020 ruling that CBD is not a narcotic. Penalties are real and enforced: possession of small amounts can draw a fine or up to one year of imprisonment, while selling or cultivating cannabis can draw up to three years. According to the World Drug Report 2011, 8.6% of Liechtenstein''s population used cannabis at least once annually, and a 2016 survey of 15-16-year-old students found 44% reported easy access to cannabis. Liechtenstein''s only organized reform push came in 2018, when the Free List political party toured the country advocating relaxed enforcement on fiscal grounds; then-Minister of Social Affairs Mauro Pedrazzini publicly declined to embrace liberalization, saying he preferred to "wait and see" the actions of neighboring countries and explicitly stating he did not want Liechtenstein to become a "stoner stronghold in the Rhine Valley." No further legislative reform initiative has been identified since, and multiple independent consumer-facing legal guides explicitly state they are not aware of any anticipated near-term change, notwithstanding Liechtenstein''s close economic and customs ties to Switzerland, which has itself run regulated-sale pilot programs.',
  '[]'::jsonb,
  '["Landtag (national parliament) -- enacted the 1983 Law on Narcotics and Psychotropic Substances", "Amt fur Gesundheit (Office of Public Health) -- enforcement and any EMA-authorized pharmaceutical access", "Ministry of Social Affairs -- has publicly and explicitly opposed liberalization"]'::jsonb,
  ARRAY[
    'Assuming Liechtenstein''s close economic and customs ties to Switzerland extend to cannabis policy -- Switzerland''s regulated-sale pilot programs have not been adopted or referenced as a template by Liechtenstein''s government',
    'Assuming CBD products are clearly and affirmatively legal -- the status rests on an interpretive gap (cannabis is only statutorily defined above 1% THC) rather than an explicit legal carve-out, and Liechtenstein''s non-EU status means it is not bound by EU-level CBD rulings',
    'Treating the 2018 Free List reform push as an active or ongoing legislative process -- it did not advance, the responsible minister publicly and explicitly rejected liberalization, and no subsequent government reform initiative has been identified'
  ],
  'published',
  'high -- the core prohibition, the 1% THC statutory threshold, and the 2005 hemp ban are consistently corroborated across Wikipedia, Cannigma, and Leafwell; the near-total absence of any reform movement is corroborated by multiple independent consumer-facing legal guides that explicitly note no anticipated changes, though these secondary sources are not all recently updated and should be spot-checked for very recent developments',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein'),
  CURRENT_DATE, now()
),
(
  'TT', 'Trinidad and Tobago', 'high', 0,
  'Not applicable for commercial licensing -- the Cannabis Control Act, 2022 (Act No. 10 of 2022) has been passed and gazetted but had not been proclaimed into force as of the most recent reporting, so the Cannabis Licensing Authority is not yet operational and no commercial licenses can currently be applied for',
  'Trinidad and Tobago operates on two distinct legal layers that are frequently conflated. The first, currently in force, is decriminalization under the Dangerous Drugs (Amendment) Act No. 24 of 2019, proclaimed 23 December 2019: adults may possess up to 30 grams of cannabis or 5 grams of cannabis resin without criminal charge, and may cultivate up to 4 cannabis plants per household. Possession above those thresholds is tiered: 30-60g (or 5-10g resin) draws a fixed penalty/fine of up to TTD 50,000 on summary conviction; 60-100g (or 10-14g resin) up to TTD 75,000; and above 100g (or 14g resin) escalates to a TTD 250,000 fine plus up to 5 years'' imprisonment on summary conviction, or a TTD 1,000,000 fine plus up to 15 years on indictment. Public smoking remains an offense (up to TTD 50,000 fine), and sale or distribution of any amount is treated as drug trafficking, carrying up to TTD 3,000,000 or 10 times street value plus potential life imprisonment on indictment -- with enhanced exposure within 500 metres of a school. The second layer -- a licensed commercial, medical, and religious cannabis industry -- exists in statute but is not yet operational. The Cannabis Control Bill, 2020 passed the House of Representatives unanimously, passed the Senate on 18 May 2022, received assent on 17 June 2022, and was gazetted 23 June 2022 as the Cannabis Control Act, 2022. The Act establishes the Trinidad and Tobago Cannabis Licensing Authority and creates license categories spanning cultivation, laboratory/testing, processing, retail distribution/dispensing, import, export, transport, and religious use; corporate applicants must maintain at least 30% local (Trinidad and Tobago or CARICOM-citizen) control, explicitly designed, per then-Attorney General Faris Al-Rawi, to "avoid the abuses that occurred with multinational domination in other territories." However, as of the most recent reporting located (mid-2026), the Act had not been proclaimed into force, meaning the Licensing Authority has not been constituted and no commercial licenses -- cultivation, dispensary, or otherwise -- have been issued; selling cannabis, including under a claimed medical or religious rationale without formal authorization, remains a criminal offense, with unauthorized medicinal use carrying a fine and up to 10 years'' imprisonment. A visible but entirely informal cannabis commerce already operates in the gap between decriminalized possession and the still-dormant licensing framework. CARICOM''s 2018 Regional Commission on Marijuana report concluded that considerable economic benefits could be gained from a more liberalized regional cannabis regime, a finding regularly cited by domestic reform advocates pressing the government to proclaim the 2022 Act.',
  '[
    {"step": "Track proclamation status directly with the Attorney General''s office or T&T Parliament before assuming any license category is actually open", "detail": "The Cannabis Control Act, 2022 is enacted law but had not been proclaimed into force as of the most recent reporting, so the Licensing Authority does not yet exist as an operating body"},
    {"step": "Understand the decriminalization layer is already fully live and operates independently", "detail": "30g personal possession / 4-plant household cultivation thresholds under the 2019 Act apply today regardless of the 2022 Act''s proclamation status"},
    {"step": "Plan for the 30% local/CARICOM-ownership requirement once licensing opens", "detail": "Wholly foreign-owned entities will not qualify under the Act as drafted; corporate applicants must maintain at least 30% Trinidad and Tobago or CARICOM-citizen control"},
    {"step": "Identify the correct license category in advance", "detail": "Cultivation, laboratory, processing, retail distribution (dispensary), import, export, transport, and religious-use licenses are separately defined under the Act"},
    {"step": "Treat any current commercial cannabis activity in the market as informal and unlicensed", "detail": "No legal retail or wholesale channel exists yet, and participating in one carries real trafficking-level criminal exposure regardless of the 2019 decriminalization"}
  ]'::jsonb,
  '["Trinidad and Tobago Cannabis Licensing Authority -- established by the 2022 Act but not yet constituted pending proclamation", "Ministry of the Attorney General and Legal Affairs -- policy ownership of the Cannabis Control Act", "Trinidad and Tobago Police Service -- enforcement of the Dangerous Drugs Act"]'::jsonb,
  ARRAY[
    'Treating the Cannabis Control Act, 2022 as operational because it has been passed and gazetted -- passage and proclamation are legally distinct steps, and the Act had not been proclaimed into force as of the most recent reporting, meaning the Licensing Authority does not yet exist',
    'Assuming decriminalized personal possession extends to sale or commercial activity -- selling cannabis in any amount, and cultivating beyond the 4-plant household limit, remain serious criminal offenses with trafficking-level penalties',
    'Assuming a wholly foreign-owned entity can qualify once licensing does open -- the Act requires at least 30% local (Trinidad and Tobago or CARICOM) control for corporate applicants'
  ],
  'published',
  'high -- the two-tier structure (2019 decriminalization in force; 2022 Act enacted but not proclaimed) is directly corroborated by Trinidad and Tobago''s own Parliament records (bill/Act pages with assent and gazette dates) and by a Caribbean regional guide updated within days of this review confirming the Act "has yet to come into full effect"; specific penalty figures are corroborated by a Trinidad-based legal aid authority (LAAA) citing the Dangerous Drugs Act directly',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/'),
  CURRENT_DATE, now()
),
(
  'GD', 'Grenada', 'high', 0,
  'Not applicable for commercial cultivation, processing, or medical licensing -- that framework was still under development as of the most recent reporting, with government having targeted a 3-6 month timeline (from January 2026) to publish it; household cultivation registration (up to 4 plants) is an administrative process through the Cannabis Secretariat and Ministry of Agriculture rather than a commercial license',
  'Grenada substantially reformed its cannabis law via the Drug Abuse (Prevention and Control) (Amendment) Act, 2026, tabled in Parliament on 20 January 2026, passed with cross-party support within days, assented by Governor-General Dame Cecile La Grenade on 13 February 2026, and published in the Government Gazette (Volume 144, Number 9) on 20 February 2026 -- one of the most recently enacted cannabis reforms in the Caribbean at time of review. The Act decriminalizes possession of up to 56 grams of cannabis and 15 grams of cannabis resin for adults aged 21 and over (Prime Minister Dickon Mitchell said he had personally favored setting the threshold at 18, the age of civil majority for voting, driving, and marriage, but deferred to "passionate" parliamentary debate favoring 21); it permits registered household cultivation of up to 4 plants for medicinal, therapeutic, or horticultural purposes, with registration required through the Cannabis Secretariat and Ministry of Agriculture; and it creates a specific religious-use framework recognizing Rastafari sacramental cannabis use, under which the Minister may authorize cultivation on designated lands, and registered places of worship and Minister-recognized "exempt events" receive legal protection. The Act also mandates an amnesty and automatic-expungement pathway for qualifying past minor cannabis convictions, with the review Board empowered to expunge records including on its own motion. Public consumption remains restricted -- violations carry a $300 fixed penalty or up to a $5,000 fine, with enhanced prohibitions within 100 yards of schools and 5 metres of public entrances -- and the Act explicitly does not create a recreational commercial market: both Health Minister Phillip Telesford and Attorney General Claudette Joseph were explicit during the parliamentary debate that recreational retail sale remains prohibited, with any commercial track limited to a still-pending medical and therapeutic framework. At the time of passage, government officials stated they would move within three to six months to develop a comprehensive national cannabis policy and supporting legislation covering cultivation, processing, research, and medicinal distribution; as of the most recent reporting located (June 2026), a visitor-facing industry guide found no official evidence of any licensed recreational or medical dispensary operating in Grenada, meaning the commercial framework remains in development. The pre-existing Cannabis Legalisation and Regulation Secretariat, operating under the Ministry of Agriculture, is the body conducting stakeholder consultation and is expected to lead design of that forthcoming regulatory framework.',
  '[
    {"step": "Register for household cultivation with the Cannabis Secretariat and Ministry of Agriculture if pursuing the personal/therapeutic track", "detail": "Up to 4 plants per household are permitted once registered; formal registration guidelines were still being finalized by the Secretariat around the time of the Act''s passage"},
    {"step": "Monitor the Cannabis Legalisation and Regulation Secretariat for the promised national cannabis policy framework", "detail": "Government committed to a 3-6 month timeline (from January 2026) for legislation covering commercial cultivation, processing, research, and medicinal distribution; no commercial licensing category exists yet"},
    {"step": "If pursuing Rastafari sacramental cultivation, apply for Ministerial authorization on designated lands", "detail": "This is a distinct legal pathway from household registration, tied to registered places of worship or Minister-recognized exempt events"},
    {"step": "Do not assume any current commercial activity is licensed", "detail": "A June 2026 visitor-facing review found no evidence of licensed recreational or medical dispensaries operating in Grenada as of that review"},
    {"step": "Respect public-consumption restrictions when evaluating any hospitality or tourism angle", "detail": "Use in or near public places, including many hotel common areas, can trigger fines, and individual properties vary widely in their own policies"}
  ]'::jsonb,
  '["Cannabis Legalisation and Regulation Secretariat (Ministry of Agriculture) -- policy design and stakeholder consultation for the forthcoming commercial framework", "Ministry of Agriculture -- household cultivation registration", "Office of the Attorney General -- legislative drafting and legal policy"]'::jsonb,
  ARRAY[
    'Assuming the February 2026 Act creates any form of legal commercial market -- both the Attorney General and Health Minister were explicit that recreational retail sale remains prohibited, and the promised medical/therapeutic licensing framework had not been published as of the most recent reporting',
    'Treating Grenada''s 56-gram possession limit (nearly 4x Antigua and Barbuda''s 15g) as evidence of a more commercially permissive environment overall -- the generous personal-possession threshold does not translate into an open licensing environment, which remains entirely undeveloped',
    'Assuming hotel and resort properties uniformly tolerate cannabis use -- policies vary sharply by property, and public-space rules under the Act apply to many common hotel areas regardless of a property''s informal stance'
  ],
  'published',
  'high -- the Act''s key provisions (56g/15g possession threshold, 4-plant household registration, Rastafari sacramental framework, expungement mechanism) are directly corroborated by Grenada''s own government secretariat, multiple Caribbean regional news outlets reporting from the parliamentary debate itself, and a June 2026 visitor-facing guide confirming no commercial dispensaries yet exist; the promised 3-6 month commercial-framework timeline is a government commitment as reported at time of passage and had not been independently confirmed as met or missed as of this review',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabiscommission.gov.gd/'),
  CURRENT_DATE, now()
),
(
  'IE', 'Ireland', 'high', 0,
  'Not applicable for cultivation, processing, or retail sale -- fully illegal outside two narrow license routes (industrial hemp cultivation permits and Ministerial/MCAP medical prescribing); industrial hemp cultivation requires an annual Department of Health license with no standardized public fee schedule identified',
  'Cannabis is illegal in Ireland for recreational use under the Misuse of Drugs Acts 1977-1984, which schedule cannabis as a controlled substance permitting cultivation, sale, or possession only under Ministerial license. Possession penalties are tiered by offense count: a first offense draws a fine up to EUR 381 on summary conviction (up to EUR 635 on indictment); a second offense up to EUR 508 (EUR 1,269 on indictment); a third or subsequent offense escalates to a fine up to EUR 1,269 or imprisonment up to 12 months summarily, or up to 3 years on indictment. CBD is legal for sale if THC content is below 0.2%, though CBD is not listed as a medical product by the Health Products Regulatory Authority (HPRA) and cannot be formally prescribed; cannabis seeds may be legally bought, sold, and imported despite cultivation itself being illegal without a license -- a frequently misunderstood quirk of the law. Industrial hemp cultivation is legal under an annual Department of Health license, with plantations required to stay under 0.2% THC and be sited away from public roads. Medical access runs through the Medical Cannabis Access Programme (MCAP), a pilot launched in 2021 following 2019 enabling legislation and originally set to run five years; a consultant may prescribe a cannabis-based product only for three defined, treatment-resistant conditions -- spasticity associated with multiple sclerosis, intractable chemotherapy-related nausea and vomiting, and severe refractory epilepsy -- for up to six months at a time, and only after standard treatments have failed. A separate, broader Ministerial Licence route lets a registered practitioner seek the Health Minister''s written approval to prescribe any cannabis product for any condition, but this pathway has reached only a small number of patients (sources vary: roughly 63-74 patients cited across recent reporting windows), leading Irish media to describe the programme as effectively failing patients at scale. In April 2026, Health Minister Jennifer Carroll MacNeill launched a formal government review of MCAP, commissioning Professor Shane Allwright to assess whether eligibility should be expanded -- a live, active process without a concluded outcome as of this review. Separately, reform momentum on the recreational/decriminalization side has been building without yet producing legislation: Ireland''s Citizens'' Assembly on Drug Use recommended decriminalizing personal possession of all drugs in January 2024; the Oireachtas Joint Committee on Drug Use published an interim report in late 2024 (sources cite differing recommendation counts across drafting stages) backing decriminalization and specifically recommending against mandatory health-service referrals for personal possession, while also proposing a Germany/Malta-style regulated non-profit cannabis social club model rather than commercial retail; committee chair Gary Gannon called it "a recognition that criminalizing people for their own drug use has not reduced risks." None of these recommendations had been enacted into law as of the most recent reporting, and successive governments have shown more openness to decriminalization than to full legalization. Enforcement remains real and current: cannabis seized at Irish customs in 2025 was valued at approximately EUR 107 million, with roughly EUR 46 million of that originating from the United States.',
  '[
    {"step": "Distinguish the three separate legal channels before assuming any pathway applies", "detail": "CBD retail (under 0.2% THC, unregulated as a medicine), licensed industrial hemp cultivation (Department of Health annual license, under 0.2% THC), and MCAP/Ministerial medical prescribing (narrow, prescriber-led, not a commercial retail model) are entirely distinct, and none permits a general cannabis business"},
    {"step": "Apply for an annual Department of Health hemp cultivation license if pursuing industrial hemp", "detail": "Plantations must stay under 0.2% THC and be located away from public roads, with the license renewed yearly"},
    {"step": "Track the April 2026 MCAP review before assuming current medical-access criteria are final", "detail": "Professor Shane Allwright''s government-commissioned assessment of whether to expand MCAP eligibility was still underway as of this review"},
    {"step": "Monitor the Oireachtas Joint Committee''s decriminalization recommendations as a policy signal, not enacted law", "detail": "As of the most recent reporting, none of the committee''s or Citizens'' Assembly''s recommendations had been passed into legislation"},
    {"step": "Do not assume cannabis seed legality implies cultivation is permitted", "detail": "Seeds may be legally bought and sold in Ireland, but germinating and growing cannabis without a Ministerial license remains a criminal offense"}
  ]'::jsonb,
  '["Health Products Regulatory Authority (HPRA) -- administers the Medical Cannabis Access Programme and controlled-drug licensing", "Department of Health -- Ministerial Licence approvals and industrial hemp cultivation licenses", "An Garda Siochana -- enforcement of the Misuse of Drugs Acts"]'::jsonb,
  ARRAY[
    'Assuming the strong political and public reform momentum (Citizens'' Assembly, Oireachtas Committee recommendations) means legalization or decriminalization is imminent -- multiple reporting cycles across 2024-2026 confirm no legislative change had been enacted as of this review, and the process has historically moved slowly',
    'Treating the Medical Cannabis Access Programme as a broad or commercially significant medical market -- it covers only three narrow, treatment-resistant conditions with consultant sign-off required, and total Ministerial Licence patient counts remain in the low dozens to low hundreds depending on the source',
    'Assuming CBD''s legal retail status means it can be marketed with medical claims -- CBD is not HPRA-listed as a medical product and cannot be formally prescribed, keeping it in a wellness/retail category distinct from the regulated MCAP pathway'
  ],
  'published',
  'high -- the current legal framework, MCAP structure, and 2025 customs seizure data are corroborated across Herb''s May 2026 guide, the official HPRA MCAP page, Cannigma, and Wikipedia; the exact Ministerial Licence patient count shows a source conflict (63 vs. 74 patients across different reporting windows) and is flagged rather than resolved; the Oireachtas Committee recommendation count also varies by source, likely reflecting different drafting stages of the same interim report',
  (SELECT id FROM public.source_registry WHERE source_url = 'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme'),
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
  ('LI', 'annual_cannabis_use_prevalence_rate', 8.6, 'percent', '2011-01-01', '2011-12-31', 'point_in_time', 'observed', 'low',
   'World Drug Report 2011 (via Wikipedia)', 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein', '2011-01-01',
   'UNODC-sourced figure; no more recent official prevalence estimate for Liechtenstein was located, so treat as dated background context'),
  ('LI', 'youth_easy_access_to_cannabis_rate', 44, 'percent', '2016-01-01', '2016-12-31', 'point_in_time', 'observed', 'medium',
   'Wikipedia -- Cannabis in Liechtenstein', 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein', '2025-04-07',
   'Share of surveyed 15-16-year-old students reporting easy access to cannabis'),

  ('TT', 'personal_possession_threshold_2019', 30, 'grams', '2019-12-23', '2019-12-23', 'point_in_time', 'observed', 'high',
   'nathuLAW -- Possession of cannabis decriminalised in Trinidad and Tobago',
   'https://nathulaw.com/possession-of-cannabis-decriminalised-in-trinidad-and-tobago/', '2019-12-23',
   'Decriminalized personal-possession ceiling under the Dangerous Drugs (Amendment) Act No. 24 of 2019; separate 5-gram ceiling applies to cannabis resin'),
  ('TT', 'corporate_license_local_ownership_requirement', 30, 'percent', '2022-06-23', '2022-06-23', 'point_in_time', 'observed', 'high',
   'Marijuana Moment -- Trinidad And Tobago Government Introduces Marijuana Reform Bills',
   'https://www.marijuanamoment.net/trinidad-and-tobago-government-introduces-marijuana-reform-bills/', '2019-11-25',
   'Minimum local/CARICOM-citizen control required for corporate licensees under the Cannabis Control Act, 2022, once proclaimed and operational'),
  ('TT', 'maximum_trafficking_fine', 3000000, 'TTD', '2019-12-23', '2026-12-31', 'point_in_time', 'observed', 'high',
   'Legal Aid and Advisory Authority (LAAA) -- The Decriminalization of Marijuana',
   'https://laaa.org.tt/news-and-events/148-the-decriminalization-of-marijuana-the-dos-and-donts', '2025-02-13',
   'Maximum fine on indictment for cannabis sale/trafficking (or 10x street value, whichever is greater), paired with potential life imprisonment'),

  ('GD', 'personal_possession_threshold_2026', 56, 'grams', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'high',
   'International CBC -- Grenada Receives Governor-General Approval For Cannabis Reforms',
   'https://internationalcbc.com/grenada-receives-governor-general-approval-for-cannabis-reforms/', '2026-03-09',
   'Decriminalized possession ceiling for adults 21+ under the Drug Abuse (Prevention and Control) (Amendment) Act, 2026; separate 15-gram ceiling applies to cannabis resin'),
  ('GD', 'household_cultivation_plant_limit', 4, 'plants', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'high',
   'NOW Grenada -- Draft Bill and Policy Statement for the Decriminalisation of Cannabis in Grenada',
   'https://nowgrenada.com/2026/01/draft-bill-and-policy-statement-for-the-decriminalisation-of-cannabis-in-grenada/', '2026-01-15',
   'Registered household cultivation limit for medicinal, therapeutic, or horticultural purposes'),
  ('GD', 'public_consumption_max_fine', 5000, 'XCD', '2026-02-20', '2026-02-20', 'point_in_time', 'observed', 'medium',
   'Herb -- How to Buy Weed in Grenada: 2026 Visitor Guide', 'https://herb.co/city-guides/buy-weed-grenada', '2026-06-08',
   'Alternative to a lower $300 fixed penalty for public consumption; currency assumed East Caribbean dollars (XCD) based on Grenada''s national currency, not explicitly specified in source'),

  ('IE', 'cannabis_customs_seizure_value_2025', 107000000, 'EUR', '2025-01-01', '2025-12-31', 'annual', 'observed', 'high',
   'Herb -- How to Buy Weed in Ireland in 2026', 'https://herb.co/city-guides/buy-weed-ireland', '2026-05-14',
   'Total value of cannabis seized at Irish customs during 2025'),
  ('IE', 'cannabis_customs_seizure_from_us_2025', 46000000, 'EUR', '2025-01-01', '2025-12-31', 'annual', 'observed', 'medium',
   'Herb -- How to Buy Weed in Ireland in 2026', 'https://herb.co/city-guides/buy-weed-ireland', '2026-05-14',
   'Portion of the 2025 total customs seizure value reported as originating from the United States'),
  ('IE', 'mcap_ministerial_licence_patients', 63, 'patients', '2025-01-01', '2025-12-31', 'point_in_time', 'observed', 'low',
   'Cannigma -- Ireland Marijuana Laws 2026 (via Prohibition Partners)', 'https://cannigma.com/regulation/ireland-marijuana-laws/', '2026-02-17',
   'Patient count under the broader Ministerial Licence route (any condition, Health Minister written approval); a separate report cites 74 patients over a 5-year window -- an unresolved cross-source conflict, flagged rather than resolved')
ON CONFLICT (country_iso2, metric_name, period_start, period_end) DO NOTHING;

INSERT INTO public.country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('LI', 'prohibition-risk-map', 'general',
   '["Liechtenstein has maintained full cannabis prohibition unchanged since 1983, with even industrial hemp banned since 2005", "No medical marijuana program exists, though Sativex and Epidiolex are available strictly by prescription", "CBD sits in an unresolved legal gray zone rather than an affirmatively legal category -- Liechtenstein is not bound by EU-level CBD rulings as a non-EU state", "The only organized reform push (2018) was explicitly and publicly rejected by the responsible government minister, and no reform initiative has followed since"]'::jsonb,
   'Read the Liechtenstein jurisdiction playbook -- static full prohibition with no active reform signal',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Liechtenstein')],
   'verified_secondary_source'),

  ('TT', 'market-access-strategy', 'investor_operator',
   '["Trinidad and Tobago has two distinct legal layers: 2019 decriminalization is fully in force today, while the 2022 Cannabis Control Act (commercial licensing) is enacted law but had not been proclaimed into force as of the most recent reporting", "The Cannabis Licensing Authority created by the 2022 Act does not yet exist as an operating body, so no commercial cultivation, processing, or dispensary licenses can currently be applied for", "Corporate license applicants will need at least 30% local (Trinidad and Tobago or CARICOM-citizen) control once licensing opens", "Selling cannabis in any amount remains a serious criminal offense today, regardless of the 2019 decriminalization of personal possession"]'::jsonb,
   'Read the Trinidad and Tobago jurisdiction playbook -- track proclamation status before assuming any commercial licence is open',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.ttparliament.org/publication/the-cannabis-control-act-2022/')],
   'verified_secondary_source'),

  ('GD', 'market-access-strategy', 'investor_operator',
   '["Grenada enacted the Drug Abuse (Prevention and Control) (Amendment) Act, 2026 in February 2026, decriminalizing possession (56g/15g resin) for adults 21+ and permitting registered 4-plant household cultivation", "The Act explicitly does not create a recreational commercial market -- both the Health Minister and Attorney General were clear that retail sale remains prohibited", "Government committed to publishing a national commercial/medical cannabis policy framework within 3-6 months of January 2026, but as of the most recent reporting (June 2026) no licensed dispensaries were confirmed operating", "A distinct Rastafari sacramental-use framework allows Ministerial authorization for cultivation on designated lands and at registered places of worship"]'::jsonb,
   'Read the Grenada jurisdiction playbook -- decriminalization is live, but the commercial licensing framework is still pending',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabiscommission.gov.gd/')],
   'verified_secondary_source'),

  ('IE', 'patient-access-pathways', 'patient_general',
   '["Cannabis remains fully illegal in Ireland for recreational use; medical access runs only through the narrow Medical Cannabis Access Programme (MCAP), covering three treatment-resistant conditions after standard treatments have failed", "A separate Ministerial Licence route allows any-condition prescribing with the Health Minister''s written approval, but has reached only a small number of patients", "In April 2026, the government launched a formal review of MCAP eligibility, led by Professor Shane Allwright -- an active, unresolved process as of this review", "Strong reform momentum exists (Citizens'' Assembly, Oireachtas Committee recommendations favoring decriminalization and a Germany/Malta-style social club model) but none of it had been enacted into law as of the most recent reporting"]'::jsonb,
   'Read the Ireland jurisdiction playbook for the full MCAP eligibility criteria and the pending eligibility review',
   ARRAY[(SELECT id FROM public.source_registry WHERE source_url = 'https://www.hpra.ie/regulation/controlled-drugs/medical-cannabis-access-programme')],
   'verified_secondary_source')
ON CONFLICT (country_iso2, module_key, role_id) DO NOTHING;

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('LI','TT','GD','IE');
