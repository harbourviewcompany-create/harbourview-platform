-- Research batch 13 of jurisdiction_playbooks: Egypt, El Salvador, Equatorial Guinea, Eritrea.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('CannabisRegulations.ai — Egypt marijuana', 'https://www.cannabisregulations.ai/country-legality/egypt-marijuana', 'Egypt', 'EG', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law 182/1960 as amended by 122/1989, ANGA enforcement detail'),
  ('Sensi Seeds — Cannabis in Egypt', 'https://sensiseeds.com/en/blog/countries/cannabis-in-egypt-laws-use-history/', 'Egypt', 'EG', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Mustafa Soliman 2010 hemp seed oil case, Sinai cultivation detail'),
  ('LegalClarity — Is Weed Legal in El Salvador', 'https://legalclarity.org/is-weed-legal-in-el-salvador-what-the-law-says/', 'El Salvador', 'SV', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Ley Reguladora statutory citation, 2022 state of exception context'),
  ('Leafwell — Is Marijuana Legal in El Salvador', 'https://leafwell.com/blog/is-marijuana-legal-in-el-salvador', 'El Salvador', 'SV', 'Latin America', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '2019 Zablah medical bill failure, penalty escalation history'),
  ('Wikipedia — Cannabis in Equatorial Guinea', 'https://en.wikipedia.org/wiki/Cannabis_in_Equatorial_Guinea', 'Equatorial Guinea', 'GQ', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'No arrests in living memory as of 2000, ministers/civil servants openly using'),
  ('Leafwell — Is Marijuana Legal in Equatorial Guinea', 'https://leafwell.com/blog/is-marijuana-legal-in-equatorial-guinea', 'Equatorial Guinea', 'GQ', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Cultural "sacred weed" status, ceremonial history'),
  ('Wikipedia — Cannabis in Eritrea', 'https://en.wikipedia.org/wiki/Cannabis_in_Eritrea', 'Eritrea', 'ER', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Penal code personal-use vs trafficking distinction, arid terrain limits cultivation'),
  ('Leafwell — Is Marijuana Legal in Eritrea', 'https://leafwell.com/blog/is-marijuana-legal-in-eritrea', 'Eritrea', 'ER', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', '6-plant/12-month cultivation threshold, Italian-era historical hemp industry')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Egypt in all forms (including hashish and locally-grown "bango") under Anti-Narcotics Law No. 182 of 1960, as amended by Law No. 122 of 1989, which criminalizes cultivation, possession, sale, import, and export. Personal possession carries a minimum one-year prison sentence and fines starting at LE 1,000, often following lengthy pretrial detention; cultivation under Article 33 can carry life imprisonment with hard labor or the death penalty where trafficking intent is established, alongside fines of LE 100,000-500,000. There is no medical cannabis program, clinical trial pathway, or pharmacy stock of cannabinoid medicines, and the law does not distinguish CBD from THC-containing cannabis — a documented 2010 case saw a traveler face death-penalty charges for importing hemp seed oil. Despite the severe statutory framework, enforcement is genuinely inconsistent: cannabis has deep cultural roots (hashish cafes operate openly in many areas, and Sinai Peninsula cultivation is long-standing), and law enforcement is frequently lax toward personal use in practice, even as large-scale trafficking and import/export are prosecuted aggressively, particularly at international airports.',
  steps = '[]'::jsonb,
  key_regulators = '["Anti-Narcotics General Administration (ANGA), Ministry of Interior","Customs at Cairo, Hurghada, and Sharm El Sheikh airports (canine/X-ray screening)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming widespread cultural tolerance and open hashish-cafe culture signals legal tolerance for commercial activity or safety for foreigners — enforcement is genuinely inconsistent for personal use but foreign nationals receive no leniency, and import/export is prosecuted severely regardless of local social norms',
    'Bringing any CBD, hemp, or hash-derived product across Egyptian borders — the law draws no THC-content distinction, and a documented case saw a traveler face death-penalty charges for importing hemp seed oil',
    'Assuming Egypt is moving toward reform given its cannabis-friendly cultural reputation — there is no credible indication of any active legalization or decriminalization initiative as of 2026, and a prior 2018 reform proposal drew immediate political opposition and went nowhere'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across a dozen+ independent sources with consistent statutory citation and a specific documented case example',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.cannabisregulations.ai/country-legality/egypt-marijuana')
WHERE country_iso2 = 'EG';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in El Salvador for all purposes — recreational, medical, and industrial — under the Ley Reguladora de las Actividades Relativas a las Drogas, whose Article 3 lists cannabis among six prohibited drug categories and bans growing, producing, transporting, selling, possessing, and consuming it, with only a narrow exception for government-authorized scientific research or pharmaceutical manufacturing that functions rarely if at all in practice. Article 5 defines even unauthorized transport or storage as "illicit trafficking," a far broader category than typical drug-dealing. Possession penalties scale by quantity (roughly 1-3 years for under 2 grams, escalating sharply above that threshold into trafficking-level charges), and cultivation for any purpose — personal or commercial — can carry 10-15 years imprisonment, among the harshest cultivation penalties in the region. A 2019 bill from Deputy Francisco Zablah proposing a Ministry-of-Health-supervised medical cannabis framework created a study commission but was never enacted, and public support for reform remains very low (historically in the 8-31% range across surveys). Critically, El Salvador has operated under an ongoing "state of exception" since 2022 (implemented for gang-related security purposes) that suspends certain constitutional protections and permits prolonged detention without judicial review — this significantly raises the practical risk profile for anyone arrested on drug charges, including cannabis, beyond what the statute text alone suggests.',
  steps = '[]'::jsonb,
  key_regulators = '["National Civil Police (PNC)","Attorney General''s Office (Fiscalía General de la República)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming CBD or hemp-derived products are exempt — the law does not distinguish high-THC marijuana from low-THC hemp, and the US State Department explicitly warns that CBD products legal in the US are illegal in El Salvador',
    'Underestimating the impact of the 2022 state of exception — its suspension of standard due-process protections and permission for prolonged detention without judicial review materially increases risk exposure beyond ordinary statutory penalties',
    'Assuming El Salvador is likely to reform given broader Latin American trends — public support for legalization is among the lowest in the region, and the 2019 Zablah medical bill failed to advance despite a formal study commission'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — extensively corroborated across Wikipedia, multiple independent legal-analysis sources, and official US State Department travel guidance',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://legalclarity.org/is-weed-legal-in-el-salvador-what-the-law-says/')
WHERE country_iso2 = 'SV';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Equatorial Guinea for both recreational and medical use, with severe statutory penalties for production, sale, and possession. However, this is a distinctive case of near-total non-enforcement: cannabis, referred to locally as the "sacred weed of the people," has deep ceremonial and cultural significance, and multiple independent sources consistently report that it is openly used across all strata of society — including by government ministers and civil servants — with no recorded arrests for smoking or dealing cannabis in living memory as of a 2000 report. Cultivation is officially banned but widely practiced nationwide, often intercropped with cassava or banana plants, and some product is trafficked to neighboring Gabon via the Muni River. There is no legal industrial hemp, medical cannabis, or CBD framework of any kind.',
  steps = '[]'::jsonb,
  key_regulators = '["Equatorial Guinean national police and judicial enforcement bodies (documented as not enforcing personal-use provisions in practice)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the well-documented non-enforcement pattern creates any legal protection for commercial activity — the underlying law remains fully in force with severe on-paper penalties, and enforcement discretion could shift without warning, particularly for anything resembling organized commercial activity rather than personal cultural use',
    'Assuming this pattern is unique to cannabis specifically rather than reflecting broader governance and enforcement-capacity dynamics — treat any commercial plan as legally unprotected regardless of how consistently personal use has gone unprosecuted historically',
    'Assuming CBD or industrial hemp occupies a different legal category — no such distinction or framework exists; all cannabis activity falls under the same nominally severe prohibition'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — the illegal-but-unenforced pattern is unusually consistently corroborated across Wikipedia, Leafwell, CannaConnection, and independent travel/culture sources, with the "no arrests in living memory" claim specifically repeated across multiple independent sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Equatorial_Guinea')
WHERE country_iso2 = 'GQ';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cannabis is illegal in Eritrea for both medical and recreational purposes, with the country maintaining one of the strictest drug regimes in the world. Eritrea''s Penal Code distinguishes personal use from trafficking more explicitly than many jurisdictions: purchasing a controlled drug or plant for personal use does not by itself make someone party to trafficking, and personal possession/use is treated as a "less serious" offense than sale or distribution, which can carry lengthy imprisonment. Cultivation of up to six plants for personal use is charged as possession (up to 12 months imprisonment), while larger-scale cultivation can carry up to 10 years. CBD is not legally distinguished from other cannabis products and is equally illegal. Eritrea''s arid climate and terrain limit cannabis cultivation relative to many African neighbors, though some domestic small-scale growing persists; the country briefly had a hemp industry under Italian colonial rule in the early 20th century. Eritrea is also used as a transit hub for cannabis trafficking from South/Southeast Asia toward Africa, Asia, and Europe, and its security forces are known to actively crack down on suspected drug activity.',
  steps = '[]'::jsonb,
  key_regulators = '["Eritrean national police and security forces (active anti-trafficking enforcement)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the Penal Code''s personal-use/trafficking distinction amounts to decriminalization — personal use remains a criminal offense (up to 12 months for cultivation of up to 6 plants), just classified as less severe than trafficking',
    'Assuming CBD is treated separately from THC-containing cannabis — no such distinction exists in Eritrean law',
    'Assuming Eritrea''s brief Italian-colonial-era hemp industry has any bearing on current law or signals future reform — no legalization plans exist, and Eritrea remains among Africa''s most restrictive jurisdictions on this topic'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across reference and legal-analysis sources, with the personal-use/trafficking Penal Code distinction independently confirmed by multiple sources',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Eritrea')
WHERE country_iso2 = 'ER';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('EG','SV','GQ','ER');
