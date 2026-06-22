-- Seed country-level cannabis regulatory briefings: Americas B/C/D
-- Countries: DM, DO, EC, SV, GD, GT, GY, HT, HN, JM, MX, NI, PA, PY, PE, KN,
--            LC, SR, TT, UY, VE, VC, AG, BS, US (country-level)

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominica','country','DM','Decriminalized; No Formal Medical Program',
'Dominica decriminalized possession of small amounts of cannabis in 2018 through amendments to the Drugs (Prevention of Misuse) Act. The law allows personal possession without criminal penalty up to defined limits. No formal medical cannabis program has been established, and commercial sale remains illegal.',
'No formal patient access pathway exists.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial cannabis market exists.',
'Regional OECS trends and economic development pressures may prompt Dominica to develop medical or adult-use frameworks. No imminent legislative action has been announced.',
'Ministry of Health of Dominica; Dominica Police Force handles enforcement.',
'Drugs (Prevention of Misuse) Act (amended 2018); OECS regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and absence of formal medical program',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'dominican-republic','country','DO','Prohibited',
'Cannabis is prohibited in the Dominican Republic under Law 50-88 on Drugs and Controlled Substances. There is no medical cannabis program. Enforcement has historically been strict and penalties can be severe.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Drug policy reform is not a current government priority. No medical cannabis legislation is anticipated in the near term.',
'DNCD (Dirección Nacional de Control de Drogas) enforces drug laws. Ministry of Public Health oversees pharmaceuticals.',
'Law 50-88; DNCD enforcement reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='DO' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'ecuador','country','EC','Medical Legal; Decriminalized for Personal Use',
'Ecuador legalized medical and therapeutic cannabis in 2019. Possession of small quantities for personal use is effectively decriminalized under Constitutional Court rulings. The State Agency for Quality Control and Phytosanitary Regulation (AGROCALIDAD) and ARCSA regulate the medical cannabis sector. The market is in early development.',
'Patients access medical cannabis through licensed pharmacies with physician authorization. Domestic production is beginning, supplemented by imported products. Patient registration is required.',
'Physicians registered with the Ministry of Public Health may prescribe authorized cannabis products. Guidelines have been issued for neurological conditions, chronic pain, and palliative care.',
'Ecuador''s medical cannabis market is nascent but growing. Domestic cultivation and extraction licenses have been issued. Ecuador''s agricultural infrastructure positions it for potential export market development.',
'The regulatory framework continues to develop. Export licensing is a policy priority given Ecuador''s agricultural export orientation. Adult-use is not under active consideration.',
'ARCSA (Agencia Nacional de Regulación, Control y Vigilancia Sanitaria) regulates medical cannabis products. AGROCALIDAD oversees cultivation licensing.',
'Resolution 002-2019 (National Assembly); ARCSA technical regulations; AGROCALIDAD licensing registry','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='EC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'el-salvador','country','SV','Prohibited',
'Cannabis is prohibited in El Salvador under the Ley Reguladora de las Actividades Relativas a las Drogas (Law 1015). There is no medical cannabis program. El Salvador has some of the strictest drug enforcement policies in Central America.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Drug policy reform is not a current government priority. No medical cannabis legislation is anticipated.',
'Ministry of Justice and Public Security; Ministry of Health (MINSAL) for pharmaceutical regulation.',
'Law 1015; MINSAL pharmaceutical policy','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SV' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'grenada','country','GD','Decriminalized; No Formal Medical Program',
'Grenada amended its drug laws in 2019 to decriminalize possession of small amounts of cannabis for personal use. No formal medical cannabis program or adult-use licensing framework exists. The country has expressed interest in developing a regulated cannabis sector aligned with CARICOM regional initiatives.',
'No formal patient access pathway exists.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial cannabis market exists.',
'CARICOM regional cannabis policy discussions may influence Grenada to develop a formal medical or commercial framework.',
'Royal Grenada Police Force and the Ministry of Health of Grenada.',
'Grenada drug law amendments 2019; CARICOM cannabis policy working group reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and CARICOM regional context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GD' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guatemala','country','GT','Decriminalized (Small Amounts); Otherwise Prohibited',
'Guatemala amended its drug law in 2021 to decriminalize possession of small amounts of cannabis for personal use, removing criminal penalties for minor possession. Commercial sale, cultivation, and supply remain illegal. No medical cannabis program exists.',
'No formal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists. Guatemala''s geographic position as a transit country influences its drug policy framework.',
'Drug policy reform is under civil society advocacy but has not gained significant legislative traction.',
'Ministry of Public Health and Social Assistance (MSPAS); SECCATID (Secretaría Ejecutiva de la Comisión Contra las Adicciones y el Tráfico Ilícito de Drogas).',
'Guatemala drug law amendment 2021; SECCATID reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting limited decriminalization and absence of medical framework',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'guyana','country','GY','Decriminalized (Small Amounts); No Formal Medical Program',
'Guyana decriminalized possession of up to 30 grams of cannabis in 2020 under the Narcotic Drugs and Psychotropic Substances (Amendment) Act. Commercial sale and cultivation remain illegal. No medical cannabis program has been established.',
'No formal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no legal framework exists.',
'No licensed market exists.',
'The Guyanese government has expressed general openness to reviewing cannabis policy. Regional CARICOM developments may accelerate reform.',
'Ministry of Home Affairs handles enforcement. Guyana Food and Drug Department (under Ministry of Health) oversees pharmaceutical matters.',
'Narcotic Drugs and Psychotropic Substances (Amendment) Act 2020; Guyana Ministry of Home Affairs reports','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and policy review context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='GY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'haiti','country','HT','Prohibited',
'Cannabis is prohibited in Haiti and no medical cannabis program exists. The country faces significant institutional and governance challenges that have prevented cannabis policy reform. Drug enforcement capacity is limited due to ongoing security and political instability.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given Haiti''s complex governance situation.',
'Ministry of Public Health and Population (MSPP); Haitian National Police.',
'Haitian drug laws; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'honduras','country','HN','Prohibited',
'Cannabis is prohibited in Honduras under the Ley sobre Uso Indebido y Tráfico Ilícito de Drogas y Sustancias Psicotrópicas. There is no medical cannabis program and no decriminalization policy. Enforcement is active and penalties can be significant.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not anticipated given the current government''s security-focused policy orientation.',
'Ministerio Público and Policía Nacional for enforcement. Secretaría de Salud for pharmaceutical regulation.',
'Drug law (Ley sobre Uso Indebido y Tráfico Ilícito de Drogas); regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jamaica','country','JM','Decriminalized; Medical and Sacramental Use Licensed',
'Jamaica amended its Dangerous Drugs Act in 2015 to decriminalize possession of up to 2 ounces, recognize Rastafarian sacramental use, and create a medical and therapeutic licensing framework. The Cannabis Licensing Authority (CLA) licenses cultivation, processing, retail, and research. Jamaica is one of the Caribbean''s most significant cannabis policy reformers and has positioned itself as a wellness tourism and export hub.',
'Patients access licensed medical cannabis from CLA-registered dispensaries with a prescription. Tourists and visitors can access cannabis through licensed herb houses. Sacramental use by Rastafarians is explicitly protected.',
'Physicians registered with the Medical Council of Jamaica may recommend cannabis for qualifying conditions. No specialist requirement applies. Medical tourism programmes allow visitors to access cannabis legally.',
'Jamaica''s licensed cannabis market includes cultivators, processors, retailers, and research operators. The wellness tourism segment is a significant driver. Export licensing to markets including the UK and EU has been pursued by several operators.',
'The CLA continues to refine licensing and quality standards to enable export market access. Further integration of Jamaican cannabis into high-value medical markets is the regulatory priority.',
'Cannabis Licensing Authority (CLA) under the Ministry of Industry, Investment and Commerce.',
'Dangerous Drugs (Amendment) Act 2015; CLA licensing registry; CLA annual reports','Current as of Q2 2026; verified against CLA official guidance','Quarterly','Full country-level briefing covering decriminalization, medical access, sacramental rights, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mexico','country','MX','Medical Legal; Adult-Use Pending Full Regulation',
'Mexico''s Supreme Court ruled cannabis prohibition unconstitutional in a series of landmark decisions from 2018 onwards. Medical cannabis was formally regulated under COFEPRIS in 2017. In 2021 Congress failed to meet a Supreme Court deadline for adult-use legislation. Medical use is well-established and the market is growing rapidly.',
'Patients access medical cannabis through COFEPRIS-licensed pharmacies and medical providers with a prescription. Imported products from Canada, the US, and Europe are available alongside growing domestic production. Home cultivation for personal use is constitutionally protected following Supreme Court rulings.',
'Physicians may prescribe authorized medical cannabis products. COFEPRIS has issued guidance on conditions including epilepsy, chronic pain, and cancer-related symptoms.',
'Mexico is Latin America''s largest potential cannabis market by population. Domestic cultivation and processing capacity is expanding. Multiple international cannabis companies have established Mexican operations. When formal adult-use regulation is enacted, Mexico is expected to become one of the world''s largest legal cannabis markets.',
'Full adult-use legislative framework remains the primary policy gap as of 2026. Congress is expected to pass comprehensive legislation. COFEPRIS will be the primary federal regulator when adult-use legislation is enacted.',
'COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios) regulates medical cannabis. Supreme Court jurisprudence shapes constitutional rights.',
'COFEPRIS medical cannabis regulations; Supreme Court amparo decisions 2018–2021; Mexican Congress legislative tracking','Current as of Q2 2026; verified against COFEPRIS official guidance','Quarterly','Full country-level briefing covering medical program, constitutional rights, pending adult-use framework, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MX' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nicaragua','country','NI','Prohibited',
'Cannabis is prohibited in Nicaragua under the Ley 177 (Ley de Estupefacientes, Psicotrópicos y Otras Sustancias Controladas). No medical cannabis program exists and no decriminalization policy is in place.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministerio de Salud (MINSA) for pharmaceutical regulation. Policía Nacional for enforcement.',
'Ley 177; MINSA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'panama','country','PA','Medical Legal (since 2021); No Adult-Use',
'Panama passed Law 242 in 2021 (Ley 242) legalizing medical and therapeutic cannabis. The Ministry of Health (MINSA) and IDIAP share regulatory responsibility. Implementation regulations have been progressively issued since 2022. The medical market is in early-stage development as of 2026.',
'Patients access medical cannabis through licensed pharmacies with a valid medical authorization. Products include oils, capsules, and topicals from licensed domestic producers and importers.',
'Physicians licensed by the Medical-Surgical Council of Panama may authorize cannabis treatment. Guidance covers chronic pain, epilepsy, and cancer-related symptoms.',
'Panama''s medical cannabis market is nascent, with initial licenses issued for cultivation, processing, and distribution. The country''s role as a regional hub and its strong regulatory infrastructure positions it for measured growth.',
'The MINSA regulatory framework is being refined. Export market development is a medium-term policy goal. Full adult-use legalization is not on the current agenda.',
'MINSA (Ministerio de Salud) for medical cannabis regulation. IDIAP for cultivation oversight.',
'Law 242 (2021); MINSA implementing regulations; IDIAP cultivation guidance','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'paraguay','country','PY','Medical Legal (CBD-Focused); Limited Program',
'Paraguay legalized medical cannabis in 2019 under Law 6007/17, with a primary focus on CBD-based products. INAN and DINAVISA regulate medical cannabis. The program remains limited in scope but Paraguay''s agricultural infrastructure provides potential for expansion.',
'Patients access medical cannabis through DINAVISA-authorized pharmacies with a physician prescription. The program initially focused on CBD products for epilepsy and chronic pain.',
'Physicians may prescribe authorized CBD-based cannabis medicines. The regulatory guidance is primarily oriented toward neurological conditions.',
'Paraguay''s medical cannabis market is small but has potential given agricultural capacity. Domestic cultivation for CBD extraction has been licensed.',
'The regulatory framework is expected to expand to include more THC-containing products as clinical evidence develops. Adult-use is not under active consideration.',
'DINAVISA (Dirección Nacional de Vigilancia Sanitaria) for product authorization. SENAVE for agricultural licensing.',
'Law 6007/17; DINAVISA resolutions; SENAVE cultivation licensing','Current as of Q2 2026','Annual','Country-level briefing covering limited medical program focused on CBD',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'peru','country','PE','Medical Legal; Growing Market',
'Peru enacted Law 30681 in 2017 legalizing medical cannabis, making it one of the first South American countries to do so. Regulations under DIGEMID authorize import, domestic production, and commercialization of cannabis-based medical products. The market has grown significantly since 2020 as domestic production capacity expanded.',
'Patients access medical cannabis through DIGEMID-authorized pharmacies with a prescription from a licensed physician. Domestic products and imports from international producers are available.',
'Physicians registered with the Colegio Médico del Perú may prescribe authorized cannabis medicines. Guidance covers epilepsy, chronic pain, cancer, multiple sclerosis, and palliative care.',
'Peru''s medical cannabis sector has matured significantly. Multiple domestic producers hold DIGEMID licenses. Export markets, particularly in Europe and North America, are being developed. Peru''s agricultural export orientation makes it a potential long-term cannabis export powerhouse.',
'DIGEMID regulatory frameworks are continuing to evolve with improved GMP standards. Export certification frameworks are a key policy priority. Adult-use legalization is not under active consideration.',
'DIGEMID (under Ministerio de Salud) for product licensing and market authorization. SERFOR for cultivation.',
'Law 30681 (2017); Supreme Decree 005-2019-SA; DIGEMID product registry; SERFOR cultivation licensing','Current as of Q2 2026; verified against DIGEMID official guidance','Quarterly','Full country-level briefing covering medical program, growing domestic production, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-kitts-and-nevis','country','KN','Decriminalized; No Formal Medical Program',
'Saint Kitts and Nevis has moved toward decriminalization of small amounts of cannabis, aligned with CARICOM regional policy discussions. No formal medical cannabis program or adult-use licensing framework exists.',
'No formal patient access pathway exists.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists.',
'CARICOM regional developments and economic diversification pressures may prompt formal policy action.',
'Saint Kitts and Nevis Police Force; Ministry of Health.',
'CARICOM cannabis commission reports; regional comparative monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization trend and CARICOM context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-lucia','country','LC','Decriminalized; No Formal Medical Program',
'Saint Lucia enacted the Cannabis Control Act in 2021, decriminalizing possession of 14 grams or less for personal use. The Act also established a framework for considering future medical and adult-use licensing. No licensed commercial or medical market was operational as of 2026, but the legislative foundation has been laid.',
'No formal patient access pathway exists. The Cannabis Control Act framework may enable future medical access.',
'Physicians cannot formally prescribe cannabis under the current framework.',
'No licensed commercial market exists. The Cannabis Control Act''s licensing provisions are expected to be operationalized.',
'The Cannabis Control Act is a foundational step. Full implementation including licensing regulations for medical and commercial use is the near-term priority.',
'Cannabis Control Authority (anticipated under the Cannabis Control Act 2021). Royal Saint Lucia Police Force.',
'Cannabis Control Act 2021; OECS/CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing covering Cannabis Control Act and pending implementation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'suriname','country','SR','Prohibited; Limited Tolerance in Practice',
'Cannabis is technically prohibited in Suriname under the Verdovende Middelen Wet (Narcotics Act). In practice, enforcement of small personal-use amounts has been lenient in urban areas. No formal medical cannabis program or decriminalization policy exists.',
'No formal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated in the near term.',
'Ministerie van Volksgezondheid (Ministry of Health); Korps Politie Suriname for enforcement.',
'Verdovende Middelen Wet; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with limited practical enforcement',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'trinidad-and-tobago','country','TT','Decriminalized (30g); Cannabis Control Authority Established',
'Trinidad and Tobago decriminalized possession of up to 30 grams of cannabis in 2019 through the Dangerous Drugs (Amendment) Act. The Cannabis Licensing Authority (CLA) was established to develop licensing frameworks for medical, research, and potentially adult-use cannabis. Full commercial operations had not yet launched as of mid-2026.',
'Patient access is not yet formally available through a licensed medical program. Individuals may possess up to 30g decriminalized and cultivate up to 4 plants at home.',
'Physicians will be able to authorize medical cannabis under the forthcoming CLA medical licensing framework.',
'No licensed commercial market has launched as of 2026. The CLA is finalizing licensing procedures.',
'The CLA framework operationalization is the key near-term development. A medical program launch followed by potential adult-use licensing is the anticipated trajectory.',
'Cannabis Licensing Authority (CLA) of Trinidad and Tobago. Ministry of Health for pharmaceutical aspects.',
'Dangerous Drugs (Amendment) Act 2019; CLA official guidance and licensing framework documents','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization, home cultivation rights, and forthcoming licensed market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uruguay','country','UY','Adult-Use Legal; Medical Legal; World Pioneer',
'Uruguay became the world''s first country to legalize adult-use cannabis nationally in 2013 under Law 19.172. The Instituto de Regulación y Control del Cannabis (IRCCA) regulates all cannabis activity including cultivation, clubs, pharmacy sales, and medical use. Residents may purchase cannabis from licensed pharmacies, join cannabis social clubs, or cultivate up to 6 plants at home. The system is restricted to Uruguayan residents and citizens.',
'Residents access cannabis from licensed IRCCA-registered pharmacies at regulated prices. Cannabis social clubs allow member cultivation. Home cultivation of up to 6 plants is permitted. Medical cannabis products are available for qualifying conditions. Non-residents cannot access the regulated market.',
'Physicians may recommend cannabis for medical purposes through a parallel track. The pharmacy-based adult-use system effectively provides broad access to any adult resident.',
'Uruguay''s market remains a national model with state involvement in production and distribution. Price controls keep cannabis affordable. The IRCCA-licensed system serves tens of thousands of registered users. Uruguay does not export cannabis.',
'Uruguay''s model is well-established and stable. Regulatory refinements focus on product variety, quality controls, and addressing the persistent informal market. International interest in Uruguay''s model for evidence-based policy remains high.',
'IRCCA (Instituto de Regulación y Control del Cannabis) under the Junta Nacional de Drogas (JND), Ministry of Education and Culture.',
'Law 19.172 (2013); IRCCA regulations; JND annual cannabis monitoring reports; academic evaluations of the Uruguayan model','Current as of Q2 2026; verified against IRCCA official data','Quarterly','Full country-level briefing covering world''s first national adult-use legalization and mature regulated market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'venezuela','country','VE','Prohibited',
'Cannabis is prohibited in Venezuela under the Ley Orgánica de Drogas. No medical cannabis program exists. The country faces significant economic and governance challenges. Enforcement capacity varies significantly across regions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists.',
'Cannabis reform is not a current policy priority given Venezuela''s political and economic situation.',
'CONACUID (Comisión Nacional Contra el Uso Ilícito de las Drogas); Ministerio de Salud for pharmaceutical matters.',
'Ley Orgánica de Drogas; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-vincent-and-grenadines','country','VC','Decriminalized; No Formal Medical Program',
'Saint Vincent and the Grenadines decriminalized small amounts of cannabis in 2018. The country has participated in CARICOM regional cannabis policy discussions. No formal medical program or adult-use licensing framework has been established.',
'No formal patient access pathway exists.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists.',
'CARICOM regional developments and economic diversification pressures may prompt policy action.',
'Ministry of Health of Saint Vincent and the Grenadines; Royal Saint Vincent and the Grenadines Police Force.',
'Drug laws amendment 2018; CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and agricultural potential for cannabis sector',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'antigua-and-barbuda','country','AG','Decriminalized; No Formal Medical Program',
'Antigua and Barbuda decriminalized possession of small amounts of cannabis in 2018 through the Misuse of Drugs (Amendment) Act. Personal cultivation of up to 4 plants was also decriminalized. No formal medical program or adult-use commercial licensing has been established.',
'No formal patient access pathway exists.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists.',
'CARICOM regional developments, particularly frameworks in Barbados and Jamaica, may influence Antigua and Barbuda to develop medical or adult-use frameworks.',
'Royal Antigua and Barbuda Police Force; Ministry of Health.',
'Misuse of Drugs (Amendment) Act 2018; CARICOM regional monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and home cultivation rights',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bahamas','country','BS','Decriminalized (1 oz); Medical Discussions Ongoing',
'The Bahamas amended the Dangerous Drugs Act in 2023 to decriminalize possession of up to one ounce of cannabis for personal use. Medical cannabis discussions have been ongoing in parliament. The country has not yet enacted a formal medical cannabis program.',
'No formal medical patient access pathway exists. The decriminalization amendment removes criminal penalties for personal possession.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Tourism industry stakeholders have expressed interest in a cannabis tourism framework.',
'Medical cannabis legislation is expected to follow the decriminalization amendment. The Bahamas is positioned to follow Caribbean neighbors in developing a regulated medical and potentially adult-use framework.',
'Royal Bahamas Police Force; Ministry of Health of The Bahamas.',
'Dangerous Drugs Act (amended 2023); parliamentary cannabis committee reports','Current as of Q2 2026','Annual','Country-level briefing covering recent decriminalization and pending medical program discussions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'united-states','country','US','Federal: Schedule I (DEA Rescheduling Proposed); State Programs Vary',
'Cannabis remains a Schedule I controlled substance under the federal Controlled Substances Act (CSA), creating a fundamental federal-state law conflict. However, as of 2026, 38+ states have enacted medical cannabis programs and 24+ states plus DC have enacted adult-use legalization. The FDA approved Epidiolex (cannabidiol) as a pharmaceutical. The DEA proposed rescheduling cannabis to Schedule III in 2024, with administrative proceedings ongoing. Hemp (cannabis with below 0.3% THC) is federally legal under the 2018 Farm Bill.',
'Patient access varies dramatically by state. In states with adult-use programs, any adult 21+ may purchase from licensed dispensaries. Medical program patients in qualifying states register with state health departments. Federal employees and those on federal property cannot legally access cannabis.',
'In states with medical programs, physicians may recommend cannabis. Federal law does not recognize cannabis prescriptions; state programs use "recommendations." Physicians in states without programs cannot recommend cannabis.',
'The US cannabis industry is the world''s largest regulated market by revenue, estimated at USD 30+ billion annually. The industry faces persistent challenges including federal taxation (280E), lack of banking access, and interstate commerce restrictions.',
'DEA rescheduling from Schedule I to Schedule III would significantly reduce regulatory burden. Congressional cannabis banking legislation has passed the House multiple times without Senate passage. State-level legalization continues to expand through ballot initiatives.',
'DEA for federal scheduling. FDA for pharmaceutical cannabis products. USDA for hemp. State cannabis control boards and agencies for state-level programs.',
'Controlled Substances Act (21 USC 801 et seq.); 2018 Farm Bill; DEA proposed rescheduling rule; FDA CBD guidance; Congressional Research Service cannabis law reports','Current as of Q2 2026; federal status based on DEA administrative proceedings','Quarterly','Full country-level federal briefing covering Schedule I status, DEA rescheduling proceedings, state program landscape, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND jurisdiction_type='country');
