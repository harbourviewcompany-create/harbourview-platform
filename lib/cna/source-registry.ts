import { createHash } from 'node:crypto';

export type CnaSourceType = 'unodc_cna_page' | 'unodc_cna_pdf';

export type CnaOfficialSourceDefinition = {
  sourceKey: string;
  title: string;
  sourceType: CnaSourceType;
  canonicalUrl: string;
  isbn?: string;
  publicationYear?: number;
  authorityName: string;
  clearanceStatus: 'source_cleared';
  clearanceBasis: string;
  clearanceEvidenceDate: string;
  usageBoundary: string;
};

export const CNA_CLEARANCE_EVIDENCE = {
  receivedAt: '2026-05-19',
  evidenceLabel: 'May 19, 2026 INCB/UNODC email confirmation',
  summary:
    'INCB/UNODC Secretariat confirmed the CNA database is open, requires no special permission, and identified the UNODC CNA page plus 2025_CNA.pdf as the applicable public sources.',
} as const;

const AUTHORITY_NAME =
  'United Nations Office on Drugs and Crime / International Narcotics Control Board Secretariat';

const USAGE_BOUNDARY =
  'Official public source clearance permits controlled ingestion and private provenance storage. Public output must use explicit redacted DTOs and must not expose raw extraction notes, snapshot storage paths, parser diagnostics, private review status, or internal provenance payloads.';

export const CNA_OFFICIAL_SOURCES: CnaOfficialSourceDefinition[] = [
  {
    sourceKey: 'unodc-cna-page',
    title: 'UNODC Country Narcotic Authorities page',
    sourceType: 'unodc_cna_page',
    canonicalUrl: 'https://www.unodc.org/unodc/en/commissions/Secretariat/cna.html',
    authorityName: AUTHORITY_NAME,
    clearanceStatus: 'source_cleared',
    clearanceBasis: CNA_CLEARANCE_EVIDENCE.summary,
    clearanceEvidenceDate: CNA_CLEARANCE_EVIDENCE.receivedAt,
    usageBoundary: USAGE_BOUNDARY,
  },
  {
    sourceKey: 'unodc-2025-cna-pdf',
    title: 'Country Narcotic Authorities Directory 2025 PDF',
    sourceType: 'unodc_cna_pdf',
    canonicalUrl: 'https://www.unodc.org/documents/commissions/CND/Publications/2025_CNA.pdf',
    isbn: '9789210030106',
    publicationYear: 2025,
    authorityName: AUTHORITY_NAME,
    clearanceStatus: 'source_cleared',
    clearanceBasis: CNA_CLEARANCE_EVIDENCE.summary,
    clearanceEvidenceDate: CNA_CLEARANCE_EVIDENCE.receivedAt,
    usageBoundary: USAGE_BOUNDARY,
  },
];

export function sha256Hex(input: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

export function buildSourceRegistrationPayload(source: CnaOfficialSourceDefinition) {
  return {
    source_key: source.sourceKey,
    title: source.title,
    source_type: source.sourceType,
    authority_name: source.authorityName,
    canonical_url: source.canonicalUrl,
    isbn: source.isbn ?? null,
    publication_year: source.publicationYear ?? null,
    clearance_status: source.clearanceStatus,
    clearance_basis: source.clearanceBasis,
    clearance_evidence_date: source.clearanceEvidenceDate,
    usage_boundary: source.usageBoundary,
    is_active: true,
  };
}

export function buildRegistrationSnapshotSeed(source: CnaOfficialSourceDefinition) {
  const seed = JSON.stringify(buildSourceRegistrationPayload(source));
  return {
    source_key: source.sourceKey,
    snapshot_url: source.canonicalUrl,
    fetch_status: 'registered' as const,
    sha256: sha256Hex(seed),
    parser_version: 'placeholder-v0',
    extraction_status: 'pending' as const,
    extraction_notes:
      'Registration-only snapshot seed. Live fetching and parser extraction are intentionally deferred to the controlled ingestion runner.',
  };
}

export function buildSourceRegistrationSql(): string {
  const values = CNA_OFFICIAL_SOURCES.map((source) => buildSourceRegistrationPayload(source));
  return JSON.stringify(values, null, 2);
}
