import type {
  CountryCoverageProfile,
  CountryDashboardRecord,
  CountryDashboardRole,
  CountryDashboardSummary,
  CountryEducationProfile,
  CountryHeatmapLayer,
  CountryHeatmapMetric,
  CountryListingSummary,
  CountryMarketplaceCategory,
  CountryMarketplaceProfile,
  CountryMovementProfile,
  CountryQuickFacts,
  CountryReadinessProfile,
  CountryReviewAction,
  CountryRoleView,
  CountryTradeAccessProfile,
} from './contracts'
import { publicMarketplaceListings, type PublicMarketplaceListing } from '@/lib/marketplace/publicListings'

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

export const countryDashboardRoleLabels: Record<CountryDashboardRole, string> = {
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

export const countryHeatmapLayerLabels: Record<CountryHeatmapLayer, string> = {
  marketplace_activity: 'Marketplace Activity',
  buyer_demand: 'Buyer Demand',
  seller_supply: 'Seller Supply',
  equipment_availability: 'Equipment Availability',
  distressed_asset_activity: 'Distressed Asset Activity',
  import_export_fit: 'Import/Export Fit',
  clinical_education_demand: 'Clinical Education Demand',
  pharmacy_readiness: 'Pharmacy Readiness',
  trade_access: 'Trade Access',
  regulatory_status: 'Regulatory Status',
  source_coverage: 'Source Coverage',
}

export const countryHeatmapLayers = Object.keys(countryHeatmapLayerLabels) as CountryHeatmapLayer[]

const marketplaceCategories: CountryMarketplaceCategory[] = [
  'Consumables',
  'Cannabis products / import-export opportunities',
  'Distressed equipment',
  'New equipment',
  'Used equipment',
  'Packaging',
  'Testing/lab services',
  'Cultivation inputs',
  'Processing equipment',
  'Pharmacy/clinic-related products',
  'Professional services',
]

const publicActions: CountryReviewAction[] = [
  { label: 'Request quote', href: '/marketplace/quote', intent: 'quote' },
  { label: 'Submit listing', href: '/marketplace/sell', intent: 'listing' },
  { label: 'Post wanted request', href: '/marketplace/wanted', intent: 'wanted' },
  { label: 'Request buyer/seller match', href: '/reviewed-connections', intent: 'match' },
  { label: 'Request import/export review', href: '/compliance/request-support', intent: 'trade-review' },
  { label: 'Request document review', href: '/education/export-import-readiness', intent: 'document-review' },
  { label: 'Request counterparty review', href: '/reviewed-connections', intent: 'counterparty-review' },
  { label: 'Request doctor/pharmacist education access', href: '/network/clinical-education/request', intent: 'education-access' },
  { label: 'Request country brief', href: '/contact?intent=country-brief', intent: 'country-brief' },
]

function metric(countrySlug: string, countryName: string, iso2: string, layer: CountryHeatmapLayer, score: number): CountryHeatmapMetric {
  return {
    countrySlug,
    countryName,
    iso2,
    layer,
    score,
    badge: score >= 80 ? 'High' : score >= 62 ? 'Active' : score >= 45 ? 'Emerging' : 'Review gated',
    tooltip: `${countryName}: ${countryHeatmapLayerLabels[layer]} ${score}/100`,
  }
}

const comparisonCountries = [
  ['germany', 'Germany', 'DE', 84],
  ['mexico', 'Mexico', 'MX', 68],
  ['colombia', 'Colombia', 'CO', 72],
  ['chile', 'Chile', 'CL', 61],
  ['argentina', 'Argentina', 'AR', 59],
  ['united-states', 'United States', 'US', 88],
  ['india', 'India', 'IN', 46],
  ['china', 'China', 'CN', 42],
  ['south-africa', 'South Africa', 'ZA', 57],
  ['australia', 'Australia', 'AU', 76],
] as const

function makeComparisonMetrics(selectedSlug: string, selectedName: string, selectedIso2: string, baseScore: number): CountryHeatmapMetric[] {
  return countryHeatmapLayers.flatMap((layer, layerIndex) => [
    metric(selectedSlug, selectedName, selectedIso2, layer, Math.max(28, Math.min(96, baseScore - (layerIndex % 4) * 3 + (layerIndex % 2) * 4))),
    ...comparisonCountries.map(([slug, name, iso2, score], index) => metric(slug, name, iso2, layer, Math.max(24, Math.min(94, score - (layerIndex % 5) * 4 + (index % 3) * 3)))),
  ])
}

function roleCard(title: string, body: string, ctaLabel: string, href: string, pillar: CountryRoleView['primaryCards'][number]['pillar']) {
  return { title, body, ctaLabel, href, pillar }
}

function buildRoleViews(countryName: string): Record<CountryDashboardRole, CountryRoleView> {
  return {
    buyer: {
      role: 'buyer', label: 'Buyer', emphasizedPillars: ['Marketplace', 'Readiness', 'Trade Access'],
      summary: `Find reviewed sellers, consumables, equipment, quote routes, and purchase-readiness gates for ${countryName}.`,
      primaryCards: [
        roleCard('Marketplace listings and wanted matches', 'Browse public-safe supply categories, post wanted requests, and start quote flow without exposing private contact details.', 'Request quote', '/marketplace/quote', 'Marketplace'),
        roleCard('Reviewed seller credibility', 'Counterparty review is positioned before introductions, pricing depth, or document exchange.', 'Request counterparty review', '/reviewed-connections', 'Readiness'),
        roleCard('Purchase-readiness gates', 'Check documents, category constraints, packaging, testing, and import prerequisites before action.', 'Request document review', '/education/export-import-readiness', 'Readiness'),
      ],
    },
    seller_supplier: {
      role: 'seller_supplier', label: 'Seller / Supplier', emphasizedPillars: ['Marketplace', 'Trade Access', 'Readiness'],
      summary: `Create listings, evaluate demand, and route buyer/distributor introductions into ${countryName}.`,
      primaryCards: [
        roleCard('Submit a commercial listing', 'Surface consumables, compliant product opportunities, services, and equipment to qualified demand.', 'Submit listing', '/marketplace/sell', 'Marketplace'),
        roleCard('Buyer demand and quote requests', 'Use demand signals as supporting context for quote workflows and marketplace visibility.', 'Post wanted response', '/marketplace/wanted', 'Marketplace'),
        roleCard('Exporter/importer route fit', 'Confirm category fit, documents, and distributor/importer matching before making commercial claims.', 'Request import/export review', '/compliance/request-support', 'Trade Access'),
      ],
    },
    importer: {
      role: 'importer', label: 'Importer', emphasizedPillars: ['Trade Access', 'Marketplace', 'Readiness'],
      summary: `Review lawful import pathways, supplier fit, document readiness, and corridor reliability for ${countryName}.`,
      primaryCards: [
        roleCard('Import pathway review', 'Map importer/distributor pathways, regulator touchpoints, landed-cost considerations, and compliance blockers.', 'Request import review', '/compliance/request-support', 'Trade Access'),
        roleCard('Reviewed exporters and suppliers', 'Screen suppliers and product categories before introductions or quote detail.', 'Request supplier match', '/reviewed-connections', 'Marketplace'),
        roleCard('Document readiness gates', 'Validate licences, certificates, testing, packaging/labelling, and controlled-product requirements.', 'Request document review', '/education/export-import-readiness', 'Readiness'),
      ],
    },
    exporter: {
      role: 'exporter', label: 'Exporter', emphasizedPillars: ['Marketplace', 'Trade Access', 'Readiness'],
      summary: `Understand demand, importer/distributor fit, export pathway readiness, and category demand into ${countryName}.`,
      primaryCards: [
        roleCard('Buyer and distributor demand', 'Prioritize marketplace demand, category fit, and reviewed introductions.', 'Request buyer match', '/reviewed-connections', 'Marketplace'),
        roleCard('Export pathway into country', 'Confirm lawful routes, local importer fit, documentation, and corridor review requirements.', 'Request export review', '/compliance/request-support', 'Trade Access'),
        roleCard('Category readiness', 'Prepare certificates, testing, packaging, and commercial documents before transaction support.', 'Request readiness review', '/education/export-import-readiness', 'Readiness'),
      ],
    },
    distributor: {
      role: 'distributor', label: 'Distributor', emphasizedPillars: ['Marketplace', 'Trade Access', 'Readiness'],
      summary: `Evaluate wholesale, retail, service-provider, supplier-matching, and channel opportunities in ${countryName}.`,
      primaryCards: [
        roleCard('Channel opportunities', 'Find wholesale, retail, service, and clinic/operator channel demand.', 'Request partner match', '/reviewed-connections', 'Marketplace'),
        roleCard('Supplier matching', 'Match reviewed suppliers and product categories to local operating readiness.', 'Request supplier match', '/reviewed-connections', 'Marketplace'),
        roleCard('Operating readiness', 'Check local logistics, licences, documentation, and onboarding gates.', 'Request readiness review', '/compliance/request-support', 'Readiness'),
      ],
    },
    doctor: {
      role: 'doctor', label: 'Doctor', emphasizedPillars: ['Education', 'Readiness', 'Trade Access'],
      summary: `Access professional education, prescribing context, patient-access rules, and jurisdiction-specific guidance for ${countryName}.`,
      primaryCards: [
        roleCard('Clinical education modules', 'Professional learning for medical cannabis basics, product categories, evidence summaries, and jurisdiction context.', 'Request education access', '/network/clinical-education/request', 'Education'),
        roleCard('Prescribing and patient-access context', 'Understand role boundaries, patient access, and professional guidance without direct clinical inducement.', 'Open clinical education', '/education/clinical', 'Education'),
        roleCard('Professional readiness', 'Review documentation, clinic workflow, and jurisdiction-specific requirements.', 'Request professional review', '/education/request', 'Readiness'),
      ],
    },
    pharmacist: {
      role: 'pharmacist', label: 'Pharmacist', emphasizedPillars: ['Education', 'Readiness', 'Trade Access'],
      summary: `Review dispensing workflow, pharmacy education, product handling, documentation, and jurisdiction rules for ${countryName}.`,
      primaryCards: [
        roleCard('Pharmacy education modules', 'Professional learning for dispensing workflow, product handling, documentation, and patient-access context.', 'Request education access', '/network/clinical-education/request', 'Education'),
        roleCard('Supplier and product readiness', 'Review product readiness and documentation without exposing private supplier details.', 'Request product review', '/marketplace/qualified-access', 'Readiness'),
        roleCard('Jurisdiction pharmacy rules', 'Understand pharmacy-specific access and handling considerations.', 'Open pharmacy education', '/education/pharmacy', 'Education'),
      ],
    },
    investor: {
      role: 'investor', label: 'Investor', emphasizedPillars: ['Marketplace', 'Movement', 'Trade Access'],
      summary: `Assess marketplace activity, transaction proxies, operator density, legal/commercial risk, and equipment distress in ${countryName}.`,
      primaryCards: [
        roleCard('Reviewed opportunities', 'Commercial opportunities remain review-gated before identities, transaction data, or diligence materials are shared.', 'Request country brief', '/contact?intent=country-brief', 'Marketplace'),
        roleCard('Distressed equipment and category growth', 'Use public-safe availability and distress indicators to prioritize diligence.', 'View used/surplus', '/marketplace/used-surplus', 'Marketplace'),
        roleCard('Commercial risk and access fit', 'Compare legal, commercial, and route-fit considerations.', 'Request review', '/compliance/request-support', 'Trade Access'),
      ],
    },
    equipment_vendor: {
      role: 'equipment_vendor', label: 'Equipment Vendor', emphasizedPillars: ['Marketplace', 'Readiness', 'Movement'],
      summary: `Surface new, used, and distressed equipment against buyer demand, logistics, and service partner needs in ${countryName}.`,
      primaryCards: [
        roleCard('Equipment listing routes', 'Promote new equipment, used equipment, and distressed assets through quote/request workflows.', 'Submit equipment listing', '/marketplace/sell', 'Marketplace'),
        roleCard('Country equipment needs', 'Match category fit, service/installation partners, and buyer demand.', 'Request buyer match', '/reviewed-connections', 'Marketplace'),
        roleCard('Logistics and service readiness', 'Review installation, service, and delivery partner needs before quoting.', 'Request readiness review', '/compliance/service-support', 'Readiness'),
      ],
    },
    service_provider: {
      role: 'service_provider', label: 'Service Provider', emphasizedPillars: ['Marketplace', 'Readiness', 'Trade Access'],
      summary: `Find service demand, local partner channels, onboarding requirements, and introduction actions in ${countryName}.`,
      primaryCards: [
        roleCard('Service demand channels', 'Clinics, operators, distributors, and suppliers can request public-safe service matching.', 'Submit service listing', '/marketplace/professional-services', 'Marketplace'),
        roleCard('Local partner introductions', 'Route introductions after counterparty and scope review.', 'Request introduction', '/reviewed-connections', 'Marketplace'),
        roleCard('Onboarding requirements', 'Review licences, documents, insurance, and jurisdiction onboarding needs.', 'Request document review', '/education/compliance-readiness', 'Readiness'),
      ],
    },
    general_research: {
      role: 'general_research', label: 'General Research', emphasizedPillars: ['Trade Access', 'Marketplace', 'Education', 'Readiness', 'Movement'],
      summary: `Public-safe country overview for legal status, marketplace activity, education availability, readiness, and movement in ${countryName}.`,
      primaryCards: [
        roleCard('Country overview', 'Review public-safe commercial posture and legal status without private evidence or internal notes.', 'Request country brief', '/contact?intent=country-brief', 'Trade Access'),
        roleCard('Marketplace and education availability', 'See where transaction workflows and professional education are available.', 'Open marketplace', '/marketplace', 'Marketplace'),
        roleCard('Public movement summary', 'Movement remains supporting context for commercial decisions.', 'View public signals', '/signals', 'Movement'),
      ],
    },
  }
}

function marketplaceCategoryFromPublicListing(listing: PublicMarketplaceListing): CountryMarketplaceCategory {
  const searchable = `${listing.section} ${listing.category} ${listing.listingType}`.toLowerCase()
  if (/packaging|consumable/.test(searchable)) return 'Packaging'
  if (/distress|surplus/.test(searchable)) return 'Distressed equipment'
  if (/used|extraction|equipment|lab/.test(searchable)) return 'Used equipment'
  if (/service/.test(searchable)) return 'Professional services'
  if (/testing|lab/.test(searchable)) return 'Testing/lab services'
  if (/cultivation/.test(searchable)) return 'Cultivation inputs'
  return 'New equipment'
}

function publicListingSummary(listing: PublicMarketplaceListing): CountryListingSummary {
  return {
    id: listing.slug,
    title: listing.title,
    category: marketplaceCategoryFromPublicListing(listing),
    listingTypeLabel: listing.listingType,
    locationLabel: listing.location ?? 'Available on request',
    availabilityLabel: listing.complianceNote,
    priceLabel: listing.price,
    publicSummary: listing.publicSummary,
    buyerFit: listing.buyerFit.slice(0, 3),
    ctaLabel: listing.ctaLabel,
    href: `/marketplace/listings/${listing.slug}`,
  }
}

function selectedMarketplaceListings() {
  const preferredSlugs = [
    'soft-launch-bulk-child-resistant-packaging-supply',
    'soft-launch-used-extraction-chiller-package',
    'soft-launch-cultivation-facility-equipment-package',
  ]
  return preferredSlugs
    .map((slug) => publicMarketplaceListings.find((listing) => listing.slug === slug))
    .filter((listing): listing is PublicMarketplaceListing => Boolean(listing))
    .map(publicListingSummary)
}

function fallbackMarketplace(countryName: string): CountryMarketplaceProfile {
  return {
    activityScore: countryName === 'Brazil' ? 78 : 46,
    summary: countryName === 'Brazil'
      ? 'Commercially framed marketplace view for consumables, equipment, wanted requests, review-gated lawful cannabis trade opportunities, and quote workflows.'
      : 'Public-safe marketplace orientation is available; listings, identities, and transaction detail remain review-gated until published.',
    categories: marketplaceCategories,
    reviewedCounterpartyLabel: 'Reviewed counterparties available by request',
    quoteFlowLabel: 'Quote, wanted, listing, and match workflows are first-class actions',
    listings: [
      ...selectedMarketplaceListings(),
      {
        id: 'lawful-trade-review',
        title: 'Lawful import/export opportunity review',
        category: 'Cannabis products / import-export opportunities',
        listingTypeLabel: 'Review-gated trade opportunity',
        locationLabel: countryName,
        availabilityLabel: 'Harbourview review required before product, counterparty, document, or route detail is shared.',
        priceLabel: 'Review required',
        publicSummary: 'Public-safe trade access card for lawful cannabis product opportunities where role, jurisdiction, category, licence, and documentation review are required before any commercial routing.',
        buyerFit: ['Importers', 'Exporters', 'Distributors'],
        ctaLabel: 'Request review',
        href: '/compliance/request-support',
      },
    ],
    wantedRequests: [
      { id: 'wanted-consumables', title: 'Buyer demand: compliant consumables and packaging', category: 'Packaging', demandLabel: 'Active wanted route', readinessLabel: 'Supplier documents required', href: '/marketplace/wanted' },
      { id: 'wanted-equipment', title: 'Buyer demand: extraction, processing, and lab equipment', category: 'Processing equipment', demandLabel: 'Equipment quote demand', readinessLabel: 'Condition and logistics review', href: '/marketplace/wanted' },
    ],
  }
}

function buildRecord(country: CountryDashboardSummary): CountryDashboardRecord {
  const isBrazil = country.slug === 'brazil'
  const marketplace = fallbackMarketplace(country.displayName)
  const tradeAccess: CountryTradeAccessProfile = {
    score: isBrazil ? 74 : 45,
    summary: isBrazil
      ? 'Role-specific access review covers buy, sell, import, export, distribute, prescribe, dispense, invest, and operate pathways with review gates.'
      : 'Trade access is public orientation only until Harbourview completes country-specific review.',
    allowedActions: ['Buy', 'Sell', 'Import review', 'Export review', 'Distribute', 'Supply', 'Prescribe/dispense context', 'Invest/operate review'],
    routeFit: ['Importer/distributor pathways', 'Buyer/seller corridors', 'Professional access routes'],
    barriers: ['Licence validation', 'Product-category constraints', 'Documentation and labelling review'],
    corridors: isBrazil ? ['Brazil ↔ Germany', 'Brazil ↔ Colombia', 'Brazil ↔ United States review route'] : ['Corridor review by request'],
  }
  const education: CountryEducationProfile = {
    demandScore: isBrazil ? 82 : 52,
    summary: isBrazil
      ? 'Doctor and pharmacist education is a first-class professional layer with clinical, pharmacy, workflow, and jurisdiction-specific modules.'
      : 'Professional education modules are available where public-safe country content has been prepared.',
    audiences: ['Doctors', 'Pharmacists', 'Clinics', 'Prescribers', 'Professional stakeholders'],
    modules: [
      { id: 'medical-basics', title: 'Medical cannabis basics for professionals', audience: 'Professional', summary: 'Foundational professional education with medical-advice boundaries.', href: '/education/pharmaceutical-medical-cannabis' },
      { id: 'doctor-context', title: `${country.displayName} prescribing context`, audience: 'Doctor', summary: 'Jurisdiction-specific patient-access and prescribing context.', href: '/education/clinical' },
      { id: 'pharmacy-workflow', title: `${country.displayName} pharmacy workflow`, audience: 'Pharmacist', summary: 'Dispensing, documentation, product handling, and patient-access context.', href: '/education/pharmacy' },
    ],
  }
  const readiness: CountryReadinessProfile = {
    score: isBrazil ? 70 : 44,
    summary: 'Readiness gates verify licences, documents, certificates, testing, packaging/labelling, counterparty diligence, and compliance blockers before action.',
    gates: ['Licence check', 'Document package', 'Testing/certificate review', 'Packaging/labelling review', 'Counterparty review'],
    blockers: ['Unverified counterparties', 'Missing licences', 'Sensitive documents not cleared for public sharing'],
    documentRequirements: ['Licences', 'Certificates of analysis', 'Import/export documents', 'Commercial invoice readiness', 'Product specifications'],
  }
  const movement: CountryMovementProfile = {
    score: isBrazil ? 63 : 39,
    summary: 'Movement is supporting context only: policy movement, procurement signals, distressed assets, regulatory updates, corridor activity, and confidence.',
    signals: ['Policy movement', 'Demand/supply movement', 'Procurement signals', 'Distressed-asset signals', 'Corridor activity'],
    sourceConfidenceLabel: isBrazil ? 'Public-safe coverage with review boundary' : 'Fallback public-safe coverage',
  }
  const coverage: CountryCoverageProfile = {
    score: isBrazil ? 76 : 40,
    label: isBrazil ? 'Commercial dashboard seeded' : 'Fallback country dashboard',
    publicSourcesLabel: 'Public-safe summaries only; raw URLs and private evidence withheld',
    reviewStatusLabel: 'Harbourview review required for identities, documents, and transaction support',
  }
  const quickFacts: CountryQuickFacts = {
    legalStatusLabel: isBrazil ? 'Medical and commercial pathways require role/category review' : 'Country-specific legal status requires review',
    commercialModelLabel: 'Marketplace, trade access, education, readiness, movement',
    roleFitLabel: 'Role-aware dashboard content changes by selected stakeholder',
    reviewBoundaryLabel: 'No private evidence, identities, documents, or internal provenance in public payloads',
  }
  return {
    countrySlug: country.slug,
    marketplace,
    tradeAccess,
    education,
    readiness,
    movement,
    coverage,
    quickFacts,
    heatmapMetrics: makeComparisonMetrics(country.slug, country.displayName, country.iso2, isBrazil ? 78 : 46),
    actions: publicActions.map((action) => ({ ...action, href: action.intent === 'country-brief' ? `/contact?intent=country-brief&country=${country.slug}` : action.href })),
    roleViews: buildRoleViews(country.displayName),
  }
}

export function normalizeCountryDashboardRole(value?: string | null): CountryDashboardRole {
  const normalized = value?.trim().toLowerCase().replace(/[\s/-]+/g, '_')
  if (normalized === 'seller' || normalized === 'supplier' || normalized === 'seller_supplier') return 'seller_supplier'
  if (normalized === 'equipment' || normalized === 'equipment_vendor') return 'equipment_vendor'
  if (normalized === 'service' || normalized === 'service_provider') return 'service_provider'
  if (normalized === 'general' || normalized === 'research' || normalized === 'general_research' || normalized === 'not_sure') return 'general_research'
  if (normalized === 'doctor_prescriber' || normalized === 'medical_professional') return 'doctor'
  if (normalized === 'distributor_wholesaler') return 'distributor'
  if (normalized === 'investor_operator') return 'investor'
  if (normalized === 'cultivator_producer' || normalized === 'processor_extractor' || normalized === 'geneticist_breeder' || normalized === 'retail_operator') return 'seller_supplier'
  if (normalized && countryDashboardRoles.includes(normalized as CountryDashboardRole)) return normalized as CountryDashboardRole
  return 'buyer'
}

export function normalizeCountryHeatmapLayer(value?: string | null): CountryHeatmapLayer {
  const normalized = value?.trim().toLowerCase().replace(/[\s/-]+/g, '_')
  if (normalized === 'market_openness' || normalized === 'opportunity_heat') return 'marketplace_activity'
  if (normalized === 'import_potential' || normalized === 'export_potential') return 'import_export_fit'
  if (normalized === 'regulatory_signals') return 'regulatory_status'
  if (normalized === 'documentation_burden') return 'pharmacy_readiness'
  if (normalized && countryHeatmapLayers.includes(normalized as CountryHeatmapLayer)) return normalized as CountryHeatmapLayer
  return 'marketplace_activity'
}

export function serializeCountryCommercialDashboardPublicDto(country: CountryDashboardSummary): CountryDashboardRecord {
  const record = buildRecord(country)
  return {
    countrySlug: record.countrySlug,
    marketplace: {
      activityScore: record.marketplace.activityScore,
      summary: record.marketplace.summary,
      categories: [...record.marketplace.categories],
      listings: record.marketplace.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        category: listing.category,
        listingTypeLabel: listing.listingTypeLabel,
        locationLabel: listing.locationLabel,
        availabilityLabel: listing.availabilityLabel,
        priceLabel: listing.priceLabel,
        publicSummary: listing.publicSummary,
        buyerFit: [...listing.buyerFit],
        ctaLabel: listing.ctaLabel,
        href: listing.href,
      })),
      wantedRequests: record.marketplace.wantedRequests.map((request) => ({
        id: request.id,
        title: request.title,
        category: request.category,
        demandLabel: request.demandLabel,
        readinessLabel: request.readinessLabel,
        href: request.href,
      })),
      reviewedCounterpartyLabel: record.marketplace.reviewedCounterpartyLabel,
      quoteFlowLabel: record.marketplace.quoteFlowLabel,
    },
    tradeAccess: {
      score: record.tradeAccess.score,
      summary: record.tradeAccess.summary,
      allowedActions: [...record.tradeAccess.allowedActions],
      routeFit: [...record.tradeAccess.routeFit],
      barriers: [...record.tradeAccess.barriers],
      corridors: [...record.tradeAccess.corridors],
    },
    education: {
      demandScore: record.education.demandScore,
      summary: record.education.summary,
      audiences: [...record.education.audiences],
      modules: record.education.modules.map((module) => ({
        id: module.id,
        title: module.title,
        audience: module.audience,
        summary: module.summary,
        href: module.href,
      })),
    },
    readiness: {
      score: record.readiness.score,
      summary: record.readiness.summary,
      gates: [...record.readiness.gates],
      blockers: [...record.readiness.blockers],
      documentRequirements: [...record.readiness.documentRequirements],
    },
    movement: {
      score: record.movement.score,
      summary: record.movement.summary,
      signals: [...record.movement.signals],
      sourceConfidenceLabel: record.movement.sourceConfidenceLabel,
    },
    coverage: { ...record.coverage },
    quickFacts: { ...record.quickFacts },
    heatmapMetrics: record.heatmapMetrics.map((metric) => ({ ...metric })),
    actions: record.actions.map((action) => ({ ...action })),
    roleViews: Object.fromEntries(Object.entries(record.roleViews).map(([role, view]) => [role, {
      role: view.role,
      label: view.label,
      summary: view.summary,
      emphasizedPillars: [...view.emphasizedPillars],
      primaryCards: view.primaryCards.map((card) => ({ ...card })),
    }])) as Record<CountryDashboardRole, CountryRoleView>,
  }
}

export function getCountryCommercialDashboard(country: CountryDashboardSummary) {
  return serializeCountryCommercialDashboardPublicDto(country)
}

export const FORBIDDEN_COUNTRY_DASHBOARD_PUBLIC_KEYS = [
  'privateSourceEvidence',
  'sourceUrl',
  'source_url',
  'rawSourceUrls',
  'internalProvenance',
  'analystNotes',
  'counterpartyIdentity',
  'buyerContact',
  'sellerContact',
  'privateReviewStatus',
  'reviewer',
  'serviceRoleData',
  'adminOnly',
  'transactionData',
  'sensitiveDocuments',
  'rawIntelligenceRecords',
] as const

function normalizePublicSafetyKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const normalizedForbiddenDashboardKeys = FORBIDDEN_COUNTRY_DASHBOARD_PUBLIC_KEYS.map(normalizePublicSafetyKey)

export function assertCountryDashboardPublicSafe(value: unknown) {
  const hits: string[] = []
  function visit(input: unknown) {
    if (!input || typeof input !== 'object') return
    for (const [key, child] of Object.entries(input as Record<string, unknown>)) {
      const normalizedKey = normalizePublicSafetyKey(key)
      if (normalizedForbiddenDashboardKeys.some((forbidden) => normalizedKey === forbidden || normalizedKey.includes(forbidden))) hits.push(key)
      visit(child)
    }
  }
  visit(value)
  return hits
}
