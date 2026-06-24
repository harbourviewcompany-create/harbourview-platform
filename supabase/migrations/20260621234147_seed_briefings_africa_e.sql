
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'senegal','country','SN','Prohibited',
'Cannabis is prohibited in Senegal under the Code des Drogues. Enforcement is active. Senegal has not engaged in formal cannabis policy reform at the legislative level. Civil society organizations have called for harm reduction approaches.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Central pour la Répression du Trafic Illicite de Stupéfiants (OCRTIS); Ministère de la Santé et de l''Action Sociale.',
'Code des Drogues; OCRTIS reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sierra-leone','country','SL','Prohibited',
'Cannabis is prohibited in Sierra Leone. Post-conflict governance development has not included cannabis policy reform as a priority. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Sierra Leone Police; Ministry of Health and Sanitation.',
'Sierra Leone drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SL' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'somalia','country','SO','Prohibited; Governance-Limited Enforcement',
'Cannabis is prohibited in Somalia but enforcement is functionally minimal across much of the country due to ongoing conflict and the absence of effective central governance. Khat (qat) is widely used and significant in Somali culture. Cannabis prohibition is nominal in many areas.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Governance constraints prevent any licensed sector development.',
'Cannabis policy reform is not a realistic near-term prospect given Somalia''s governance situation. No legislative action is anticipated.',
'Federal Government of Somalia (where operational); Somali Police Force; Ministry of Health.',
'Somali drug laws; governance and security monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-africa','country','ZA','Private Use Decriminalized (Constitutional Court); Medical Licensed; Adult-Use Framework Pending',
'South Africa''s Constitutional Court ruled in 2018 (Prince v Minister of Justice) that prohibiting private adult cannabis use and cultivation was unconstitutional. This decriminalized personal use and home cultivation for adults. Medical cannabis has been regulated under Section 22C of the Medicines and Related Substances Act since 2017, with SAHPRA licensing cultivation, manufacturing, and research. A comprehensive Cannabis for Private Purposes Act was enacted in 2024 to codify private use rights. An adult-use commercial market framework is under development.',
'Adults may privately use and cultivate cannabis. Medical cannabis patients access products through SAHPRA-licensed channels with physician recommendations. Internationally licensed medical cannabis products are available through specialist pharmacies. The regulated adult-use retail market is expected to open once commercial licensing regulations are finalized.',
'Physicians registered with the HPCSA may recommend medical cannabis products through SAHPRA-licensed dispensing channels. General practitioners and specialists may recommend. The South African Society of Cannabis Clinicians provides professional guidance.',
'South Africa''s licensed cannabis sector spans cultivation, extraction, manufacturing, and research. Export-oriented producers target EU and UK markets. The domestic adult-use market, once commercially regulated, will be one of Africa''s largest by population. Investment from local and international operators is active. The Western Cape and Mpumalanga are key cultivation regions.',
'The commercial adult-use licensing framework is the most significant pending regulatory development. SAHPRA GMP inspections and compliance requirements for export producers are ongoing. South Africa''s cannabis economy has significant potential given its scale, infrastructure, and agricultural capacity. Cannabis tourism legislation may also develop.',
'SAHPRA (South African Health Products Regulatory Authority) for medical licensing and product authorization. Department of Health for policy. SAPS (South African Police Service) for enforcement. DALRRD (Department of Agriculture) for cultivation.',
'Cannabis for Private Purposes Act 2024; Medicines and Related Substances Act Section 22C; SAHPRA licensing regulations; Constitutional Court ruling Prince v Minister of Justice 2018','Current as of Q2 2026; verified against SAHPRA official guidance','Quarterly','Full country-level briefing covering constitutional decriminalization, medical licensing, and pending commercial adult-use framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'south-sudan','country','SS','Prohibited; Governance Challenges',
'Cannabis is prohibited in South Sudan. Ongoing governance challenges and periodic conflict have prevented coherent drug policy development. No medical cannabis program exists. Enforcement capacity is severely limited.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'South Sudan National Police Service; Ministry of Health.',
'South Sudan drug laws; governance monitoring','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance limitations',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'sudan','country','SD','Prohibited; Strict Penalties',
'Cannabis is prohibited in Sudan under the Drugs and Psychotropic Substances Control Act with severe penalties. Islamic-influenced drug law provides a strong prohibitionist framework. Political transitions have not brought cannabis policy reform. No medical program exists.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. Sudan''s political and legal framework makes near-term liberalization unlikely.',
'Sudan Counter Narcotics Police; Ministry of Health.',
'Drugs and Psychotropic Substances Control Act; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting strict prohibition',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'eswatini','country','SZ','Prohibited; Traditional Cultivation Prevalent',
'Cannabis is prohibited in Eswatini (formerly Swaziland) but traditional cultivation has occurred for generations, producing varieties known internationally as "Swazi Gold." Enforcement is inconsistent in rural areas. No medical cannabis program exists. No formal reform discussions are underway, though economic arguments for licensing existing traditional production have been made.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Traditional cultivation occurs informally. Economic arguments for formalizing the existing industry have been made in civil society.',
'The economic potential of formalizing traditional cannabis cultivation could be a future policy driver. No imminent legislative action has been announced.',
'Eswatini Royal Police Service; Ministry of Health.',
'Eswatini drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibition alongside traditional cultivation heritage',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tanzania','country','TZ','Prohibited',
'Cannabis is prohibited in Tanzania under the Drug Control and Enforcement Act. Enforcement has been active under successive governments. No medical cannabis program exists. Tanzania has participated in African cannabis policy discussions at the academic level.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Agricultural potential for cannabis cultivation is noted given geographic and climate conditions.',
'Cannabis reform is not a current legislative priority. Tanzania''s enforcement-oriented approach makes near-term liberalization unlikely.',
'Drug Control and Enforcement Authority (DCEA); Ministry of Health.',
'Drug Control and Enforcement Act; DCEA annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TZ' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'togo','country','TG','Prohibited',
'Cannabis is prohibited in Togo. No medical cannabis program exists. Togo has not engaged in cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Office Togolais de la Lutte Contre la Drogue (OTLCD); Ministry of Health.',
'Togo drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'tunisia','country','TN','Prohibited; Controversial Mandatory Minimums',
'Cannabis is prohibited in Tunisia under Law 92-52, which imposes mandatory minimum prison sentences for cannabis possession that have been widely criticized by civil society, human rights organizations, and regional legal bodies. Even possession of small amounts can result in a one-year minimum sentence. Reform advocacy has been active. No medical cannabis program exists.',
'No legal patient access pathway exists. Tunisia''s mandatory minimum sentencing makes any informal therapeutic use legally very risky.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medicines are available.',
'No licensed market exists.',
'Tunisia is a jurisdiction where reform advocacy is significant and internationally supported. Law 92-52 has been identified for reform by human rights bodies. Legislative change is politically contested but possible. Reform of mandatory minimums is the most likely near-term action rather than medical legalization.',
'Ministère de la Santé; Ministère de l''Intérieur for enforcement.',
'Law 92-52 (1992); UNODC Tunisia reports; human rights monitoring','Current as of Q2 2026','Quarterly','Country-level briefing covering prohibition with significant reform advocacy context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TN' AND jurisdiction_type='country');
