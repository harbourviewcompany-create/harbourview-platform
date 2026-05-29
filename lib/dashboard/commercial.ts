import type { CountryDashboardSummary } from './contracts'

export type CountryMarketplaceCategory =
  | 'Consumables'
  | 'Cannabis products / import-export opportunities'
  | 'Distressed equipment'
  | 'New equipment'
  | 'Used equipment'
  | 'Packaging'
  | 'Testing/lab services'
  | 'Cultivation inputs'
  | 'Processing equipment'
  | 'Pharmacy/clinic-related products'
  | 'Professional services'

export type CountryListingSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  countryFit: string
  availabilityLabel: string
  reviewGate: string
  ctaLabel: string
}

export type CountryWantedRequestSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  demandLabel: string
  readinessNeed: string
  ctaLabel: string
}

export type CountryMarketplaceProfile = {
  activityScore: number
  categories: CountryMarketplaceCategory[]
  listings: CountryListingSummary[]
  wantedRequests: CountryWantedRequestSummary[]
  reviewedCounterpartyLabel: string
  quoteFlowLabel: string
  commercialSummary: string
}

export type CountryTradeAccessProfile = {
  accessScore: number
  routeFit: string
  roleRelevance: string
  commercialBarriers: string[]
  pathways: string[]
  corridorSummary: string
}

export type CountryProfessionalEducationModule = {
  id: string
  title: string
  audience: Array<'Doctor' | 'Pharmacist' | 'Clinic' | 'Professional'>
  format: string
  jurisdictionContext: string
  ctaLabel: string
}

export type CountryEducationProfile = {
  demandScore: number
  professionalReadiness: string
  summary: string
  modules: CountryProfessionalEducationModule[]
}

export type CountryReadinessProfile = {
  readinessScore: number
  summary: string
  gates: string[]
  blockers: string[]
}

export type CountryMovementProfile = {
  movementScore: number
  summary: string
  updates: string[]
  confidenceLabel: string
}

export type CountryCoverageProfile = {
  coverageScore: number
  summary: string
  publicBoundary: string
}

export type CountryQuickFacts = {
  legalStatus: string
  commercialPosture: string
  educationPosture: string
  reviewBoundary: string
}

export type CountryHeatmapLayer =
  | 'Marketplace Activity'
  | 'Buyer Demand'
  | 'Seller Supply'
  | 'Equipment Availability'
  | 'Distressed Asset Activity'
  | 'Import/Export Fit'
  | 'Clinical Education Demand'
  | 'Pharmacy Readiness'
  | 'Trade Access'
  | 'Regulatory Status'
  | 'Source Coverage'

export type CountryHeatmapMetric = {
  countrySlug: string
  countryName: string
  iso2: string
  layer: CountryHeatmapLayer
  score: number
  badge: string
  tooltip: string
  summary: string
}

export type CountryReviewAction = {
  id: string
  label: string
  href: string
  commercialIntent: string
}

export type CountryRoleView = {
  role: CountryDashboardRole
  label: string
  headline: string
  summary: string
  primaryCards: Array<{
    title: string
    eyebrow: 'Marketplace' | 'Trade Access' | 'Education' | 'Readiness' | 'Movement'
    body: string
    ctaLabel: string
    href: string
  }>
  priorityPillars: Array<'Marketplace' | 'Trade Access' | 'Education' | 'Readiness' | 'Movement'>
}

export type CountryDashboardRecord = {
  slug: string
  displayName: string
  iso2: string
  iso3: string
  region: string
  subregion: string
  quickFacts: CountryQuickFacts
  marketplace: CountryMarketplaceProfile
  tradeAccess: CountryTradeAccessProfile
  education: CountryEducationProfile
  readiness: CountryReadinessProfile
  movement: CountryMovementProfile
  coverage: CountryCoverageProfile
  heatmapMetrics: CountryHeatmapMetric[]
  reviewActions: CountryReviewAction[]
  roleViews: Record<CountryDashboardRole, CountryRoleView>
}

export type CountryDashboardRole =
  | 'buyer'
  | 'seller_supplier'
  | 'importer'
  | 'exporter'
  | 'distributor'
  | 'doctor'
  | 'pharmacist'
  | 'investor'
  | 'equipment_vendor'
  | 'service_provider'
  | 'general_research'

export const countryDashboardRoles: CountryDashboardRole[] = [
  'buyer',
  'seller_supplier',
  'importer',
  'exporter',
  'distributor',
  'doctor',
  'pharmacist',
  'investor',
  'equipment_vendor',
  'service_provider',
  'general_research',
]

export const countryHeatmapLayers: CountryHeatmapLayer[] = [
  'Marketplace Activity',
  'Buyer Demand',
  'Seller Supply',
  'Equipment Availability',
  'Distressed Asset Activity',
  'Import/Export Fit',
  'Clinical Education Demand',
  'Pharmacy Readiness',
  'Trade Access',
  'Regulatory Status',
  'Source Coverage',
]

const roleLabels: Record<CountryDashboardRole, string> = {
  buyer: 'Buyer',
  seller_supplier: 'Seller / Supplier',
  importer: 'Importer',
  exporter: 'Exporter',
  distributor: 'Distributor',
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  investor: 'Investor',
  equipment_vendor: 'Equipment Vendor',
  service_provider: 'Service Provider',
  general_research: 'General Research',
}

const roleAliases: Record<string, CountryDashboardRole> = {
  buyer: 'buyer',
  purchaser: 'buyer',
  seller: 'seller_supplier',
  supplier: 'seller_supplier',
  seller_supplier: 'seller_supplier',
  'seller-supplier': 'seller_supplier',
  importer: 'importer',
  exporter: 'exporter',
  distributor: 'distributor',
  doctor: 'doctor',
  physician: 'doctor',
  prescriber: 'doctor',
  doctor_prescriber: 'doctor',
  pharmacist: 'pharmacist',
  pharmacy: 'pharmacist',
  investor: 'investor',
  equipment_vendor: 'equipment_vendor',
  'equipment-vendor': 'equipment_vendor',
  service_provider: 'service_provider',
  'service-provider': 'service_provider',
  research: 'general_research',
  general_research: 'general_research',
  'general-research': 'general_research',
  commercial_operator: 'buyer',
  medical_professional: 'doctor',
  regulatory_legal: 'importer',
}

export function getCountryDashboardRoleLabel(role: CountryDashboardRole) {
  return roleLabels[role]
}

export function resolveCountryDashboardRole(rawRole?: string | null): CountryDashboardRole {
  if (!rawRole) return 'buyer'
  return roleAliases[rawRole.trim().toLowerCase()] ?? 'buyer'
}

function action(id: string, label: string, intent: string, countrySlug: string): CountryReviewAction {
  return { id, label, commercialIntent: intent, href: `/contact?intent=${intent}&country=${countrySlug}` }
}

function metric(countrySlug: string, countryName: string, iso2: string, layer: CountryHeatmapLayer, score: number, summary: string): CountryHeatmapMetric {
  const badge = score >= 80 ? 'High' : score >= 65 ? 'Active' : score >= 50 ? 'Emerging' : score >= 35 ? 'Review' : 'Low'
  return {
    countrySlug,
    countryName,
    iso2,
    layer,
    score,
    badge,
    tooltip: `${countryName}: ${badge} ${layer.toLowerCase()} (${score})`,
    summary,
  }
}

const comparisonScores: Record<string, { name: string; iso2: string; scores: number[] }> = {
  germany: { name: 'Germany', iso2: 'DE', scores: [82, 78, 72, 70, 46, 84, 79, 81, 86, 83, 76] },
  mexico: { name: 'Mexico', iso2: 'MX', scores: [58, 64, 52, 50, 44, 57, 55, 49, 56, 50, 45] },
  colombia: { name: 'Colombia', iso2: 'CO', scores: [63, 70, 78, 48, 38, 74, 50, 45, 72, 62, 48] },
  chile: { name: 'Chile', iso2: 'CL', scores: [54, 58, 46, 44, 35, 52, 57, 55, 51, 59, 43] },
  argentina: { name: 'Argentina', iso2: 'AR', scores: [56, 62, 49, 47, 42, 55, 62, 58, 54, 57, 46] },
  'united-states': { name: 'United States', iso2: 'US', scores: [88, 86, 84, 87, 74, 66, 82, 76, 62, 65, 79] },
  india: { name: 'India', iso2: 'IN', scores: [49, 58, 54, 52, 37, 46, 44, 43, 45, 42, 41] },
  china: { name: 'China', iso2: 'CN', scores: [51, 48, 72, 75, 55, 40, 35, 34, 39, 38, 44] },
  'south-africa': { name: 'South Africa', iso2: 'ZA', scores: [57, 61, 53, 51, 45, 59, 54, 51, 58, 55, 46] },
  australia: { name: 'Australia', iso2: 'AU', scores: [74, 70, 62, 65, 43, 68, 76, 74, 69, 73, 68] },
}

function buildMetrics(countrySlug: string, countryName: string, iso2: string, scores: number[]) {
  return countryHeatmapLayers.map((layer, index) => metric(countrySlug, countryName, iso2, layer, scores[index] ?? 45, publicLayerSummary(layer)))
}

function publicLayerSummary(layer: CountryHeatmapLayer) {
  const summaries: Record<CountryHeatmapLayer, string> = {
    'Marketplace Activity': 'Public-safe listing, wanted request, quote, and reviewed-introduction activity.',
    'Buyer Demand': 'Visible demand patterns from wanted requests, quote interest, and category pull.',
    'Seller Supply': 'Visible supply posture across reviewed marketplace categories and listing readiness.',
    'Equipment Availability': 'New, used, serviceable, and install-supported equipment availability.',
    'Distressed Asset Activity': 'Distressed asset and surplus opportunity activity requiring review before disclosure.',
    'Import/Export Fit': 'Commercial route fit for lawful import/export pathways and corridor review.',
    'Clinical Education Demand': 'Professional education demand across prescriber and clinic stakeholders.',
    'Pharmacy Readiness': 'Dispensing, handling, documentation, and pharmacy workflow readiness.',
    'Trade Access': 'Role-aware ability to buy, sell, distribute, prescribe, dispense, invest, or operate.',
    'Regulatory Status': 'Public regulatory posture and review-safe legal orientation.',
    'Source Coverage': 'Public-safe coverage breadth; detailed source evidence remains private.',
  }
  return summaries[layer]
}

const brazilMetrics = buildMetrics('brazil', 'Brazil', 'BR', [76, 81, 62, 66, 52, 71, 84, 80, 74, 70, 64])
const comparisonMetrics = Object.entries(comparisonScores).flatMap(([slug, value]) => buildMetrics(slug, value.name, value.iso2, value.scores))

const marketplaceCardsByRole: Record<CountryDashboardRole, CountryRoleView['primaryCards']> = {
  buyer: [
    { eyebrow: 'Marketplace', title: 'Source reviewed offers and wanted matches', body: 'Compare consumables, equipment, packaging, testing support, and lawful category opportunities with quote and match requests in the first workflow.', ctaLabel: 'Request quote', href: '/marketplace/quote' },
    { eyebrow: 'Readiness', title: 'Purchase-readiness gates', body: 'Check licenses, documents, certificates, counterparty review, and country-specific import or local purchase requirements before action.', ctaLabel: 'Request document review', href: '/contact?intent=document-review' },
  ],
  seller_supplier: [
    { eyebrow: 'Marketplace', title: 'Create supply visibility', body: 'Submit consumables, equipment, packaging, testing, professional service, or lawful cannabis trade opportunities for review-gated marketplace visibility.', ctaLabel: 'Submit listing', href: '/marketplace/sell' },
    { eyebrow: 'Trade Access', title: 'Match buyer demand to routes', body: 'Use demand, importer/distributor fit, required documents, and corridor review to choose where supply can be commercialized.', ctaLabel: 'Request buyer match', href: '/contact?intent=buyer-seller-match' },
  ],
  importer: [
    { eyebrow: 'Trade Access', title: 'Import pathway fit', body: 'Review lawful product category fit, importer requirements, documentation gates, corridor reliability, and landed-cost/compliance considerations.', ctaLabel: 'Request import review', href: '/contact?intent=import-export-review' },
    { eyebrow: 'Marketplace', title: 'Reviewed exporter and supplier routes', body: 'Find reviewed supply routes and quote-ready categories without exposing private contact or transaction data publicly.', ctaLabel: 'Request match', href: '/contact?intent=buyer-seller-match' },
  ],
  exporter: [
    { eyebrow: 'Marketplace', title: 'Demand into selected country', body: 'Prioritize wanted requests, importer fit, distributor introductions, and category demand before making export commitments.', ctaLabel: 'Request buyer match', href: '/contact?intent=buyer-seller-match' },
    { eyebrow: 'Trade Access', title: 'Export route readiness', body: 'Map certificates, testing, packaging/labelling, and local partner requirements into the selected country.', ctaLabel: 'Request export review', href: '/contact?intent=import-export-review' },
  ],
  distributor: [
    { eyebrow: 'Marketplace', title: 'Channel opportunities', body: 'See wholesale, retail, clinic, pharmacy, service-provider, and logistics channel openings for reviewed matching.', ctaLabel: 'Request distributor intro', href: '/contact?intent=buyer-seller-match' },
    { eyebrow: 'Readiness', title: 'Operating-readiness checklist', body: 'Confirm local licensing, partner availability, storage, handling, documentation, and onboarding requirements.', ctaLabel: 'Request readiness review', href: '/contact?intent=document-review' },
  ],
  doctor: [
    { eyebrow: 'Education', title: 'Clinical education modules', body: 'Access professional education on medical cannabis basics, prescribing context, patient-access rules, product categories, and jurisdiction-specific guidance.', ctaLabel: 'Request education access', href: '/network/clinical-education/request' },
    { eyebrow: 'Readiness', title: 'Professional practice context', body: 'Understand clinical documentation, patient-access boundaries, and review-safe professional onboarding without direct commercial inducement.', ctaLabel: 'Request country brief', href: '/contact?intent=country-brief' },
  ],
  pharmacist: [
    { eyebrow: 'Education', title: 'Pharmacy workflow education', body: 'Training on dispensing workflow, product handling, documentation, patient-access context, and jurisdiction rules.', ctaLabel: 'Request education access', href: '/network/clinical-education/request' },
    { eyebrow: 'Readiness', title: 'Dispensing readiness gates', body: 'Review pharmacy documentation, supplier/product readiness, labelling, and handling requirements before operational action.', ctaLabel: 'Request document review', href: '/contact?intent=document-review' },
  ],
  investor: [
    { eyebrow: 'Marketplace', title: 'Commercial activity proxies', body: 'Use marketplace activity, operator density, equipment distress signals, category growth, and reviewed opportunities to scope investable themes.', ctaLabel: 'Request country brief', href: '/contact?intent=country-brief' },
    { eyebrow: 'Movement', title: 'Risk and growth movement', body: 'Movement summarizes public-safe policy, demand, supply, and corridor activity as supporting context only.', ctaLabel: 'Request opportunity review', href: '/contact?intent=counterparty-review' },
  ],
  equipment_vendor: [
    { eyebrow: 'Marketplace', title: 'Equipment demand and listings', body: 'Promote new, used, distressed, processing, cultivation, service, installation, and spare-part opportunities with quote requests.', ctaLabel: 'Submit equipment listing', href: '/marketplace/sell' },
    { eyebrow: 'Trade Access', title: 'Logistics and service fit', body: 'Map country equipment needs, installation partners, logistics constraints, and buyer readiness.', ctaLabel: 'Request match', href: '/contact?intent=buyer-seller-match' },
  ],
  service_provider: [
    { eyebrow: 'Marketplace', title: 'Service demand', body: 'Show support demand from clinics, operators, distributors, importers, exporters, and marketplace participants.', ctaLabel: 'Submit service listing', href: '/marketplace/sell' },
    { eyebrow: 'Readiness', title: 'Onboarding and partner channels', body: 'Clarify onboarding requirements, local partner channels, and introduction steps before engagement.', ctaLabel: 'Request introduction', href: '/contact?intent=buyer-seller-match' },
  ],
  general_research: [
    { eyebrow: 'Trade Access', title: 'Country commercial overview', body: 'Review legal status, marketplace activity, education availability, readiness gates, and public-safe movement without private evidence.', ctaLabel: 'Request country brief', href: '/contact?intent=country-brief' },
    { eyebrow: 'Marketplace', title: 'Marketplace orientation', body: 'Understand visible categories, quote workflows, wanted requests, and reviewed transaction-support paths.', ctaLabel: 'Explore marketplace', href: '/marketplace' },
  ],
}

function makeRoleViews(countryName: string): Record<CountryDashboardRole, CountryRoleView> {
  return Object.fromEntries(countryDashboardRoles.map((role) => {
    const cards = marketplaceCardsByRole[role]
    const educationFirst = role === 'doctor' || role === 'pharmacist'
    const priorityPillars: CountryRoleView['priorityPillars'] = educationFirst
      ? ['Education', 'Readiness', 'Trade Access', 'Marketplace', 'Movement']
      : role === 'general_research'
        ? ['Trade Access', 'Marketplace', 'Education', 'Readiness', 'Movement']
        : ['Marketplace', 'Trade Access', 'Readiness', 'Education', 'Movement']
    return [role, {
      role,
      label: roleLabels[role],
      headline: `${roleLabels[role]} commercial operating view for ${countryName}`,
      summary: educationFirst
        ? 'Professional education and readiness are first-class; marketplace content stays contextual and review-gated where clinically appropriate.'
        : 'Marketplace and transaction workflows lead the view, with trade access, readiness, education, and movement supporting commercial decisions.',
      primaryCards: cards,
      priorityPillars,
    }]
  })) as Record<CountryDashboardRole, CountryRoleView>
}

function makeFallbackRecord(country: CountryDashboardSummary): CountryDashboardRecord {
  const scores = [48, 45, 44, 42, 32, 43, 41, 40, 44, 46, 38]
  return makeCommercialRecord(country, scores, {
    legalStatus: 'Public orientation only; country-specific commercial actions require review.',
    commercialPosture: 'Marketplace request, listing intake, and country brief workflows are available.',
    educationPosture: 'Professional education can be requested where jurisdiction context is needed.',
    reviewBoundary: 'No private sources, documents, counterparties, or transaction data are exposed publicly.',
  })
}

function makeCommercialRecord(country: CountryDashboardSummary, scores: number[], quickFacts: CountryQuickFacts): CountryDashboardRecord {
  const metrics = buildMetrics(country.slug, country.displayName, country.iso2, scores)
  return {
    slug: country.slug,
    displayName: country.displayName,
    iso2: country.iso2,
    iso3: country.iso3,
    region: country.region,
    subregion: country.subregion,
    quickFacts,
    marketplace: {
      activityScore: scores[0] ?? 48,
      categories: ['Consumables', 'Cannabis products / import-export opportunities', 'Distressed equipment', 'New equipment', 'Used equipment', 'Packaging', 'Testing/lab services', 'Cultivation inputs', 'Processing equipment', 'Pharmacy/clinic-related products', 'Professional services'],
      listings: [
        { id: `${country.slug}-consumables`, title: 'Consumables and packaging quote lane', category: 'Consumables', countryFit: 'Buyer-ready categories routed through quote review.', availabilityLabel: 'Quote-ready', reviewGate: 'Document and counterparty review before transaction support.', ctaLabel: 'Request quote' },
        { id: `${country.slug}-equipment`, title: 'New, used, and distressed equipment lane', category: 'Used equipment', countryFit: 'Equipment, installation, service, and logistics fit can be reviewed.', availabilityLabel: 'Listings visible', reviewGate: 'Asset condition and ownership review before introductions.', ctaLabel: 'Request equipment match' },
        { id: `${country.slug}-lawful-trade`, title: 'Lawful cannabis trade pathway review', category: 'Cannabis products / import-export opportunities', countryFit: 'Only lawful, review-gated category opportunities are surfaced.', availabilityLabel: 'Review-gated', reviewGate: 'Import/export, licenses, testing, and route fit must be reviewed.', ctaLabel: 'Request trade review' },
      ],
      wantedRequests: [
        { id: `${country.slug}-wanted-consumables`, title: 'Wanted: recurring consumables supply', category: 'Consumables', demandLabel: 'Active buyer pull', readinessNeed: 'Purchasing authority and document set required.', ctaLabel: 'Post wanted request' },
        { id: `${country.slug}-wanted-equipment`, title: 'Wanted: equipment and service partners', category: 'Processing equipment', demandLabel: 'Equipment demand', readinessNeed: 'Technical fit, service coverage, and logistics review required.', ctaLabel: 'Request equipment quote' },
      ],
      reviewedCounterpartyLabel: 'Reviewed counterparties available through request workflow; identities are not public.',
      quoteFlowLabel: 'Quote, wanted request, buyer/seller match, and review support are primary transaction workflows.',
      commercialSummary: 'Marketplace activity is the primary commercial layer for listings, wanted requests, quote requests, reviewed matching, and transaction support.',
    },
    tradeAccess: {
      accessScore: scores[8] ?? 44,
      routeFit: 'Role-specific buy, sell, import, export, distribute, supply, prescribe, dispense, invest, or operate fit requires review before execution.',
      roleRelevance: 'Role selection changes the commercial cards, readiness gates, education modules, and CTAs shown first.',
      commercialBarriers: ['Licensing and authorization checks', 'Import/export document set', 'Testing and packaging/labelling requirements', 'Counterparty and corridor review'],
      pathways: ['Importer/distributor review', 'Buyer/seller matching', 'Quote and wanted request intake', 'Professional education onboarding'],
      corridorSummary: 'Corridor fit is summarized publicly; detailed route evidence and counterparties remain private.',
    },
    education: {
      demandScore: scores[6] ?? 41,
      professionalReadiness: 'Doctor, pharmacist, clinic, and professional education workflows are first-class country dashboard layers.',
      summary: 'Education includes medical cannabis basics, prescribing/dispensing context, product-category education, and jurisdiction-specific professional onboarding.',
      modules: [
        { id: `${country.slug}-clinical-basics`, title: 'Medical cannabis basics and patient-access context', audience: ['Doctor', 'Clinic', 'Professional'], format: 'Guided module', jurisdictionContext: 'Adapted to the selected country after review.', ctaLabel: 'Request doctor education access' },
        { id: `${country.slug}-pharmacy-workflow`, title: 'Pharmacy dispensing workflow and documentation', audience: ['Pharmacist', 'Professional'], format: 'Workflow briefing', jurisdictionContext: 'Covers handling, dispensing, documentation, and patient-access rules.', ctaLabel: 'Request pharmacist education access' },
      ],
    },
    readiness: {
      readinessScore: scores[7] ?? 40,
      summary: 'Readiness shows what must be verified before action across licenses, documents, testing, packaging, counterparty review, and transaction gates.',
      gates: ['License/authorization fit', 'Document and certificate set', 'Testing and packaging/labelling', 'Counterparty diligence', 'Purchase and corridor readiness'],
      blockers: ['Review not completed', 'Missing documents', 'Unconfirmed lawful category fit'],
    },
    movement: {
      movementScore: scores[4] ?? 32,
      summary: 'Movement is supporting context for policy, demand/supply, procurement, distressed assets, corridor activity, and source coverage; it does not dominate the dashboard.',
      updates: ['Policy movement', 'Demand and supply movement', 'Procurement and distressed-asset signals', 'Corridor activity'],
      confidenceLabel: 'Public-safe summary only; underlying evidence is not exposed.',
    },
    coverage: {
      coverageScore: scores[10] ?? 38,
      summary: 'Coverage indicates breadth of public-safe orientation and review availability.',
      publicBoundary: 'DTO allowlists exclude private evidence, raw URLs, provenance, notes, private counterparties, service roles, documents, and non-public transaction data.',
    },
    heatmapMetrics: metrics,
    reviewActions: [
      action('quote', 'Request quote', 'quote-request', country.slug),
      action('listing', 'Submit listing', 'submit-listing', country.slug),
      action('wanted', 'Post wanted request', 'wanted-request', country.slug),
      action('match', 'Request buyer/seller match', 'buyer-seller-match', country.slug),
      action('trade-review', 'Request import/export review', 'import-export-review', country.slug),
      action('document-review', 'Request document review', 'document-review', country.slug),
      action('counterparty-review', 'Request counterparty review', 'counterparty-review', country.slug),
      action('education-access', 'Request doctor/pharmacist education access', 'education-access', country.slug),
      action('country-brief', 'Request country brief', 'country-brief', country.slug),
    ],
    roleViews: makeRoleViews(country.displayName),
  }
}

export function getComparisonHeatmapMetrics() {
  return comparisonMetrics
}

export function getCountryDashboardRecord(country: CountryDashboardSummary): CountryDashboardRecord {
  if (country.slug === 'brazil') {
    return makeCommercialRecord(country, [76, 81, 62, 66, 52, 71, 84, 80, 74, 70, 64], {
      legalStatus: 'Brazil has a review-gated medical and commercial orientation; transaction execution requires role, license, product, and route review.',
      commercialPosture: 'Marketplace demand, quote requests, consumables, equipment, and lawful trade pathway review are commercially relevant.',
      educationPosture: 'Doctor and pharmacist education demand is prominent for professional onboarding and jurisdiction-specific workflow context.',
      reviewBoundary: 'Public view shows only allowlisted summaries; private evidence, counterparties, documents, and transaction data remain excluded.',
    })
  }

  const comparison = comparisonScores[country.slug]
  if (comparison) {
    return makeCommercialRecord(country, comparison.scores, {
      legalStatus: 'Public-safe commercial orientation; role-specific action requires review.',
      commercialPosture: 'Marketplace, trade access, education, readiness, and movement are available as dashboard layers.',
      educationPosture: 'Professional education can be requested for jurisdiction-specific context.',
      reviewBoundary: 'Public payloads use DTO allowlists and exclude private operating data.',
    })
  }

  return makeFallbackRecord(country)
}

export function getMetricForLayer(record: CountryDashboardRecord, layer: CountryHeatmapLayer) {
  return record.heatmapMetrics.find((item) => item.layer === layer) ?? record.heatmapMetrics[0]
}

export function serializeCountryCommercialDashboardPublicDto(record: CountryDashboardRecord) {
  return {
    slug: record.slug,
    displayName: record.displayName,
    iso2: record.iso2,
    iso3: record.iso3,
    region: record.region,
    subregion: record.subregion,
    quickFacts: record.quickFacts,
    marketplace: record.marketplace,
    tradeAccess: record.tradeAccess,
    education: record.education,
    readiness: record.readiness,
    movement: record.movement,
    coverage: record.coverage,
    heatmapMetrics: record.heatmapMetrics,
    reviewActions: record.reviewActions,
    roleViews: record.roleViews,
  }
}
