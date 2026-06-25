
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritania','country','MR','Prohibited; Strict Islamic Law Influence',
'Cannabis is prohibited in Mauritania under a legal framework influenced by Islamic jurisprudence as well as civil drug laws. Penalties are severe. No medical cannabis program exists and no reform is under consideration.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministère de la Santé; security forces for enforcement.',
'Mauritanian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mauritius','country','MU','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Mauritius under the Dangerous Drugs Act. Mauritius has historically maintained strict drug enforcement policies, with significant penalties including mandatory minimum sentences. Cannabis use is prevalent in some communities but enforcement is active. No medical cannabis program exists.',
'No legal patient access pathway exists. Mauritius''s strict drug laws leave no pathways for medical access.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medicines are available through the Mauritius healthcare system.',
'No licensed market exists. The country''s financial services orientation has not included cannabis industry development.',
'Cannabis reform has been discussed in civil society but is not a current government priority. Mauritius''s legal framework may be influenced by Commonwealth peer developments, particularly the UK and Australia, but no near-term legislative action is anticipated.',
'Mauritius Drug Unit (MDU); Ministry of Health and Wellness.',
'Dangerous Drugs Act; Mauritius Drug Unit reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MU' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'morocco','country','MA','Medical and Industrial Legal (since 2021); Major Global Hashish Producer',
'Morocco is the world''s largest producer of cannabis resin (hashish) and passed Law 13-21 in 2021, ending 54 years of formal prohibition by legalizing cannabis for medical, industrial, and cosmetic purposes. The National Agency for the Regulation of Cannabis Activities (ANRAC) was established to license and regulate the sector. The Rif Mountain region, particularly around Ketama, has been the center of traditional hashish production for generations. The regulated program focuses on channeling existing cultivation into a licensed framework.',
'Domestic patient access to medical cannabis products is being developed. Patients will be able to access licensed medical cannabis through authorized healthcare channels as domestic production and distribution frameworks are operationalized.',
'Moroccan physicians are beginning to engage with the new medical cannabis regulatory framework. Clinical guidelines are being developed. Specialist access initially for neurological and pain conditions.',
'Morocco''s regulated cannabis sector has enormous scale potential given existing cultivation infrastructure. The Rif region''s tens of thousands of farming families and centuries of cultivation expertise are the base. Export licensing for medical and pharmaceutical cannabis to Europe and beyond is a primary policy goal. International investment in licensed Moroccan cannabis production has begun.',
'ANRAC is developing the full licensing and regulatory infrastructure. Export market access to the EU, requiring GMP certification, is the near-term industry priority. The transition from informal to formal production is a significant social and economic policy challenge in the Rif region. Morocco''s cannabis legalization is one of the most consequential in global regulatory history given scale.',
'ANRAC (Agence Nationale de Réglementation des Activités liées au Cannabis) under the Head of Government''s Office. Ministry of Health for medical product authorization.',
'Law 13-21 (2021); ANRAC implementing regulations; Ministry of Health guidance; traditional production region data','Current as of Q2 2026; verified against ANRAC official guidance','Quarterly','Full country-level briefing covering landmark 2021 legalization, world''s largest hashish production base, and regulated sector development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mozambique','country','MZ','Prohibited',
'Cannabis is prohibited in Mozambique. No medical cannabis program exists. Mozambique has not engaged in formal cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'PRM (Polícia da República de Moçambique); Ministry of Health (MISAU).',
'Mozambique drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'namibia','country','NA','Decriminalized (Personal Use); Medical Access Under Development',
'Namibia''s High Court ruled in 2018 that private cannabis use and possession was not criminally unlawful, effectively decriminalizing personal use. The government has been developing a formal medical cannabis licensing framework since 2021. No licensed commercial market exists as of 2026, but Namibia is positioned as a progressive regional reformer with growing regulatory capacity.',
'No formal licensed patient access pathway exists yet, though the constitutional recognition of personal use provides implicit tolerance. Medical program licensing, when operational, will provide formal access.',
'Physicians are not yet able to formally prescribe cannabis under a regulated framework. Medical associations have engaged with the Ministry of Health on forthcoming regulatory frameworks.',
'No licensed commercial market exists. Namibia''s combination of decriminalization, suitable agricultural conditions, and a developing regulatory framework positions it for near-term licensed production.',
'Namibia is expected to operationalize medical cannabis licensing regulations in 2025–2027. The country''s stable governance and professional regulatory infrastructure make it a credible candidate for attracting cannabis investment. Export market orientation is expected.',
'Ministry of Health and Social Services (MoHSS); Namibia Police Force (NAMPOL) for enforcement.',
'High Court ruling 2018; MoHSS cannabis framework development; regional comparative monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization ruling and pending medical licensing framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'niger','country','NE','Prohibited',
'Cannabis is prohibited in Niger. The country faces significant security challenges in the Sahel region affecting all governance functions. No medical cannabis program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given the security situation. No legislative action is anticipated.',
'Direction de la Police Judiciaire; Ministère de la Santé Publique.',
'Niger drug laws; regional security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nigeria','country','NG','Prohibited; Medical Reform Under Active Consideration',
'Cannabis is prohibited in Nigeria under the NDLEA Act, with enforcement by the National Drug Law Enforcement Agency. However, Nigeria''s Senate has been actively reviewing medical cannabis legislation, with committee hearings and executive briefings occurring from 2020 onwards. As Africa''s largest economy and most populous nation, Nigeria''s entry into the medical cannabis market would have continental significance.',
'No formal patient access pathway currently exists. The prospect of a future medical program is contingent on pending legislation.',
'Physicians cannot prescribe cannabis under the current legal framework. Medical professionals and the Nigerian Medical Association have participated in policy consultations on potential medical programs.',
'No licensed market exists. Nigeria''s scale—200 million population, significant agricultural capacity, and growing pharmaceutical sector—makes it a potentially transformative African cannabis market if legislation passes. International cannabis companies have been engaging with Nigerian stakeholders in anticipation of regulatory change.',
'Nigeria is one of the most closely watched African jurisdictions for cannabis reform. Senate committee deliberations on medical cannabis have been substantive. Legislation is possible in the 2025–2027 period, though political consensus is not yet secured. If enacted, Nigeria could rapidly become Africa''s largest medical cannabis market.',
'NDLEA (National Drug Law Enforcement Agency); NAFDAC (National Agency for Food and Drug Administration and Control) for pharmaceutical matters.',
'NDLEA Act; NAFDAC regulatory framework; Senate cannabis committee proceedings; NigeriaCannabisBill developments','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with active high-stakes medical reform process',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'republic-of-congo','country','CG','Prohibited',
'Cannabis is prohibited in the Republic of Congo. No medical cannabis program exists. The country''s oil-dependent economy has not engaged in cannabis policy reform.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Direction Générale de la Pharmacie, du Médicament et des Laboratoires; Gendarmerie Nationale.',
'Congo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='CG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'rwanda','country','RW','Prohibited; Strict Enforcement',
'Cannabis is prohibited in Rwanda under strict drug laws. Rwanda''s government maintains a strong law enforcement approach to drug policy. No medical cannabis program exists and no reform is under active consideration.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Rwanda''s enforcement-oriented governance approach makes near-term liberalization unlikely.',
'Rwanda Investigation Bureau (RIB); Ministry of Health (Rwanda FDA) for pharmaceutical matters.',
'Rwanda drug laws; RIB enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='RW' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sao-tome-and-principe','country','ST','Prohibited',
'Cannabis is prohibited in São Tomé and Príncipe. The small island state has not engaged in cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministério da Saúde; Polícia Nacional for enforcement.',
'Drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ST' AND jurisdiction_type='country');
