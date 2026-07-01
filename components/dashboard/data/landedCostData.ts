// Elite Landed Cost / Trade Economics data for cannabis cross-border trade
// All monetary values in USD unless noted; freight costs are per kg, air

export type LandedProductType = 'flower-premium' | 'flower-standard' | 'oil' | 'biomass' | 'distillate'

export const LANDED_PRODUCT_LABELS: Record<LandedProductType, string> = {
  'flower-premium':  'Flower — Premium (EU-GMP)',
  'flower-standard': 'Flower — Standard',
  'oil':             'Cannabis Oil / Extract',
  'biomass':         'Biomass / Trim',
  'distillate':      'Distillate (>85% THC)',
}

// ── Exporter Origin Profiles ───────────────────────────────────────────────

export type ExporterOrigin = {
  iso2:                    string
  label:                   string
  regulatoryBody:          string
  exportLicenceBody:       string
  exportPermitCostUSD:     number   // per shipment export permit fee
  exportDocCostUSDPerKg:   number   // COA, phytosanitary, notarisation, translation (per kg)
  exportDocFixedUSD:       number   // fixed per-shipment documentation overhead
  productionCost: Record<LandedProductType, { low: number; high: number } | null>
  // null = not typically exported from this origin
}

export const EXPORTER_ORIGINS: ExporterOrigin[] = [
  {
    iso2: 'IL',
    label: 'Israel',
    regulatoryBody: 'IMCA (Israel Medical Cannabis Authority)',
    exportLicenceBody: 'Israeli Ministry of Health',
    exportPermitCostUSD: 380,
    exportDocCostUSDPerKg: 12,
    exportDocFixedUSD: 450,
    productionCost: {
      'flower-premium':  { low: 1800, high: 3200 },
      'flower-standard': { low: 800,  high: 1600 },
      'oil':             { low: 2000, high: 3800 },  // per litre equiv USD/kg oil
      'biomass':         { low: 200,  high: 500  },
      'distillate':      { low: 3500, high: 6000 },
    },
  },
  {
    iso2: 'PT',
    label: 'Portugal',
    regulatoryBody: 'INFARMED',
    exportLicenceBody: 'INFARMED',
    exportPermitCostUSD: 220,
    exportDocCostUSDPerKg: 8,
    exportDocFixedUSD: 320,
    productionCost: {
      'flower-premium':  { low: 2200, high: 3800 },
      'flower-standard': { low: 1200, high: 2200 },
      'oil':             { low: 2400, high: 4200 },
      'biomass':         { low: 150,  high: 350  },
      'distillate':      { low: 2800, high: 5500 },
    },
  },
  {
    iso2: 'CA',
    label: 'Canada',
    regulatoryBody: 'Health Canada',
    exportLicenceBody: 'Health Canada',
    exportPermitCostUSD: 420,
    exportDocCostUSDPerKg: 10,
    exportDocFixedUSD: 550,
    productionCost: {
      'flower-premium':  { low: 2350, high: 4050 },  // CAD 3200-5500 @ 0.735
      'flower-standard': { low: 450,  high: 1050 },  // CAD 600-1400 @ 0.735
      'oil':             { low: 1300, high: 3000 },
      'biomass':         { low: 250,  high: 700  },
      'distillate':      { low: 1450, high: 3700 },  // CAD distillate
    },
  },
  {
    iso2: 'ZA',
    label: 'South Africa',
    regulatoryBody: 'SAHPRA',
    exportLicenceBody: 'SAHPRA / SAPS',
    exportPermitCostUSD: 280,
    exportDocCostUSDPerKg: 7,
    exportDocFixedUSD: 380,
    productionCost: {
      'flower-premium':  { low: 900,  high: 2000 },
      'flower-standard': { low: 600,  high: 1400 },
      'oil':             null,
      'biomass':         { low: 80,   high: 220  },
      'distillate':      null,
    },
  },
  {
    iso2: 'CO',
    label: 'Colombia',
    regulatoryBody: 'ICA / INVIMA',
    exportLicenceBody: 'ICA / Colombian Ministry of Justice',
    exportPermitCostUSD: 200,
    exportDocCostUSDPerKg: 6,
    exportDocFixedUSD: 280,
    productionCost: {
      'flower-premium':  null,
      'flower-standard': { low: 400,  high: 900  },
      'oil':             { low: 800,  high: 2000 },
      'biomass':         { low: 60,   high: 160  },
      'distillate':      { low: 1200, high: 2800 },
    },
  },
  {
    iso2: 'AU',
    label: 'Australia',
    regulatoryBody: 'ODC / TGA',
    exportLicenceBody: 'ODC (Office of Drug Control)',
    exportPermitCostUSD: 660,   // AUD 1000 avg @ 0.66
    exportDocCostUSDPerKg: 14,
    exportDocFixedUSD: 620,
    productionCost: {
      'flower-premium':  { low: 5940, high: 9240 },  // AUD 9000-14000 @ 0.66
      'flower-standard': { low: 2640, high: 4620 },
      'oil':             { low: 9.9,  high: 23.1 },  // per gram equiv
      'biomass':         { low: 330,  high: 660  },
      'distillate':      { low: 1320, high: 2310 },
    },
  },
  {
    iso2: 'TH',
    label: 'Thailand',
    regulatoryBody: 'Thai FDA / Office of Narcotics Control Board',
    exportLicenceBody: 'Thai FDA',
    exportPermitCostUSD: 260,
    exportDocCostUSDPerKg: 8,
    exportDocFixedUSD: 340,
    productionCost: {
      'flower-premium':  null,
      'flower-standard': { low: 2200, high: 5000 },  // THB → USD
      'oil':             null,
      'biomass':         { low: 220,  high: 560  },
      'distillate':      null,
    },
  },
]

// ── Destination Import Market Profiles ────────────────────────────────────

export type DestinationMarket = {
  iso2:                        string
  label:                       string
  currency:                    string
  regulatoryBody:              string
  importPermitCostUSD:         number   // per shipment
  importPermitIsAnnual:        boolean  // true = one permit covers multiple shipments/yr
  customsClearanceUSD:         number   // broker + clearance fees per shipment
  dutyRatePct: Record<LandedProductType, number>   // 0 = duty-free
  gdpDistCostUSDPerKg:         number   // licensed in-country distribution
  testingCostPerBatchUSD:      number   // GMP/QC batch release testing
  typicalBatchSizeKg:          number   // minimum viable batch for economics
  wholesaleTargetUSD: Record<LandedProductType, { low: number; high: number } | null>
  notes:                       string
}

export const DESTINATION_MARKETS: DestinationMarket[] = [
  {
    iso2: 'DE',
    label: 'Germany',
    currency: 'EUR',
    regulatoryBody: 'BfArM',
    importPermitCostUSD: 440,   // €350-500 avg @ 1.10
    importPermitIsAnnual: false,
    customsClearanceUSD: 350,
    dutyRatePct: {
      'flower-premium':  0,   // HS 3004 pharma — EU MFN 0%
      'flower-standard': 0,
      'oil':             0,
      'biomass':         6.4, // HS 1211 — EU MFN 6.4% (unless EU-EPA applies)
      'distillate':      0,   // HS 1302 / 3004 — pharma preparations 0%
    },
    gdpDistCostUSDPerKg: 4.8,
    testingCostPerBatchUSD: 3300,
    typicalBatchSizeKg: 8,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 5280, high: 6820 },  // €4800-6200 @ 1.10
      'flower-standard': { low: 3080, high: 4620 },
      'oil':             { low: 8.8,  high: 16.5 },  // per gram
      'biomass':         { low: 308,  high: 572  },
      'distillate':      { low: 2200, high: 4400 },
    },
    notes: 'World\'s largest medical cannabis import market. BfArM issues per-shipment import permits (€350–€500 each). EU-GMP required for flower. Pharmacy-only dispensing. CanG social club supply creating downward price pressure on standard-tier.',
  },
  {
    iso2: 'NL',
    label: 'Netherlands',
    currency: 'EUR',
    regulatoryBody: 'Farmatec / BMC',
    importPermitCostUSD: 255,   // €150-300 avg @ 1.10
    importPermitIsAnnual: false,
    customsClearanceUSD: 280,
    dutyRatePct: {
      'flower-premium':  0,
      'flower-standard': 0,
      'oil':             0,
      'biomass':         6.4,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 3.6,
    testingCostPerBatchUSD: 2860,
    typicalBatchSizeKg: 6,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 4620, high: 6380 },
      'flower-standard': { low: 2640, high: 4180 },
      'oil':             { low: 8.0,  high: 14.5 },
      'biomass':         { low: 165,  high: 352  },
      'distillate':      { low: 2000, high: 3800 },
    },
    notes: 'BMC is the state cannabis procurement agency but private imports allowed for non-BMC varieties. Acts as a key EU import hub with strong re-distribution capability to DE, BE, and CZ. BIG-registered narcotics storage licence required for importers.',
  },
  {
    iso2: 'GB',
    label: 'United Kingdom',
    currency: 'GBP',
    regulatoryBody: 'MHRA / Home Office',
    importPermitCostUSD: 590,   // £350-600 avg @ 1.27
    importPermitIsAnnual: false,
    customsClearanceUSD: 390,
    dutyRatePct: {
      'flower-premium':  0,   // UK Global Tariff HS 3004 — 0%
      'flower-standard': 0,
      'oil':             0,
      'biomass':         0,   // UK: no MFN duty on HS 1211 post-Brexit
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 5.5,
    testingCostPerBatchUSD: 3810,  // £3,000 avg @ 1.27
    typicalBatchSizeKg: 7,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 6985, high: 10415 },  // £5500-8200 @ 1.27
      'flower-standard': { low: 4445, high: 6985  },
      'oil':             { low: 12.7, high: 27.9  },  // per gram
      'biomass':         { low: 380,  high: 760   },
      'distillate':      { low: 2540, high: 5080  },
    },
    notes: 'Schedule 2 controlled drug. MHRA import licence required per shipment. Home Office Schedule 2 import licence is separate. Private prescription market; no NHS reimbursement for cannabis. Premium-priced market vs EU due to supply constraint and FX. Post-Brexit customs adds complexity and cost.',
  },
  {
    iso2: 'AU',
    label: 'Australia',
    currency: 'AUD',
    regulatoryBody: 'TGA / ODC',
    importPermitCostUSD: 660,   // AUD 1000 avg @ 0.66
    importPermitIsAnnual: false,
    customsClearanceUSD: 480,
    dutyRatePct: {
      'flower-premium':  0,   // Schedule 8 pharmaceutical — 0% duty
      'flower-standard': 0,
      'oil':             0,
      'biomass':         0,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 4.6,   // AUD 7 avg @ 0.66
    testingCostPerBatchUSD: 2640, // AUD 4000 avg @ 0.66
    typicalBatchSizeKg: 5,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 5940, high: 9240 },   // AUD 9000-14000 @ 0.66
      'flower-standard': { low: 2640, high: 4950 },
      'oil':             { low: 9.9,  high: 23.1 },   // per gram
      'biomass':         { low: 396,  high: 660  },
      'distillate':      { low: 1320, high: 2640 },
    },
    notes: 'Historically highest medical cannabis wholesale prices globally. All imported product must undergo Australian irradiation (or equivalent) treatment. TGA Schedule 8 authorised prescriber and SAS-B pathways govern patient access. Domestic cultivation ramping, which is suppressing import demand for lower-tier product.',
  },
  {
    iso2: 'CH',
    label: 'Switzerland',
    currency: 'CHF',
    regulatoryBody: 'Swissmedic / FOPH',
    importPermitCostUSD: 715,   // CHF 600 avg @ 1.10 EUR equiv adjusted
    importPermitIsAnnual: false,
    customsClearanceUSD: 420,
    dutyRatePct: {
      'flower-premium':  0,
      'flower-standard': 0,
      'oil':             0,
      'biomass':         0,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 6.6,   // CHF 6 avg @ 1.10
    testingCostPerBatchUSD: 4400, // CHF 4000 avg
    typicalBatchSizeKg: 5,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 6050, high: 8800 },   // CHF 5500-8000 @ 1.10
      'flower-standard': { low: 880,  high: 2200 },
      'oil':             { low: 11.0, high: 24.2 },
      'biomass':         { low: 330,  high: 660  },
      'distillate':      { low: 2200, high: 4400 },
    },
    notes: 'Non-EU market outside EU drug legislation. Swissmedic authorisation required. Federal pilot programme lifting demand. Ultra-premium products reach CHF 12k/kg. Not subject to EU GMP requirements but Swiss GMP equivalent is de facto standard.',
  },
  {
    iso2: 'CZ',
    label: 'Czech Republic',
    currency: 'CZK',
    regulatoryBody: 'SÚKL',
    importPermitCostUSD: 330,   // €300 avg @ 1.10
    importPermitIsAnnual: false,
    customsClearanceUSD: 270,
    dutyRatePct: {
      'flower-premium':  0,
      'flower-standard': 0,
      'oil':             0,
      'biomass':         6.4,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 3.3,
    testingCostPerBatchUSD: 2530,
    typicalBatchSizeKg: 6,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 3850, high: 6050 },
      'flower-standard': { low: 2200, high: 3850 },
      'oil':             { low: 7.7,  high: 13.2 },
      'biomass':         { low: 220,  high: 440  },
      'distillate':      { low: 1760, high: 3300 },
    },
    notes: 'SÚKL-issued import permits. Czech Republic has one of the most active patient communities in Central Europe. Pharmacies import directly or via licensed wholesalers. Growing strategic hub for Central/Eastern Europe distribution from IL and CA supply.',
  },
  {
    iso2: 'DK',
    label: 'Denmark',
    currency: 'DKK',
    regulatoryBody: 'Danish Medicines Agency (DMA)',
    importPermitCostUSD: 385,   // ~€350 avg
    importPermitIsAnnual: false,
    customsClearanceUSD: 310,
    dutyRatePct: {
      'flower-premium':  0,
      'flower-standard': 0,
      'oil':             0,
      'biomass':         6.4,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 4.2,
    testingCostPerBatchUSD: 2970,
    typicalBatchSizeKg: 5,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 5500, high: 7700 },
      'flower-standard': { low: 3300, high: 5500 },
      'oil':             { low: 9.9,  high: 19.8 },
      'biomass':         { low: 275,  high: 550  },
      'distillate':      { low: 2200, high: 4400 },
    },
    notes: 'Four-year pilot programme ended 2021; now permanent medical scheme. DMA issues import authorisations. Bedrocan has historically dominated; Canadian and Israeli product gaining ground. Pharmacy-only channel.',
  },
  {
    iso2: 'IT',
    label: 'Italy',
    currency: 'EUR',
    regulatoryBody: 'AIFA / ISS',
    importPermitCostUSD: 385,
    importPermitIsAnnual: false,
    customsClearanceUSD: 300,
    dutyRatePct: {
      'flower-premium':  0,
      'flower-standard': 0,
      'oil':             0,
      'biomass':         6.4,
      'distillate':      0,
    },
    gdpDistCostUSDPerKg: 4.4,
    testingCostPerBatchUSD: 2860,
    typicalBatchSizeKg: 6,
    wholesaleTargetUSD: {
      'flower-premium':  { low: 4400, high: 6600 },
      'flower-standard': { low: 2640, high: 4400 },
      'oil':             { low: 7.7,  high: 15.4 },
      'biomass':         { low: 220,  high: 440  },
      'distillate':      { low: 1760, high: 3520 },
    },
    notes: 'Military Pharmaceutical Chemical Plant (OPM) has historically been the primary domestic producer. Pharmacy channel rapidly expanding access. Growing private import market for higher-THC products not produced domestically. AIFA import authorisation required.',
  },
]

// ── Freight Corridors ─────────────────────────────────────────────────────

export type FreightCorridor = {
  originIso2:                 string
  destIso2:                   string
  airFreightUSDPerKg:         { low: number; high: number }
  narcoticsSurchargeUSDPerKg: number  // GDP monitoring, security handling surcharge
  transitDays:                number
  notes?:                     string
}

export const FREIGHT_CORRIDORS: FreightCorridor[] = [
  // Israel
  { originIso2: 'IL', destIso2: 'DE', airFreightUSDPerKg: { low: 18, high: 26 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3, notes: 'Tel Aviv → Frankfurt; direct or via Amsterdam hub' },
  { originIso2: 'IL', destIso2: 'NL', airFreightUSDPerKg: { low: 18, high: 26 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3, notes: 'Tel Aviv → Amsterdam (Schiphol)' },
  { originIso2: 'IL', destIso2: 'GB', airFreightUSDPerKg: { low: 20, high: 28 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3 },
  { originIso2: 'IL', destIso2: 'AU', airFreightUSDPerKg: { low: 32, high: 48 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5, notes: 'Long-haul via Singapore hub' },
  { originIso2: 'IL', destIso2: 'CH', airFreightUSDPerKg: { low: 20, high: 28 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3 },
  { originIso2: 'IL', destIso2: 'CZ', airFreightUSDPerKg: { low: 20, high: 28 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3, notes: 'Via Frankfurt or Vienna hub' },
  { originIso2: 'IL', destIso2: 'DK', airFreightUSDPerKg: { low: 22, high: 30 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3 },
  { originIso2: 'IL', destIso2: 'IT', airFreightUSDPerKg: { low: 18, high: 26 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 3 },
  // Portugal
  { originIso2: 'PT', destIso2: 'DE', airFreightUSDPerKg: { low: 6,  high: 12 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2, notes: 'Short-haul air or temperature-controlled road' },
  { originIso2: 'PT', destIso2: 'NL', airFreightUSDPerKg: { low: 6,  high: 12 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  { originIso2: 'PT', destIso2: 'GB', airFreightUSDPerKg: { low: 8,  high: 16 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  { originIso2: 'PT', destIso2: 'CH', airFreightUSDPerKg: { low: 8,  high: 14 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  { originIso2: 'PT', destIso2: 'CZ', airFreightUSDPerKg: { low: 8,  high: 14 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  { originIso2: 'PT', destIso2: 'DK', airFreightUSDPerKg: { low: 9,  high: 16 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  { originIso2: 'PT', destIso2: 'IT', airFreightUSDPerKg: { low: 6,  high: 12 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 2 },
  // Canada
  { originIso2: 'CA', destIso2: 'DE', airFreightUSDPerKg: { low: 25, high: 38 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  { originIso2: 'CA', destIso2: 'NL', airFreightUSDPerKg: { low: 25, high: 36 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  { originIso2: 'CA', destIso2: 'GB', airFreightUSDPerKg: { low: 22, high: 34 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  { originIso2: 'CA', destIso2: 'AU', airFreightUSDPerKg: { low: 16, high: 26 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 4, notes: 'Toronto → Sydney; established corridor for irradiated product' },
  { originIso2: 'CA', destIso2: 'CH', airFreightUSDPerKg: { low: 26, high: 38 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  { originIso2: 'CA', destIso2: 'CZ', airFreightUSDPerKg: { low: 26, high: 38 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  { originIso2: 'CA', destIso2: 'DK', airFreightUSDPerKg: { low: 26, high: 38 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  { originIso2: 'CA', destIso2: 'IT', airFreightUSDPerKg: { low: 26, high: 38 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  // South Africa
  { originIso2: 'ZA', destIso2: 'DE', airFreightUSDPerKg: { low: 15, high: 22 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 4, notes: 'OR Tambo → Frankfurt; growing corridor' },
  { originIso2: 'ZA', destIso2: 'NL', airFreightUSDPerKg: { low: 15, high: 22 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 4 },
  { originIso2: 'ZA', destIso2: 'GB', airFreightUSDPerKg: { low: 14, high: 20 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 4 },
  { originIso2: 'ZA', destIso2: 'IT', airFreightUSDPerKg: { low: 15, high: 22 }, narcoticsSurchargeUSDPerKg: 4, transitDays: 4 },
  // Colombia
  { originIso2: 'CO', destIso2: 'DE', airFreightUSDPerKg: { low: 12, high: 18 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5, notes: 'Bogotá → Frankfurt; ICA/DIAN clearance can add days' },
  { originIso2: 'CO', destIso2: 'NL', airFreightUSDPerKg: { low: 12, high: 18 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  { originIso2: 'CO', destIso2: 'GB', airFreightUSDPerKg: { low: 14, high: 20 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  { originIso2: 'CO', destIso2: 'IT', airFreightUSDPerKg: { low: 12, high: 18 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 5 },
  // Australia
  { originIso2: 'AU', destIso2: 'DE', airFreightUSDPerKg: { low: 30, high: 48 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 7, notes: 'Sydney/Melbourne → Frankfurt; longest commercial cannabis corridor' },
  { originIso2: 'AU', destIso2: 'NL', airFreightUSDPerKg: { low: 30, high: 46 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  { originIso2: 'AU', destIso2: 'GB', airFreightUSDPerKg: { low: 28, high: 44 }, narcoticsSurchargeUSDPerKg: 5, transitDays: 6 },
  // Thailand
  { originIso2: 'TH', destIso2: 'DE', airFreightUSDPerKg: { low: 10, high: 18 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 4, notes: 'Bangkok → Frankfurt; primarily biomass exports' },
  { originIso2: 'TH', destIso2: 'NL', airFreightUSDPerKg: { low: 10, high: 18 }, narcoticsSurchargeUSDPerKg: 3, transitDays: 4 },
]

// ── Calculation Engine ────────────────────────────────────────────────────

export type LandedCostResult = {
  productionCostPerKg:       { low: number; high: number }
  exportPermitPerKg:         { low: number; high: number }
  exportDocPerKg:            { low: number; high: number }
  freightPerKg:              { low: number; high: number }
  narcoticsSurchargePerKg:   { low: number; high: number }
  importPermitPerKg:         { low: number; high: number }
  customsClearancePerKg:     { low: number; high: number }
  dutyPerKg:                 { low: number; high: number }
  gdpDistributionPerKg:      { low: number; high: number }
  testingPerKg:              { low: number; high: number }
  totalLandedPerKg:          { low: number; high: number }
  wholesaleTarget:           { low: number; high: number } | null
  impliedMarginPct:          { low: number; high: number } | null
  breakEvenVolumeKg:         number | null  // kg/shipment to break even on fixed costs
  corridorFound:             boolean
  available:                 boolean  // false if this product not exported from origin
}

export function calcLandedCost(
  originIso2: string,
  destIso2: string,
  product: LandedProductType,
  volumeKg: number,
  overrideProductionCostLow?: number,
  overrideProductionCostHigh?: number,
): LandedCostResult {
  const origin = EXPORTER_ORIGINS.find(o => o.iso2 === originIso2)
  const dest   = DESTINATION_MARKETS.find(d => d.iso2 === destIso2)
  const corridor = FREIGHT_CORRIDORS.find(c => c.originIso2 === originIso2 && c.destIso2 === destIso2)

  if (!origin || !dest) {
    return { ...ZERO_RESULT, corridorFound: false, available: false }
  }

  const rawProd = origin.productionCost[product]
  if (!rawProd) {
    return { ...ZERO_RESULT, corridorFound: !!corridor, available: false }
  }

  const prodLow  = overrideProductionCostLow  ?? rawProd.low
  const prodHigh = overrideProductionCostHigh ?? rawProd.high

  // Per-kg cost breakdown
  const exportPermitLow  = origin.exportPermitCostUSD  / volumeKg
  const exportPermitHigh = exportPermitLow
  const exportDocLow     = origin.exportDocCostUSDPerKg + origin.exportDocFixedUSD / volumeKg
  const exportDocHigh    = exportDocLow

  const freightLow  = corridor ? corridor.airFreightUSDPerKg.low  : 25
  const freightHigh = corridor ? corridor.airFreightUSDPerKg.high : 45
  const surcharge   = corridor ? corridor.narcoticsSurchargeUSDPerKg : 4

  const importPermitPerKg  = dest.importPermitCostUSD   / volumeKg
  const customsPerKg       = dest.customsClearanceUSD   / volumeKg
  const dutyRate           = dest.dutyRatePct[product] / 100
  const dutyLow            = prodLow  * dutyRate
  const dutyHigh           = prodHigh * dutyRate
  const gdpDist            = dest.gdpDistCostUSDPerKg
  const testingPerKg       = dest.testingCostPerBatchUSD / Math.max(volumeKg, dest.typicalBatchSizeKg)

  const totalLow  = prodLow  + exportPermitLow  + exportDocLow  + freightLow  + surcharge + importPermitPerKg + customsPerKg + dutyLow  + gdpDist + testingPerKg
  const totalHigh = prodHigh + exportPermitHigh + exportDocHigh + freightHigh + surcharge + importPermitPerKg + customsPerKg + dutyHigh + gdpDist + testingPerKg

  const wsTarget = dest.wholesaleTargetUSD[product]
  let marginLow: number | null  = null
  let marginHigh: number | null = null
  if (wsTarget) {
    marginLow  = ((wsTarget.low  - totalHigh) / wsTarget.low)  * 100
    marginHigh = ((wsTarget.high - totalLow ) / wsTarget.high) * 100
  }

  // Break-even volume: fixed costs / (ws_target_mid - variable_cost_per_kg)
  let breakEvenVol: number | null = null
  if (wsTarget) {
    const fixedCosts    = origin.exportPermitCostUSD + origin.exportDocFixedUSD + dest.importPermitCostUSD + dest.customsClearanceUSD + dest.testingCostPerBatchUSD
    const wsMid         = (wsTarget.low + wsTarget.high) / 2
    const variablePerKg = (prodLow + prodHigh) / 2 + (freightLow + freightHigh) / 2 + surcharge + origin.exportDocCostUSDPerKg + gdpDist + dutyLow
    const margin        = wsMid - variablePerKg
    if (margin > 0) breakEvenVol = Math.ceil(fixedCosts / margin)
  }

  return {
    productionCostPerKg:     { low: prodLow,         high: prodHigh         },
    exportPermitPerKg:       { low: exportPermitLow,  high: exportPermitHigh },
    exportDocPerKg:          { low: exportDocLow,     high: exportDocHigh    },
    freightPerKg:            { low: freightLow,       high: freightHigh      },
    narcoticsSurchargePerKg: { low: surcharge,        high: surcharge        },
    importPermitPerKg:       { low: importPermitPerKg, high: importPermitPerKg },
    customsClearancePerKg:   { low: customsPerKg,     high: customsPerKg     },
    dutyPerKg:               { low: dutyLow,          high: dutyHigh         },
    gdpDistributionPerKg:    { low: gdpDist,          high: gdpDist          },
    testingPerKg:            { low: testingPerKg,     high: testingPerKg     },
    totalLandedPerKg:        { low: totalLow,         high: totalHigh        },
    wholesaleTarget:         wsTarget ?? null,
    impliedMarginPct:        marginLow !== null && marginHigh !== null ? { low: marginLow, high: marginHigh } : null,
    breakEvenVolumeKg:       breakEvenVol,
    corridorFound:           !!corridor,
    available:               true,
  }
}

const ZERO_RESULT: Omit<LandedCostResult, 'corridorFound' | 'available'> = {
  productionCostPerKg:     { low: 0, high: 0 },
  exportPermitPerKg:       { low: 0, high: 0 },
  exportDocPerKg:          { low: 0, high: 0 },
  freightPerKg:            { low: 0, high: 0 },
  narcoticsSurchargePerKg: { low: 0, high: 0 },
  importPermitPerKg:       { low: 0, high: 0 },
  customsClearancePerKg:   { low: 0, high: 0 },
  dutyPerKg:               { low: 0, high: 0 },
  gdpDistributionPerKg:    { low: 0, high: 0 },
  testingPerKg:            { low: 0, high: 0 },
  totalLandedPerKg:        { low: 0, high: 0 },
  wholesaleTarget:         null,
  impliedMarginPct:        null,
  breakEvenVolumeKg:       null,
}
