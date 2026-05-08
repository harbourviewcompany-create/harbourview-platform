import type {
  CounterpartyRecord,
  ICMemo,
  IntelligenceSignal,
  IntelligenceSource,
  MandateReview,
  MarketIntelligenceRecord,
  MissionProfile,
  NetworkContactRecord,
  ReviewStatus
} from './types';

function hasString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(hasString);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return ['draft', 'candidate', 'under_review', 'approved', 'rejected', 'published', 'expired'].includes(String(value));
}

function requireFields(value: Record<string, unknown>, fields: string[], label: string): void {
  const missing = fields.filter((field) => value[field] === undefined || value[field] === null || value[field] === '');
  if (missing.length) {
    throw new Error(`${label} missing required fields: ${missing.join(', ')}`);
  }
}

export function validateMarketIntelligenceRecord(value: unknown): MarketIntelligenceRecord {
  if (!value || typeof value !== 'object') throw new Error('market intelligence record must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'country', 'region', 'category', 'reviewStatus', 'confidence', 'headline', 'privateAssessment', 'opportunityCategories', 'marketAccessPathway', 'sourceIds', 'lastReviewedAt', 'nextReviewDueAt'], 'market intelligence record');
  if (!isReviewStatus(record.reviewStatus)) throw new Error('invalid market intelligence reviewStatus');
  if (!hasStringArray(record.opportunityCategories)) throw new Error('market intelligence opportunityCategories must be string[]');
  if (!hasStringArray(record.sourceIds)) throw new Error('market intelligence sourceIds must be string[]');
  return value as MarketIntelligenceRecord;
}

export function validateIntelligenceSignal(value: unknown): IntelligenceSignal {
  if (!value || typeof value !== 'object') throw new Error('intelligence signal must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'title', 'country', 'region', 'category', 'severity', 'confidence', 'reviewStatus', 'summary', 'analystAssessment', 'sourceIds', 'evidence', 'provenanceSummary', 'createdAt'], 'intelligence signal');
  if (!isReviewStatus(record.reviewStatus)) throw new Error('invalid signal reviewStatus');
  if (!hasStringArray(record.sourceIds)) throw new Error('signal sourceIds must be string[]');
  if (!Array.isArray(record.evidence)) throw new Error('signal evidence must be array');
  return value as IntelligenceSignal;
}

export function validateIntelligenceSource(value: unknown): IntelligenceSource {
  if (!value || typeof value !== 'object') throw new Error('intelligence source must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'sourceName', 'sourceUrl', 'sourceKind', 'country', 'region', 'crawlAllowed', 'validationStatus'], 'intelligence source');
  if (typeof record.crawlAllowed !== 'boolean') throw new Error('source crawlAllowed must be boolean');
  return value as IntelligenceSource;
}

export function validateCounterpartyRecord(value: unknown): CounterpartyRecord {
  if (!value || typeof value !== 'object') throw new Error('counterparty must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'name', 'entityType', 'country', 'region', 'capabilities', 'relationshipStatus', 'diligenceStatus'], 'counterparty');
  if (!hasStringArray(record.capabilities)) throw new Error('counterparty capabilities must be string[]');
  return value as CounterpartyRecord;
}

export function validateNetworkContactRecord(value: unknown): NetworkContactRecord {
  if (!value || typeof value !== 'object') throw new Error('network contact must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'counterpartyId', 'name', 'role', 'contactEmail', 'relationshipContext'], 'network contact');
  return value as NetworkContactRecord;
}

export function validateMandateReview(value: unknown): MandateReview {
  if (!value || typeof value !== 'object') throw new Error('mandate review must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'mandateName', 'country', 'category', 'qualificationStatus', 'fitScore', 'riskScore', 'commercialPathway', 'privateAssessment', 'nextAction'], 'mandate review');
  if (!isNumber(record.fitScore) || !isNumber(record.riskScore)) throw new Error('mandate review scores must be finite numbers');
  return value as MandateReview;
}

export function validateMissionProfile(value: unknown): MissionProfile {
  if (!value || typeof value !== 'object') throw new Error('mission profile must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'title', 'country', 'answers'], 'mission profile');
  if (!Array.isArray(record.answers)) throw new Error('mission profile answers must be array');
  return value as MissionProfile;
}

export function validateICMemo(value: unknown): ICMemo {
  if (!value || typeof value !== 'object') throw new Error('IC memo must be an object');
  const record = value as Record<string, unknown>;
  requireFields(record, ['id', 'title', 'country', 'thesis', 'supportingSignals', 'risks', 'recommendedAction', 'reviewStatus'], 'IC memo');
  if (!hasStringArray(record.supportingSignals)) throw new Error('IC memo supportingSignals must be string[]');
  if (!hasStringArray(record.risks)) throw new Error('IC memo risks must be string[]');
  if (!isReviewStatus(record.reviewStatus)) throw new Error('invalid IC memo reviewStatus');
  return value as ICMemo;
}
