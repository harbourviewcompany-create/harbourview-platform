# CNA Source Clearance Evidence

## Status

GO for controlled private ingestion foundation.

HOLD for public exposure of contact-level data until an explicit public DTO route, redaction tests, and operator review workflow are implemented.

## Evidence basis

On May 19, 2026, the INCB/UNODC Secretariat replied to the access request for the Country Narcotic Authorities Directory and confirmed that the access to the database is open and no special permission is required. The reply identified the UNODC Country Narcotic Authorities page and the 2025 CNA PDF/e-book as the relevant sources.

Official source URLs recorded for ingestion:

1. UNODC Country Narcotic Authorities page: `https://www.unodc.org/unodc/en/commissions/Secretariat/cna.html`
2. Country Narcotic Authorities Directory 2025 PDF: `https://www.unodc.org/documents/commissions/CND/Publications/2025_CNA.pdf`
3. UNODC publications page: `https://www.unodc.org/unodc/en/commissions/Secretariat/publications.html`

Directory ISBN recorded from the request thread: `9789210030106`.

## Interpretation

The email is treated as source-clearance evidence only. It supports ingestion from official public UNODC/INCB sources. It does not authorize uncontrolled redistribution, expose private ingestion diagnostics, bypass public/private boundaries, or publish raw provenance payloads.

## Public/private boundary

Private ingestion tables may store raw snapshots, hashes, parser diagnostics, dedupe keys, extraction confidence, raw records, normalized records, contact fields, source-page markers, and review status.

Public surfaces may only use DTOs that intentionally expose approved fields. The default public DTO for CNA authorities may expose country, authority name, authority type, website URL, and a general source label. It must not expose email, phone, fax, personal contact names, raw address text, raw records, provenance JSON, snapshot paths, parser diagnostics, review notes, dedupe keys, or internal status fields unless a separate approval decision and redaction test exists.

## Update monitoring

Default cadence: weekly metadata check of the UNODC CNA page and PDF URL, plus manual check after UNODC/CND publication-cycle updates. Every check must record an ingestion event and, if fetched, a SHA-256 snapshot hash. Changed hashes must trigger parser rerun and analyst review before any public DTO refresh.

## Implementation notes

The first implementation adds schema, source registry helpers, registration hash generation, parser placeholders, and tests. It intentionally does not fetch live content, parse the PDF, write public routes, or publish authority contacts.
