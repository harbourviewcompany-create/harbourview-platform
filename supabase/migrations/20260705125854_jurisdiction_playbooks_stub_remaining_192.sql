INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
)
SELECT
  v.iso2, v.name, 'moderate', 12,
  NULL, 'Pending research — no verified market-entry data yet.', '[]'::jsonb, '[]'::jsonb,
  '{}'::text[], 'draft', CURRENT_DATE
FROM (VALUES
('AF','Afghanistan'),('AL','Albania'),('DZ','Algeria'),('AD','Andorra'),('AO','Angola'),
('AG','Antigua and Barbuda'),('AR','Argentina'),('AM','Armenia'),('AT','Austria'),('AZ','Azerbaijan'),
('BS','Bahamas'),('BH','Bahrain'),('BD','Bangladesh'),('BB','Barbados'),('BY','Belarus'),
('BE','Belgium'),('BZ','Belize'),('BJ','Benin'),('BT','Bhutan'),('BO','Bolivia'),
('BA','Bosnia and Herzegovina'),('BW','Botswana'),('BN','Brunei'),('BG','Bulgaria'),('BF','Burkina Faso'),
('BI','Burundi'),('KH','Cambodia'),('CM','Cameroon'),('CV','Cape Verde'),('CF','Central African Republic'),
('TD','Chad'),('CL','Chile'),('CN','China'),('KM','Comoros'),('CR','Costa Rica'),
('CI','Cote d''Ivoire'),('HR','Croatia'),('CU','Cuba'),('CY','Cyprus'),('CD','Democratic Republic of the Congo'),
('DK','Denmark'),('DJ','Djibouti'),('DM','Dominica'),('DO','Dominican Republic'),('EC','Ecuador'),
('EG','Egypt'),('SV','El Salvador'),('GQ','Equatorial Guinea'),('ER','Eritrea'),('EE','Estonia'),
('SZ','Eswatini'),('ET','Ethiopia'),('FK','Falkland Islands'),('FO','Faroe Islands'),('FJ','Fiji'),
('FI','Finland'),('GA','Gabon'),('GM','Gambia'),('GE','Georgia'),('GH','Ghana'),
('GR','Greece'),('GL','Greenland'),('GD','Grenada'),('GT','Guatemala'),('GN','Guinea'),
('GW','Guinea-Bissau'),('GY','Guyana'),('HT','Haiti'),('VA','Holy See'),('HN','Honduras'),
('HK','Hong Kong'),('HU','Hungary'),('IS','Iceland'),('IN','India'),('ID','Indonesia'),
('IR','Iran'),('IQ','Iraq'),('IE','Ireland'),('IT','Italy'),('JM','Jamaica'),
('JP','Japan'),('JO','Jordan'),('KZ','Kazakhstan'),('KE','Kenya'),('KI','Kiribati'),
('XK','Kosovo'),('KW','Kuwait'),('KG','Kyrgyzstan'),('LA','Laos'),('LV','Latvia'),
('LB','Lebanon'),('LS','Lesotho'),('LR','Liberia'),('LY','Libya'),('LI','Liechtenstein'),
('LT','Lithuania'),('MG','Madagascar'),('MW','Malawi'),('MY','Malaysia'),('MV','Maldives'),
('ML','Mali'),('MH','Marshall Islands'),('MR','Mauritania'),('MU','Mauritius'),('FM','Micronesia'),
('MD','Moldova'),('MC','Monaco'),('MN','Mongolia'),('ME','Montenegro'),('MA','Morocco'),
('MZ','Mozambique'),('MM','Myanmar'),('NA','Namibia'),('NR','Nauru'),('NP','Nepal'),
('NI','Nicaragua'),('NE','Niger'),('NG','Nigeria'),('KP','North Korea'),('MK','North Macedonia'),
('NO','Norway'),('OM','Oman'),('PK','Pakistan'),('PW','Palau'),('PS','Palestine'),
('PA','Panama'),('PG','Papua New Guinea'),('PY','Paraguay'),('PE','Peru'),('PH','Philippines'),
('PR','Puerto Rico'),('QA','Qatar'),('CG','Republic of the Congo'),('RO','Romania'),('RU','Russia'),
('RW','Rwanda'),('KN','Saint Kitts and Nevis'),('LC','Saint Lucia'),('VC','Saint Vincent and the Grenadines'),('WS','Samoa'),
('SM','San Marino'),('ST','Sao Tome and Principe'),('SA','Saudi Arabia'),('SN','Senegal'),('RS','Serbia'),
('SC','Seychelles'),('SL','Sierra Leone'),('SG','Singapore'),('SK','Slovakia'),('SI','Slovenia'),
('SB','Solomon Islands'),('SO','Somalia'),('KR','South Korea'),('SS','South Sudan'),('LK','Sri Lanka'),
('SD','Sudan'),('SR','Suriname'),('SE','Sweden'),('SY','Syria'),('TW','Taiwan'),
('TJ','Tajikistan'),('TZ','Tanzania'),('TL','Timor-Leste'),('TG','Togo'),('TO','Tonga'),
('TT','Trinidad and Tobago'),('TN','Tunisia'),('TR','Türkiye'),('TM','Turkmenistan'),('TV','Tuvalu'),
('UG','Uganda'),('UA','Ukraine'),('AE','United Arab Emirates'),('UZ','Uzbekistan'),('VU','Vanuatu'),
('VE','Venezuela'),('VN','Vietnam'),('EH','Western Sahara'),('YE','Yemen'),('ZM','Zambia'),
('ZW','Zimbabwe')
) AS v(iso2, name)
ON CONFLICT (country_iso2) DO NOTHING;
