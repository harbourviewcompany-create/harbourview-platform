import type {
  CounterpartyRecord,
  IntelligenceSignal,
  IntelligenceSource,
  MarketIntelligenceRecord,
  MissionProfile,
  MissionScore,
  PublicCounterpartySummary,
  PublicMarketSummary,
  PublicSignalSummary,
  PublicSourceSummary
} from './types';
import { assertPublicSafe } from './publicSafety';

export function toPublicMarketSummary(record: MarketIntelligenceRecord): PublicMarketSummary | null {
  if (record.reviewStatus !== 'published' || !record.publicSummary) return null;

  const projected: PublicMarketSummary = {
    id: record.id,
    country: record.country,
    region: record.region,
    category: record.category,
    confidence: record.confidence,
    headline: record.headline,
    summary: record.publicSummary,
    opportunityCategories: record.opportunityCategories,
    marketAccessPathway: record.marketAccessPathway,
    lastReviewedAt: record.lastReviewedAt
  };

  assertPublicSafe(projected);
  return projected;
}

export function toPublicSignalSummary(signal: IntelligenceSignal): PublicSignalSummary | null {
  if (signal.reviewStatus !== 'published' || !signal.publicSummary || !signal.publishedAt) return null;

  const projected: PublicSignalSummary = {
    id: signal.id,
    title: signal.title,
    country: signal.country,
    region: signal.region,
    category: signal.category,
    severity: signal.severity,
    confidence: signal.confidence,
    summary: signal.publicSummary,
    publishedAt: signal.publishedAt
  };

  assertPublicSafe(projected);
  return projected;
}

export function toPublicSourceSummary(source: IntelligenceSource): PublicSourceSummary {
  const projected: PublicSourceSummary = {
    id: source.id,
    sourceKind: source.sourceKind,
    country: source.country,
    region: source.region,
    validationStatus: source.validationStatus
  };

  assertPublicSafe(projected);
  return projected;
}

export function toPublicCounterpartySummary(counterparty: CounterpartyRecord): PublicCounterpartySummary | null {
  if (counterparty.relationshipStatus !== 'qualified') return null;

  const projected: PublicCounterpartySummary = {
    id: counterparty.id,
    name: counterparty.name,
    entityType: counterparty.entityType,
    country: counterparty.country,
    region: counterparty.region,
    capabilities: counterparty.capabilities,
    relationshipStatus: counterparty.relationshipStatus
  };

  assertPublicSafe(projected);
  return projected;
}

export function scoreMissionProfile(profile: MissionProfile): MissionScore {
  const disqualified = profile.answers.some((answer) => answer.disqualifier === true);
  const score = profile.answers.reduce((total, answer) => total + answer.score, 0);

  return {
    profileId: profile.id,
    score,
    disqualified,
    decision: disqualified ? 'hold' : score >= 75 ? 'advance' : score >= 50 ? 'review' : 'hold'
  };
}

export function projectPublicCollection<T, R>(records: T[], projector: (record: T) => R | null): R[] {
  return records.map(projector).filter((record): record is R => record !== null);
}
