export type ReviewStatus = 'draft' | 'candidate' | 'under_review' | 'approved' | 'rejected' | 'published' | 'expired';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type IntelligenceCategory =
  | 'market_access'
  | 'regulatory_change'
  | 'commercial_signal'
  | 'counterparty'
  | 'supply'
  | 'demand'
  | 'distribution'
  | 'education'
  | 'policy'
  | 'standards';

export type SourceKind = 'regulator' | 'government' | 'industry' | 'operator' | 'academic' | 'media' | 'event' | 'private_network';

export type SignalSeverity = 'watch' | 'review' | 'priority' | 'critical';

export type EntityType = 'licensed_operator' | 'importer' | 'distributor' | 'clinic' | 'association' | 'regulator' | 'service_provider' | 'investor' | 'unknown';

export interface EvidenceRecord {
  id: string;
  sourceUrl: string;
  sourceName: string;
  capturedAt: string;
  evidenceHash: string;
  excerpt: string;
  privateNotes?: string;
}

export interface IntelligenceSource {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  country: string;
  region: string;
  crawlAllowed: boolean;
  validationStatus: 'not_checked' | 'allowed' | 'restricted' | 'blocked';
  privateNotes?: string;
}

export interface IntelligenceSignal {
  id: string;
  title: string;
  country: string;
  region: string;
  category: IntelligenceCategory;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  summary: string;
  analystAssessment: string;
  publicSummary?: string;
  sourceIds: string[];
  evidence: EvidenceRecord[];
  provenanceSummary: string;
  internalNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  publishedAt?: string;
  expiresAt?: string;
}

export interface MarketIntelligenceRecord {
  id: string;
  country: string;
  region: string;
  category: IntelligenceCategory;
  reviewStatus: ReviewStatus;
  confidence: ConfidenceLevel;
  headline: string;
  privateAssessment: string;
  publicSummary?: string;
  opportunityCategories: string[];
  marketAccessPathway: string;
  sourceIds: string[];
  internalNotes?: string;
  lastReviewedAt: string;
  nextReviewDueAt: string;
}

export interface CounterpartyRecord {
  id: string;
  name: string;
  entityType: EntityType;
  country: string;
  region: string;
  capabilities: string[];
  relationshipStatus: 'unknown' | 'watchlist' | 'screening' | 'qualified' | 'do_not_contact';
  diligenceStatus: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'needs_review';
  contactEmail?: string;
  linkedinUrl?: string;
  gatekeepers?: string[];
  redFlags?: string[];
  internalNotes?: string;
}

export interface NetworkContactRecord {
  id: string;
  counterpartyId: string;
  name: string;
  role: string;
  contactEmail: string;
  relationshipContext: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  privateNotes?: string;
}

export interface MandateReview {
  id: string;
  mandateName: string;
  country: string;
  category: IntelligenceCategory;
  qualificationStatus: 'unqualified' | 'needs_review' | 'qualified' | 'rejected';
  fitScore: number;
  riskScore: number;
  commercialPathway: string;
  privateAssessment: string;
  nextAction: string;
  internalNotes?: string;
}

export interface MissionQuestionAnswer {
  id: string;
  label: string;
  score: number;
  disqualifier?: boolean;
}

export interface MissionProfile {
  id: string;
  title: string;
  country: string;
  answers: MissionQuestionAnswer[];
  privateNotes?: string;
}

export interface MissionScore {
  profileId: string;
  score: number;
  decision: 'hold' | 'review' | 'advance';
  disqualified: boolean;
}

export interface ICMemo {
  id: string;
  title: string;
  country: string;
  thesis: string;
  supportingSignals: string[];
  risks: string[];
  recommendedAction: string;
  reviewStatus: ReviewStatus;
  internalNotes?: string;
}

export interface PublicMarketSummary {
  id: string;
  country: string;
  region: string;
  category: IntelligenceCategory;
  confidence: ConfidenceLevel;
  headline: string;
  summary: string;
  opportunityCategories: string[];
  marketAccessPathway: string;
  lastReviewedAt: string;
}

export interface PublicSignalSummary {
  id: string;
  title: string;
  country: string;
  region: string;
  category: IntelligenceCategory;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  summary: string;
  publishedAt: string;
}

export interface PublicSourceSummary {
  id: string;
  sourceKind: SourceKind;
  country: string;
  region: string;
  validationStatus: 'not_checked' | 'allowed' | 'restricted' | 'blocked';
}

export interface PublicCounterpartySummary {
  id: string;
  name: string;
  entityType: EntityType;
  country: string;
  region: string;
  capabilities: string[];
  relationshipStatus: CounterpartyRecord['relationshipStatus'];
}

export type DecisionRecommendationState = 'act_now' | 'investigate' | 'monitor' | 'no_action';
export type DecisionEvidenceRelationship = 'supports' | 'contradicts' | 'clarifies' | 'supersedes' | 'background';

export interface DecisionEvidenceSummary {
  sourceLabel: string | null;
  sourceUrl: string | null;
  status: 'needs_review' | 'partially_verified' | 'verified' | 'conflicting' | 'stale' | string;
  observedAt: string | null;
  relationship: DecisionEvidenceRelationship;
}

export interface DecisionIntelDossier {
  id: string;
  headline: string;
  summary: string | null;
  eventType: string;
  jurisdictionLabel: string | null;
  occurredAt: string | null;
  detectedAt: string | null;
  effectiveAt: string | null;
  lastVerifiedAt: string | null;
  materiality: 'low' | 'medium' | 'high' | 'critical';
  consolidationStatus: string;
  reviewStatus: string;
  sourceCount: number;
  whatHappened: string;
  whatChanged: string | null;
  whyItMatters: string | null;
  commercialImplications: string | null;
  regulatoryImplications: string | null;
  affectedEntities: string[];
  affectedMarkets: string[];
  affectedProducts: string[];
  whyNow: string | null;
  confidence: number | null;
  confidenceRationale: string | null;
  contradictions: string[];
  unknowns: string[];
  recommendationState: DecisionRecommendationState;
  recommendationReasoning: string;
  actionSummary: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  evidence: DecisionEvidenceSummary[];
}
