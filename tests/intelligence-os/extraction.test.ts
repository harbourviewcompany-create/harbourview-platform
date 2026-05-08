import { describe, expect, it } from 'vitest';
import {
  assertPublicSafe,
  counterparties,
  findForbiddenPublicFieldNames,
  findForbiddenPublicStrings,
  icMemos,
  intelligenceSignals,
  intelligenceSources,
  mandateReviews,
  marketIntelligenceRecords,
  missionProfiles,
  networkContacts,
  projectPublicCollection,
  scoreMissionProfile,
  toPublicCounterpartySummary,
  toPublicMarketSummary,
  toPublicSignalSummary,
  toPublicSourceSummary,
  validateCounterpartyRecord,
  validateICMemo,
  validateIntelligenceSignal,
  validateIntelligenceSource,
  validateMandateReview,
  validateMarketIntelligenceRecord,
  validateMissionProfile,
  validateNetworkContactRecord
} from '../../lib/intelligence-os';

const stringify = (value: unknown) => JSON.stringify(value);

describe('Harbourview Intelligence OS extraction V1.1', () => {
  it('validates all typed fixture families', () => {
    expect(marketIntelligenceRecords.map(validateMarketIntelligenceRecord)).toHaveLength(2);
    expect(intelligenceSignals.map(validateIntelligenceSignal)).toHaveLength(2);
    expect(intelligenceSources.map(validateIntelligenceSource)).toHaveLength(2);
    expect(counterparties.map(validateCounterpartyRecord)).toHaveLength(1);
    expect(networkContacts.map(validateNetworkContactRecord)).toHaveLength(1);
    expect(mandateReviews.map(validateMandateReview)).toHaveLength(1);
    expect(missionProfiles.map(validateMissionProfile)).toHaveLength(2);
    expect(icMemos.map(validateICMemo)).toHaveLength(1);
  });

  it('projects only published market intelligence records to public summaries', () => {
    const projected = projectPublicCollection(marketIntelligenceRecords, toPublicMarketSummary);

    expect(projected).toHaveLength(1);
    expect(projected[0]?.country).toBe('Germany');
    expect(projected[0]).not.toHaveProperty('sourceIds');
    expect(projected[0]).not.toHaveProperty('privateAssessment');
    expect(projected[0]).not.toHaveProperty('internalNotes');
    expect(() => assertPublicSafe(projected)).not.toThrow();
  });

  it('projects only published signals and strips evidence, provenance and analyst fields', () => {
    const projected = projectPublicCollection(intelligenceSignals, toPublicSignalSummary);

    expect(projected).toHaveLength(1);
    expect(projected[0]?.id).toBe('signal-de-importer-demand-001');
    expect(projected[0]).not.toHaveProperty('sourceIds');
    expect(projected[0]).not.toHaveProperty('evidence');
    expect(projected[0]).not.toHaveProperty('provenanceSummary');
    expect(projected[0]).not.toHaveProperty('analystAssessment');
    expect(() => assertPublicSafe(projected)).not.toThrow();
  });

  it('keeps source registry private while allowing source-type summaries without URL or name leakage', () => {
    const projected = intelligenceSources.map(toPublicSourceSummary);
    const body = stringify(projected);

    expect(projected).toHaveLength(2);
    expect(body).not.toContain('sourceUrl');
    expect(body).not.toContain('sourceName');
    expect(body).not.toContain('https://example.invalid');
    expect(body).not.toContain('BfArM public medical cannabis page');
    expect(() => assertPublicSafe(projected)).not.toThrow();
  });

  it('does not publish unqualified counterparties or private contact records', () => {
    const projected = projectPublicCollection(counterparties, toPublicCounterpartySummary);

    expect(projected).toEqual([]);
    expect(findForbiddenPublicFieldNames(counterparties)).toContain('contactEmail');
    expect(findForbiddenPublicFieldNames(networkContacts)).toContain('contactEmail');
  });

  it('keeps mandate reviews and IC memos private by contract', () => {
    expect(findForbiddenPublicFieldNames(mandateReviews)).toEqual(expect.arrayContaining(['internalNotes', 'nextAction', 'privateAssessment']));
    expect(findForbiddenPublicFieldNames(icMemos)).toEqual(expect.arrayContaining(['internalNotes', 'recommendedAction', 'supportingSignals']));
  });

  it('scores mission profiles deterministically without external calls', () => {
    expect(scoreMissionProfile(missionProfiles[0]!)).toEqual({
      profileId: 'mission-de-access-001',
      score: 74,
      decision: 'review',
      disqualified: false
    });
    expect(scoreMissionProfile(missionProfiles[1]!)).toEqual({
      profileId: 'mission-disqualified-001',
      score: 0,
      decision: 'hold',
      disqualified: true
    });
  });

  it('detects forbidden public field names and strings', () => {
    const unsafe = {
      country: 'Germany',
      contactEmail: 'private@example.invalid',
      sourceUrl: 'https://example.invalid/private/source',
      nested: { privateNotes: 'not public safe' }
    };

    expect(findForbiddenPublicFieldNames(unsafe)).toEqual(['contactEmail', 'privateNotes', 'sourceUrl']);
    expect(findForbiddenPublicStrings(unsafe).length).toBeGreaterThan(0);
    expect(() => assertPublicSafe(unsafe)).toThrow(/forbidden content/);
  });
});
