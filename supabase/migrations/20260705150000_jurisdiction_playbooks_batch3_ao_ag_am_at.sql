-- Research batch 3 of jurisdiction_playbooks: Angola, Antigua and Barbuda, Armenia, Austria.
-- Real, sourced content replacing draft stub rows.

INSERT INTO public.source_registry (source_name, source_url, country, iso, region, tier, adapter, crawl_cadence, source_type, notes)
VALUES
  ('Wikipedia — Cannabis in Angola', 'https://en.wikipedia.org/wiki/Cannabis_in_Angola', 'Angola', 'AO', 'Africa', 2, 'html_snapshot', 'quarterly', 'reference', 'Law 3/99, no medical program, UN CND 2022 reaffirmation'),
  ('CannabisRegulations.ai — Angola CBD', 'https://www.cannabisregulations.ai/country-legality/angola-cbd', 'Angola', 'AO', 'Africa', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'ARMED non-approval, customs seizure practice'),
  ('US Dept of State — 2023 Intl Religious Freedom Report: Antigua and Barbuda', 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/antigua-and-barbuda/', 'Antigua and Barbuda', 'AG', 'Caribbean', 1, 'html_snapshot', 'quarterly', 'government_official', '2018 Cannabis Act thresholds, 2023 Rastafari/Hindu religious license'),
  ('Tripbase — Antigua and Barbuda drug laws 2026', 'https://www.tripbase.com/drug-laws/antigua-and-barbuda/', 'Antigua and Barbuda', 'AG', 'Caribbean', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Current possession/cultivation thresholds, MCA role'),
  ('Wikipedia — Cannabis in Armenia', 'https://en.wikipedia.org/wiki/Cannabis_in_Armenia', 'Armenia', 'AM', 'Asia', 2, 'html_snapshot', 'quarterly', 'reference', '2021 industrial hemp legalization, no personal/medical pathway'),
  ('Raw Organics EU — Is CBD legal in Armenia', 'https://www.raworganics.eu/en-us/blogs/news/is-cbd-legal-in-armenia', 'Armenia', 'AM', 'Asia', 2, 'html_snapshot', 'quarterly', 'legal_analysis', 'Hemp license terms: 10yr, THC cap, tonnage caps'),
  ('CMS Expert Guides — Cannabis law and legislation in Austria', 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/austria', 'Austria', 'AT', 'Europe', 1, 'html_snapshot', 'quarterly', 'legal_analysis', 'Law firm expert guide: SMG framework, medical/CBD/cosmetics rules'),
  ('Cannabis Europa — Is cannabis legal in Austria 2026 business guide', 'https://cannabis-europa.com/insights/is-cannabis-legal-in-austria/', 'Austria', 'AT', 'Europe', 2, 'html_snapshot', 'quarterly', 'trade_press', 'Medical channel scope, no adult-use reform in progress')
ON CONFLICT DO NOTHING;

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 0,
  estimated_cost_range = 'Not applicable — no legal market-entry pathway exists',
  legal_framework_summary = 'Cultivation, sale, possession, and consumption of cannabis are prohibited under Angolan drug law (Law No. 3/99), with no medical marijuana program in place. CBD is not explicitly addressed by separate legislation, but in practice the medicines regulator ARMED has not approved any cannabinoid product and customs authorities seize CBD imports at ports of entry. Enforcement of personal-use offenses is reportedly inconsistent despite the formal illegality, and cannabis remains Angola''s most widely cultivated illicit cash crop. Angola explicitly reaffirmed its prohibitionist stance at the UN Commission on Narcotic Drugs in 2022, even as neighboring Zimbabwe and Zambia have moved toward legalization.',
  steps = '[]'::jsonb,
  key_regulators = '["Ministry of Health","ARMED (medicines regulatory agency) — has not approved any cannabinoid product","AGT Customs (seizes CBD/cannabis imports at ports of entry)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming inconsistent street-level enforcement signals tolerance for any commercial activity — no legal commercial pathway exists regardless of enforcement patterns',
    'Assuming CBD is treated separately from THC — ARMED has approved no cannabinoid product and customs seizes CBD shipments the same as any cannabis product',
    'Assuming regional liberalization momentum (South Africa, Zimbabwe, Zambia) signals imminent Angolan reform — Angola explicitly reaffirmed prohibition at the 2022 UN CND'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently documented across reference and legal-analysis sources with no conflicting claims',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Angola')
WHERE country_iso2 = 'AO';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 18,
  estimated_cost_range = 'Personal possession/cultivation carries no licensing cost (15g/4-plant household threshold). Rastafari/Hindu religious cultivation license fees are waived by government policy. Commercial medical cultivation licensing fees via the Medicinal Cannabis Authority are not publicly standardized.',
  legal_framework_summary = 'The Cannabis Act, passed November 2018, decriminalized personal possession (currently applied at up to 15 grams) and home cultivation (up to 4 plants per household) for adults 18+, and established the Medicinal Cannabis Authority (MCA) to license medical cultivation, processing, and distribution. In 2023 the government extended sacramental cultivation and use rights to Rastafari and Hindu practitioners via a special religious license, permitting cultivation and use within a private dwelling or approved place of worship (with transport between the two), and waived licensing fees for Rastafari-owned operations — though this religious license explicitly excludes any commercial or financial transaction. There is no general legal retail market: sale outside licensed or religious channels and public consumption remain offenses, and importing cannabis into the country — even if legally obtained elsewhere — remains illegal.',
  steps = '[{"step":"Personal-use route","detail":"Adults 18+ may possess up to 15g and cultivate up to 4 plants per household without criminal prosecution"},{"step":"Religious/Rastafari or Hindu route","detail":"Apply for a special religious cultivation/use license; permits cultivation and use within a private dwelling or approved place of worship and transport between the two; commercial transactions explicitly excluded; fees waived for Rastafari-owned operations"},{"step":"Medical/commercial route","detail":"Apply to the Medicinal Cannabis Authority (MCA) for cultivation, processing, or distribution licensing"}]'::jsonb,
  key_regulators = '["Medicinal Cannabis Authority (MCA)","Royal Police Force of Antigua and Barbuda"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming decriminalization equals a legal commercial retail market — none exists; sale outside licensed channels remains illegal',
    'Assuming the Rastafari/Hindu religious license permits commercial activity — it explicitly excludes any commercial or financial transaction',
    'Bringing cannabis into the country from abroad — importation is illegal regardless of the domestic decriminalization framework'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — corroborated by the US State Department''s official religious-freedom reporting plus multiple independent news sources on the 2018 Act and 2023 religious licensing',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/antigua-and-barbuda/')
WHERE country_iso2 = 'AG';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'very_high', typical_timeline_months = 12,
  estimated_cost_range = 'Not applicable for personal, recreational, or medical use — no legal pathway exists. Industrial hemp: license issued by the Ministry of Health for a 10-year term (renewable); production capped at 20,000 tons of hemp flower and 20,000 tons of CBD oil annually per licensee.',
  legal_framework_summary = 'All cannabis use, possession, cultivation, and sale for personal, recreational, or medical purposes remains illegal and criminally prosecuted in Armenia, with no medical marijuana program despite past legislative discussion. In 2021, Armenia legalized industrial hemp production, manufacturing, sale, and export exclusively under a Ministry of Health license (10-year renewable term), requiring THC content below 0.3% and capping annual output at 20,000 tons of hemp flower and 20,000 tons of CBD oil per licensee, with growers required to report expected CBD levels before production. The industrial hemp law does not explicitly legalize CBD oil for consumer sale, and CBD/THC products are separately treated as illegal for import and possession — travelers have reportedly been denied entry for carrying CBD or THC products.',
  steps = '[{"step":"Industrial hemp license","detail":"Apply to the Ministry of Health for a 10-year hemp production/export license; THC must stay below 0.3%; annual production capped at 20,000 tons flower and 20,000 tons CBD oil"},{"step":"Pre-production compliance reporting","detail":"Licensees must report expected CBD levels to authorities before production begins"}]'::jsonb,
  key_regulators = '["Ministry of Health of the Republic of Armenia (hemp licensing authority)","Ministry of Economy (industrial hemp policy origin)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming the 2021 industrial hemp law creates any personal, medical, or CBD-consumption legality — it covers licensed industrial production/export only',
    'Traveling with CBD or THC products — Armenia does not distinguish CBD from THC for import/possession purposes and travelers have been denied entry over this',
    'Assuming personal use is decriminalized — Armenia''s Ministry of Health explicitly confirmed in 2019 there were no plans to decriminalize despite public rumors'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — consistently corroborated across Wikipedia, industry legal-analysis sources, and a news.am report citing the US Embassy Yerevan',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://en.wikipedia.org/wiki/Cannabis_in_Armenia')
WHERE country_iso2 = 'AM';

UPDATE public.jurisdiction_playbooks SET
  difficulty = 'moderate', typical_timeline_months = 12,
  estimated_cost_range = 'Hemp/CBD retail entry is relatively low-cost (certified seed sourcing, standard business registration). Medical/pharmaceutical-channel cultivation is restricted solely to AGES (the state health/food-safety agency) — no private domestic cultivation license is available for that channel.',
  legal_framework_summary = 'Recreational cannabis remains illegal under the Suchtmittelgesetz (Narcotic Substances Act, SMG, 1998), though small-quantity possession has been handled administratively rather than criminally since 2016. Medical cannabis has been legal since 2008 but only in a narrow pharmaceutical form: doctors may prescribe finished medicines — Sativex, pharmacy-compounded dronabinol, nabilone, and Epidyolex — but cannabis flower itself is not an authorized dispensing format, and AGES (Austrian Agency for Health and Food Safety) is the sole entity permitted to cultivate cannabis domestically for pharmaceutical use. Industrial hemp cultivation is legal for EU Common Catalogue varieties at or below 0.3% THC, and CBD products are widely sold but must be marketed as "aroma" or "technical" products rather than food or medicine under EU Novel Food rules. A 2025 Supreme Administrative Court ruling, codified into law in December 2025, reclassifies low-THC smokable hemp flower as a tobacco-monopoly product — from 2029 it may be sold only through licensed tobacconists (Trafiken), not ordinary hemp/CBD shops.',
  steps = '[{"step":"Hemp/CBD route","detail":"Source certified EU Common Catalogue seed varieties (<=0.3% THC); market CBD strictly as an aroma/technical product, not food or supplement, per EU Novel Food restrictions"},{"step":"Medical/pharma route","detail":"Obtain Austrian Trade Act production authorization from the Federal Ministry of Health for any cannabis-based pharmaceutical activity; note domestic flower cultivation for this channel is restricted solely to AGES"},{"step":"Plan for 2029 smokable-hemp transition","detail":"Once the Tobacco Monopoly Act amendment takes effect, low-THC smokable hemp flower must be sourced from approved wholesalers and sold exclusively through licensed tobacconists"}]'::jsonb,
  key_regulators = '["Federal Ministry of Health (medical/narcotics authorization)","AGES — Austrian Agency for Health and Food Safety (sole authorized domestic cultivator for pharmaceutical-channel cannabis)","Federal Ministry of Justice (SMG enforcement)","Tobacco Monopoly Administration (smokable hemp flower from 2029)"]'::jsonb,
  common_pitfalls = ARRAY[
    'Assuming Austria mirrors Germany''s flower-prescription medical model — it does not; only finished pharmaceutical products are prescribable, and flower is not an authorized dispensing format',
    'Marketing CBD as a food supplement or medicine — Austrian and EU Novel Food rules restrict this to aroma/technical product labeling only',
    'Planning smokable hemp flower retail through ordinary CBD shops after 2029 — the amended Tobacco Monopoly Act channels this exclusively through licensed tobacconists'
  ],
  status = 'published', last_reviewed = CURRENT_DATE,
  confidence_label = 'high — well corroborated across a law firm expert guide (CMS), independent trade-press analysis, and Wikipedia; one lower-quality source claimed broader flower-prescription reforms that could not be corroborated and was disregarded',
  last_verified_at = now(),
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/austria')
WHERE country_iso2 = 'AT';

UPDATE public.jurisdiction_playbooks_research_queue
SET playbook_status = 'published', last_researched_at = now(), last_researched_by = 'claude-agent'
WHERE country_code IN ('AO','AG','AM','AT');
