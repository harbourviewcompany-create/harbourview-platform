export type ClaimState = 'verified' | 'inference' | 'unresolved'

export type SourceKind =
  | 'regulator'
  | 'company'
  | 'filing'
  | 'registry'
  | 'industry'
  | 'secondary'

export type AccessPosture =
  | 'open_gateway'
  | 'selective_gateway'
  | 'vertically_controlled'
  | 'regulator'
  | 'competitor'
  | 'watch'

export type CounterpartyRole =
  | 'regulator'
  | 'parent_company'
  | 'producer'
  | 'manufacturer'
  | 'importer'
  | 'wholesaler'
  | 'distributor'
  | 'pharmacy'
  | 'clinic'
  | 'market_access_partner'
  | 'acquisition_target'

export interface IntelligenceSource {
  id: string
  label: string
  url: string
  kind: SourceKind
  jurisdiction?: string
  note?: string
}

export interface IntelligenceClaim {
  id: string
  state: ClaimState
  statement: string
  sourceIds: string[]
}

export interface PathwayStep {
  label: string
  detail: string
}

export interface CounterpartyNode {
  id: string
  name: string
  role: CounterpartyRole
  jurisdiction: string
  ownership: string
  accessPosture: AccessPosture
  licenceOrFacility: string
  commercialPosition: string
  state: ClaimState
  sourceIds: string[]
}

export interface OwnershipChange {
  entity: string
  change: string
  effectiveDate?: string
  state: ClaimState
  commercialMeaning: string
  sourceIds: string[]
}

export interface RegulatorNode {
  name: string
  jurisdiction: string
  remit: string
  sourceIds: string[]
}

export interface CommercialImpactItem {
  label: string
  rationale: string
  state: 'inference'
}

export interface CommercialOpening {
  title: string
  priority: 'highest' | 'high' | 'medium'
  targetCounterparties: string[]
  rationale: string
  evidenceBoundary: string
}

export interface WatchTrigger {
  title: string
  condition: string
  whyItMatters: string
  sourceIds: string[]
}

export interface DataQualityNote {
  state: 'unresolved'
  title: string
  detail: string
  decisionRule: string
  sourceIds: string[]
}

export interface CounterpartyIntelligencePathway {
  id: string
  slug: string
  title: string
  eventDate: string
  asOf: string
  jurisdictions: string[]
  eventClass: 'material_advancement'
  thesis: string
  verifiedFacts: IntelligenceClaim[]
  dataQualityNotes: DataQualityNote[]
  pathway: PathwayStep[]
  counterparties: CounterpartyNode[]
  ownershipChanges: OwnershipChange[]
  regulators: RegulatorNode[]
  likelyWinners: CommercialImpactItem[]
  likelyLosers: CommercialImpactItem[]
  commercialOpenings: CommercialOpening[]
  nextTriggers: WatchTrigger[]
  sources: IntelligenceSource[]
}

export const counterpartyIntelligencePathways: CounterpartyIntelligencePathway[] = [
  {
    id: 'ci-de-germany-q1-import-revision-2026',
    slug: 'germany-q1-import-revision',
    title: 'Germany Q1 2026 import baseline revised to 67.569 tonnes',
    eventDate: '2026-08-21',
    asOf: '2026-08-21',
    jurisdictions: ['Germany', 'Canada', 'Portugal', 'European Union'],
    eventClass: 'material_advancement',
    thesis:
      'Germany is a larger medical-cannabis import market than the earlier Q1 publication implied, while several major routes to pharmacies are increasingly vertically controlled. Independent, supplier-open import and distribution gateways therefore become more strategically valuable.',
    verifiedFacts: [
      {
        id: 'de-q1-total',
        state: 'verified',
        statement:
          'The reported Q1 2026 German medical-cannabis import total was revised upward from 50.539 tonnes to 67.569 tonnes, a 33.7% increase versus the earlier figure.',
        sourceIds: ['de-import-revision'],
      },
      {
        id: 'de-import-authority',
        state: 'verified',
        statement:
          'BfArM / Bundesopiumstelle is a core German authority for medical-cannabis handling and import authorisations under MedCanG, including operating-site and foreign-exporter information for import applications.',
        sourceIds: ['bfarm-medcang'],
      },
      {
        id: 'de-cansativa-open',
        state: 'verified',
        statement:
          'Cansativa publicly operates a supplier-onboarding model and describes a network of more than 40 suppliers and more than 2,000 active pharmacy customers.',
        sourceIds: ['cansativa-suppliers'],
      },
      {
        id: 'de-cantourage-open',
        state: 'verified',
        statement:
          'Cantourage publicly presents a platform model serving Europe and working with more than 65 licensed cultivation partners.',
        sourceIds: ['cantourage-platform'],
      },
      {
        id: 'de-four20-owned',
        state: 'verified',
        statement:
          'Curaleaf completed the acquisition of the remaining interest in Four 20 Pharma in April 2026, making the German producer/distributor fully Curaleaf-owned.',
        sourceIds: ['curaleaf-four20'],
      },
      {
        id: 'de-tilray-pharmacy-access',
        state: 'verified',
        statement:
          'Tilray-owned CC Pharma and 14U Pharma announced a strategic pharmacy-access arrangement with Alliance Healthcare Deutschland / gesund leben, increasing Tilray-controlled downstream reach in Germany.',
        sourceIds: ['tilray-cc-pharma'],
      },
    ],
    dataQualityNotes: [
      {
        state: 'unresolved',
        title: 'Country-of-origin table does not yet reconcile to the revised headline total',
        detail:
          'The older Q1 country table totals 50.539 tonnes, while the revised headline total is 67.569 tonnes. The roughly 17.030-tonne difference has not been cleanly re-attributed by country in the source set used for this pathway.',
        decisionRule:
          'Do not recalculate supplier-country market shares against 67.569 tonnes until BfArM publishes a reconciled country table or equivalent authoritative breakdown.',
        sourceIds: ['de-import-revision', 'de-country-breakdown-old'],
      },
    ],
    pathway: [
      {
        label: 'Foreign licensed producer',
        detail: 'Cultivation/manufacturing in an export-authorised source jurisdiction.',
      },
      {
        label: 'Foreign exporter',
        detail: 'Contractual exporter identified for the German import transaction.',
      },
      {
        label: 'German importer / manufacturer',
        detail: 'MedCanG / medicines-law permissions, quality/release and site controls as applicable.',
      },
      {
        label: 'Wholesaler / distributor',
        detail: 'German pharmaceutical distribution and pharmacy access.',
      },
      {
        label: 'Pharmacy',
        detail: 'Dispensing endpoint for prescribed medical cannabis.',
      },
    ],
    counterparties: [
      {
        id: 'bfarm',
        name: 'BfArM / Bundesopiumstelle',
        role: 'regulator',
        jurisdiction: 'Germany',
        ownership: 'German federal authority',
        accessPosture: 'regulator',
        licenceOrFacility: 'MedCanG handling/import authorisation authority.',
        commercialPosition: 'Primary regulatory gate for legal German import activity.',
        state: 'verified',
        sourceIds: ['bfarm-medcang'],
      },
      {
        id: 'cansativa',
        name: 'Cansativa Group',
        role: 'distributor',
        jurisdiction: 'Germany',
        ownership: 'Independent platform in the sources reviewed for this pathway.',
        accessPosture: 'open_gateway',
        licenceOrFacility: 'Pharmaceutical manufacturer/wholesaler with central distribution operations in Germany.',
        commercialPosition: 'High-value supplier-open German gateway with explicit supplier onboarding.',
        state: 'verified',
        sourceIds: ['cansativa-suppliers'],
      },
      {
        id: 'cantourage',
        name: 'Cantourage Group SE',
        role: 'market_access_partner',
        jurisdiction: 'Germany / United Kingdom / Europe',
        ownership: 'Public independent platform.',
        accessPosture: 'open_gateway',
        licenceOrFacility: 'European cannabis import, processing and distribution platform.',
        commercialPosition: 'High-value route for licensed producers seeking multi-market European access.',
        state: 'verified',
        sourceIds: ['cantourage-platform'],
      },
      {
        id: 'cannamedical',
        name: 'Cannamedical Pharma GmbH',
        role: 'importer',
        jurisdiction: 'Germany',
        ownership: 'Part of Semdor Pharma Group.',
        accessPosture: 'selective_gateway',
        licenceOrFacility: 'Imports, processes, releases and distributes medical cannabis into German pharmacy/clinical channels.',
        commercialPosition: 'Established multinational sourcing counterparty with demonstrated third-party supplier relationships.',
        state: 'verified',
        sourceIds: ['cannamedical-about'],
      },
      {
        id: 'four20',
        name: 'Four 20 Pharma GmbH',
        role: 'distributor',
        jurisdiction: 'Germany',
        ownership: '100% Curaleaf-owned as of April 2026.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'EU-GMP/GDP German producer/distributor and pharmaceutical wholesale infrastructure.',
        commercialPosition: 'Capable German route, but less neutral for direct competitors of Curaleaf.',
        state: 'verified',
        sourceIds: ['curaleaf-four20'],
      },
      {
        id: 'cc-pharma',
        name: 'CC Pharma',
        role: 'distributor',
        jurisdiction: 'Germany',
        ownership: 'Tilray-owned.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'Pharmaceutical importer/distributor with broad German pharmacy reach.',
        commercialPosition: 'Important downstream Tilray channel rather than a neutral competitor gateway.',
        state: 'verified',
        sourceIds: ['tilray-cc-pharma'],
      },
    ],
    ownershipChanges: [
      {
        entity: 'Four 20 Pharma GmbH',
        change: 'Curaleaf acquired the remaining 45% and moved to 100% ownership.',
        effectiveDate: '2026-04',
        state: 'verified',
        commercialMeaning:
          'A significant German distribution route became fully vertically integrated into Curaleaf, increasing the strategic value of supplier-open alternatives.',
        sourceIds: ['curaleaf-four20'],
      },
    ],
    regulators: [
      {
        name: 'BfArM / Bundesopiumstelle',
        jurisdiction: 'Germany',
        remit: 'Medical-cannabis handling/import authorisations and associated import controls under MedCanG.',
        sourceIds: ['bfarm-medcang'],
      },
    ],
    likelyWinners: [
      {
        label: 'Supplier-open German import/distribution platforms',
        rationale:
          'Higher measured demand increases the value of licensed gateways that can onboard additional EU-GMP supply without forcing producers into a captive competitor channel.',
        state: 'inference',
      },
      {
        label: 'Existing compliant exporters with reliable repeat volume',
        rationale:
          'A larger market can reward suppliers that already satisfy pharmaceutical quality, documentation and delivery requirements.',
        state: 'inference',
      },
    ],
    likelyLosers: [
      {
        label: 'Undifferentiated commodity suppliers dependent on one vertically controlled importer',
        rationale:
          'Channel consolidation can compress negotiating leverage and shelf/pharmacy access for suppliers without independent routes.',
        state: 'inference',
      },
    ],
    commercialOpenings: [
      {
        title: 'Parallel German gateway qualification',
        priority: 'highest',
        targetCounterparties: ['Cansativa Group', 'Cantourage Group SE', 'Cannamedical Pharma GmbH'],
        rationale:
          'Qualify multiple independent importer/distributor routes before additional vertical consolidation reduces neutral access.',
        evidenceBoundary:
          'Cansativa and Cantourage are explicitly supplier-facing in reviewed public material. Cannamedical has verified multinational sourcing, but current onboarding appetite should be revalidated before outreach.',
      },
      {
        title: 'Re-price Germany opportunity using the revised market baseline',
        priority: 'high',
        targetCounterparties: ['German importers', 'EU-GMP suppliers'],
        rationale:
          'The revised headline total materially changes market-size assumptions, but country shares must remain provisional until BfArM reconciles the underlying table.',
        evidenceBoundary:
          'Use 67.569 tonnes for headline Q1 market size; do not infer revised supplier-country shares from the stale 50.539-tonne table.',
      },
    ],
    nextTriggers: [
      {
        title: 'BfArM reconciles the Q1 country table',
        condition:
          'Authoritative publication attributes the revised 67.569-tonne Q1 total by source country or otherwise explains the ~17.030-tonne gap.',
        whyItMatters:
          'This will reveal whether an existing corridor was materially understated or a different supplying jurisdiction accelerated faster than previously visible.',
        sourceIds: ['bfarm-medcang', 'de-import-revision'],
      },
      {
        title: 'BfArM publishes Q2 2026 import data',
        condition: 'A new Q2 import total and/or country breakdown is published.',
        whyItMatters:
          'Confirms whether the revised Q1 level represents sustained structural demand or a one-quarter measurement adjustment.',
        sourceIds: ['bfarm-medcang'],
      },
    ],
    sources: [
      {
        id: 'de-import-revision',
        label: 'International Cannabis Business Conference — German Q1 2026 import revision',
        url: 'https://internationalcbc.com/german-q1-2026-cannabis-import-total-revised-upward-sets-new-record/',
        kind: 'industry',
        jurisdiction: 'Germany',
      },
      {
        id: 'bfarm-medcang',
        label: 'BfArM — Erlaubnis nach § 4 MedCanG',
        url: 'https://www.bfarm.de/DE/Bundesopiumstelle/Medizinisches-Cannabis/Erlaubnis/_artikel.html?nn=1749282',
        kind: 'regulator',
        jurisdiction: 'Germany',
      },
      {
        id: 'cansativa-suppliers',
        label: 'Cansativa — supplier onboarding',
        url: 'https://www.cansativa.de/en/suppliers/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'cantourage-platform',
        label: 'Cantourage — European platform',
        url: 'https://www.cantourage.com/en',
        kind: 'company',
        jurisdiction: 'Europe',
      },
      {
        id: 'cannamedical-about',
        label: 'Cannamedical — company and sourcing profile',
        url: 'https://cannamedical.com/uber-uns/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'curaleaf-four20',
        label: 'Curaleaf International — full acquisition of Four 20 Pharma',
        url: 'https://curaleafinternational.com/curaleaf-has-announced-the-completion-of-the-full-acquisition-of-four-20-pharma-a-fully-eu-gmp-gdp-licensed-german-producer-and-distributor-of-medical-cannabis/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'tilray-cc-pharma',
        label: 'Tilray — CC Pharma / 14U Pharma German pharmacy-access alliance',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-medical-cc-pharma-and-14u-pharma-announce-strategic/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'de-country-breakdown-old',
        label: 'StratCann — earlier Q1 2026 supplier-country breakdown',
        url: 'https://stratcann.com/news/canada-supplied-half-germanys-cannabis-imports-in-q1-2026/',
        kind: 'secondary',
        jurisdiction: 'Germany',
        note: 'Used only to document the unreconciled earlier 50.539-tonne country breakdown.',
      },
    ],
  },
  {
    id: 'ci-tilray-capacity-2026-08-20',
    slug: 'tilray-275t-capacity-expansion',
    title: 'Tilray expands stated global cultivation capacity toward 275 tonnes',
    eventDate: '2026-08-20',
    asOf: '2026-08-21',
    jurisdictions: ['Canada', 'Portugal', 'Germany', 'United Kingdom', 'Australia'],
    eventClass: 'material_advancement',
    thesis:
      'Tilray is increasing upstream capacity while already controlling major downstream assets in Germany and the United Kingdom. The competitive threat is therefore an integrated route-to-patient system rather than an isolated cultivation expansion.',
    verifiedFacts: [
      {
        id: 'tilray-capacity',
        state: 'verified',
        statement:
          'Tilray announced approximately 275 metric tonnes of cultivation capacity, up from approximately 210 tonnes, with additional output in Quebec and Portugal; its forward-looking language also references an approximate 260–275 tonne range.',
        sourceIds: ['tilray-capacity-release'],
      },
      {
        id: 'tilray-quebec-plus30',
        state: 'verified',
        statement:
          'The announcement attributes 30 tonnes of incremental capacity to Quebec and says Quebec-grown bulk is already moving to Tilray operations in Portugal and Australia.',
        sourceIds: ['tilray-capacity-release'],
      },
      {
        id: 'tilray-quebec-eugmp',
        state: 'verified',
        statement:
          'Tilray targets EU-GMP certification for its Quebec cultivation operation within approximately 12 months; the August 2026 release does not establish that certification as already complete.',
        sourceIds: ['tilray-capacity-release'],
      },
      {
        id: 'tilray-germany-arx',
        state: 'verified',
        statement:
          'Tilray launched ARX as a German-grown medical-cannabis brand from Aphria RX in Neumünster in June 2026.',
        sourceIds: ['tilray-arx'],
      },
      {
        id: 'tilray-uk-lyphe',
        state: 'verified',
        statement:
          'Tilray announced the acquisition of Lyphe Group, adding UK clinic and dispensary infrastructure to its medical-cannabis route-to-patient model.',
        sourceIds: ['tilray-lyphe'],
      },
    ],
    dataQualityNotes: [],
    pathway: [
      {
        label: 'Canadian cultivation',
        detail: 'Quebec production adds upstream volume; export requires Canadian federal licensing and shipment-specific permissions.',
      },
      {
        label: 'Portugal EU-GMP hub',
        detail: 'Cantanhede provides Tilray with an established EU pharmaceutical production/processing base.',
      },
      {
        label: 'Germany domestic/import platform',
        detail: 'Aphria RX and CC Pharma combine production/import/distribution capabilities.',
      },
      {
        label: 'Pharmacy access',
        detail: 'CC Pharma / 14U Pharma leverage Alliance Healthcare and gesund leben pharmacy coverage.',
      },
      {
        label: 'UK patient channel',
        detail: 'Lyphe adds clinic and dispensary access downstream of supply.',
      },
    ],
    counterparties: [
      {
        id: 'tilray',
        name: 'Tilray Brands / Tilray Medical',
        role: 'parent_company',
        jurisdiction: 'Global',
        ownership: 'Public parent company.',
        accessPosture: 'competitor',
        licenceOrFacility: 'Integrated international medical-cannabis platform.',
        commercialPosition: 'Controls multiple upstream and downstream assets across Canada, Europe and the UK.',
        state: 'verified',
        sourceIds: ['tilray-capacity-release', 'tilray-lyphe'],
      },
      {
        id: 'tilray-quebec',
        name: 'Tilray Quebec cultivation operation',
        role: 'producer',
        jurisdiction: 'Canada',
        ownership: 'Tilray-controlled.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'Adds 30 tonnes of announced cultivation capacity; EU-GMP certification targeted, not yet established by the August release.',
        commercialPosition: 'Potential future EU supply source after additional qualification/certification milestones.',
        state: 'verified',
        sourceIds: ['tilray-capacity-release', 'tilray-masson-angers'],
      },
      {
        id: 'tilray-portugal',
        name: 'Tilray Portugal — Cantanhede',
        role: 'manufacturer',
        jurisdiction: 'Portugal',
        ownership: 'Tilray-controlled.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'EU pharmaceutical manufacturing / processing base at Cantanhede.',
        commercialPosition: 'Core bridge between international cultivation and EU medical markets.',
        state: 'verified',
        sourceIds: ['tilray-capacity-release', 'infarmed-tilray'],
      },
      {
        id: 'aphria-rx',
        name: 'Aphria RX GmbH',
        role: 'producer',
        jurisdiction: 'Germany',
        ownership: 'Tilray-controlled.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'German cultivation operation in Neumünster; source of the ARX brand.',
        commercialPosition: 'Domestic German production reduces dependence on imported supply for part of Tilray portfolio.',
        state: 'verified',
        sourceIds: ['tilray-arx'],
      },
      {
        id: 'cc-pharma-tilray',
        name: 'CC Pharma',
        role: 'distributor',
        jurisdiction: 'Germany',
        ownership: 'Tilray-owned.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'Pharmaceutical distribution platform with broad German pharmacy reach.',
        commercialPosition: 'Downstream control point for Tilray products and pharmacy access.',
        state: 'verified',
        sourceIds: ['tilray-cc-pharma-2'],
      },
      {
        id: 'alliance-healthcare-de',
        name: 'Alliance Healthcare Deutschland / gesund leben',
        role: 'market_access_partner',
        jurisdiction: 'Germany',
        ownership: 'Independent of Tilray; strategic distribution/pharmacy-access partner.',
        accessPosture: 'selective_gateway',
        licenceOrFacility: 'Nationwide logistics plus gesund leben partner-pharmacy network.',
        commercialPosition: 'Amplifies CC Pharma pharmacy reach under the announced strategic arrangement.',
        state: 'verified',
        sourceIds: ['tilray-cc-pharma-2'],
      },
      {
        id: 'lyphe',
        name: 'Lyphe Group',
        role: 'clinic',
        jurisdiction: 'United Kingdom',
        ownership: 'Acquired by Tilray in April 2026.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'Clinic and dispensary infrastructure serving UK medical-cannabis patients.',
        commercialPosition: 'Adds patient acquisition and dispensing to Tilray downstream control.',
        state: 'verified',
        sourceIds: ['tilray-lyphe'],
      },
      {
        id: 'health-canada',
        name: 'Health Canada',
        role: 'regulator',
        jurisdiction: 'Canada',
        ownership: 'Canadian federal authority',
        accessPosture: 'regulator',
        licenceOrFacility: 'Federal cannabis licensing and medical/scientific export controls.',
        commercialPosition: 'Upstream regulatory gate for Canadian cultivation/processing/export activity.',
        state: 'verified',
        sourceIds: ['health-canada-licensing'],
      },
    ],
    ownershipChanges: [
      {
        entity: 'Lyphe Group',
        change: 'Acquired by Tilray, adding UK clinic and dispensary infrastructure.',
        effectiveDate: '2026-04-15',
        state: 'verified',
        commercialMeaning:
          'Tilray expanded from supply into direct patient-facing access in the UK, increasing vertical integration.',
        sourceIds: ['tilray-lyphe'],
      },
    ],
    regulators: [
      {
        name: 'Health Canada',
        jurisdiction: 'Canada',
        remit: 'Cannabis cultivation/processing licensing and controlled international export permissions.',
        sourceIds: ['health-canada-licensing'],
      },
      {
        name: 'INFARMED',
        jurisdiction: 'Portugal',
        remit: 'Portuguese medicines regulator and manufacturing authorisation / EU-GMP oversight relevant to Cantanhede.',
        sourceIds: ['infarmed-tilray'],
      },
      {
        name: 'BfArM / German medicines authorities',
        jurisdiction: 'Germany',
        remit: 'German medical-cannabis import/handling and pharmaceutical-market controls.',
        sourceIds: ['tilray-cc-pharma-2'],
      },
    ],
    likelyWinners: [
      {
        label: 'Tilray-controlled production and distribution assets',
        rationale:
          'Additional capacity becomes more commercially valuable because Tilray also owns or controls downstream access in Germany and the UK.',
        state: 'inference',
      },
      {
        label: 'Pharmacy-access partners integrated into Tilray distribution',
        rationale:
          'More Tilray volume can increase throughput and portfolio activity across established pharmacy/logistics channels.',
        state: 'inference',
      },
    ],
    likelyLosers: [
      {
        label: 'Commodity suppliers relying on Tilray-controlled channels',
        rationale:
          'Tilray has greater incentive and capability to fill its own downstream network with internally controlled supply.',
        state: 'inference',
      },
    ],
    commercialOpenings: [
      {
        title: 'Exploit the pre-certification window for competing EU-GMP supply',
        priority: 'highest',
        targetCounterparties: ['Independent German importers', 'Independent UK importers', 'EU-GMP producers'],
        rationale:
          'Tilray has announced the Quebec EU-GMP target but the August release does not establish it as already certified. Existing qualified suppliers can use that interval to lock in recurring independent routes.',
        evidenceBoundary:
          'Treat the Quebec certification as a target until an authoritative EU-GMP certificate or regulator listing is available.',
      },
      {
        title: 'Compete on differentiated, dependable supply rather than nominal tonnes',
        priority: 'high',
        targetCounterparties: ['German importers', 'UK importers', 'European pharmacy-facing distributors'],
        rationale:
          'Integrated competitors are difficult to beat on sheer channel control; differentiated genetics, repeatable quality, landed economics and service reliability remain more defensible entry levers.',
        evidenceBoundary:
          'This is a commercial strategy inference, not a claim that any named importer is currently buying a particular competing SKU.',
      },
    ],
    nextTriggers: [
      {
        title: 'Quebec EU-GMP certification is formally achieved',
        condition:
          'A regulator, certificate database or Tilray filing confirms EU-GMP status for the Quebec cultivation operation referenced in the capacity announcement.',
        whyItMatters:
          'This would materially reduce friction for routing more Tilray-controlled Canadian supply into European pharmaceutical channels.',
        sourceIds: ['tilray-capacity-release', 'infarmed-tilray'],
      },
      {
        title: 'Capacity becomes demonstrated shipment/revenue throughput',
        condition:
          'Tilray reporting shows materially higher international medical-cannabis shipment volume, utilisation or revenue tied to the added capacity.',
        whyItMatters:
          'Distinguishes nominal installed capacity from commercially absorbed production.',
        sourceIds: ['tilray-capacity-release'],
      },
    ],
    sources: [
      {
        id: 'tilray-capacity-release',
        label: 'Tilray — global medical cannabis production increase',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-strengthens-global-medical-cannabis-leadership-major',
        kind: 'company',
        jurisdiction: 'Global',
      },
      {
        id: 'tilray-masson-angers',
        label: 'Tilray — Masson-Angers cultivation update',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-shifts-cultivation-its-flagship-canadian-cannabis-brand',
        kind: 'company',
        jurisdiction: 'Canada',
        note: 'Supports identification of a significant Quebec Tilray cultivation operation; does not by itself prove the full 30-tonne increment is attributable to that site.',
      },
      {
        id: 'infarmed-tilray',
        label: 'INFARMED — authorised pharmaceutical manufacturing entities',
        url: 'https://www.infarmed.pt/documents/15786/1672954/Lista%2Bde%2Bentidades%2Bautorizadas%2Ba%2Bfabricar%2Bmedicamentos%2Bde%2Buso%2Bhumano%2C%2Bmedicamentos%2Bexperimentais%2C%2Bsubst%C3%A2ncias%2Bativas%2Be%2BLaborat%C3%B3rios%2Bautorizados%2Ba%2Befetuarem%2Bo%2Bcontrolo%2Bde%2Bqualidade%2Bde%2Bmedicamentos_Atualizado%2Ba%2B11-07-2025/e31b6d8d-4c64-b459-66fe-2e1494391be6',
        kind: 'regulator',
        jurisdiction: 'Portugal',
      },
      {
        id: 'tilray-arx',
        label: 'Tilray — ARX German-grown medical cannabis launch',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-medical-germany-launches-arxtm-new-premium-medical',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'tilray-cc-pharma-2',
        label: 'Tilray — CC Pharma / 14U Pharma / Alliance Healthcare strategic cooperation',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-medical-cc-pharma-and-14u-pharma-announce-strategic/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
      {
        id: 'tilray-lyphe',
        label: 'Tilray — Lyphe Group acquisition',
        url: 'https://tilray.gcs-web.com/news-releases/news-release-details/tilray-brands-accelerates-next-phase-global-growth-and-market/',
        kind: 'company',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'health-canada-licensing',
        label: 'Health Canada — cannabis licensing summary',
        url: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/industry-licensees-applicants/licensing-summary.html',
        kind: 'regulator',
        jurisdiction: 'Canada',
      },
    ],
  },
  {
    id: 'ci-aurora-internode-hap-2026-08-19',
    slug: 'aurora-internode-hap-acquisition',
    title: 'Aurora acquires UK importer Internode Pharma and HAP Pharma',
    eventDate: '2026-08-19',
    asOf: '2026-08-21',
    jurisdictions: ['United Kingdom', 'Canada', 'Germany'],
    eventClass: 'material_advancement',
    thesis:
      'Aurora is converting a UK import/distribution and pharmacy pathway into a controlled downstream channel. Competing producers should therefore value independently licensed UK gateways more highly, while also monitoring the unresolved Curaleaf bid because it could combine additional European production and distribution assets under one group.',
    verifiedFacts: [
      {
        id: 'aurora-acquisition',
        state: 'verified',
        statement:
          'Aurora announced that a wholly owned subsidiary indirectly acquired 100% of Internode Pharma Limited and HAP Pharma Limited for £2.1 million cash, subject to post-closing conditions.',
        sourceIds: ['aurora-acquisition-release'],
      },
      {
        id: 'internode-wda',
        state: 'verified',
        statement:
          'Internode Pharma Limited is an active UK pharmaceutical wholesaler and holds MHRA WDA(H) 58825 for its Oldbury operating site.',
        sourceIds: ['internode-companies-house', 'internode-mhra'],
      },
      {
        id: 'internode-psc-change',
        state: 'verified',
        statement:
          'Companies House filings show pre-close changes to Internode significant-control disclosures in July 2026, including cessation of prior PSC positions and a subsequent filing stating no registrable PSC.',
        sourceIds: ['internode-companies-house'],
      },
      {
        id: 'hap-ownership-filings',
        state: 'verified',
        statement:
          'HAP Pharma Limited Companies House filings show changes to significant-control positions immediately before Aurora announced the acquisition.',
        sourceIds: ['hap-companies-house'],
      },
      {
        id: 'aurora-curaleaf-bid',
        state: 'verified',
        statement:
          'Aurora is also subject to an unsolicited Curaleaf takeover bid; Aurora formed an independent special committee and told shareholders not to take action pending review.',
        sourceIds: ['aurora-curaleaf-response'],
      },
    ],
    dataQualityNotes: [
      {
        state: 'unresolved',
        title: 'HAP pharmacy registration requires independent registry resolution',
        detail:
          'Aurora describes HAP Pharma as a licensed virtual pharmacy, but the exact current GPhC premises registration / trading-name mapping was not independently resolved in the source set used for this pathway.',
        decisionRule:
          'Display HAP as Aurora-described licensed pharmacy infrastructure, but do not assert a specific GPhC registration number until independently matched.',
        sourceIds: ['aurora-acquisition-release', 'hap-companies-house'],
      },
      {
        state: 'unresolved',
        title: 'Aurora acquisition vehicle is not yet cleanly resolved in Companies House ownership display',
        detail:
          'Public Companies House records reviewed for Internode/HAP do not yet provide a simple, fully reconciled post-close ownership chain naming Aurora’s specific acquisition vehicle.',
        decisionRule:
          'Treat Aurora’s acquisition announcement as authoritative for transaction completion while monitoring Companies House for the detailed post-close control chain.',
        sourceIds: ['aurora-acquisition-release', 'internode-companies-house', 'hap-companies-house'],
      },
    ],
    pathway: [
      {
        label: 'Aurora EU-GMP production',
        detail: 'Aurora-controlled Canadian/German production assets provide upstream medical-cannabis supply options.',
      },
      {
        label: 'UK import / wholesale',
        detail: 'Internode provides licensed pharmaceutical wholesale/import infrastructure.',
      },
      {
        label: 'Virtual pharmacy',
        detail: 'HAP is described by Aurora as licensed pharmacy infrastructure for patient fulfilment.',
      },
      {
        label: 'UK patient',
        detail: 'Aurora’s stated strategic rationale is greater control from cultivation through import/distribution to patient delivery.',
      },
    ],
    counterparties: [
      {
        id: 'aurora',
        name: 'Aurora Cannabis Inc.',
        role: 'parent_company',
        jurisdiction: 'Canada / Germany / United Kingdom',
        ownership: 'Public parent company; subject to an unsolicited Curaleaf takeover bid as of 2026-08-21.',
        accessPosture: 'competitor',
        licenceOrFacility: 'International medical-cannabis platform with EU-GMP-capable production assets and German operations.',
        commercialPosition: 'Increasing downstream control in the UK through Internode and HAP.',
        state: 'verified',
        sourceIds: ['aurora-acquisition-release', 'aurora-annual-info', 'aurora-curaleaf-response'],
      },
      {
        id: 'internode',
        name: 'Internode Pharma Limited',
        role: 'importer',
        jurisdiction: 'United Kingdom',
        ownership: 'Acquired by Aurora through a wholly owned subsidiary structure.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'MHRA WDA(H) 58825; Oldbury pharmaceutical wholesale operating site.',
        commercialPosition: 'Now a captive Aurora UK import/wholesale route rather than a neutral gateway for Aurora competitors.',
        state: 'verified',
        sourceIds: ['aurora-acquisition-release', 'internode-companies-house', 'internode-mhra'],
      },
      {
        id: 'hap',
        name: 'HAP Pharma Limited',
        role: 'pharmacy',
        jurisdiction: 'United Kingdom',
        ownership: 'Acquired by Aurora through the same transaction.',
        accessPosture: 'vertically_controlled',
        licenceOrFacility: 'Aurora-described licensed virtual pharmacy; exact current GPhC registration mapping remains unresolved in this record.',
        commercialPosition: 'Adds downstream dispensing/patient fulfilment to Aurora’s UK chain.',
        state: 'verified',
        sourceIds: ['aurora-acquisition-release', 'hap-companies-house'],
      },
      {
        id: 'ips-pharma',
        name: 'IPS Pharma',
        role: 'importer',
        jurisdiction: 'United Kingdom',
        ownership: 'Independent alternative in the sources reviewed.',
        accessPosture: 'open_gateway',
        licenceOrFacility: 'UK pharmaceutical importer/distributor with demonstrated medical-cannabis supplier partnerships.',
        commercialPosition: 'High-value independent alternative for foreign suppliers seeking UK route-to-market access.',
        state: 'verified',
        sourceIds: ['ips-puro'],
      },
      {
        id: 'cantourage-uk',
        name: 'Cantourage UK Ltd',
        role: 'importer',
        jurisdiction: 'United Kingdom',
        ownership: 'Cantourage Group company.',
        accessPosture: 'open_gateway',
        licenceOrFacility: 'MHRA wholesale distribution/GDP infrastructure supporting UK medical-cannabis supply.',
        commercialPosition: 'Independent-of-Aurora route with wider Cantourage pan-European sourcing platform.',
        state: 'verified',
        sourceIds: ['cantourage-uk-mhra', 'cantourage-uk-group'],
      },
      {
        id: 'target-healthcare',
        name: 'Target Healthcare Ltd',
        role: 'wholesaler',
        jurisdiction: 'United Kingdom',
        ownership: 'Independent alternative in the sources reviewed.',
        accessPosture: 'selective_gateway',
        licenceOrFacility: 'MHRA WDA(H) 43086 with broad pharmaceutical wholesale permissions.',
        commercialPosition: 'Regulatory infrastructure is relevant, but current cannabis supplier-onboarding appetite requires qualification.',
        state: 'verified',
        sourceIds: ['target-healthcare-mhra'],
      },
      {
        id: 'mhra',
        name: 'MHRA',
        role: 'regulator',
        jurisdiction: 'United Kingdom',
        ownership: 'UK medicines regulator',
        accessPosture: 'regulator',
        licenceOrFacility: 'Wholesale distribution and medicines manufacturing oversight.',
        commercialPosition: 'Core pharmaceutical licensing gate for UK importer/wholesaler infrastructure.',
        state: 'verified',
        sourceIds: ['internode-mhra', 'target-healthcare-mhra'],
      },
      {
        id: 'home-office',
        name: 'UK Home Office',
        role: 'regulator',
        jurisdiction: 'United Kingdom',
        ownership: 'UK government department',
        accessPosture: 'regulator',
        licenceOrFacility: 'Controlled-drug domestic licences and shipment-specific import/export permissions.',
        commercialPosition: 'Controlled-drug licensing gate for CBPM movement and possession/supply as applicable.',
        state: 'verified',
        sourceIds: ['uk-home-office-controlled-drugs'],
      },
    ],
    ownershipChanges: [
      {
        entity: 'Internode Pharma Limited',
        change: 'Aurora acquired 100% through a wholly owned subsidiary structure.',
        effectiveDate: '2026-08-19',
        state: 'verified',
        commercialMeaning:
          'A UK import/wholesale route moved from independent ownership into Aurora’s vertically controlled medical-cannabis chain.',
        sourceIds: ['aurora-acquisition-release'],
      },
      {
        entity: 'HAP Pharma Limited',
        change: 'Aurora acquired 100% through the same transaction.',
        effectiveDate: '2026-08-19',
        state: 'verified',
        commercialMeaning:
          'Aurora added downstream pharmacy/patient-fulfilment capability to its UK pathway.',
        sourceIds: ['aurora-acquisition-release'],
      },
      {
        entity: 'Aurora Cannabis Inc.',
        change: 'Subject to an unsolicited takeover bid from Curaleaf; outcome unresolved.',
        effectiveDate: '2026-08-18',
        state: 'verified',
        commercialMeaning:
          'If completed, Curaleaf could combine Four 20’s German distribution with Aurora production and the newly acquired UK channel, materially increasing European vertical integration.',
        sourceIds: ['aurora-curaleaf-response', 'curaleaf-four20-aurora'],
      },
    ],
    regulators: [
      {
        name: 'MHRA',
        jurisdiction: 'United Kingdom',
        remit: 'Pharmaceutical wholesale/manufacturing authorisations and GDP/GMP oversight.',
        sourceIds: ['internode-mhra', 'target-healthcare-mhra'],
      },
      {
        name: 'UK Home Office',
        jurisdiction: 'United Kingdom',
        remit: 'Controlled-drug licensing and import/export permissions for CBPMs as applicable.',
        sourceIds: ['uk-home-office-controlled-drugs'],
      },
      {
        name: 'General Pharmaceutical Council',
        jurisdiction: 'Great Britain',
        remit: 'Pharmacy premises and pharmacy-professional regulation; exact HAP registration mapping remains to be resolved.',
        sourceIds: ['aurora-acquisition-release'],
      },
    ],
    likelyWinners: [
      {
        label: 'Aurora’s integrated UK medical-cannabis platform',
        rationale:
          'Owning import/wholesale and pharmacy infrastructure can reduce external distribution friction and capture more downstream economics.',
        state: 'inference',
      },
      {
        label: 'Independent UK gateways with proven third-party supplier appetite',
        rationale:
          'When a formerly independent route becomes captive, remaining neutral gateways become scarcer and therefore strategically more valuable to competing producers.',
        state: 'inference',
      },
    ],
    likelyLosers: [
      {
        label: 'Independent intermediaries previously used for Aurora UK routing',
        rationale:
          'Aurora’s stated rationale is greater control of its own route to patients, which can displace third-party intermediary economics over time.',
        state: 'inference',
      },
    ],
    commercialOpenings: [
      {
        title: 'Qualify independent UK import/distribution routes now',
        priority: 'highest',
        targetCounterparties: ['IPS Pharma', 'Cantourage UK Ltd', 'Target Healthcare Ltd'],
        rationale:
          'Internode/HAP should now be treated as Aurora-controlled. Competing producers need independent UK routes that are not structurally tied to Aurora supply.',
        evidenceBoundary:
          'IPS and Cantourage show demonstrated cannabis sourcing/distribution activity. Target Healthcare has relevant licence infrastructure, but current supplier appetite must be qualified.',
      },
      {
        title: 'Monitor Curaleaf/Aurora as a European concentration event',
        priority: 'high',
        targetCounterparties: ['Aurora Cannabis Inc.', 'Curaleaf Holdings', 'Four 20 Pharma GmbH'],
        rationale:
          'A completed Curaleaf takeover could combine additional upstream EU-GMP assets with German and UK downstream infrastructure.',
        evidenceBoundary:
          'The bid is live and unresolved; model the integrated Curaleaf/Aurora chain as a scenario, not as current ownership.',
      },
    ],
    nextTriggers: [
      {
        title: 'Aurora board / special committee responds formally to Curaleaf bid',
        condition:
          'Aurora issues its formal recommendation, directors’ circular or another definitive transaction response.',
        whyItMatters:
          'Changes the probability of a major European vertical-integration event involving Aurora assets.',
        sourceIds: ['aurora-curaleaf-response'],
      },
      {
        title: 'Companies House resolves post-close Internode/HAP control chain',
        condition:
          'New PSC, shareholding, confirmation-statement or officer filings identify Aurora’s post-close acquisition vehicle/control structure.',
        whyItMatters:
          'Provides durable registry evidence for ownership and may expose additional acquisition entities or governance changes.',
        sourceIds: ['internode-companies-house', 'hap-companies-house'],
      },
      {
        title: 'HAP pharmacy registration is independently matched',
        condition:
          'A current GPhC premises record is matched to HAP Pharma or its trading pharmacy name.',
        whyItMatters:
          'Closes the main licence-resolution gap in Aurora’s stated UK route-to-patient chain.',
        sourceIds: ['aurora-acquisition-release'],
      },
      {
        title: 'Aurora reports first material operating contribution from Internode/HAP',
        condition:
          'Aurora discloses shipment, revenue, patient, gross-margin or EBITDA contribution tied to the acquired UK businesses.',
        whyItMatters:
          'Tests whether the strategic downstream-control thesis is translating into commercial throughput.',
        sourceIds: ['aurora-acquisition-release'],
      },
    ],
    sources: [
      {
        id: 'aurora-acquisition-release',
        label: 'Aurora — acquisition of Internode Pharma and HAP Pharma',
        url: 'https://www.prnewswire.com/news-releases/aurora-cannabis-furthers-global-medical-cannabis-growth-with-accretive-acquisition-of-internode-pharma-limited-and-hap-pharma-limited-expanding-distribution-access-to-the-uk-medical-cannabis-market-302855564.html',
        kind: 'company',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'aurora-annual-info',
        label: 'Aurora — 2026 annual information form',
        url: 'https://www.sec.gov/Archives/edgar/data/1683541/000162828026042364/a9972026annualinformatio.htm',
        kind: 'filing',
        jurisdiction: 'Canada / Germany',
      },
      {
        id: 'internode-companies-house',
        label: 'Companies House — Internode Pharma Limited (15225062)',
        url: 'https://find-and-update.company-information.service.gov.uk/company/15225062',
        kind: 'registry',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'hap-companies-house',
        label: 'Companies House — HAP Pharma Limited (12574373)',
        url: 'https://find-and-update.company-information.service.gov.uk/company/12574373',
        kind: 'registry',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'internode-mhra',
        label: 'MHRA — Internode Pharma WDA(H) 58825',
        url: 'https://cms.mhra.gov.uk/',
        kind: 'regulator',
        jurisdiction: 'United Kingdom',
        note: 'MHRA registry record for WDA(H) 58825 / Internode Pharma Limited, Oldbury.',
      },
      {
        id: 'uk-home-office-controlled-drugs',
        label: 'UK Home Office — controlled drugs domestic licences',
        url: 'https://www.gov.uk/guidance/controlled-drugs-domestic-licences',
        kind: 'regulator',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'ips-puro',
        label: 'IPS Pharma — Puro cannabis UK supply agreement / first delivery',
        url: 'https://ips-pharma.com/ips-pharma-puro-cannabis-deal-first-uk-delivery/',
        kind: 'company',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'cantourage-uk-mhra',
        label: 'MHRA — Cantourage UK wholesale distribution authorisation',
        url: 'https://cms.mhra.gov.uk/mhra/wda?order=field_wda_date&page=144&sort=asc%2F1000',
        kind: 'regulator',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'cantourage-uk-group',
        label: 'Cantourage — European sourcing/distribution platform',
        url: 'https://www.cantourage.com/en',
        kind: 'company',
        jurisdiction: 'Europe',
      },
      {
        id: 'target-healthcare-mhra',
        label: 'MHRA — Target Healthcare WDA(H) 43086',
        url: 'https://cms.mhra.gov.uk/index.php/mhra/wda/uk-wdah-43086',
        kind: 'regulator',
        jurisdiction: 'United Kingdom',
      },
      {
        id: 'aurora-curaleaf-response',
        label: 'Aurora — response to unsolicited Curaleaf takeover bid',
        url: 'https://www.prnewswire.com/news-releases/aurora-cannabis-inc-urges-shareholders-to-take-no-action-at-this-time-in-respect-to-the-unsolicited-take-over-bid-by-curaleaf-holdings-inc-302854811.html',
        kind: 'company',
        jurisdiction: 'Canada',
      },
      {
        id: 'curaleaf-four20-aurora',
        label: 'Curaleaf International — full acquisition of Four 20 Pharma',
        url: 'https://curaleafinternational.com/curaleaf-has-announced-the-completion-of-the-full-acquisition-of-four-20-pharma-a-fully-eu-gmp-gdp-licensed-german-producer-and-distributor-of-medical-cannabis/',
        kind: 'company',
        jurisdiction: 'Germany',
      },
    ],
  },
]

export const counterpartyIntelligenceSourceIndex = new Map(
  counterpartyIntelligencePathways.flatMap(pathway => pathway.sources).map(source => [source.id, source]),
)

export function getCounterpartyIntelligencePathway(slug: string): CounterpartyIntelligencePathway | undefined {
  return counterpartyIntelligencePathways.find(pathway => pathway.slug === slug)
}
