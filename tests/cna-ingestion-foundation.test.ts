import { describe, expect, it } from 'vitest';
import {
  CNA_CLEARANCE_EVIDENCE,
  CNA_OFFICIAL_SOURCES,
  buildRegistrationSnapshotSeed,
  buildSourceRegistrationPayload,
  sha256Hex,
} from '../lib/cna/source-registry';
import {
  CNA_PRIVATE_FIELDS,
  buildCnaDedupeKey,
  buildPrivateNormalizedRecord,
  toCnaPublicAuthorityDto,
} from '../lib/cna/normalization';
import { parseUnodcCnaPagePlaceholder, parseUnodcCnaPdfPlaceholder } from '../lib/cna/parsers';

describe('CNA ingestion foundation', () => {
  it('registers the UNODC CNA page and 2025 PDF as source-cleared official sources', () => {
    expect(CNA_OFFICIAL_SOURCES).toHaveLength(2);
    expect(CNA_CLEARANCE_EVIDENCE.receivedAt).toBe('2026-05-19');

    const sourceKeys = CNA_OFFICIAL_SOURCES.map((source) => source.sourceKey);
    expect(sourceKeys).toEqual(['unodc-cna-page', 'unodc-2025-cna-pdf']);

    for (const source of CNA_OFFICIAL_SOURCES) {
      const payload = buildSourceRegistrationPayload(source);
      expect(payload.clearance_status).toBe('source_cleared');
      expect(payload.clearance_basis).toContain('requires no special permission');
      expect(payload.authority_name).toContain('United Nations Office on Drugs and Crime');
      expect(payload.canonical_url).toMatch(/^https:\/\/www\.unodc\.org\//);
    }
  });

  it('creates stable SHA-256 registration snapshot hashes', () => {
    expect(sha256Hex('test')).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');

    for (const source of CNA_OFFICIAL_SOURCES) {
      const snapshot = buildRegistrationSnapshotSeed(source);
      expect(snapshot.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot.fetch_status).toBe('registered');
      expect(snapshot.extraction_status).toBe('pending');
    }
  });

  it('builds deterministic dedupe keys from country and authority names', () => {
    const one = buildCnaDedupeKey({ countryName: 'Côte d’Ivoire', countryIso3: 'CIV', authorityName: ' Ministry of Health  ' });
    const two = buildCnaDedupeKey({ countryName: 'Cote d Ivoire', countryIso3: 'civ', authorityName: 'Ministry   of   Health' });
    expect(one).toBe(two);
    expect(one).toBe('CIV::ministry of health');
  });

  it('normalizes private records while preserving public DTO redaction', () => {
    const record = {
      countryName: 'Canada',
      countryIso2: 'ca',
      countryIso3: 'can',
      authorityName: 'Office of Controlled Substances',
      authorityType: 'National authority',
      addressText: 'private address',
      email: 'CONTACT@EXAMPLE.ORG',
      phone: '+1 555 0000',
      contactPerson: 'Private Person',
      websiteUrl: 'https://example.org',
    };

    const privateRecord = buildPrivateNormalizedRecord(record);
    expect(privateRecord.email).toBe('contact@example.org');
    expect(privateRecord.dedupe_key).toBe('CAN::office of controlled substances');

    const publicDto = toCnaPublicAuthorityDto(record);
    expect(publicDto).toEqual({
      countryName: 'Canada',
      countryIso2: 'CA',
      countryIso3: 'CAN',
      authorityName: 'Office of Controlled Substances',
      authorityType: 'National authority',
      websiteUrl: 'https://example.org',
      sourceLabel: 'UNODC Country Narcotic Authorities Directory',
    });

    for (const field of CNA_PRIVATE_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(publicDto, field)).toBe(false);
    }
  });

  it('keeps page and PDF parsers as explicit placeholders', () => {
    expect(parseUnodcCnaPagePlaceholder({ sourceKey: 'unodc-cna-page', sourceUrl: 'x', contentType: 'html', content: '<html />' }).status).toBe('placeholder');
    expect(parseUnodcCnaPdfPlaceholder({ sourceKey: 'unodc-2025-cna-pdf', sourceUrl: 'x', contentType: 'pdf', content: Buffer.from('%PDF') }).status).toBe('placeholder');
  });
});
