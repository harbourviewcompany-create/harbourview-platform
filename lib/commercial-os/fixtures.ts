import type {
  CommercialCounterparty,
  CommercialOpportunity,
  CommercialRoutingSuggestion,
  CommercialSignal,
  ConfidentialIntroduction,
  DealFlowItem,
  DocumentPacket,
  SourcingIntake,
} from './types'

export const commercialFixtureNotice =
  'Fixture-only operator workspace. These deterministic records are not live counterparties, live metrics, live AI output, live submissions, live documents, or live deal activity.'

export const commercialSignals = [
  {
    id: 'signal-fixture-eu-demand',
    type: 'buyer_demand',
    market: 'Germany',
    category: 'Reviewed demand fixture',
    confidence: 'medium',
    summary: 'Fixture signal for operator triage.',
    relatedPathway: 'Germany pathway fixture',
    relatedCounterparty: 'Route partner fixture',
    nextAction: 'Review documentation readiness.',
    reviewStatus: 'needs_review',
  },
  {
    id: 'signal-fixture-supplier-docs',
    type: 'supplier_pipeline',
    market: 'Portugal',
    category: 'Documentation readiness fixture',
    confidence: 'high',
    summary: 'Fixture signal for supplier packet review.',
    relatedPathway: 'EU readiness fixture',
    relatedCounterparty: 'Supplier fixture',
    nextAction: 'Request missing packet items.',
    reviewStatus: 'watching',
  },
] satisfies CommercialSignal[]

export const sourcingIntakes = [
  {
    id: 'intake-fixture-buyer-demand',
    source: 'Wanted-request fixture',
    category: 'buyer_demand',
    market: 'Germany',
    status: 'review',
    summary: 'Fixture buyer-demand intake awaiting qualification.',
    conversionActions: ['qualify intake', 'link to counterparty', 'convert to opportunity'],
  },
  {
    id: 'intake-fixture-market-access',
    source: 'Market-access discussion fixture',
    category: 'market_access',
    market: 'Germany',
    status: 'opportunity_candidate',
    summary: 'Fixture inquiry linked to route-to-market review.',
    conversionActions: ['link to pathway', 'link to counterparty', 'convert to opportunity'],
  },
] satisfies SourcingIntake[]

export const commercialOpportunities = [
  {
    id: 'opp-fixture-germany-demand',
    title: 'Germany demand fixture',
    stage: 'qualified',
    category: 'buyer_demand',
    market: 'Germany',
    summary: 'Fixture opportunity showing review-to-introduction readiness.',
    relatedCounterparties: ['Route partner fixture', 'Supplier fixture'],
    relatedDocuments: ['Packet fixture', 'Requirements fixture'],
    relatedPathway: 'Germany pathway fixture',
    suggestedNextAction: 'Confirm requirements before proposing introduction.',
    publicCardCandidate: true,
    updatedLabel: 'Fixture updated this cycle',
  },
  {
    id: 'opp-fixture-supplier',
    title: 'Supplier readiness fixture',
    stage: 'docs_requested',
    category: 'supplier_pipeline',
    market: 'Portugal',
    summary: 'Fixture opportunity for documentation-pending controls.',
    relatedCounterparties: ['Supplier fixture'],
    relatedDocuments: ['Readiness packet fixture'],
    relatedPathway: 'EU readiness fixture',
    suggestedNextAction: 'Request missing packet confirmation.',
    publicCardCandidate: false,
    updatedLabel: 'Fixture requires document follow-up',
  },
] satisfies CommercialOpportunity[]

export const commercialCounterparties = [
  {
    id: 'counterparty-fixture-route-partner',
    name: 'Route partner fixture',
    counterpartyType: 'importer',
    marketsCovered: ['Germany', 'EU'],
    acceptedFormats: ['Format fixture A', 'Format fixture B'],
    documentationRequirements: ['Packet fixture', 'Requirements fixture'],
    relationshipStage: 'Qualification fixture',
    lastContact: 'Fixture date not live',
    nextAction: 'Validate requirements before introduction approval.',
    links: [
      { label: 'Supplier fixture', relationship: 'matched to' },
      { label: 'Germany pathway fixture', relationship: 'relevant to pathway' },
    ],
  },
  {
    id: 'counterparty-fixture-supplier',
    name: 'Supplier fixture',
    counterpartyType: 'seller',
    marketsCovered: ['Portugal', 'Germany'],
    acceptedFormats: ['Format fixture A'],
    documentationRequirements: ['Packet fixture', 'Readiness fixture'],
    relationshipStage: 'Docs pending fixture',
    lastContact: 'Fixture date not live',
    nextAction: 'Complete packet readiness review.',
    links: [{ label: 'Route partner fixture', relationship: 'introduced to' }],
  },
] satisfies CommercialCounterparty[]

export const confidentialIntroductions = [
  {
    id: 'intro-fixture-germany',
    match: 'Route partner fixture to Supplier fixture',
    opportunity: 'Germany demand fixture',
    pathway: 'Germany pathway fixture',
    fitScore: 82,
    status: 'review_docs',
    nextAction: 'Confirm packet completeness before approval.',
    summary: 'Fixture introduction showing qualification, document review, approval, follow-up, and outcome stages.',
  },
] satisfies ConfidentialIntroduction[]

export const dealFlowItems = [
  {
    id: 'deal-fixture-qualified',
    title: 'Germany demand fixture',
    category: 'buyer_demand',
    market: 'Germany',
    stage: 'qualified',
    relatedCounterparties: ['Route partner fixture', 'Supplier fixture'],
    nextAction: 'Request document confirmation.',
    updatedLabel: 'Fixture grouped under Qualified',
  },
  {
    id: 'deal-fixture-docs',
    title: 'Supplier readiness fixture',
    category: 'supplier_pipeline',
    market: 'Portugal',
    stage: 'docs_requested',
    relatedCounterparties: ['Supplier fixture'],
    nextAction: 'Track missing packet items.',
    updatedLabel: 'Fixture grouped under Docs Requested',
  },
] satisfies DealFlowItem[]

export const documentPackets = [
  {
    id: 'docs-fixture-readiness',
    title: 'Readiness packet fixture',
    packetType: 'eu_gmp',
    requiredItems: ['Certificate fixture', 'Scope fixture', 'Expiry fixture'],
    receivedItems: ['Certificate fixture'],
    missingItems: ['Scope fixture', 'Expiry fixture'],
    readinessStatus: 'missing_documents',
    relatedOpportunity: 'Germany demand fixture',
    relatedCounterparty: 'Supplier fixture',
    nextAction: 'Request missing packet details.',
  },
  {
    id: 'docs-fixture-requirements',
    title: 'Requirements packet fixture',
    packetType: 'buyer_requirements',
    requiredItems: ['Requirement summary', 'Review note'],
    receivedItems: ['Requirement summary', 'Review note'],
    missingItems: [],
    readinessStatus: 'ready_for_review',
    relatedOpportunity: 'Germany demand fixture',
    relatedCounterparty: 'Route partner fixture',
    nextAction: 'Operator review before introduction approval.',
  },
] satisfies DocumentPacket[]

export const routingSuggestions = [
  {
    id: 'route-fixture-match',
    suggestionType: 'match',
    title: 'Fixture match suggestion',
    rationale: 'Deterministic fixture suggesting a controlled review path between demand, supplier readiness, and documentation completeness.',
    priority: 'high',
    destination: '/admin/commercial/introductions',
    internalNextAction: 'Review documents before approving introduction.',
  },
  {
    id: 'route-fixture-public-card',
    suggestionType: 'public_card_candidate',
    title: 'Fixture public-card candidate',
    rationale: 'Deterministic fixture indicating a possible public marketplace card only after redaction and operator approval.',
    priority: 'medium',
    destination: '/admin/commercial/opportunities',
    internalNextAction: 'Review public/private redaction boundary.',
  },
] satisfies CommercialRoutingSuggestion[]
