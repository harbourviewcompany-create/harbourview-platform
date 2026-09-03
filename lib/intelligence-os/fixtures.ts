import type {
  CounterpartyRecord,
  ICMemo,
  IntelligenceSignal,
  IntelligenceSource,
  MandateReview,
  MarketIntelligenceRecord,
  MissionProfile,
  NetworkContactRecord
} from './types';

export const intelligenceSources: IntelligenceSource[] = [
  {
    id: 'source-de-bfarm-001',
    sourceName: 'BfArM public medical cannabis page',
    sourceUrl: 'https://example.invalid/private/source/de-bfarm-001',
    sourceKind: 'government',
    country: 'Germany',
    region: 'Europe',
    crawlAllowed: false,
    validationStatus: 'not_checked',
    privateNotes: 'Fixture only. Validate robots, terms and route before any future source watching.'
  },
  {
    id: 'source-uk-policy-001',
    sourceName: 'UK controlled medicines policy source',
    sourceUrl: 'https://example.invalid/private/source/uk-policy-001',
    sourceKind: 'government',
    country: 'United Kingdom',
    region: 'Europe',
    crawlAllowed: false,
    validationStatus: 'not_checked',
    privateNotes: 'Fixture only. No live fetch or scraping permitted in this extraction.'
  }
];

export const marketIntelligenceRecords: MarketIntelligenceRecord[] = [
  {
    id: 'market-de-access-001',
    country: 'Germany',
    region: 'Europe',
    category: 'market_access',
    reviewStatus: 'published',
    confidence: 'medium',
    headline: 'Germany remains a priority market requiring disciplined importer and product-fit review',
    privateAssessment: 'Private fixture assessment with counterparty fit, importer pathway and evidence review references. Not public-safe by default.',
    publicSummary: 'Germany remains a priority regulated medical cannabis market where access depends on importer fit, product readiness and disciplined compliance review.',
    opportunityCategories: ['import pathway review', 'qualified distributor screening', 'medical market education'],
    marketAccessPathway: 'Importer-led review with licensed counterparty screening and product documentation validation.',
    sourceIds: ['source-de-bfarm-001'],
    internalNotes: 'Private review notes intentionally excluded from public projection.',
    lastReviewedAt: '2026-05-08',
    nextReviewDueAt: '2026-06-07'
  },
  {
    id: 'market-uk-access-001',
    country: 'United Kingdom',
    region: 'Europe',
    category: 'policy',
    reviewStatus: 'under_review',
    confidence: 'low',
    headline: 'UK pathway remains review-gated pending stronger evidence',
    privateAssessment: 'Private under-review fixture. Should not appear in public projection until status changes.',
    publicSummary: 'United Kingdom pathway remains under review and is not treated as open access in this model.',
    opportunityCategories: ['policy monitoring'],
    marketAccessPathway: 'Review-gated. No active importer recommendation from this fixture.',
    sourceIds: ['source-uk-policy-001'],
    internalNotes: 'Private under-review notes.',
    lastReviewedAt: '2026-05-08',
    nextReviewDueAt: '2026-05-22'
  }
];

export const intelligenceSignals: IntelligenceSignal[] = [
  {
    id: 'signal-de-importer-demand-001',
    title: 'Importer demand signal fixture',
    country: 'Germany',
    category: 'demand',
    strength: 'medium',
    status: 'active',
    summary: 'Private demand signal fixture for importer pathway review.',
    sourceIds: ['source-de-bfarm-001'],
    internalNotes: 'Private signal notes.'
  }
];

export const counterparties: CounterpartyRecord[] = [
  {
    id: 'counterparty-de-importer-001',
    name: 'Private German importer fixture',
    country: 'Germany',
    role: 'importer',
    verificationStatus: 'unverified',
    website: 'https://example.invalid/private/importer',
    linkedinUrl: 'https://example.invalid/private/linkedin',
    gatekeepers: ['private gatekeeper fixture'],
    redFlags: ['unverified fixture only'],
    internalNotes: 'Private counterparty fixture.'
  }
];

export const networkContacts: NetworkContactRecord[] = [
  {
    id: 'contact-de-importer-001',
    counterpartyId: 'counterparty-de-importer-001',
    name: 'Private Contact Fixture',
    role: 'Commercial review lead',
    contactEmail: 'private.contact@example.invalid',
    relationshipContext: 'Private relationship context fixture.',
    lastContactedAt: '2026-05-01',
    nextFollowUpAt: '2026-05-15',
    privateNotes: 'Private contact note.'
  }
];

export const mandateReviews: MandateReview[] = [
  {
    id: 'mandate-review-de-001',
    mandateName: 'Germany importer access review fixture',
    country: 'Germany',
    category: 'market_access',
    qualificationStatus: 'needs_review',
    fitScore: 74,
    riskScore: 31,
    commercialPathway: 'Importer-led review with documentation gate.',
    privateAssessment: 'Private mandate fit and risk assessment.',
    nextAction: 'Analyst review before any outreach.',
    internalNotes: 'Private mandate notes.'
  }
];

export const missionProfiles: MissionProfile[] = [
  {
    id: 'mission-de-access-001',
    title: 'Germany market access mission fixture',
    country: 'Germany',
    answers: [
      { id: 'doc-readiness', label: 'Documentation readiness', score: 30 },
      { id: 'counterparty-fit', label: 'Counterparty fit', score: 24 },
      { id: 'regulatory-risk', label: 'Regulatory risk manageable', score: 20 }
    ],
    privateNotes: 'Private mission notes.'
  },
  {
    id: 'mission-disqualified-001',
    title: 'Disqualified mission fixture',
    country: 'Germany',
    answers: [{ id: 'license-gap', label: 'Required licence gap', score: 0, disqualifier: true }],
    privateNotes: 'Private disqualification rationale.'
  }
];

export const icMemos: ICMemo[] = [
  {
    id: 'ic-memo-de-001',
    title: 'Germany controlled access thesis fixture',
    country: 'Germany',
    thesis: 'Importer-led access remains plausible only where product documentation, counterparty fit and compliance review are strong.',
    supportingSignals: ['signal-de-importer-demand-001'],
    risks: ['counterparty quality', 'documentation mismatch', 'jurisdiction-specific requirements'],
    recommendedAction: 'Keep private pending analyst review and counterparty validation.',
    reviewStatus: 'under_review',
    internalNotes: 'Private IC memo notes.'
  }
];
