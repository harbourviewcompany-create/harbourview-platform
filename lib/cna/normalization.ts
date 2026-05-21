export type CnaRawAuthorityRecord = {
  countryName: string;
  authorityName: string;
  countryIso2?: string | null;
  countryIso3?: string | null;
  authorityType?: string | null;
  city?: string | null;
  addressText?: string | null;
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
  websiteUrl?: string | null;
  contactPerson?: string | null;
};

export type CnaPublicAuthorityDto = {
  countryName: string;
  countryIso2: string | null;
  countryIso3: string | null;
  authorityName: string;
  authorityType: string | null;
  websiteUrl: string | null;
  sourceLabel: 'UNODC Country Narcotic Authorities Directory';
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeName(value: string): string {
  return normalizeWhitespace(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeSearchKey(value: string): string {
  return normalizeName(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeCountryName(countryName: string): string {
  return normalizeSearchKey(countryName);
}

export function normalizeAuthorityName(authorityName: string): string {
  return normalizeSearchKey(authorityName);
}

export function buildCnaDedupeKey(record: Pick<CnaRawAuthorityRecord, 'countryName' | 'authorityName' | 'countryIso2' | 'countryIso3'>): string {
  const country = record.countryIso3?.toUpperCase() || record.countryIso2?.toUpperCase() || normalizeCountryName(record.countryName);
  return [country, normalizeAuthorityName(record.authorityName)].join('::');
}

export function buildPrivateNormalizedRecord(record: CnaRawAuthorityRecord) {
  return {
    country_iso2: record.countryIso2?.toUpperCase() ?? null,
    country_iso3: record.countryIso3?.toUpperCase() ?? null,
    country_name: normalizeWhitespace(record.countryName),
    normalized_country_name: normalizeCountryName(record.countryName),
    authority_name: normalizeWhitespace(record.authorityName),
    normalized_authority_name: normalizeAuthorityName(record.authorityName),
    authority_type: record.authorityType ? normalizeWhitespace(record.authorityType) : null,
    city: record.city ? normalizeWhitespace(record.city) : null,
    address_text: record.addressText ? normalizeWhitespace(record.addressText) : null,
    email: record.email ? normalizeWhitespace(record.email).toLowerCase() : null,
    phone: record.phone ? normalizeWhitespace(record.phone) : null,
    fax: record.fax ? normalizeWhitespace(record.fax) : null,
    website_url: record.websiteUrl ? normalizeWhitespace(record.websiteUrl) : null,
    contact_person: record.contactPerson ? normalizeWhitespace(record.contactPerson) : null,
    dedupe_key: buildCnaDedupeKey(record),
  };
}

export function toCnaPublicAuthorityDto(record: CnaRawAuthorityRecord): CnaPublicAuthorityDto {
  return {
    countryName: normalizeWhitespace(record.countryName),
    countryIso2: record.countryIso2?.toUpperCase() ?? null,
    countryIso3: record.countryIso3?.toUpperCase() ?? null,
    authorityName: normalizeWhitespace(record.authorityName),
    authorityType: record.authorityType ? normalizeWhitespace(record.authorityType) : null,
    websiteUrl: record.websiteUrl ? normalizeWhitespace(record.websiteUrl) : null,
    sourceLabel: 'UNODC Country Narcotic Authorities Directory',
  };
}

export const CNA_PRIVATE_FIELDS = [
  'addressText',
  'email',
  'phone',
  'fax',
  'contactPerson',
  'dedupeKey',
  'rawRecord',
  'normalizedRecord',
  'provenance',
  'sourceSnapshotId',
  'storagePath',
  'parserDiagnostics',
  'reviewStatus',
  'publicReleaseStatus',
] as const;
