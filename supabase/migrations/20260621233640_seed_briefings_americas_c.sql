
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'honduras','country','HN','Prohibited',
'Cannabis is prohibited in Honduras under the Ley sobre Uso Indebido y Tráfico Ilícito de Drogas y Sustancias Psicotrópicas. There is no medical cannabis program and no decriminalization policy. Enforcement is active and penalties can be significant. The country has not engaged in cannabis policy reform discussions at the legislative level.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available through the public or private healthcare system.',
'Physicians cannot prescribe cannabis. No regulatory framework for clinical cannabis use exists.',
'No licensed market exists. Honduras faces significant drug-related security challenges that have reinforced prohibition approaches.',
'Cannabis reform is not anticipated given the current government''s security-focused policy orientation. No legislative action is expected in the near term.',
'Ministerio Público and Policía Nacional for enforcement. Secretaría de Salud for pharmaceutical regulation.',
'Drug law (Ley sobre Uso Indebido y Tráfico Ilícito de Drogas); regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='HN' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'jamaica','country','JM','Decriminalized; Medical and Sacramental Use Licensed',
'Jamaica amended its Dangerous Drugs Act in 2015 to decriminalize possession of up to 2 ounces, recognize Rastafarian sacramental use, and create a medical and therapeutic licensing framework. The Cannabis Licensing Authority (CLA) licenses cultivation, processing, retail, and research. Jamaica is one of the Caribbean''s most significant cannabis policy reformers and has positioned itself as a wellness tourism and export hub.',
'Patients access licensed medical cannabis from CLA-registered dispensaries with a prescription. Tourists and visitors can access cannabis through licensed herb houses. Sacramental use by Rastafarians is explicitly protected. Retail dispensaries operate in major tourism areas.',
'Physicians registered with the Medical Council of Jamaica may recommend cannabis for qualifying conditions. No specialist requirement applies. Clinical guidelines have been developed. Medical tourism programmes allow visitors to access cannabis legally.',
'Jamaica''s licensed cannabis market includes cultivators, processors, retailers, and research operators. The wellness tourism segment is a significant driver, with cannabis spa treatments and experiences offered. Export licensing to markets including the UK and EU has been pursued by several operators. The market attracts international investment.',
'The CLA continues to refine licensing and quality standards to enable export market access, particularly to the EU with its GMP requirements. Further integration of Jamaican cannabis into high-value medical markets is the regulatory priority. Adult-use commercial legalization is politically possible given public sentiment.',
'Cannabis Licensing Authority (CLA) under the Ministry of Industry, Investment and Commerce.',
'Dangerous Drugs (Amendment) Act 2015; CLA licensing registry; CLA annual reports','Current as of Q2 2026; verified against CLA official guidance','Quarterly','Full country-level briefing covering decriminalization, medical access, sacramental rights, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='JM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'mexico','country','MX','Medical Legal; Adult-Use Pending Full Regulation',
'Mexico''s Supreme Court ruled cannabis prohibition unconstitutional in a series of landmark decisions from 2018 onwards. Medical cannabis was formally regulated under COFEPRIS in 2017. In 2021 Congress failed to meet a Supreme Court deadline for adult-use legislation, creating a legal gap. Regulatory frameworks for adult-use have been proposed but comprehensive federal legislation had not been enacted as of mid-2026. Medical use is well-established and the market is growing rapidly.',
'Patients access medical cannabis through COFEPRIS-licensed pharmacies and medical providers with a prescription. Imported products from Canada, the US, and Europe are available alongside growing domestic production. Home cultivation for personal use is constitutionally protected following Supreme Court rulings.',
'Physicians may prescribe authorized medical cannabis products. COFEPRIS has issued guidance on conditions including epilepsy, chronic pain, and cancer-related symptoms. General practitioners may prescribe; specialist referral is not required.',
'Mexico is Latin America''s largest potential cannabis market by population. Domestic cultivation and processing capacity is expanding. Multiple international cannabis companies have established Mexican operations or licensing agreements. The constitutional protection for personal use has created a de facto market for personal cultivation. When formal adult-use regulation is enacted, Mexico is expected to become one of the world''s largest legal cannabis markets.',
'Full adult-use legislative framework remains the primary policy gap as of 2026. Congress is expected to pass comprehensive legislation, though timeline remains uncertain due to political complexities. COFEPRIS will be the primary federal regulator when adult-use legislation is enacted. Export market development is a medium-term priority.',
'COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios) regulates medical cannabis. Supreme Court jurisprudence shapes constitutional rights. SEMARNAT and SAGARPA may be involved in cultivation regulation.',
'COFEPRIS medical cannabis regulations; Supreme Court amparo decisions 2018–2021; Mexican Congress legislative tracking','Current as of Q2 2026; verified against COFEPRIS official guidance','Quarterly','Full country-level briefing covering medical program, constitutional rights, pending adult-use framework, and market scale',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='MX' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'nicaragua','country','NI','Prohibited',
'Cannabis is prohibited in Nicaragua under the Ley 177 (Ley de Estupefacientes, Psicotrópicos y Otras Sustancias Controladas). No medical cannabis program exists and no decriminalization policy is in place. The current government has not engaged with cannabis reform at the legislative level.',
'No legal patient access pathway exists. No regulated cannabis-based medical products are available.',
'Physicians cannot prescribe cannabis. No regulatory framework for medical cannabis use exists.',
'No licensed market exists. Cannabis activity is actively enforced against.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'Ministerio de Salud (MINSA) for pharmaceutical regulation. Policía Nacional for enforcement.',
'Ley 177; MINSA pharmaceutical policy; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='NI' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'panama','country','PA','Medical Legal (since 2021); No Adult-Use',
'Panama passed Law 242 in 2021 (Ley 242) legalizing medical and therapeutic cannabis. The Ministry of Health (MINSA) and the Institute for Agricultural Innovation of Panama (IDIAP) share regulatory responsibility. Implementation regulations have been progressively issued since 2022. The medical market is in early-stage development as of 2026.',
'Patients access medical cannabis through licensed pharmacies with a valid medical authorization. Products include oils, capsules, and topicals from licensed domestic producers and importers. Patient registration is required through the MINSA system.',
'Physicians licensed by the Medical-Surgical Council of Panama may authorize cannabis treatment. Guidance covers chronic pain, epilepsy, and cancer-related symptoms. No specialist-only restriction applies.',
'Panama''s medical cannabis market is nascent, with initial licenses issued for cultivation, processing, and distribution. The country''s role as a regional hub and its strong regulatory infrastructure positions it for measured growth. International investor interest is growing.',
'The MINSA regulatory framework is being refined. Export market development is a medium-term policy goal. Full adult-use legalization is not on the current agenda but regional trends may influence future policy.',
'MINSA (Ministerio de Salud) for medical cannabis regulation. IDIAP for cultivation oversight.',
'Law 242 (2021); MINSA implementing regulations; IDIAP cultivation guidance','Current as of Q2 2026','Quarterly','Country-level briefing covering medical legalization and early market development',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PA' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'paraguay','country','PY','Medical Legal (CBD-Focused); Limited Program',
'Paraguay legalized medical cannabis in 2019 under Law 6007/17, with a primary focus on CBD-based products. INAN (National Institute of Food and Nutrition) and DINAVISA (National Directorate of Sanitary Surveillance) regulate medical cannabis. Paraguay is also one of the region''s largest tobacco producers and has agricultural infrastructure transferable to cannabis cultivation, though the program remains limited in scope.',
'Patients access medical cannabis through DINAVISA-authorized pharmacies with a physician prescription. The program initially focused on CBD products for epilepsy and chronic pain. THC-containing products face more significant regulatory barriers.',
'Physicians may prescribe authorized CBD-based cannabis medicines. The regulatory guidance is primarily oriented toward neurological conditions. Specialist referral may be required for complex cases.',
'Paraguay''s medical cannabis market is small but has potential given agricultural capacity. Domestic cultivation for CBD extraction has been licensed. Several companies have expressed interest in Paraguay as a South American production base.',
'The regulatory framework is expected to expand in scope to include more THC-containing products as clinical evidence develops. Export market development is under consideration. Adult-use is not under active consideration.',
'DINAVISA (Dirección Nacional de Vigilancia Sanitaria) for product authorization. INAN for nutritional supplement classification. SENAVE for agricultural licensing.',
'Law 6007/17; DINAVISA resolutions; SENAVE cultivation licensing','Current as of Q2 2026','Annual','Country-level briefing covering limited medical program focused on CBD',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PY' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'peru','country','PE','Medical Legal; Growing Market',
'Peru enacted Law 30681 in 2017 legalizing medical cannabis, making it one of the first South American countries to do so. Regulations under DIGEMID (Dirección General de Medicamentos, Insumos y Drogas) authorize import, domestic production, and commercialization of cannabis-based medical products. The market has grown significantly since 2020 as domestic production capacity expanded.',
'Patients access medical cannabis through DIGEMID-authorized pharmacies with a prescription from a licensed physician. Domestic products and imports from international producers are available. Costs have declined as domestic production has scaled.',
'Physicians registered with the Colegio Médico del Perú may prescribe authorized cannabis medicines. Guidance covers epilepsy, chronic pain, cancer, multiple sclerosis, and palliative care. No specialist-only restriction applies though complex cases may involve referral.',
'Peru''s medical cannabis sector has matured significantly. Multiple domestic producers hold DIGEMID licenses for cultivation, extraction, and manufacturing. Export markets, particularly in Europe and North America, are being developed. The sector has attracted investment from international cannabis companies establishing Peruvian operations.',
'DIGEMID regulatory frameworks are continuing to evolve with improved GMP standards. Export certification frameworks are a key policy priority. Adult-use legalization is not under active consideration but decriminalization provisions remain in effect for small amounts. Peru''s agricultural export orientation makes it a potential long-term cannabis export powerhouse.',
'DIGEMID (under Ministerio de Salud) for product licensing and market authorization. SERFOR (Servicio Nacional Forestal y de Fauna Silvestre) for cultivation.',
'Law 30681 (2017); Supreme Decree 005-2019-SA; DIGEMID product registry; SERFOR cultivation licensing','Current as of Q2 2026; verified against DIGEMID official guidance','Quarterly','Full country-level briefing covering medical program, growing domestic production, and export positioning',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='PE' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'saint-kitts-and-nevis','country','KN','Decriminalized; No Formal Medical Program',
'Saint Kitts and Nevis has moved toward decriminalization of small amounts of cannabis, aligned with CARICOM regional policy discussions. No formal medical cannabis program or adult-use licensing framework exists. The country participates in the CARICOM Regional Commission on Marijuana discussions.',
'No formal patient access pathway exists. No regulated cannabis-based medical products are available through official healthcare channels.',
'Physicians cannot formally prescribe cannabis as no medical regulatory framework exists.',
'No licensed commercial market exists. Interest in cannabis tourism as a supplement to the existing tourism economy has been noted.',
'CARICOM regional developments and economic diversification pressures may prompt formal policy action. No imminent legislation has been introduced.',
'Saint Kitts and Nevis Police Force; Ministry of Health.',
'CARICOM cannabis commission reports; regional comparative monitoring','Current as of Q2 2026','Annual','Country-level briefing noting decriminalization trend and CARICOM context',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='KN' AND jurisdiction_type='country');
