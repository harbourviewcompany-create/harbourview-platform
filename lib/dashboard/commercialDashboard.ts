import type { CountryDashboardSummary } from './contracts'
import type { RoleId } from '@/types/globe-router'

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

export type CountryHeatmapLayer =
  | 'marketplace_activity'
  | 'buyer_demand'
  | 'seller_supply'
  | 'equipment_availability'
  | 'distressed_asset_activity'
  | 'import_export_fit'
  | 'clinical_education_demand'
  | 'pharmacy_readiness'
  | 'trade_access'
  | 'regulatory_status'
  | 'source_coverage'

export type CountryReviewAction = {
  id: string
  label: string
  href: string
  description: string
}

export type CountryListingSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  geography: string
  commercialStatus: 'public preview' | 'review gated' | 'quote request' | 'education appropriate'
  ctaLabel: string
  href: string
}

export type CountryWantedRequestSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  geography: string
  ctaLabel: string
  href: string
}

export type CountryMarketplaceProfile = {
  activityScore: number
  summary: string
  categories: CountryMarketplaceCategory[]
  listingSummaries: CountryListingSummary[]
  wantedRequests: CountryWantedRequestSummary[]
  reviewedCounterpartySummary: string
  quoteFlowSummary: string
}

export type CountryTradeAccessProfile = {
  accessScore: number
  summary: string
  rolePermissions: string[]
  corridors: string[]
  barriers: string[]
  routeFit: string
}

export type CountryProfessionalEducationModule = {
  id: string
  title: string
  audience: 'Doctor' | 'Pharmacist' | 'Professional'
  summary: string
  status: 'available' | 'request access' | 'jurisdiction review'
  ctaLabel: string
}

export type CountryEducationProfile = {
  demandScore: number
  summary: string
  professionalReadiness: string
  modules: CountryProfessionalEducationModule[]
}

export type CountryReadinessProfile = {
  readinessScore: number
  summary: string
  gates: string[]
  blockers: string[]
  documentChecklist: string[]
}

export type CountryMovementProfile = {
  movementScore: number
  summary: string
  signals: string[]
  sourceConfidence: 'Low' | 'Medium' | 'High'
}

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

export type CountryQuickFacts = {
  legalStatus: string
  primaryCommercialUse: string
  educationFit: string
  readinessNote: string
}

export type CountryCoverageProfile = {
  coverageScore: number
  publicCoverage: string
  reviewedCoverage: string
  lastReviewedLabel: string
}

export type CountryRoleView = {
  role: CountryDashboardRole
  label: string
  headline: string
  emphasis: string[]
  primaryCards: Array<{ title: string; body: string; ctaLabel: string; href: string; pillar: 'Marketplace' | 'Trade Access' | 'Education' | 'Readiness' | 'Movement' }>
  firstScreenPillar: 'Marketplace' | 'Education' | 'Trade Access'
}

export type CountryDashboardRecord = {
  slug: string
  iso2: string
  iso3: string
  displayName: string
  publicSummary: string
  selectedLayer: CountryHeatmapLayer
  selectedLayerMetric: CountryHeatmapMetric
  quickFacts: CountryQuickFacts
  marketplace: CountryMarketplaceProfile
  tradeAccess: CountryTradeAccessProfile
  education: CountryEducationProfile
  readiness: CountryReadinessProfile
  movement: CountryMovementProfile
  coverage: CountryCoverageProfile
  heatmapMetrics: CountryHeatmapMetric[]
  comparisonMetrics: CountryHeatmapMetric[]
  reviewActions: CountryReviewAction[]
  roleViews: Record<CountryDashboardRole, CountryRoleView>
}


export type CountryDashboardPublicRecordDto = Pick<
  CountryDashboardRecord,
  | 'slug'
  | 'iso2'
  | 'iso3'
  | 'displayName'
  | 'publicSummary'
  | 'selectedLayer'
  | 'selectedLayerMetric'
  | 'quickFacts'
  | 'marketplace'
  | 'tradeAccess'
  | 'education'
  | 'readiness'
  | 'movement'
  | 'coverage'
  | 'heatmapMetrics'
  | 'comparisonMetrics'
  | 'reviewActions'
  | 'roleViews'
>

export type CommercialDashboardSelection = {
  selectedRole: CountryDashboardRole
  selectedLayer: CountryHeatmapLayer
}

export const countryDashboardRoles: Array<{ id: CountryDashboardRole; label: string }> = [
  { id: 'buyer', label: 'Buyer' },
  { id: 'seller_supplier', label: 'Seller / Supplier' },
  { id: 'importer', label: 'Importer' },
  { id: 'exporter', label: 'Exporter' },
  { id: 'distributor', label: 'Distributor' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'pharmacist', label: 'Pharmacist' },
  { id: 'investor', label: 'Investor' },
  { id: 'equipment_vendor', label: 'Equipment Vendor' },
  { id: 'service_provider', label: 'Service Provider' },
  { id: 'general_research', label: 'General Research' },
]

export const countryHeatmapLayers: Array<{ id: CountryHeatmapLayer; label: string }> = [
  { id: 'marketplace_activity', label: 'Marketplace Activity' },
  { id: 'buyer_demand', label: 'Buyer Demand' },
  { id: 'seller_supply', label: 'Seller Supply' },
  { id: 'equipment_availability', label: 'Equipment Availability' },
  { id: 'distressed_asset_activity', label: 'Distressed Asset Activity' },
  { id: 'import_export_fit', label: 'Import/Export Fit' },
  { id: 'clinical_education_demand', label: 'Clinical Education Demand' },
  { id: 'pharmacy_readiness', label: 'Pharmacy Readiness' },
  { id: 'trade_access', label: 'Trade Access' },
  { id: 'regulatory_status', label: 'Regulatory Status' },
  { id: 'source_coverage', label: 'Source Coverage' },
]

const defaultScores: Record<CountryHeatmapLayer, number> = {
  marketplace_activity: 52,
  buyer_demand: 49,
  seller_supply: 44,
  equipment_availability: 46,
  distressed_asset_activity: 35,
  import_export_fit: 42,
  clinical_education_demand: 48,
  pharmacy_readiness: 43,
  trade_access: 41,
  regulatory_status: 45,
  source_coverage: 38,
}

// Populated at runtime via getCommercialCountryDashboardRecord — overridden by live data when passed
let _liveComparisonScores: Array<{ slug: string; name: string; iso2: string; base: number }> = [
  { slug: 'germany',       name: 'Germany',       iso2: 'DE', base: 76 },
  { slug: 'mexico',        name: 'Mexico',         iso2: 'MX', base: 58 },
  { slug: 'colombia',      name: 'Colombia',       iso2: 'CO', base: 64 },
  { slug: 'chile',         name: 'Chile',          iso2: 'CL', base: 54 },
  { slug: 'argentina',     name: 'Argentina',      iso2: 'AR', base: 57 },
  { slug: 'united-states', name: 'United States',  iso2: 'US', base: 72 },
  { slug: 'india',         name: 'India',          iso2: 'IN', base: 47 },
  { slug: 'china',         name: 'China',          iso2: 'CN', base: 45 },
  { slug: 'south-africa',  name: 'South Africa',   iso2: 'ZA', base: 55 },
  { slug: 'australia',     name: 'Australia',      iso2: 'AU', base: 69 },
]
const comparisonCountryScores = _liveComparisonScores

/** Call once from the server component to inject live opportunity scores */
export function seedComparisonCountryScores(
  live: Array<{ iso2: string; name: string; slug: string; opportunity_score: number }>,
) {
  if (!live.length) return
  _liveComparisonScores = live.map(r => ({
    slug: r.slug,
    name: r.name,
    iso2: r.iso2,
    base: r.opportunity_score,
  }))
}

function layerLabel(layer: CountryHeatmapLayer) {
  return countryHeatmapLayers.find((item) => item.id === layer)?.label ?? 'Marketplace Activity'
}

function metric(countrySlug: string, countryName: string, iso2: string, layer: CountryHeatmapLayer, score: number): CountryHeatmapMetric {
  const label = layerLabel(layer)
  const normalized = Math.max(0, Math.min(100, Math.round(score)))
  return {
    countrySlug,
    countryName,
    iso2,
    layer,
    score: normalized,
    badge: normalized >= 75 ? 'High' : normalized >= 55 ? 'Developing' : normalized >= 40 ? 'Review' : 'Thin coverage',
    tooltip: `${countryName}: ${label} ${normalized}/100`,
    summary: `${label} is ${normalized >= 75 ? 'strong' : normalized >= 55 ? 'developing' : 'review-gated'} for public dashboard comparison.`,
  }
}

const brazilScoreOverrides: Partial<Record<CountryHeatmapLayer, number>> = {
  marketplace_activity: 70,
  buyer_demand: 74,
  seller_supply: 59,
  equipment_availability: 66,
  distressed_asset_activity: 61,
  import_export_fit: 68,
  clinical_education_demand: 82,
  pharmacy_readiness: 72,
  trade_access: 64,
  regulatory_status: 63,
  source_coverage: 71,
}

function buildMetrics(country: CountryDashboardSummary, overrides: Partial<Record<CountryHeatmapLayer, number>> = {}) {
  return countryHeatmapLayers.map((layer, index) => {
    const score = overrides[layer.id] ?? defaultScores[layer.id] + (country.displayName.charCodeAt(0) % 7) - index % 4
    return metric(country.slug, country.displayName, country.iso2, layer.id, score)
  })
}

function comparisonMetrics(selectedLayer: CountryHeatmapLayer) {
  return comparisonCountryScores.map((country, index) => metric(country.slug, country.name, country.iso2, selectedLayer, country.base + (index % 3) * 4 - (selectedLayer.length % 5)))
}

function action(id: string, label: string, intent: string, description: string, countrySlug: string): CountryReviewAction {
  return { id, label, href: `/contact?intent=${intent}&country=${countrySlug}`, description }
}

function cardsFor(role: CountryDashboardRole, slug: string): CountryRoleView['primaryCards'] {
  const commercial = [
    { title: 'Marketplace listings', body: 'Public-safe listing previews, consumables, equipment and review-gated lawful trade opportunities.', ctaLabel: 'Request quote', href: `/contact?intent=request-quote&country=${slug}`, pillar: 'Marketplace' as const },
    { title: 'Wanted requests', body: 'Post demand for products, equipment, services, distributor channels or reviewed counterparties.', ctaLabel: 'Post wanted request', href: `/contact?intent=post-wanted-request&country=${slug}`, pillar: 'Marketplace' as const },
    { title: 'Transaction readiness', body: 'Documents, licenses, certificates, testing and counterparty gates to review before commercial action.', ctaLabel: 'Request document review', href: `/contact?intent=document-review&country=${slug}`, pillar: 'Readiness' as const },
  ]
  const education = [
    { title: 'Professional education modules', body: 'Medical cannabis basics, jurisdiction context, prescribing or dispensing workflow and product-category education.', ctaLabel: 'Request education access', href: `/contact?intent=professional-education&country=${slug}`, pillar: 'Education' as const },
    { title: 'Patient-access and workflow context', body: 'Country-specific professional guidance for clinical, pharmacy and documentation workflows.', ctaLabel: 'Request country brief', href: `/contact?intent=country-brief&country=${slug}`, pillar: 'Education' as const },
    { title: 'Professional readiness gates', body: 'Licensing, documentation, pharmacy handling and professional onboarding checks before action.', ctaLabel: 'Request readiness review', href: `/contact?intent=readiness-review&country=${slug}`, pillar: 'Readiness' as const },
  ]

  const byRole: Record<CountryDashboardRole, CountryRoleView['primaryCards']> = {
    buyer: commercial,
    seller_supplier: [
      { title: 'Create a seller listing', body: 'Surface lawful product, consumables, services or equipment availability to reviewed buyer routes.', ctaLabel: 'Submit listing', href: `/contact?intent=submit-listing&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Buyer demand map', body: 'Review public-safe demand categories, quote requests and distributor/importer matching paths.', ctaLabel: 'Request buyer match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Export/import fit', body: 'Check category fit, documents and corridor readiness before outreach.', ctaLabel: 'Request import/export review', href: `/contact?intent=import-export-review&country=${slug}`, pillar: 'Trade Access' },
    ],
    importer: [
      { title: 'Import pathway review', body: 'Importer, distributor and category-pathway fit with document readiness and regulator touchpoints.', ctaLabel: 'Request import/export review', href: `/contact?intent=import-export-review&country=${slug}`, pillar: 'Trade Access' },
      { title: 'Reviewed exporters and suppliers', body: 'Request public-safe supplier matching without exposing private counterparty identities.', ctaLabel: 'Request match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Landed readiness gates', body: 'Testing, certificates, labelling, packaging and compliance barriers to clear before transaction support.', ctaLabel: 'Request document review', href: `/contact?intent=document-review&country=${slug}`, pillar: 'Readiness' },
    ],
    exporter: [
      { title: 'Buyer and importer demand', body: 'Demand categories, distributor fit, quote requests and marketplace demand into the selected country.', ctaLabel: 'Request buyer match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Export corridor fit', body: 'Export pathways, documents and importer/distributor introductions for lawful categories.', ctaLabel: 'Request export review', href: `/contact?intent=import-export-review&country=${slug}`, pillar: 'Trade Access' },
      { title: 'Product-category readiness', body: 'Review testing, packaging, certificates and category restrictions before listing or shipment.', ctaLabel: 'Request document review', href: `/contact?intent=document-review&country=${slug}`, pillar: 'Readiness' },
    ],
    distributor: [
      { title: 'Channel opportunities', body: 'Wholesale, retail, clinic, pharmacy and service-provider routes with partner availability.', ctaLabel: 'Request partner match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Supplier matching', body: 'Reviewed supplier routes, local logistics context and marketplace category demand.', ctaLabel: 'Request match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Operating readiness', body: 'Licenses, documents and local channel gates required before commercial execution.', ctaLabel: 'Request readiness review', href: `/contact?intent=readiness-review&country=${slug}`, pillar: 'Readiness' },
    ],
    doctor: education,
    pharmacist: education,
    investor: [
      { title: 'Marketplace activity proxies', body: 'Listings, quote requests, wanted demand and operator-density signals summarized for opportunity review.', ctaLabel: 'Request country brief', href: `/contact?intent=country-brief&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Distressed asset signals', body: 'Equipment distress, category growth and reviewed opportunity paths without private transaction disclosure.', ctaLabel: 'Request reviewed opportunities', href: `/contact?intent=counterparty-review&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Commercial risk', body: 'Legal, trade-access and readiness barriers that may affect investment diligence.', ctaLabel: 'Request review', href: `/contact?intent=dashboard-review&country=${slug}`, pillar: 'Trade Access' },
    ],
    equipment_vendor: [
      { title: 'Equipment marketplace', body: 'New, used and distressed equipment listings with country equipment needs and quote requests.', ctaLabel: 'Submit equipment listing', href: `/contact?intent=submit-listing&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Buyer demand for equipment', body: 'Country category fit, wanted requests and installation/service partner routes.', ctaLabel: 'Request buyer match', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Logistics and service partners', body: 'Review routing, installation and local partner readiness before committing delivery.', ctaLabel: 'Request review', href: `/contact?intent=readiness-review&country=${slug}`, pillar: 'Readiness' },
    ],
    service_provider: [
      { title: 'Service demand', body: 'Operators, clinics, distributors and marketplace participants that may need support.', ctaLabel: 'Submit service listing', href: `/contact?intent=submit-listing&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Local partner channels', body: 'Reviewed introductions and onboarding requirements for professional service routes.', ctaLabel: 'Request introduction', href: `/contact?intent=buyer-seller-match&country=${slug}`, pillar: 'Marketplace' },
      { title: 'Onboarding readiness', body: 'Documentation, compliance posture and counterparty review needed before engagement.', ctaLabel: 'Request counterparty review', href: `/contact?intent=counterparty-review&country=${slug}`, pillar: 'Readiness' },
    ],
    general_research: [
      { title: 'Country overview', body: 'Legal status, marketplace activity, education availability and readiness summary.', ctaLabel: 'Request country brief', href: `/contact?intent=country-brief&country=${slug}`, pillar: 'Trade Access' },
      { title: 'Marketplace orientation', body: 'Public-safe categories and commercial calls to action without private identities.', ctaLabel: 'View marketplace routes', href: `/marketplace?country=${slug}`, pillar: 'Marketplace' },
      { title: 'Movement snapshot', body: 'Policy, procurement, corridor and source-confidence movement as a supporting layer.', ctaLabel: 'Request brief', href: `/contact?intent=country-brief&country=${slug}`, pillar: 'Movement' },
    ],
  }
  return byRole[role]
}

function roleView(role: CountryDashboardRole, slug: string): CountryRoleView {
  const labels = Object.fromEntries(countryDashboardRoles.map((item) => [item.id, item.label])) as Record<CountryDashboardRole, string>
  const educationRole = role === 'doctor' || role === 'pharmacist'
  const emphasis: Record<CountryDashboardRole, string[]> = {
    buyer: ['listings', 'wanted requests', 'reviewed sellers', 'quote requests', 'purchase readiness'],
    seller_supplier: ['listing creation', 'buyer demand', 'category demand', 'importer/distributor matching', 'documents'],
    importer: ['import pathways', 'reviewed exporters', 'document readiness', 'corridor reliability', 'landed compliance'],
    exporter: ['buyer demand', 'importer fit', 'export pathways', 'category demand', 'distributor introductions'],
    distributor: ['channel opportunities', 'local logistics', 'supplier matching', 'partner availability', 'operating readiness'],
    doctor: ['clinical education', 'prescribing context', 'patient access', 'evidence summaries', 'education modules'],
    pharmacist: ['pharmacy education', 'dispensing workflow', 'product handling', 'documentation', 'jurisdiction rules'],
    investor: ['marketplace activity', 'transaction proxies', 'commercial risk', 'equipment distress', 'growth categories'],
    equipment_vendor: ['new equipment', 'used equipment', 'distressed equipment', 'buyer demand', 'service partners'],
    service_provider: ['service demand', 'local partner channels', 'operator support', 'onboarding requirements', 'introductions'],
    general_research: ['country overview', 'legal status', 'marketplace activity', 'education availability', 'public-safe movement'],
  }
  return {
    role,
    label: labels[role],
    headline: educationRole ? `${labels[role]} professional education and readiness view` : `${labels[role]} commercial operating view`,
    emphasis: emphasis[role],
    primaryCards: cardsFor(role, slug),
    firstScreenPillar: educationRole ? 'Education' : role === 'general_research' ? 'Trade Access' : 'Marketplace',
  }
}

function buildRoleViews(slug: string) {
  return Object.fromEntries(countryDashboardRoles.map((role) => [role.id, roleView(role.id, slug)])) as Record<CountryDashboardRole, CountryRoleView>
}

function fallbackRecord(country: CountryDashboardSummary, selectedLayer: CountryHeatmapLayer): CountryDashboardRecord {
  const metrics = buildMetrics(country)
  return {
    slug: country.slug,
    iso2: country.iso2,
    iso3: country.iso3,
    displayName: country.displayName,
    publicSummary: `${country.displayName} is shown as a public-safe commercial operating dashboard. Marketplace, trade access, education, readiness and movement details are review-gated where country-specific records are thin.`,
    selectedLayer,
    selectedLayerMetric: metrics.find((item) => item.layer === selectedLayer) ?? metrics[0],
    quickFacts: {
      legalStatus: 'Public orientation only; confirm lawful activity before transaction support.',
      primaryCommercialUse: 'Country comparison, quote routing, listing intake and review requests.',
      educationFit: 'Professional education access is available by request where appropriate.',
      readinessNote: 'Documents, licenses, counterparties and product claims require review before action.',
    },
    marketplace: {
      activityScore: 52,
      summary: 'Marketplace routes are available for listings, wanted requests, quote intake and reviewed matching; country-specific public records are limited.',
      categories: ['Consumables', 'New equipment', 'Used equipment', 'Professional services'],
      listingSummaries: [
        { id: 'fallback-equipment', title: 'Equipment and service listing intake', category: 'New equipment', geography: country.displayName, commercialStatus: 'quote request', ctaLabel: 'Submit listing', href: `/contact?intent=submit-listing&country=${country.slug}` },
      ],
      wantedRequests: [
        { id: 'fallback-wanted', title: 'Post a wanted request for reviewed matching', category: 'Professional services', geography: country.displayName, ctaLabel: 'Post wanted request', href: `/contact?intent=post-wanted-request&country=${country.slug}` },
      ],
      reviewedCounterpartySummary: 'Counterparty identities are not displayed publicly; request reviewed introductions.',
      quoteFlowSummary: 'Quote requests route through Harbourview review before private commercial details are exchanged.',
    },
    tradeAccess: { accessScore: 41, summary: 'Role-specific buy, sell, import, export, distribute, operate or invest pathways require review.', rolePermissions: ['Request role fit review', 'Confirm category legality', 'Map importer/distributor route'], corridors: ['Review required'], barriers: ['Country-specific documentation not yet published'], routeFit: 'Review-gated' },
    education: { demandScore: 48, summary: 'Professional education modules are available by request and jurisdiction review.', professionalReadiness: 'Professional onboarding required before clinical or pharmacy workflow use.', modules: [
      { id: 'professional-basics', title: 'Medical cannabis and product-category basics', audience: 'Professional', summary: 'Introductory professional module with jurisdiction-specific addendum by request.', status: 'request access', ctaLabel: 'Request education access' },
    ] },
    readiness: { readinessScore: 43, summary: 'Readiness gates must be cleared before action.', gates: ['License check', 'Document review', 'Counterparty diligence'], blockers: ['Unverified product claims', 'Missing import/export documents'], documentChecklist: ['Licenses', 'Certificates', 'Testing records', 'Packaging/labelling review'] },
    movement: { movementScore: 38, summary: 'Movement is a supporting layer for policy, demand/supply and corridor updates.', signals: ['Policy movement review', 'Procurement signal review', 'Source coverage check'], sourceConfidence: 'Medium' },
    coverage: { coverageScore: 38, publicCoverage: 'Fallback public-safe coverage', reviewedCoverage: 'Reviewed records available by request', lastReviewedLabel: country.lastUpdated },
    heatmapMetrics: metrics,
    comparisonMetrics: comparisonMetrics(selectedLayer),
    reviewActions: buildReviewActions(country.slug),
    roleViews: buildRoleViews(country.slug),
  }
}

function buildReviewActions(slug: string): CountryReviewAction[] {
  return [
    action('request-quote', 'Request quote', 'request-quote', 'Start a reviewed quote workflow.', slug),
    action('submit-listing', 'Submit listing', 'submit-listing', 'Add public-safe listing intake for review.', slug),
    action('post-wanted', 'Post wanted request', 'post-wanted-request', 'Publish demand through reviewed intake.', slug),
    action('match', 'Request buyer/seller match', 'buyer-seller-match', 'Ask Harbourview to match reviewed counterparties.', slug),
    action('import-export', 'Request import/export review', 'import-export-review', 'Review route fit, documents and barriers.', slug),
    action('documents', 'Request document review', 'document-review', 'Check licenses, certificates, testing and labels.', slug),
    action('counterparty', 'Request counterparty review', 'counterparty-review', 'Review counterparties before introductions.', slug),
    action('education', 'Request doctor/pharmacist education access', 'professional-education', 'Request professional learning modules.', slug),
    action('brief', 'Request country brief', 'country-brief', 'Request a public-safe country brief.', slug),
  ]
}

function brazilRecord(country: CountryDashboardSummary, selectedLayer: CountryHeatmapLayer): CountryDashboardRecord {
  const metrics = buildMetrics(country, brazilScoreOverrides)
  return {
    ...fallbackRecord(country, selectedLayer),
    publicSummary: 'Brazil is framed as a commercial operating dashboard: marketplace demand, lawful trade-access review, professional education, readiness gates and supporting movement in one role-aware workspace.',
    selectedLayerMetric: metrics.find((item) => item.layer === selectedLayer) ?? metrics[0],
    quickFacts: {
      legalStatus: 'Medical and controlled-category activity must be reviewed against current Brazilian rules before action.',
      primaryCommercialUse: 'Buyer demand, supplier matching, equipment workflows, import/export route review and professional onboarding.',
      educationFit: 'High professional education demand for doctors, pharmacists, clinics and regulated stakeholders.',
      readinessNote: 'Licenses, prescriptions/dispensing context, testing, packaging/labelling, import documents and counterparty review are gating items.',
    },
    marketplace: {
      activityScore: 70,
      summary: 'Brazil marketplace view prioritizes quote requests, wanted demand, consumables, lawful cannabis trade review, equipment and reviewed commercial introductions.',
      categories: ['Consumables', 'Cannabis products / import-export opportunities', 'Distressed equipment', 'New equipment', 'Used equipment', 'Packaging', 'Testing/lab services', 'Cultivation inputs', 'Processing equipment', 'Pharmacy/clinic-related products', 'Professional services'],
      listingSummaries: [
        { id: 'br-consumables', title: 'Consumables and packaging quote lane', category: 'Consumables', geography: 'Brazil', commercialStatus: 'quote request', ctaLabel: 'Request quote', href: '/contact?intent=request-quote&country=brazil' },
        { id: 'br-equipment', title: 'New, used and distressed equipment intake', category: 'Distressed equipment', geography: 'Brazil', commercialStatus: 'public preview', ctaLabel: 'View equipment route', href: '/marketplace?country=brazil&category=equipment' },
        { id: 'br-lawful-trade', title: 'Lawful cannabis import/export opportunity review', category: 'Cannabis products / import-export opportunities', geography: 'Brazil corridors', commercialStatus: 'review gated', ctaLabel: 'Request trade review', href: '/contact?intent=import-export-review&country=brazil' },
      ],
      wantedRequests: [
        { id: 'br-pharmacy-ready', title: 'Pharmacy-ready product and documentation demand', category: 'Pharmacy/clinic-related products', geography: 'Brazil', ctaLabel: 'Post matching offer', href: '/contact?intent=buyer-seller-match&country=brazil' },
        { id: 'br-services', title: 'Testing, quality and regulatory service needs', category: 'Testing/lab services', geography: 'Brazil', ctaLabel: 'Submit service listing', href: '/contact?intent=submit-listing&country=brazil' },
      ],
      reviewedCounterpartySummary: 'Reviewed counterparties are routed through Harbourview review; private identities and contacts stay off the public dashboard.',
      quoteFlowSummary: 'Quote, listing, wanted and match requests are monetizable workflows that move from public-safe intake to reviewed transaction support.',
    },
    tradeAccess: { accessScore: 64, summary: 'Role access depends on whether the user is buying, selling, importing, exporting, distributing, prescribing, dispensing, investing or operating.', rolePermissions: ['Buy/sell route fit review', 'Importer/distributor pathway mapping', 'Doctor/pharmacist professional education access', 'Investment/commercial risk review'], corridors: ['Brazil ↔ Germany', 'Brazil ↔ Colombia', 'Brazil ↔ United States', 'Brazil ↔ Portugal'], barriers: ['Regulated product category review', 'Importer/distributor qualification', 'Documentation, testing and labelling requirements'], routeFit: 'Developing, review-gated trade access' },
    education: { demandScore: 82, summary: 'Doctor and pharmacist education is a first-class Brazil dashboard layer, with jurisdiction-specific clinical and dispensing context.', professionalReadiness: 'Professional access requires role-appropriate onboarding and country-specific regulatory context.', modules: [
      { id: 'br-doctor-basics', title: 'Brazil medical cannabis prescribing context', audience: 'Doctor', summary: 'Professional education on patient-access context, prescribing workflow, product categories and evidence summaries.', status: 'request access', ctaLabel: 'Request doctor access' },
      { id: 'br-pharmacy-workflow', title: 'Brazil pharmacy dispensing and documentation workflow', audience: 'Pharmacist', summary: 'Dispensing, handling, documentation and patient-access workflow education for pharmacy stakeholders.', status: 'request access', ctaLabel: 'Request pharmacist access' },
      { id: 'br-category-education', title: 'Product category education and compliance context', audience: 'Professional', summary: 'Jurisdiction-specific product-category learning before commercial or professional action.', status: 'jurisdiction review', ctaLabel: 'Request module review' },
    ] },
    readiness: { readinessScore: 72, summary: 'Brazil transaction readiness focuses on licenses, documents, certificates, testing, packaging/labelling and counterparty diligence before action.', gates: ['License and role verification', 'Importer/distributor pathway review', 'Testing and certificate checks', 'Packaging/labelling review', 'Counterparty diligence'], blockers: ['Unverified counterparty claims', 'Missing product documentation', 'Unsupported clinical inducement risk', 'Unreviewed import/export corridor'], documentChecklist: ['Licenses/authorizations', 'Certificates and testing records', 'Packaging/labelling files', 'Import/export documents', 'Pharmacy or clinical workflow documents'] },
    movement: { movementScore: 63, summary: 'Movement supports the workflow with policy movement, procurement signals, distressed-asset activity and corridor updates without dominating the page.', signals: ['Policy movement watch', 'Buyer demand and procurement signal watch', 'Equipment distress and resale signal watch', 'Corridor activity watch'], sourceConfidence: 'High' },
    coverage: { coverageScore: 71, publicCoverage: 'Public-safe Brazil commercial dashboard coverage', reviewedCoverage: 'Reviewed pathway and counterparty records remain private until requested', lastReviewedLabel: '2026-05-28' },
    heatmapMetrics: metrics,
    comparisonMetrics: comparisonMetrics(selectedLayer),
    reviewActions: buildReviewActions('brazil'),
    roleViews: buildRoleViews('brazil'),
  }
}


function readQueryValue(value?: string | string[] | null) {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

export function resolveCommercialDashboardSelection(
  params: Record<string, string | string[] | undefined> = {},
  defaultRole: CountryDashboardRole = 'buyer',
): CommercialDashboardSelection {
  const role = readQueryValue(params.role)
  const layer = readQueryValue(params.layer)

  return {
    selectedRole: role ? normalizeCountryDashboardRole(role) : defaultRole,
    selectedLayer: normalizeCountryHeatmapLayer(layer),
  }
}

export function getDefaultRoleForDashboardSection(section?: string | null): CountryDashboardRole {
  if (section === 'education') return 'doctor'
  if (section === 'connections') return 'service_provider'
  if (section === 'intelligence') return 'general_research'
  if (section === 'signals') return 'general_research'
  if (section === 'compliance') return 'importer'
  if (section === 'opportunities') return 'investor'
  return 'buyer'
}

export function isCountryDashboardRole(value?: string): value is CountryDashboardRole {
  return Boolean(value && countryDashboardRoles.some((role) => role.id === value))
}

export function normalizeCountryDashboardRole(value?: string | null): CountryDashboardRole {
  if (!value) return 'buyer'
  const normalized = value.trim().toLowerCase().replace(/[\s/-]+/g, '_')
  if (isCountryDashboardRole(normalized)) return normalized
  const globeRoleMap: Partial<Record<RoleId, CountryDashboardRole>> = {
    doctor_prescriber: 'doctor',
    pharmacist: 'pharmacist',
    importer: 'importer',
    exporter: 'exporter',
    distributor_wholesaler: 'distributor',
    investor_operator: 'investor',
    logistics_customs: 'service_provider',
    lab_qa: 'service_provider',
    legal_advisory: 'service_provider',
    regulatory_compliance: 'service_provider',
    cultivator_producer: 'seller_supplier',
    processor_extractor: 'seller_supplier',
    clinic_healthcare_operator: 'doctor',
    not_sure: 'general_research',
  }
  return globeRoleMap[normalized as RoleId] ?? 'buyer'
}

export function normalizeCountryHeatmapLayer(value?: string | null): CountryHeatmapLayer {
  if (!value) return 'marketplace_activity'
  const normalized = value.trim().toLowerCase().replace(/[\s/-]+/g, '_')
  return countryHeatmapLayers.some((layer) => layer.id === normalized) ? normalized as CountryHeatmapLayer : 'marketplace_activity'
}

export function getCommercialCountryDashboardRecord(country: CountryDashboardSummary, selectedLayer: CountryHeatmapLayer = 'marketplace_activity'): CountryDashboardRecord {
  return country.slug === 'brazil' ? brazilRecord(country, selectedLayer) : fallbackRecord(country, selectedLayer)
}
