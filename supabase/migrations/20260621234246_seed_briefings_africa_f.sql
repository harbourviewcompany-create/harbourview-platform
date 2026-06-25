
INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'uganda','country','UG','Prohibited',
'Cannabis is prohibited in Uganda under the Narcotic Drugs and Psychotropic Substances (Control) Act. Enforcement is active. No medical cannabis program exists. Uganda has not engaged in formal cannabis policy reform discussions.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Uganda''s fertile agricultural land has been noted for potential cannabis cultivation if regulation changes.',
'Cannabis reform is not a current policy priority. No legislative action is anticipated.',
'National Drug Authority (NDA); Uganda Police Force Anti-Narcotics Unit.',
'Narcotic Drugs and Psychotropic Substances (Control) Act; NDA reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='UG' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zambia','country','ZM','Prohibited',
'Cannabis is prohibited in Zambia under the Narcotic Drugs and Psychotropic Substances Act of 1993. No medical cannabis program exists. Zambia has not engaged in formal cannabis policy reform discussions, though its neighbor Zimbabwe''s 2018 legalization has been noted in policy circles.',
'No legal patient access pathway exists.',
'Physicians cannot prescribe cannabis as no regulatory framework exists.',
'No licensed market exists. Zambia''s agricultural capacity and stable governance could make it a future cannabis market if reform occurs.',
'Zimbabwe''s medical cannabis program may create regional pressure for Zambia to consider reform. No near-term legislative action is anticipated.',
'Drug Enforcement Commission (DEC); Ministry of Health (Zambia Medicines Regulatory Authority, ZAMRA).',
'Narcotic Drugs and Psychotropic Substances Act 1993; DEC annual reports; regional comparative analysis','Current as of Q2 2026','Annual','Country-level briefing noting prohibited status',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZM' AND jurisdiction_type='country');

INSERT INTO cc_jurisdiction_briefings (jurisdiction_slug,jurisdiction_type,country_iso2,program_status,public_summary,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,data_source_summary,verification_summary,update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state)
SELECT 'zimbabwe','country','ZW','Medical Legal; Pioneer Sub-Saharan Africa',
'Zimbabwe became one of sub-Saharan Africa''s first countries to legalize medical cannabis in 2018 through the Dangerous Drugs and Controlled Substances (General) Regulations (SI 62 of 2018). The Medicines Control Authority of Zimbabwe (MCAZ) licenses cultivation, processing, and export of medical cannabis. Zimbabwe''s program is primarily export-oriented, with Zimbabwean-produced cannabis targeting European pharmaceutical markets.',
'Domestic patient access to medical cannabis products is limited. The program''s primary focus is on cultivating and processing cannabis for international medical markets. Local medical access pathways are developing.',
'Zimbabwean physicians are not yet widely able to access domestic clinical cannabis products. Medical access frameworks for local patients are being developed alongside the export sector.',
'Zimbabwe''s medical cannabis sector has attracted investment from international cannabis companies establishing licensed growing operations. Zimbabwe''s fertile agricultural land, skilled farming workforce, and established export infrastructure (tobacco) provide a strong foundation. EU GMP compliance for export access is a primary focus.',
'The MCAZ licensing framework continues to be refined. Domestic medical access program development is anticipated alongside continued export market expansion. Zimbabwe''s position in southern Africa and agricultural infrastructure makes it a significant long-term player.',
'MCAZ (Medicines Control Authority of Zimbabwe) under the Ministry of Health and Child Care.',
'SI 62 of 2018 (Dangerous Drugs and Controlled Substances Regulations); MCAZ licensing registry and guidance; Ministry of Health cannabis policy','Current as of Q2 2026; verified against MCAZ official guidance','Quarterly','Full country-level briefing covering pioneer medical cannabis legalization and export-oriented market',DATE '2026-06-21','[]'::jsonb,'[]'::jsonb,'reviewed'
WHERE NOT EXISTS (SELECT 1 FROM cc_jurisdiction_briefings WHERE country_iso2='ZW' AND jurisdiction_type='country');
