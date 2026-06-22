-- =============================================================================
-- Migration: Gap D — Jurisdiction Schema Unification (Cross-Reference Layer)
-- Platform:  Harbourview Cannabis Intelligence Platform
-- Database:  Supabase PostgreSQL 17
-- Author:    Harbourview Engineering
-- Date:      2026-06-22
-- Purpose:   Adds a non-destructive cross-reference layer that ties together:
--              • public.countries          (iso_alpha2 PK)
--              • public.jurisdictions      (jurisdiction_id PK)
--              • hv_core.jurisdictions     (id uuid PK, iso_code text)
--            No existing tables are dropped or structurally altered.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. CROSS-REFERENCE TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jurisdiction_crossref (
    id                         uuid        NOT NULL DEFAULT gen_random_uuid(),
    countries_iso2             text        UNIQUE,
    jurisdictions_id           text        UNIQUE,
    hv_core_jurisdiction_iso_code text,
    -- ^ Store as plain text — cross-schema FK from public→hv_core is fragile
    --   (schema ownership, pg_dump ordering). Back-fill via scheduled job.
    canonical_iso2             text        NOT NULL,
    canonical_name             text        NOT NULL,
    created_at                 timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT jurisdiction_crossref_pkey
        PRIMARY KEY (id),

    CONSTRAINT jurisdiction_crossref_countries_iso2_fkey
        FOREIGN KEY (countries_iso2)
        REFERENCES public.countries (iso_alpha2)
        ON DELETE SET NULL,

    CONSTRAINT jurisdiction_crossref_jurisdictions_id_fkey
        FOREIGN KEY (jurisdictions_id)
        REFERENCES public.jurisdictions (jurisdiction_id)
        ON DELETE SET NULL,

    CONSTRAINT jurisdiction_crossref_at_least_one_ref
        CHECK (countries_iso2 IS NOT NULL OR jurisdictions_id IS NOT NULL)
);

COMMENT ON TABLE public.jurisdiction_crossref IS
    'Non-destructive cross-reference unifying public.countries, '
    'public.jurisdictions, and hv_core.jurisdictions into a single '
    'canonical jurisdiction identity. Existing tables are not altered.';

COMMENT ON COLUMN public.jurisdiction_crossref.countries_iso2 IS
    'FK → public.countries.iso_alpha2. NULL if no countries row exists yet.';
COMMENT ON COLUMN public.jurisdiction_crossref.jurisdictions_id IS
    'FK → public.jurisdictions.jurisdiction_id. NULL until confirmed populated.';
COMMENT ON COLUMN public.jurisdiction_crossref.hv_core_jurisdiction_iso_code IS
    'Mirrors hv_core.jurisdictions.iso_code. Stored as text (no cross-schema FK) '
    'to avoid pg_dump ordering and schema ownership issues. Back-fill via job.';
COMMENT ON COLUMN public.jurisdiction_crossref.canonical_iso2 IS
    'Single canonical ISO 3166-1 alpha-2 code for this jurisdiction.';
COMMENT ON COLUMN public.jurisdiction_crossref.canonical_name IS
    'Human-readable canonical name for this jurisdiction.';


-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_jurisdiction_crossref_canonical_iso2
    ON public.jurisdiction_crossref (canonical_iso2);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_crossref_hv_core_iso
    ON public.jurisdiction_crossref (hv_core_jurisdiction_iso_code)
    WHERE hv_core_jurisdiction_iso_code IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.jurisdiction_crossref ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_select_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY public_select_jurisdiction_crossref
    ON public.jurisdiction_crossref
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS service_role_all_jurisdiction_crossref ON public.jurisdiction_crossref;
CREATE POLICY service_role_all_jurisdiction_crossref
    ON public.jurisdiction_crossref
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 4. UNIFIED VIEW
-- ---------------------------------------------------------------------------
-- LEFT JOINs all three layers. Columns from public.countries and
-- public.country_profiles_public that may not exist yet are listed; if
-- those columns are absent the view can be adjusted — the join logic is
-- correct regardless.

CREATE OR REPLACE VIEW public.v_jurisdiction_unified AS
SELECT
    xref.canonical_iso2,
    xref.canonical_name,

    -- public.countries columns
    c.country_name,
    c.market_access_status,
    c.medical_status,
    c.adult_use_status,
    c.import_status,
    c.export_status,
    c.opportunity_score,
    c.data_completeness                        AS countries_data_completeness,

    -- public.jurisdictions columns
    j.jurisdiction_id,
    j.data_release_status,
    j.identity_verification_status,

    -- public.country_profiles_public columns
    cpp.public_summary,
    cpp.confidence_band_public,
    cpp.last_regulatory_verified_at

FROM public.jurisdiction_crossref xref
LEFT JOIN public.countries c
    ON c.iso_alpha2 = xref.countries_iso2
LEFT JOIN public.jurisdictions j
    ON j.jurisdiction_id = xref.jurisdictions_id
LEFT JOIN public.country_profiles_public cpp
    ON cpp.jurisdiction_id = j.jurisdiction_id;

COMMENT ON VIEW public.v_jurisdiction_unified IS
    'Unified jurisdiction view joining jurisdiction_crossref with public.countries, '
    'public.jurisdictions, and public.country_profiles_public. '
    'All joins are LEFT so rows without matching detail tables are preserved.';

GRANT SELECT ON public.v_jurisdiction_unified TO anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. SEED DATA — All 191 ISO 3166-1 alpha-2 countries
--    For each row: countries_iso2 = iso_alpha2, jurisdictions_id = NULL
--    (back-filled once jurisdictions table is confirmed populated).
--    ON CONFLICT DO NOTHING ensures full idempotency.
-- ---------------------------------------------------------------------------

INSERT INTO public.jurisdiction_crossref
    (countries_iso2, jurisdictions_id, canonical_iso2, canonical_name)
VALUES
    ('AD', NULL, 'AD', 'Andorra'),
    ('AE', NULL, 'AE', 'United Arab Emirates'),
    ('AF', NULL, 'AF', 'Afghanistan'),
    ('AG', NULL, 'AG', 'Antigua and Barbuda'),
    ('AI', NULL, 'AI', 'Anguilla'),
    ('AL', NULL, 'AL', 'Albania'),
    ('AM', NULL, 'AM', 'Armenia'),
    ('AO', NULL, 'AO', 'Angola'),
    ('AQ', NULL, 'AQ', 'Antarctica'),
    ('AR', NULL, 'AR', 'Argentina'),
    ('AS', NULL, 'AS', 'American Samoa'),
    ('AT', NULL, 'AT', 'Austria'),
    ('AU', NULL, 'AU', 'Australia'),
    ('AW', NULL, 'AW', 'Aruba'),
    ('AX', NULL, 'AX', 'Åland Islands'),
    ('AZ', NULL, 'AZ', 'Azerbaijan'),
    ('BA', NULL, 'BA', 'Bosnia and Herzegovina'),
    ('BB', NULL, 'BB', 'Barbados'),
    ('BD', NULL, 'BD', 'Bangladesh'),
    ('BE', NULL, 'BE', 'Belgium'),
    ('BF', NULL, 'BF', 'Burkina Faso'),
    ('BG', NULL, 'BG', 'Bulgaria'),
    ('BH', NULL, 'BH', 'Bahrain'),
    ('BI', NULL, 'BI', 'Burundi'),
    ('BJ', NULL, 'BJ', 'Benin'),
    ('BL', NULL, 'BL', 'Saint Barthélemy'),
    ('BM', NULL, 'BM', 'Bermuda'),
    ('BN', NULL, 'BN', 'Brunei Darussalam'),
    ('BO', NULL, 'BO', 'Bolivia'),
    ('BQ', NULL, 'BQ', 'Bonaire, Sint Eustatius and Saba'),
    ('BR', NULL, 'BR', 'Brazil'),
    ('BS', NULL, 'BS', 'Bahamas'),
    ('BT', NULL, 'BT', 'Bhutan'),
    ('BV', NULL, 'BV', 'Bouvet Island'),
    ('BW', NULL, 'BW', 'Botswana'),
    ('BY', NULL, 'BY', 'Belarus'),
    ('BZ', NULL, 'BZ', 'Belize'),
    ('CA', NULL, 'CA', 'Canada'),
    ('CC', NULL, 'CC', 'Cocos (Keeling) Islands'),
    ('CD', NULL, 'CD', 'Democratic Republic of the Congo'),
    ('CF', NULL, 'CF', 'Central African Republic'),
    ('CG', NULL, 'CG', 'Republic of the Congo'),
    ('CH', NULL, 'CH', 'Switzerland'),
    ('CI', NULL, 'CI', 'Côte d''Ivoire'),
    ('CK', NULL, 'CK', 'Cook Islands'),
    ('CL', NULL, 'CL', 'Chile'),
    ('CM', NULL, 'CM', 'Cameroon'),
    ('CN', NULL, 'CN', 'China'),
    ('CO', NULL, 'CO', 'Colombia'),
    ('CR', NULL, 'CR', 'Costa Rica'),
    ('CU', NULL, 'CU', 'Cuba'),
    ('CV', NULL, 'CV', 'Cabo Verde'),
    ('CW', NULL, 'CW', 'Curaçao'),
    ('CX', NULL, 'CX', 'Christmas Island'),
    ('CY', NULL, 'CY', 'Cyprus'),
    ('CZ', NULL, 'CZ', 'Czechia'),
    ('DE', NULL, 'DE', 'Germany'),
    ('DJ', NULL, 'DJ', 'Djibouti'),
    ('DK', NULL, 'DK', 'Denmark'),
    ('DM', NULL, 'DM', 'Dominica'),
    ('DO', NULL, 'DO', 'Dominican Republic'),
    ('DZ', NULL, 'DZ', 'Algeria'),
    ('EC', NULL, 'EC', 'Ecuador'),
    ('EE', NULL, 'EE', 'Estonia'),
    ('EG', NULL, 'EG', 'Egypt'),
    ('EH', NULL, 'EH', 'Western Sahara'),
    ('ER', NULL, 'ER', 'Eritrea'),
    ('ES', NULL, 'ES', 'Spain'),
    ('ET', NULL, 'ET', 'Ethiopia'),
    ('FI', NULL, 'FI', 'Finland'),
    ('FJ', NULL, 'FJ', 'Fiji'),
    ('FK', NULL, 'FK', 'Falkland Islands'),
    ('FM', NULL, 'FM', 'Micronesia'),
    ('FO', NULL, 'FO', 'Faroe Islands'),
    ('FR', NULL, 'FR', 'France'),
    ('GA', NULL, 'GA', 'Gabon'),
    ('GB', NULL, 'GB', 'United Kingdom'),
    ('GD', NULL, 'GD', 'Grenada'),
    ('GE', NULL, 'GE', 'Georgia'),
    ('GF', NULL, 'GF', 'French Guiana'),
    ('GG', NULL, 'GG', 'Guernsey'),
    ('GH', NULL, 'GH', 'Ghana'),
    ('GI', NULL, 'GI', 'Gibraltar'),
    ('GL', NULL, 'GL', 'Greenland'),
    ('GM', NULL, 'GM', 'Gambia'),
    ('GN', NULL, 'GN', 'Guinea'),
    ('GP', NULL, 'GP', 'Guadeloupe'),
    ('GQ', NULL, 'GQ', 'Equatorial Guinea'),
    ('GR', NULL, 'GR', 'Greece'),
    ('GS', NULL, 'GS', 'South Georgia and the South Sandwich Islands'),
    ('GT', NULL, 'GT', 'Guatemala'),
    ('GU', NULL, 'GU', 'Guam'),
    ('GW', NULL, 'GW', 'Guinea-Bissau'),
    ('GY', NULL, 'GY', 'Guyana'),
    ('HK', NULL, 'HK', 'Hong Kong'),
    ('HM', NULL, 'HM', 'Heard Island and McDonald Islands'),
    ('HN', NULL, 'HN', 'Honduras'),
    ('HR', NULL, 'HR', 'Croatia'),
    ('HT', NULL, 'HT', 'Haiti'),
    ('HU', NULL, 'HU', 'Hungary'),
    ('ID', NULL, 'ID', 'Indonesia'),
    ('IE', NULL, 'IE', 'Ireland'),
    ('IL', NULL, 'IL', 'Israel'),
    ('IM', NULL, 'IM', 'Isle of Man'),
    ('IN', NULL, 'IN', 'India'),
    ('IO', NULL, 'IO', 'British Indian Ocean Territory'),
    ('IQ', NULL, 'IQ', 'Iraq'),
    ('IR', NULL, 'IR', 'Iran'),
    ('IS', NULL, 'IS', 'Iceland'),
    ('IT', NULL, 'IT', 'Italy'),
    ('JE', NULL, 'JE', 'Jersey'),
    ('JM', NULL, 'JM', 'Jamaica'),
    ('JO', NULL, 'JO', 'Jordan'),
    ('JP', NULL, 'JP', 'Japan'),
    ('KE', NULL, 'KE', 'Kenya'),
    ('KG', NULL, 'KG', 'Kyrgyzstan'),
    ('KH', NULL, 'KH', 'Cambodia'),
    ('KI', NULL, 'KI', 'Kiribati'),
    ('KM', NULL, 'KM', 'Comoros'),
    ('KN', NULL, 'KN', 'Saint Kitts and Nevis'),
    ('KP', NULL, 'KP', 'North Korea'),
    ('KR', NULL, 'KR', 'South Korea'),
    ('KW', NULL, 'KW', 'Kuwait'),
    ('KY', NULL, 'KY', 'Cayman Islands'),
    ('KZ', NULL, 'KZ', 'Kazakhstan'),
    ('LA', NULL, 'LA', 'Laos'),
    ('LB', NULL, 'LB', 'Lebanon'),
    ('LC', NULL, 'LC', 'Saint Lucia'),
    ('LI', NULL, 'LI', 'Liechtenstein'),
    ('LK', NULL, 'LK', 'Sri Lanka'),
    ('LR', NULL, 'LR', 'Liberia'),
    ('LS', NULL, 'LS', 'Lesotho'),
    ('LT', NULL, 'LT', 'Lithuania'),
    ('LU', NULL, 'LU', 'Luxembourg'),
    ('LV', NULL, 'LV', 'Latvia'),
    ('LY', NULL, 'LY', 'Libya'),
    ('MA', NULL, 'MA', 'Morocco'),
    ('MC', NULL, 'MC', 'Monaco'),
    ('MD', NULL, 'MD', 'Moldova'),
    ('ME', NULL, 'ME', 'Montenegro'),
    ('MF', NULL, 'MF', 'Saint Martin (French part)'),
    ('MG', NULL, 'MG', 'Madagascar'),
    ('MH', NULL, 'MH', 'Marshall Islands'),
    ('MK', NULL, 'MK', 'North Macedonia'),
    ('ML', NULL, 'ML', 'Mali'),
    ('MM', NULL, 'MM', 'Myanmar'),
    ('MN', NULL, 'MN', 'Mongolia'),
    ('MO', NULL, 'MO', 'Macao'),
    ('MP', NULL, 'MP', 'Northern Mariana Islands'),
    ('MQ', NULL, 'MQ', 'Martinique'),
    ('MR', NULL, 'MR', 'Mauritania'),
    ('MS', NULL, 'MS', 'Montserrat'),
    ('MT', NULL, 'MT', 'Malta'),
    ('MU', NULL, 'MU', 'Mauritius'),
    ('MV', NULL, 'MV', 'Maldives'),
    ('MW', NULL, 'MW', 'Malawi'),
    ('MX', NULL, 'MX', 'Mexico'),
    ('MY', NULL, 'MY', 'Malaysia'),
    ('MZ', NULL, 'MZ', 'Mozambique'),
    ('NA', NULL, 'NA', 'Namibia'),
    ('NC', NULL, 'NC', 'New Caledonia'),
    ('NE', NULL, 'NE', 'Niger'),
    ('NF', NULL, 'NF', 'Norfolk Island'),
    ('NG', NULL, 'NG', 'Nigeria'),
    ('NI', NULL, 'NI', 'Nicaragua'),
    ('NL', NULL, 'NL', 'Netherlands'),
    ('NO', NULL, 'NO', 'Norway'),
    ('NP', NULL, 'NP', 'Nepal'),
    ('NR', NULL, 'NR', 'Nauru'),
    ('NU', NULL, 'NU', 'Niue'),
    ('NZ', NULL, 'NZ', 'New Zealand'),
    ('OM', NULL, 'OM', 'Oman'),
    ('PA', NULL, 'PA', 'Panama'),
    ('PE', NULL, 'PE', 'Peru'),
    ('PF', NULL, 'PF', 'French Polynesia'),
    ('PG', NULL, 'PG', 'Papua New Guinea'),
    ('PH', NULL, 'PH', 'Philippines'),
    ('PK', NULL, 'PK', 'Pakistan'),
    ('PL', NULL, 'PL', 'Poland'),
    ('PM', NULL, 'PM', 'Saint Pierre and Miquelon'),
    ('PN', NULL, 'PN', 'Pitcairn'),
    ('PR', NULL, 'PR', 'Puerto Rico'),
    ('PS', NULL, 'PS', 'Palestine'),
    ('PT', NULL, 'PT', 'Portugal'),
    ('PW', NULL, 'PW', 'Palau'),
    ('PY', NULL, 'PY', 'Paraguay'),
    ('QA', NULL, 'QA', 'Qatar'),
    ('RE', NULL, 'RE', 'Réunion'),
    ('RO', NULL, 'RO', 'Romania'),
    ('RS', NULL, 'RS', 'Serbia'),
    ('RU', NULL, 'RU', 'Russia'),
    ('RW', NULL, 'RW', 'Rwanda'),
    ('SA', NULL, 'SA', 'Saudi Arabia'),
    ('SB', NULL, 'SB', 'Solomon Islands'),
    ('SC', NULL, 'SC', 'Seychelles'),
    ('SD', NULL, 'SD', 'Sudan'),
    ('SE', NULL, 'SE', 'Sweden'),
    ('SG', NULL, 'SG', 'Singapore'),
    ('SH', NULL, 'SH', 'Saint Helena, Ascension and Tristan da Cunha'),
    ('SI', NULL, 'SI', 'Slovenia'),
    ('SJ', NULL, 'SJ', 'Svalbard and Jan Mayen'),
    ('SK', NULL, 'SK', 'Slovakia'),
    ('SL', NULL, 'SL', 'Sierra Leone'),
    ('SM', NULL, 'SM', 'San Marino'),
    ('SN', NULL, 'SN', 'Senegal'),
    ('SO', NULL, 'SO', 'Somalia'),
    ('SR', NULL, 'SR', 'Suriname'),
    ('SS', NULL, 'SS', 'South Sudan'),
    ('ST', NULL, 'ST', 'São Tomé and Príncipe'),
    ('SV', NULL, 'SV', 'El Salvador'),
    ('SX', NULL, 'SX', 'Sint Maarten (Dutch part)'),
    ('SY', NULL, 'SY', 'Syria'),
    ('SZ', NULL, 'SZ', 'Eswatini'),
    ('TC', NULL, 'TC', 'Turks and Caicos Islands'),
    ('TD', NULL, 'TD', 'Chad'),
    ('TF', NULL, 'TF', 'French Southern Territories'),
    ('TG', NULL, 'TG', 'Togo'),
    ('TH', NULL, 'TH', 'Thailand'),
    ('TJ', NULL, 'TJ', 'Tajikistan'),
    ('TK', NULL, 'TK', 'Tokelau'),
    ('TL', NULL, 'TL', 'Timor-Leste'),
    ('TM', NULL, 'TM', 'Turkmenistan'),
    ('TN', NULL, 'TN', 'Tunisia'),
    ('TO', NULL, 'TO', 'Tonga'),
    ('TR', NULL, 'TR', 'Turkey'),
    ('TT', NULL, 'TT', 'Trinidad and Tobago'),
    ('TV', NULL, 'TV', 'Tuvalu'),
    ('TW', NULL, 'TW', 'Taiwan'),
    ('TZ', NULL, 'TZ', 'Tanzania'),
    ('UA', NULL, 'UA', 'Ukraine'),
    ('UG', NULL, 'UG', 'Uganda'),
    ('UM', NULL, 'UM', 'United States Minor Outlying Islands'),
    ('US', NULL, 'US', 'United States'),
    ('UY', NULL, 'UY', 'Uruguay'),
    ('UZ', NULL, 'UZ', 'Uzbekistan'),
    ('VA', NULL, 'VA', 'Vatican City'),
    ('VC', NULL, 'VC', 'Saint Vincent and the Grenadines'),
    ('VE', NULL, 'VE', 'Venezuela'),
    ('VG', NULL, 'VG', 'British Virgin Islands'),
    ('VI', NULL, 'VI', 'United States Virgin Islands'),
    ('VN', NULL, 'VN', 'Viet Nam'),
    ('VU', NULL, 'VU', 'Vanuatu'),
    ('WF', NULL, 'WF', 'Wallis and Futuna'),
    ('WS', NULL, 'WS', 'Samoa'),
    ('XK', NULL, 'XK', 'Kosovo'),
    ('YE', NULL, 'YE', 'Yemen'),
    ('YT', NULL, 'YT', 'Mayotte'),
    ('ZA', NULL, 'ZA', 'South Africa'),
    ('ZM', NULL, 'ZM', 'Zambia'),
    ('ZW', NULL, 'ZW', 'Zimbabwe')

ON CONFLICT (countries_iso2) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. GRANTS
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.jurisdiction_crossref TO anon, authenticated;
GRANT ALL    ON public.jurisdiction_crossref TO service_role;


COMMIT;
