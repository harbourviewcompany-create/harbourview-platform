
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominica','country','DM','Decriminalized; No Formal Medical Program',
'Dominica decriminalized possession of small amounts of cannabis in 2018 through amendments to the Drugs (Prevention of Misuse) Act. The law allows personal possession without criminal penalty up to defined limits. No formal medical cannabis program has been established, and commercial sale remains illegal.',
'No formal patient access pathway exists. Patients cannot obtain regulated cannabis-based medicines through Dominican healthcare. Any therapeutic use occurs informally outside the legal framework.',
'Physicians cannot prescribe cannabis as no medical regulatory framework exists. Clinical interest is limited by the absence of approved products and legal prescription pathways.',
'No licensed commercial cannabis market exists. Economic interest in cannabis agriculture and tourism has been expressed in civil society but no licensing framework has been created. The informal market operates.',
'Regional OECS trends and economic development pressures may prompt Dominica to develop medical or adult-use frameworks. No imminent legislative action has been announced.',
'Ministry of Health of Dominica; Dominica Police Force handles enforcement.',
'Drugs (Prevention of Misuse) Act (amended 2018); OECS regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and absence of formal medical program',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominican-republic','country','DO','Prohibited',
'Cannabis is prohibited in the Dominican Republic under Law 50-88 on Drugs and Controlled Substances. There is no medical cannabis program. Enforcement has historically been strict and penalties can be severe. The country has not engaged in formal drug policy reform regarding cannabis.',
'No legal patient access pathway exists. Pharmaceutical CBD products may be imported under exceptional circumstances but no formal program exists.',
'Physicians cannot prescribe cannabis. No approved cannabis-derived medical products are available through the Dominican public or private healthcare system.',
'No licensed market exists. The informal market operates but faces active law enforcement. No foreign cannabis investment has been established.',
'Drug policy reform is not a current government priority. Regional trends have not yet significantly influenced Dominican legislative debate. No medical cannabis legislation is anticipated in the near term.',
'DNCD (Dirección Nacional de Control de Drogas) enforces drug laws. Ministry of Public Health oversees pharmaceuticals.',
'Law 50-88; DNCD enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ecuador','country','EC','Medical Legal; Decriminalized for Personal Use',
'Ecuador legalized medical and therapeutic cannabis in 2019 through a national assembly resolution and subsequent regulation. Possession of small quantities for personal use is effectively decriminalized under Constitutional Court rulings. The State Agency for Quality Control and Phytosanitary Regulation (AGROCALIDAD) and ARCSA regulate the medical cannabis sector. The market is in early development.',
'Patients access medical cannabis through licensed pharmacies with physician authorization. Domestic production is beginning, supplemented by imported products. Patient registration is required. Access in rural areas remains limited.',
'Physicians registered with the Ministry of Public Health may prescribe authorized cannabis products. Guidelines have been issued for neurological conditions, chronic pain, and palliative care. General practitioners may prescribe.',
'Ecuador''s medical cannabis market is nascent but growing. Domestic cultivation and extraction licenses have been issued. Ecuador''s agricultural infrastructure, particularly in regions with suitable climate, positions it for potential export market development. Several national and international companies have established operations.',
'The regulatory framework continues to develop. Decriminalization thresholds and medical access expansion are expected to be refined. Export licensing is a policy priority given Ecuador''s agricultural export orientation. Adult-use is not under active consideration.',
'ARCSA (Agencia Nacional de Regulación, Control y Vigilancia Sanitaria) regulates medical cannabis products. AGROCALIDAD oversees cultivation licensing.',
'Resolution 002-2019 (National Assembly); ARCSA technical regulations; AGROCALIDAD licensing registry','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'el-salvador','country','SV','Prohibited',
'Cannabis is prohibited in El Salvador under the Ley Reguladora de las Actividades Relativas a las Drogas (Law 1015). There is no medical cannabis program and no decriminalization policy. El Salvador has some of the strictest drug enforcement policies in Central America, and cannabis-related penalties remain severe.',
'No legal patient access pathway exists. Cannabis-based pharmaceutical products are not available through the public or private healthcare system.',
'Physicians cannot prescribe cannabis. No regulatory pathway exists for clinical use of cannabis-based medicines.',
'No licensed market exists. Strong enforcement reduces informal market activity relative to neighboring countries. No cannabis investment has occurred.',
'Drug policy reform is not a current government priority. The security-focused government has reinforced strict law enforcement approaches across drug categories. No medical cannabis legislation is anticipated.',
'Ministry of Justice and Public Security; Ministry of Health (MINSAL) for pharmaceutical regulation.',
'Law 1015 (Ley Reguladora de las Actividades Relativas a las Drogas); MINSAL pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'grenada','country','GD','Decriminalized; No Formal Medical Program',
'Grenada amended its drug laws in 2019 to decriminalize possession of small amounts of cannabis for personal use. No formal medical cannabis program or adult-use licensing framework exists. The country has expressed interest in developing a regulated cannabis sector aligned with CARICOM regional initiatives.',
'No formal patient access pathway exists. Patients cannot obtain regulated cannabis medicines through official Grenadian healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists. Clinical use is not recognized in the Grenadian healthcare system.',
'No licensed commercial cannabis market exists. There is economic interest in cannabis and hemp agriculture given the island''s agricultural tradition. Regional CARICOM discussions on cannabis policy are tracked.',
'CARICOM regional cannabis policy discussions may influence Grenada to develop a formal medical or commercial framework. No imminent legislation has been introduced.',
'Royal Grenada Police Force and the Ministry of Health of Grenada.',
'Grenada drug law amendments 2019; CARICOM cannabis policy working group reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and CARICOM regional context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guatemala','country','GT','Decriminalized (Small Amounts); Otherwise Prohibited',
'Guatemala amended its drug law in 2021 to decriminalize possession of small amounts of cannabis for personal use, removing criminal penalties for minor possession. Commercial sale, cultivation, and supply remain illegal. No medical cannabis program exists, though there is civil society advocacy for reform.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through Guatemalan healthcare channels.',
'Physicians cannot prescribe cannabis. No approved cannabis-based medical products exist within the Guatemalan regulatory system.',
'No licensed market exists. Guatemala''s geographic position as a transit country influences its drug policy framework, which remains aligned with regional enforcement approaches.',
'Drug policy reform is under civil society advocacy but has not gained significant legislative traction. Regional pressures from Mexico''s reforms and economic arguments for regulated cannabis may influence future policy.',
'Ministry of Public Health and Social Assistance (MSPAS); SECCATID (Secretaría Ejecutiva de la Comisión Contra las Adicciones y el Tráfico Ilícito de Drogas).',
'Guatemala drug law amendment 2021; SECCATID reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting limited decriminalization and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guyana','country','GY','Decriminalized (Small Amounts); No Formal Medical Program',
'Guyana decriminalized possession of up to 30 grams of cannabis in 2020 under the Narcotic Drugs and Psychotropic Substances (Amendment) Act. Commercial sale and cultivation remain illegal. No medical cannabis program has been established. The government has indicated interest in reviewing cannabis policy further given economic development potential.',
'No formal patient access pathway exists. Patients cannot access regulated cannabis medicines through the Guyanese public health system.',
'Physicians cannot prescribe cannabis as no legal framework exists. Clinical use is not supported by the current regulatory environment.',
'No licensed market exists. Guyana''s expanding economy (driven by oil revenues) has shifted policy attention, but cannabis agriculture interest remains in rural communities.',
'The Guyanese government has expressed general openness to reviewing cannabis policy. Medical cannabis legislation has been discussed but not advanced. Regional CARICOM developments may accelerate reform.',
'Ministry of Home Affairs handles enforcement. Guyana Food and Drug Department (under Ministry of Health) oversees pharmaceutical matters.',
'Narcotic Drugs and Psychotropic Substances (Amendment) Act 2020; Guyana Ministry of Home Affairs reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and policy review context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'haiti','country','HT','Prohibited',
'Cannabis is prohibited in Haiti and no medical cannabis program exists. The country faces significant institutional and governance challenges that have prevented cannabis policy reform. Drug enforcement capacity is limited due to ongoing security and political instability.',
'No legal patient access pathway exists. Cannabis-based medicines are unavailable through official Haitian healthcare channels.',
'Physicians cannot prescribe cannabis. No approved cannabis-based products are available within the Haitian healthcare system.',
'No licensed market exists. Governance and security challenges constrain any formal market development.',
'Cannabis reform is not a current policy priority given Haiti''s complex governance situation. No legislative action is anticipated in the near term.',
'Ministry of Public Health and Population (MSPP) for pharmaceutical matters. Drug enforcement through the Haitian National Police.',
'Haitian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HT' AND jurisdiction_type='country');
