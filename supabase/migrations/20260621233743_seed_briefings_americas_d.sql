
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-lucia','country','LC','Decriminalized; No Formal Medical Program',
'Saint Lucia enacted the Cannabis Control Act in 2021, decriminalizing possession of 14 grams or less for personal use. The Act also established a framework for considering future medical and adult-use licensing. No licensed commercial or medical market was operational as of 2026, but the legislative foundation has been laid.',
'No formal patient access pathway exists. No licensed medical cannabis dispensaries operate. The Cannabis Control Act framework may enable future medical access.',
'Physicians cannot formally prescribe cannabis under the current framework. The Cannabis Control Act is expected to be followed by further regulations enabling medical prescription.',
'No licensed commercial market exists. The Cannabis Control Act''s licensing provisions are expected to be operationalized, with potential for cannabis tourism applications.',
'The Cannabis Control Act is a foundational step. Full implementation including licensing regulations for medical and commercial use is the near-term priority. Saint Lucia is positioned to develop a regulated market in alignment with regional trends.',
'Cannabis Control Authority (anticipated under the Cannabis Control Act 2021). Royal Saint Lucia Police Force.',
'Cannabis Control Act 2021; OECS/CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing covering Cannabis Control Act and pending implementation',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='LC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'suriname','country','SR','Prohibited; Limited Tolerance in Practice',
'Cannabis is technically prohibited in Suriname under the Verdovende Middelen Wet (Narcotics Act). In practice, enforcement of small personal-use amounts has been lenient in urban areas. No formal medical cannabis program or decriminalization policy exists. Suriname has not engaged in legislative cannabis reform.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. The informal market operates in urban areas with limited enforcement.',
'Cannabis reform is not a current policy priority. Regional developments may create future reform pressure but no legislative action is anticipated in the near term.',
'Ministerie van Volksgezondheid (Ministry of Health); Korps Politie Suriname for enforcement.',
'Verdovende Middelen Wet; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status with limited practical enforcement',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='SR' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'trinidad-and-tobago','country','TT','Decriminalized (30g); Cannabis Control Authority Established',
'Trinidad and Tobago decriminalized possession of up to 30 grams of cannabis in 2019 through the Dangerous Drugs (Amendment) Act. The Cannabis Licensing Authority (CLA) was established to develop licensing frameworks for medical, research, and potentially adult-use cannabis. Full commercial operations had not yet launched as of mid-2026, but framework development is advanced.',
'Patient access is not yet formally available through a licensed medical program. The CLA framework, once fully operational, will enable medical cannabis dispensaries. Individuals may possess up to 30g decriminalized and cultivate up to 4 plants at home.',
'Physicians will be able to authorize medical cannabis under the forthcoming CLA medical licensing framework. No products are yet available through official pharmaceutical channels.',
'No licensed commercial market has launched as of 2026. The CLA is finalizing licensing procedures. Trinidad and Tobago''s oil and gas expertise and infrastructure are seen as potentially transferable to a pharmaceutical cannabis industry.',
'The CLA framework operationalization is the key near-term development. A medical program launch followed by potential adult-use licensing is the anticipated trajectory. Caribbean regional context and economic diversification pressures support development.',
'Cannabis Licensing Authority (CLA) of Trinidad and Tobago. Ministry of Health for pharmaceutical aspects.',
'Dangerous Drugs (Amendment) Act 2019; CLA official guidance and licensing framework documents','Current as of Q2 2026','Quarterly','Country-level briefing covering decriminalization, home cultivation rights, and forthcoming licensed market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='TT' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uruguay','country','UY','Adult-Use Legal; Medical Legal; World Pioneer',
'Uruguay became the world''s first country to legalize adult-use cannabis nationally in 2013 under Law 19.172. The Instituto de Regulación y Control del Cannabis (IRCCA) regulates all cannabis activity including cultivation, clubs, pharmacy sales, and medical use. Residents may purchase cannabis from licensed pharmacies, join cannabis social clubs, or cultivate up to 6 plants at home. The system is restricted to Uruguayan residents and citizens.',
'Residents access cannabis from licensed IRCCA-registered pharmacies at regulated prices. Cannabis social clubs allow member cultivation. Home cultivation of up to 6 plants is permitted. Medical cannabis products are available for qualifying conditions under physician guidance. Non-residents cannot access the regulated market.',
'Physicians may recommend cannabis for medical purposes through a separate but parallel track. The pharmacy-based adult-use system effectively provides broad access to any adult resident. Medical guidance is integrated into the overall regulated system.',
'Uruguay''s market remains a national monopoly model with state involvement in production and distribution. Price controls keep cannabis affordable. The IRCCA-licensed system serves tens of thousands of registered users. Uruguay does not export cannabis despite its pioneer status. The market is stable rather than rapidly growing, reflecting the policy design as a public health model rather than a commercial industry.',
'Uruguay''s model is well-established and stable. Regulatory refinements focus on product variety, quality controls, and addressing the persistent informal market through competitive pricing. Export potential may be explored as part of economic diversification. International interest in Uruguay''s model for evidence-based policy remains high.',
'IRCCA (Instituto de Regulación y Control del Cannabis) under the Junta Nacional de Drogas (JND), Ministry of Education and Culture.',
'Law 19.172 (2013); IRCCA regulations; JND annual cannabis monitoring reports; academic evaluations of the Uruguayan model','Current as of Q2 2026; verified against IRCCA official data','Quarterly','Full country-level briefing covering world''s first national adult-use legalization and mature regulated market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'venezuela','country','VE','Prohibited',
'Cannabis is prohibited in Venezuela under the Ley Orgánica de Drogas. No medical cannabis program exists and no decriminalization framework has been enacted. The country faces significant economic and governance challenges that have not allowed for cannabis policy reform. Enforcement capacity varies significantly across regions.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available through Venezuelan healthcare.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Economic collapse and governance challenges dominate policy attention.',
'Cannabis reform is not a current policy priority given Venezuela''s political and economic situation. No legislative action is anticipated.',
'CONACUID (Comisión Nacional Contra el Uso Ilícito de las Drogas); Ministerio de Salud for pharmaceutical matters.',
'Ley Orgánica de Drogas; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status and governance context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-vincent-and-grenadines','country','VC','Decriminalized; No Formal Medical Program',
'Saint Vincent and the Grenadines decriminalized small amounts of cannabis in 2018. The country has participated in CARICOM regional cannabis policy discussions. No formal medical program or adult-use licensing framework has been established. The Saint Vincent government has expressed interest in developing a regulated cannabis sector given the country''s agricultural tradition.',
'No formal patient access pathway exists. No regulated medical cannabis products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Saint Vincent''s agricultural history (including the former banana export economy) is seen as a transferable foundation for cannabis cultivation.',
'CARICOM regional developments and economic diversification pressures may prompt policy action. No imminent legislation has been formally introduced.',
'Ministry of Health of Saint Vincent and the Grenadines; Royal Saint Vincent and the Grenadines Police Force.',
'Drug laws amendment 2018; CARICOM regional policy monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and agricultural potential for cannabis sector',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='VC' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'antigua-and-barbuda','country','AG','Decriminalized; No Formal Medical Program',
'Antigua and Barbuda decriminalized possession of small amounts of cannabis in 2018 through the Misuse of Drugs (Amendment) Act. Personal cultivation of up to 4 plants was also decriminalized. No formal medical program or adult-use commercial licensing has been established. The country participates in CARICOM regional cannabis policy forums.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Economic interest in cannabis tourism has been expressed given the country''s substantial tourism economy.',
'CARICOM regional developments, particularly frameworks in Barbados and Jamaica, may influence Antigua and Barbuda to develop medical or adult-use frameworks. No imminent legislation has been introduced.',
'Royal Antigua and Barbuda Police Force; Ministry of Health.',
'Misuse of Drugs (Amendment) Act 2018; CARICOM regional monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization and home cultivation rights',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='AG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'bahamas','country','BS','Decriminalized (1 oz); Medical Discussions Ongoing',
'The Bahamas amended the Dangerous Drugs Act in 2023 to decriminalize possession of up to one ounce of cannabis for personal use. Medical cannabis discussions have been ongoing in parliament. The country has not yet enacted a formal medical cannabis program, but the decriminalization amendment signals policy liberalization. The Bahamas'' significant tourism economy creates commercial interest in cannabis policy development.',
'No formal medical patient access pathway exists. The decriminalization amendment removes criminal penalties for personal possession. No licensed dispensaries operate.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Tourism industry stakeholders have expressed interest in a cannabis tourism framework aligned with regional peers.',
'Medical cannabis legislation is expected to follow the decriminalization amendment. The Bahamas is positioned to follow Caribbean neighbors such as Jamaica and Barbados in developing a regulated medical and potentially adult-use framework.',
'Royal Bahamas Police Force; Ministry of Health of The Bahamas.',
'Dangerous Drugs Act (amended 2023); parliamentary cannabis committee reports','Current as of Q2 2026','Annual','Country-level briefing covering recent decriminalization and pending medical program discussions',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='BS' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'united-states','country','US','Federal: Schedule I (DEA Rescheduling Proposed); State Programs Vary',
'Cannabis remains a Schedule I controlled substance under the federal Controlled Substances Act (CSA), creating a fundamental federal-state law conflict. However, as of 2026, 38+ states have enacted medical cannabis programs and 24+ states plus DC have enacted adult-use legalization. The FDA approved Epidiolex (cannabidiol) as a pharmaceutical. The DEA proposed rescheduling cannabis to Schedule III in 2024, and administrative proceedings are ongoing. Hemp (cannabis with below 0.3% THC) is federally legal under the 2018 Farm Bill.',
'Patient access varies dramatically by state. In states with adult-use programs, any adult 21+ may purchase from licensed dispensaries. Medical program patients in qualifying states register with state health departments and access licensed dispensaries. Interstate commerce of cannabis remains federally illegal regardless of state law. Federal employees and those on federal property cannot legally access cannabis.',
'In states with medical programs, physicians (and in some states nurse practitioners) may recommend cannabis. Federal law does not recognize cannabis prescriptions; state programs use "recommendations." Physicians in states without programs cannot recommend cannabis. Federal healthcare systems (VA, Indian Health Service) face unique restrictions.',
'The US cannabis industry is the world''s largest regulated market by revenue, estimated at USD 30+ billion annually. California, Colorado, Illinois, Michigan, and New York are among the largest state markets. Multi-state operators (MSOs) dominate commercial cannabis with vertically integrated operations. The industry faces persistent challenges including federal taxation (280E), lack of banking access, interstate commerce restrictions, and social equity licensing backlogs. Hemp-derived products including CBD, delta-8, and THCA are a significant parallel market with overlapping legal complexity.',
'DEA rescheduling from Schedule I to Schedule III would significantly reduce regulatory burden, potentially enable banking access, and eliminate IRC 280E tax penalties. Congressional cannabis banking legislation (SAFE Banking Act) has passed the House multiple times without Senate passage. Full federal legalization (the MORE Act or similar) remains politically contested. State-level legalization continues to expand through ballot initiatives.',
'DEA (Drug Enforcement Administration) for federal scheduling. FDA (Food and Drug Administration) for pharmaceutical cannabis products. USDA (Department of Agriculture) for hemp. State cannabis control boards and agencies for state-level programs (e.g., California DCC, Colorado MED, Illinois IDFPR).',
'Controlled Substances Act (21 USC 801 et seq.); 2018 Farm Bill; DEA proposed rescheduling rule; state cannabis statutes (by state); FDA CBD guidance; Congressional Research Service cannabis law reports','Current as of Q2 2026; federal status based on DEA administrative proceedings','Quarterly','Full country-level federal briefing covering Schedule I status, DEA rescheduling proceedings, state program landscape, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='US' AND jurisdiction_type='country');
