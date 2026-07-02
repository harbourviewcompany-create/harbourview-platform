export type ProductType = 'flower' | 'biomass' | 'distillate' | 'oil' | 'concentrate' | 'pre-roll' | 'hash'
export type QualityTier = 'premium' | 'standard' | 'economy'
export type PriceTrend  = 'up' | 'down' | 'stable'
export type PriceUnit   = 'kg' | 'gram' | 'unit'

export type PriceBenchmark = {
  id:          string
  country:     string   // ISO2
  region:      string
  product:     ProductType
  tier:        QualityTier
  currency:    string
  minPrice:    number
  maxPrice:    number
  unit:        PriceUnit
  trend:       PriceTrend
  trendPct?:   number   // % change vs prior quarter
  notes?:      string
  updatedQ:    string   // e.g. "Q2 2026"
  channel:     'wholesale' | 'medical-wholesale' | 'retail'
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  flower:      'Flower (dried)',
  biomass:     'Biomass / Trim',
  distillate:  'Distillate',
  oil:         'Cannabis Oil',
  concentrate: 'Concentrate / Extract',
  'pre-roll':  'Pre-Roll',
  hash:        'Hash / Resin',
}

export const PRODUCT_TYPE_ICONS: Record<ProductType, string> = {
  flower:      '🌿',
  biomass:     '🌾',
  distillate:  '💧',
  oil:         '🧴',
  concentrate: '🧬',
  'pre-roll':  '🚬',
  hash:        '🟫',
}

export const TIER_LABELS: Record<QualityTier, string> = {
  premium:  'Premium',
  standard: 'Standard',
  economy:  'Economy',
}

export const TIER_COLORS: Record<QualityTier, string> = {
  premium:  '#d4a84b',
  standard: '#6366f1',
  economy:  '#6b7280',
}

export const PRICE_BENCHMARKS: PriceBenchmark[] = [
  // ── Germany ────────────────────────────────────────────────────────────────
  { id: 'de-flower-premium', country: 'DE', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 4800, maxPrice: 6200, unit: 'kg', trend: 'down', trendPct: -8,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'EU-GMP certified, THC ≥22%. Price pressure from rising domestic Anbauvereinigung supply and Portuguese/Dutch imports.' },
  { id: 'de-flower-standard', country: 'DE', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 2800, maxPrice: 4200, unit: 'kg', trend: 'down', trendPct: -12,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'EU-GMP or third-country equivalent. Increasing supply from Canadian LPs expanding into European market.' },
  { id: 'de-biomass-standard', country: 'DE', region: 'Europe', product: 'biomass', tier: 'standard',
    currency: 'EUR', minPrice: 280, maxPrice: 520, unit: 'kg', trend: 'down', trendPct: -15,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'CBD/hemp biomass for extraction. Domestic CanG social club excess trim entering market.' },
  { id: 'de-oil-premium', country: 'DE', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'EUR', minPrice: 8, maxPrice: 15, unit: 'gram', trend: 'stable', trendPct: -2,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Full-spectrum THC oil (≥25 mg/mL). Pharmacy-route product, must meet DAC/NRF monograph.' },

  // ── Netherlands ────────────────────────────────────────────────────────────
  { id: 'nl-flower-premium', country: 'NL', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 4200, maxPrice: 5800, unit: 'kg', trend: 'stable', trendPct: 1,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Bureau Medicinale Cannabis (BMC) contract prices. Bedrocan varieties; limited supply allocation.' },
  { id: 'nl-hash-standard', country: 'NL', region: 'Europe', product: 'hash', tier: 'standard',
    currency: 'EUR', minPrice: 3200, maxPrice: 5500, unit: 'kg', trend: 'stable',
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Moroccan and domestically-produced hash. Coffeeshop wholesale reference; tolerance policy (gedoogbeleid) product.' },

  // ── Portugal ───────────────────────────────────────────────────────────────
  { id: 'pt-flower-premium', country: 'PT', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 2200, maxPrice: 3800, unit: 'kg', trend: 'down', trendPct: -6,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'INFARMED-licensed. Portugal remains a cost-competitive EU-GMP exporter. Growing competition from Iberian peers.' },
  { id: 'pt-biomass-standard', country: 'PT', region: 'Europe', product: 'biomass', tier: 'standard',
    currency: 'EUR', minPrice: 150, maxPrice: 320, unit: 'kg', trend: 'down', trendPct: -10,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Hemp biomass (CBD ≥4%). High-volume outdoor cultivation; used by EU extractors.' },

  // ── Switzerland ────────────────────────────────────────────────────────────
  { id: 'ch-flower-premium', country: 'CH', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'CHF', minPrice: 5500, maxPrice: 8000, unit: 'kg', trend: 'up', trendPct: 5,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'SWISSMEDIC-authorised. Swiss pilot programme volumes lifting prices. Ultra-premium products reach CHF 12k/kg.' },
  { id: 'ch-flower-standard', country: 'CH', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'CHF', minPrice: 800, maxPrice: 2000, unit: 'kg', trend: 'down', trendPct: -20,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Swiss hemp flower (THC <1%). Domestic market only; export restrictions apply.' },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  { id: 'gb-flower-premium', country: 'GB', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'GBP', minPrice: 5500, maxPrice: 8200, unit: 'kg', trend: 'stable', trendPct: 0,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Schedule 2 controlled drug. MHRA-licensed product; predominantly imported from Canada and Netherlands.' },
  { id: 'gb-oil-premium', country: 'GB', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'GBP', minPrice: 10, maxPrice: 22, unit: 'gram', trend: 'stable',
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'THC-containing oil on private prescription via pharmacy. Bedrocan and Grow Pharma dominate.' },

  // ── Israel ─────────────────────────────────────────────────────────────────
  { id: 'il-flower-premium', country: 'IL', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'USD', minPrice: 1800, maxPrice: 3200, unit: 'kg', trend: 'down', trendPct: -18,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'IMCA-licensed. Domestic oversupply driving sharp price declines. Export volumes critical for Israeli operators to remain viable.' },
  { id: 'il-flower-standard', country: 'IL', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 800, maxPrice: 1600, unit: 'kg', trend: 'down', trendPct: -25,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Significant domestic price compression. Indoor standard-grade facing severe competition from lower-tier greenhouse product.' },

  // ── Canada ─────────────────────────────────────────────────────────────────
  { id: 'ca-flower-premium', country: 'CA', region: 'Americas', product: 'flower', tier: 'premium',
    currency: 'CAD', minPrice: 3200, maxPrice: 5500, unit: 'kg', trend: 'stable', trendPct: 2,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Health Canada LP. Premium craft and indoor. Export to EU commands 20–40% premium over domestic pricing.' },
  { id: 'ca-flower-economy', country: 'CA', region: 'Americas', product: 'flower', tier: 'economy',
    currency: 'CAD', minPrice: 600, maxPrice: 1400, unit: 'kg', trend: 'down', trendPct: -5,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Value-tier greenhouse product. Bulk volume; significant price deflation ongoing since 2022.' },
  { id: 'ca-distillate-standard', country: 'CA', region: 'Americas', product: 'distillate', tier: 'standard',
    currency: 'CAD', minPrice: 2, maxPrice: 5, unit: 'gram', trend: 'down', trendPct: -8,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'THC distillate (>90% THC). Concentrated market with several large extractors; pricing under pressure.' },

  // ── United States ──────────────────────────────────────────────────────────
  { id: 'us-ca-flower-premium', country: 'US', region: 'Americas', product: 'flower', tier: 'premium',
    currency: 'USD', minPrice: 800, maxPrice: 2200, unit: 'kg', trend: 'down', trendPct: -14,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'California wholesale (licensed dispensary channel). Sustained price compression from oversupply; legacy market competition.' },
  { id: 'us-co-flower-standard', country: 'US', region: 'Americas', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 400, maxPrice: 1000, unit: 'kg', trend: 'down', trendPct: -10,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Colorado mature market. One of the lowest-cost US wholesale markets; 10+ years of adult-use regulation.' },
  { id: 'us-mi-distillate-standard', country: 'US', region: 'Americas', product: 'distillate', tier: 'standard',
    currency: 'USD', minPrice: 1.5, maxPrice: 3.5, unit: 'gram', trend: 'down', trendPct: -12,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Michigan distillate — one of the most price-competitive extraction markets in North America.' },

  // ── Australia ──────────────────────────────────────────────────────────────
  { id: 'au-flower-premium', country: 'AU', region: 'Asia-Pacific', product: 'flower', tier: 'premium',
    currency: 'AUD', minPrice: 9000, maxPrice: 14000, unit: 'kg', trend: 'down', trendPct: -7,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'TGA-licensed. Historically high prices due to import dependency; domestic cultivation now ramping. Predominantly irradiated imports from Canada.' },
  { id: 'au-oil-premium', country: 'AU', region: 'Asia-Pacific', product: 'oil', tier: 'premium',
    currency: 'AUD', minPrice: 15, maxPrice: 35, unit: 'gram', trend: 'down', trendPct: -5,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'TGA Schedule 8 cannabis oil. Patient access via authorised prescriber or SAS-B pathway. Premium CBD/THC formulations.' },

  // ── Thailand ───────────────────────────────────────────────────────────────
  { id: 'th-flower-standard', country: 'TH', region: 'Asia-Pacific', product: 'flower', tier: 'standard',
    currency: 'THB', minPrice: 80000, maxPrice: 180000, unit: 'kg', trend: 'down', trendPct: -22,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Post-reclassification market. Significant price compression; tourism-adjacent wellness channel dominant.' },
  { id: 'th-biomass-standard', country: 'TH', region: 'Asia-Pacific', product: 'biomass', tier: 'standard',
    currency: 'THB', minPrice: 8000, maxPrice: 20000, unit: 'kg', trend: 'down', trendPct: -18,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Hemp biomass for export. Thailand establishing itself as low-cost Asian biomass supplier for EU extractors.' },

  // ── South Africa ───────────────────────────────────────────────────────────
  { id: 'za-flower-standard', country: 'ZA', region: 'Africa', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 600, maxPrice: 1400, unit: 'kg', trend: 'up', trendPct: 8,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'SAHPRA-licensed export. Low production cost; growing EU export interest. Outdoor/greenhouse growing regions in Western Cape and KZN.' },
  { id: 'za-biomass-economy', country: 'ZA', region: 'Africa', product: 'biomass', tier: 'economy',
    currency: 'USD', minPrice: 120, maxPrice: 280, unit: 'kg', trend: 'up', trendPct: 12,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Low-cost African biomass. Attractive to European extractors seeking cost efficiencies; logistics remain a constraint.' },

  // ── Colombia ───────────────────────────────────────────────────────────────
  { id: 'co-flower-standard', country: 'CO', region: 'Americas', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 400, maxPrice: 900, unit: 'kg', trend: 'up', trendPct: 6,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'ICA-licensed export. Colombia offers the lowest production cost among major exporters. Increasing EU and UK import interest.' },
  { id: 'co-biomass-economy', country: 'CO', region: 'Americas', product: 'biomass', tier: 'economy',
    currency: 'USD', minPrice: 60, maxPrice: 150, unit: 'kg', trend: 'stable',
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Ultra-low-cost outdoor biomass. Ideal feedstock for European distillate/concentrate producers seeking cost-optimised supply chains.' },

  // ── Czech Republic ─────────────────────────────────────────────────────────
  { id: 'cz-flower-premium', country: 'CZ', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 5200, maxPrice: 7000, unit: 'kg', trend: 'stable', trendPct: -3,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'SÚKL-licensed. Czech medical cannabis supplied predominantly by licensed imports from NL, PT, and DE. Tight import permit control keeps volumes low and prices elevated relative to source markets.' },
  { id: 'cz-flower-standard', country: 'CZ', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 3200, maxPrice: 5000, unit: 'kg', trend: 'down', trendPct: -4,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Standard-grade imports. Increasing competition from Polish and Slovak parallel import routes; pricing compressing marginally.' },
  { id: 'cz-oil-premium', country: 'CZ', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'EUR', minPrice: 10, maxPrice: 18, unit: 'gram', trend: 'up', trendPct: 5,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Czech pharmacy dispensing channel expanding with growing prescriber adoption. Oil formats outselling flower; domestic production interest emerging under SÚKL pilot.' },

  // ── Denmark ────────────────────────────────────────────────────────────────
  { id: 'dk-flower-premium', country: 'DK', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 7000, maxPrice: 10500, unit: 'kg', trend: 'down', trendPct: -5,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Danish Medicines Agency (DKMA) four-year pilot scheme. One of Europe\'s most expensive markets; supply constraints and limited prescriber count maintain premium pricing. Predominantly Canadian and Dutch imports.' },
  { id: 'dk-oil-standard', country: 'DK', region: 'Europe', product: 'oil', tier: 'standard',
    currency: 'EUR', minPrice: 12, maxPrice: 22, unit: 'gram', trend: 'down', trendPct: -4,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Oil products gaining traction over flower in Danish pilot scheme. Aurora Cannabis and Canopy Growth dominate licensed product list; price competition expected if pilot extended.' },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { id: 'it-flower-premium', country: 'IT', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 5500, maxPrice: 8500, unit: 'kg', trend: 'up', trendPct: 4,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'AIFA-authorized medical cannabis. Chronic undersupply: SCFM Florence facility cannot meet patient demand. Licensed imports from NL, PT, and DE growing but permit bottlenecks persist. Rising patient numbers support pricing.' },
  { id: 'it-flower-standard', country: 'IT', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 3800, maxPrice: 6000, unit: 'kg', trend: 'up', trendPct: 3,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Standard medical imports increasing to fill SCFM gap. German and Dutch operators expanding Italian allocation; Italian Ministry of Health streamlining import authorizations.' },
  { id: 'it-oil-premium', country: 'IT', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'EUR', minPrice: 12, maxPrice: 22, unit: 'gram', trend: 'up', trendPct: 5,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Italian pharmacy-dispensed oil expanding rapidly. Neurological, chronic pain, and oncology indications growing; SSN coverage in select regions creating significant volume demand.' },

  // ── Belgium ────────────────────────────────────────────────────────────────
  { id: 'be-flower-premium', country: 'BE', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 5800, maxPrice: 8200, unit: 'kg', trend: 'stable', trendPct: 1,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'FAMHP (Federal Agency for Medicines and Health Products) import-authorized. Belgian pharmacy market small but growing; pricing supported by tight import controls and slow licence approvals.' },
  { id: 'be-oil-standard', country: 'BE', region: 'Europe', product: 'oil', tier: 'standard',
    currency: 'EUR', minPrice: 9, maxPrice: 16, unit: 'gram', trend: 'stable',
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Oil dominant in Belgian medical channel; capsules and oral solutions also listed. CompCan and Bedrocan varieties registered. Prescriber base limited but expanding following specialist network training.' },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { id: 'es-flower-standard', country: 'ES', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 2500, maxPrice: 4500, unit: 'kg', trend: 'down', trendPct: -8,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Spanish cannabis social club (asociación cannábica) supply chain. Barcelona, Madrid, and Basque Country clubs dominate; semi-regulated grey-market model operates in legal grey zone. No formal medical cannabis framework (Sativex is the only authorised product).' },
  { id: 'es-hash-standard', country: 'ES', region: 'Europe', product: 'hash', tier: 'standard',
    currency: 'EUR', minPrice: 2800, maxPrice: 5000, unit: 'kg', trend: 'stable',
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Traditional Spanish hash market — Moroccan kif and domestically-pressed varieties. Social club distribution channel; national legal ambiguity persists despite regional (Catalonia, Basque) tolerance of club model.' },

  // ── Additional US States ───────────────────────────────────────────────────
  { id: 'us-fl-flower-premium', country: 'US', region: 'Americas', product: 'flower', tier: 'premium',
    currency: 'USD', minPrice: 1200, maxPrice: 2800, unit: 'kg', trend: 'down', trendPct: -10,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Florida medical-only market (MMTC vertical integration requirement). Wholesale reference pricing from inter-operator supply agreements. Adult-use ballot initiative expected 2026; would significantly alter market structure.' },
  { id: 'us-ny-flower-premium', country: 'US', region: 'Americas', product: 'flower', tier: 'premium',
    currency: 'USD', minPrice: 1500, maxPrice: 3200, unit: 'kg', trend: 'up', trendPct: 8,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'New York adult-use (CAURD and conditional adult-use licensees). Licensed cultivation supply severely constrained; illegal market still dominates by volume. Premium pricing for licensed product from compliant operators.' },
  { id: 'us-or-flower-economy', country: 'US', region: 'Americas', product: 'flower', tier: 'economy',
    currency: 'USD', minPrice: 150, maxPrice: 450, unit: 'kg', trend: 'down', trendPct: -20,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Oregon is the most over-supplied adult-use market in the US. Per-gram wholesale prices among the lowest in North America. Interstate export ban prevents supply relief. Market consolidation ongoing.' },
  { id: 'us-wa-flower-standard', country: 'US', region: 'Americas', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 600, maxPrice: 1400, unit: 'kg', trend: 'down', trendPct: -6,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Washington State — adult-use since 2014. WSLCB-licensed market with steady price compression from expanding cultivation capacity and domestic supply surplus.' },
  { id: 'us-nj-flower-premium', country: 'US', region: 'Americas', product: 'flower', tier: 'premium',
    currency: 'USD', minPrice: 1800, maxPrice: 3500, unit: 'kg', trend: 'up', trendPct: 8,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'New Jersey CRC-licensed adult-use market (launched 2023). Supply constrained relative to demand; NYC border proximity and high-income consumer base supports premium positioning above national average.' },
  { id: 'us-ma-flower-standard', country: 'US', region: 'Americas', product: 'flower', tier: 'standard',
    currency: 'USD', minPrice: 1200, maxPrice: 2500, unit: 'kg', trend: 'stable', trendPct: -2,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Massachusetts CCC-regulated adult-use market. Stabilizing after initial post-launch supply shortage (2018–2020). Boston-area premium retail channel supports above-average wholesale vs West Coast.' },
  { id: 'us-ok-flower-economy', country: 'US', region: 'Americas', product: 'flower', tier: 'economy',
    currency: 'USD', minPrice: 200, maxPrice: 700, unit: 'kg', trend: 'down', trendPct: -18,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'Oklahoma OMMA-licensed medical market — highest cultivator licence density in the US (10,000+ licences). Severe structural oversupply depressing prices; market rationalization underway following adult-use vote failure in 2023.' },

  // ── Poland ─────────────────────────────────────────────────────────────────
  { id: 'pl-flower-premium', country: 'PL', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 3400, maxPrice: 5200, unit: 'kg', trend: 'down', trendPct: -7,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'URPL-regulated medical market since 2017. Primary imports from Canada, Netherlands, and Germany. High import duties and regulatory overhead add ~EUR 800/kg above German equivalent. Supply expanding slowly as domestic patient registry grows.' },
  { id: 'pl-flower-standard', country: 'PL', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 1900, maxPrice: 3400, unit: 'kg', trend: 'down', trendPct: -10,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Mid-tier imports filling growing patient demand. Pharmacy dispensing via NFZ-reimbursed prescriptions creating volume pull. Price erosion driven by new supplier agreements and volume commitments from major importers.' },
  { id: 'pl-oil-premium', country: 'PL', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'EUR', minPrice: 11, maxPrice: 19, unit: 'gram', trend: 'stable', trendPct: -1,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'THC oil (≥25 mg/mL) for pharmacy dispensing. Very limited product authorizations compared to flower; European-manufactured products dominate. Reimbursement approval pending for several SKUs.' },

  // ── France ─────────────────────────────────────────────────────────────────
  { id: 'fr-flower-premium', country: 'FR', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'EUR', minPrice: 4600, maxPrice: 6800, unit: 'kg', trend: 'up', trendPct: 4,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'ANSM-authorized medical pilot (expérimentation). Extremely constrained supply; only SATIPHARM and select EU-GMP producers hold authorizations. Pharmacy distribution via AGEPS. Pilot extension underway toward permanent framework.' },
  { id: 'fr-oil-premium', country: 'FR', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'EUR', minPrice: 13, maxPrice: 22, unit: 'gram', trend: 'up', trendPct: 6,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Full-spectrum oil products dispensed via hospital pharmacies. Very few authorized SKUs; Sativex (nabiximols) approved separately. Premium pricing reflects supply scarcity and high regulatory entry cost for new products.' },
  { id: 'fr-flower-standard', country: 'FR', region: 'Europe', product: 'flower', tier: 'standard',
    currency: 'EUR', minPrice: 2800, maxPrice: 4500, unit: 'kg', trend: 'stable', trendPct: 2,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Standard-tier imports entering pilot programme. ANSM tightening supplier qualification requirements. Pilot expanding gradually; eventual market size projected to match Germany at scale if permanent framework passes.' },

  // ── Sweden ─────────────────────────────────────────────────────────────────
  { id: 'se-flower-premium', country: 'SE', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'SEK', minPrice: 75000, maxPrice: 115000, unit: 'kg', trend: 'stable', trendPct: 1,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Läkemedelsverket-authorized. Sweden maintains one of the most restrictive medical cannabis frameworks in the EU. Apoteket AB monopoly distribution significantly inflates landed cost. Specialist prescription only; very small patient population (~3,000 active).' },
  { id: 'se-oil-premium', country: 'SE', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'SEK', minPrice: 160, maxPrice: 280, unit: 'gram', trend: 'stable', trendPct: -2,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'THC oil dispensed via Apoteket. Bedrocan and select EU-GMP products authorized. High per-gram price reflects mono-channel distribution, specialist prescribing requirements, and absence of cost competition. Sativex reimbursed separately via NT-rådet.' },

  // ── Norway ─────────────────────────────────────────────────────────────────
  { id: 'no-flower-premium', country: 'NO', region: 'Europe', product: 'flower', tier: 'premium',
    currency: 'NOK', minPrice: 70000, maxPrice: 105000, unit: 'kg', trend: 'stable', trendPct: 0,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Statens Legemiddelverk (SLV) licensed. Non-EU jurisdiction with high import compliance cost. Apotek 1 / Vitus distribution monopoly. Extremely small patient population; most prescriptions are §28c compassionate use. Import volumes among the lowest per-capita in Europe.' },
  { id: 'no-oil-premium', country: 'NO', region: 'Europe', product: 'oil', tier: 'premium',
    currency: 'NOK', minPrice: 2200, maxPrice: 3800, unit: 'gram', trend: 'stable', trendPct: 1,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'SLV §28c exempt products. Bedrocan, Tilray, and Canadian LPs supply small volume. Pharmacy price markups under Apotek 1/Vitus frame substantial add to wholesale base. Very high end-patient cost limits adherence and patient uptake.' },

  // ── South Africa (additional products) ────────────────────────────────────
  { id: 'za-distillate-standard', country: 'ZA', region: 'Africa', product: 'distillate', tier: 'standard',
    currency: 'USD', minPrice: 400, maxPrice: 900, unit: 'kg', trend: 'up', trendPct: 10,
    channel: 'wholesale', updatedQ: 'Q2 2026',
    notes: 'SAHPRA-licensed extract producers targeting EU export corridors. Low production cost base (outdoor/greenhouse) creates strong margin at destination. EU-GMP certification pathway being pursued by leading Cape producers to unlock European pharmacy markets.' },
  { id: 'za-oil-standard', country: 'ZA', region: 'Africa', product: 'oil', tier: 'standard',
    currency: 'USD', minPrice: 3, maxPrice: 7, unit: 'gram', trend: 'up', trendPct: 9,
    channel: 'medical-wholesale', updatedQ: 'Q2 2026',
    notes: 'Section 21 / complementary medicines-authorized oil products. Domestic medical market nascent but growing. EU export potential significant for finished oil if GMP certification achieved. Several operators approaching international pharmacy channel readiness.' },
]

export function formatPrice(b: PriceBenchmark): string {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(n < 10 ? 2 : 0)
  return `${b.currency} ${fmt(b.minPrice)}–${fmt(b.maxPrice)} / ${b.unit}`
}
