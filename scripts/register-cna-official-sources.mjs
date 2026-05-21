import { createHash } from 'node:crypto';

const CNA_CLEARANCE_EVIDENCE = {
  receivedAt: '2026-05-19',
  evidenceLabel: 'May 19, 2026 INCB/UNODC email confirmation',
  summary:
    'INCB/UNODC Secretariat confirmed the CNA database is open, requires no special permission, and identified the UNODC CNA page plus 2025_CNA.pdf as the applicable public sources.',
};

const AUTHORITY_NAME =
  'United Nations Office on Drugs and Crime / International Narcotics Control Board Secretariat';

const USAGE_BOUNDARY =
  'Official public source clearance permits controlled ingestion and private provenance storage. Public output must use explicit redacted DTOs and must not expose raw extraction notes, snapshot storage paths, parser diagnostics, private review status, or internal provenance payloads.';

const CNA_OFFICIAL_SOURCES = [
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

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function buildSourceRegistrationPayload(source) {
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

function buildRegistrationSnapshotSeed(source) {
  const seed = JSON.stringify(buildSourceRegistrationPayload(source));
  return {
    source_key: source.sourceKey,
    snapshot_url: source.canonicalUrl,
    fetch_status: 'registered',
    sha256: sha256Hex(seed),
    parser_version: 'placeholder-v0',
    extraction_status: 'pending',
    extraction_notes:
      'Registration-only snapshot seed. Live fetching and parser extraction are intentionally deferred to the controlled ingestion runner.',
  };
}

const payload = CNA_OFFICIAL_SOURCES.map((source) => ({
  source: buildSourceRegistrationPayload(source),
  registrationSnapshot: buildRegistrationSnapshotSeed(source),
}));

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), officialSources: payload }, null, 2));
