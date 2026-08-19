/**
 * Corridor depth layer — decision-grade structure on top of playbook merge.
 * Failure modes, workstreams, and EU GMP recognition are orientation patterns — not authority advice.
 */

import type { ProductClass } from './tradeCorridors'
import {
  buildGmpRecognition,
  type GmpRecognitionProfile,
} from './gmpRecognition'

export type FailureMode = {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  where: 'export' | 'import' | 'logistics' | 'commercial' | 'quality'
  pattern: string
  mitigation: string
}

export type Workstream = {
  id: string
  name: string
  side: 'export' | 'import' | 'parallel'
  canRunInParallelWith: string[]
  description: string
}

export type OpenQuestion = {
  id: string
  question: string
  whyItMatters: string
}

export type ProductDocDelta = {
  id: string
  side: 'export' | 'import'
  label: string
  required: boolean
  notes?: string
}

export type CorridorDepthBundle = {
  workstreams: Workstream[]
  failureModes: FailureMode[]
  productDocDeltas: ProductDocDelta[]
  openQuestions: OpenQuestion[]
  criticalPathNarrative: string
  gmpRecognition: GmpRecognitionProfile
}

const GENERIC_FAILURES: FailureMode[] = [
  {
    id: 'gmp-mismatch',
    title: 'GMP recognition gap',
    severity: 'high',
    where: 'quality',
    pattern:
      'Export-site certificate is valid domestically but not accepted as equivalent by the destination competent authority or notified body.',
    mitigation:
      'Map recognition pathway before scheduling audits; treat destination GMP expectation as the design target, not a later add-on.',
  },
  {
    id: 'mra-scope-assumed',
    title: 'MRA / CETA scope assumed for cannabis SKU',
    severity: 'high',
    where: 'quality',
    pattern:
      'Teams treat “origin has an EU MRA/CETA protocol” as automatic EU-GMP coverage for a specific cannabis dosage form without checking operational product scope and certificate issuer.',
    mitigation:
      'Verify SKU classification, MRA annex scope, and current site certificate (e.g. EudraGMDP) before relying on mutual recognition.',
  },
  {
    id: 'permit-clock-desync',
    title: 'Permit clocks out of sync',
    severity: 'high',
    where: 'import',
    pattern:
      'Import permit validity window expires before export release or freight booking; shipment slips a full permit cycle.',
    mitigation:
      'Align application order and validity windows; build buffer between permit issue and earliest ship date.',
  },
  {
    id: 'coa-spec-drift',
    title: 'COA / specification drift',
    severity: 'high',
    where: 'quality',
    pattern:
      'Batch analytics meet origin release specs but fail destination monograph, impurity limits, or method expectations.',
    mitigation:
      'Lock destination specification and methods into the commercial quality agreement before production allocation.',
  },
  {
    id: 'transport-narcotics',
    title: 'Controlled transport documentation gap',
    severity: 'medium',
    where: 'logistics',
    pattern:
      'Commercial air waybill is booked without matching narcotics transport / chain-of-custody authorisations for every leg.',
    mitigation:
      'Treat transport permits as a separate workstream from import/export product permits; verify each carrier leg.',
  },
  {
    id: 'importer-auth',
    title: 'Importer authorisation incomplete',
    severity: 'high',
    where: 'import',
    pattern:
      'Product permit is granted but the named importer lacks wholesale / controlled-substance storage authorisation for the SKU class.',
    mitigation:
      'Confirm importer licence scope (product class, storage, GDP) before finalising the commercial party on the permit.',
  },
  {
    id: 'commercial-volume',
    title: 'Economics break at planned volume',
    severity: 'medium',
    where: 'commercial',
    pattern:
      'Fixed permit, testing, and security costs dominate at trial volumes; margin only appears above a higher batch size.',
    mitigation:
      'Run landed-cost sensitivity before locking trial size; prefer fewer larger batches when fixed costs are high.',
  },
]

const CORRIDOR_FAILURE_EXTRAS: Record<string, FailureMode[]> = {
  'CA-DE': [
    {
      id: 'ca-de-eugmp',
      title: 'EU-GMP scoped too late',
      severity: 'high',
      where: 'quality',
      pattern:
        'Canadian site audited only to domestic expectations; BfArM pathway still expects EU-GMP-grade evidence.',
      mitigation:
        'Scope the manufacturing-site audit as EU-GMP from the outset when Germany is the primary target market.',
    },
    {
      id: 'ca-de-ceta',
      title: 'CETA treated as cannabis free pass',
      severity: 'high',
      where: 'quality',
      pattern:
        'CETA GMP protocol for pharmaceuticals is assumed to remove EU-GMP inspection or import-testing needs for medical cannabis flower without product-scope confirmation.',
      mitigation:
        'Treat CETA as a possible inspection-reliance instrument for in-scope products only; still evidence EU-GMP certificate path for DE import practice.',
    },
  ],
  'CA-AU': [
    {
      id: 'ca-au-irradiation',
      title: 'Irradiation / treatment evidence gap',
      severity: 'high',
      where: 'import',
      pattern:
        'Shipment meets Canadian release but lacks treatment pathway evidence expected under Australian import practice.',
      mitigation:
        'Confirm treatment expectations with the importer quality unit before production allocation for AU.',
    },
  ],
  'PT-DE': [
    {
      id: 'pt-de-intra-eu',
      title: 'Intra-EU narcotics movement assumed free',
      severity: 'medium',
      where: 'logistics',
      pattern:
        'Teams assume free movement of goods removes narcotics transport formalities inside the EU.',
      mitigation:
        'Keep narcotics transport permits on the critical checklist even for PT→DE EU-GMP product.',
    },
  ],
  'IL-DE': [
    {
      id: 'il-de-acaa-scope',
      title: 'ACAA scope not checked for dosage form',
      severity: 'medium',
      where: 'quality',
      pattern:
        'Israel–EU ACAA alignment is assumed for every cannabis presentation without checking exclusions and certificate evidence.',
      mitigation:
        'Confirm product is inside ACAA operational coverage and that site evidence matches destination import expectations.',
    },
  ],
  'TH-AU': [
    {
      id: 'th-au-export-eligibility',
      title: 'Export eligibility re-check missed',
      severity: 'high',
      where: 'export',
      pattern:
        'Thai export rules or product-class eligibility change between LOI and ship date.',
      mitigation:
        'Re-confirm export eligibility immediately before each shipment plan, not only at annual diligence.',
    },
  ],
  'CO-DE': [
    {
      id: 'co-de-no-mra',
      title: 'No MRA path under-estimated',
      severity: 'high',
      where: 'quality',
      pattern:
        'Colombian GACP supply is contracted without a clear EU-GMP processing or NCA inspection path into Germany.',
      mitigation:
        'Lock EU-GMP processor or overseas NCA inspection plan before commercial volume commitments.',
    },
  ],
}

function productDocDeltas(product: ProductClass | 'any'): ProductDocDelta[] {
  if (product === 'any') return []
  const extras: ProductDocDelta[] = []
  if (product === 'flower') {
    extras.push({
      id: 'prod-flower-micro',
      side: 'export',
      label: 'Microbiology / moisture / foreign-matter panel aligned to destination flower monograph',
      required: true,
      notes: 'Product-class delta — confirm method set with destination quality unit.',
    })
    extras.push({
      id: 'prod-gacp',
      side: 'export',
      label: 'GACP cultivation evidence for flower / starting material upstream of EU-GMP processing',
      required: true,
      notes: 'Often required alongside EU-GMP manufacturing evidence for medical flower pathways.',
    })
  }
  if (product === 'extract' || product === 'finished_product') {
    extras.push({
      id: 'prod-extract-stability',
      side: 'export',
      label: 'Stability / shelf-life and container-closure summary for liquid or finished forms',
      required: true,
      notes: 'Often required beyond bulk flower packs; treat as class-specific until counsel confirms otherwise.',
    })
  }
  if (product === 'starting_material') {
    extras.push({
      id: 'prod-biomass-botanical',
      side: 'export',
      label: 'Botanical identity and processing history for starting material / biomass',
      required: true,
    })
  }
  extras.push({
    id: 'prod-class-label',
    side: 'import',
    label: `Destination classification confirmed for product class: ${product}`,
    required: true,
    notes: 'Schedule / HS / pharmaceutical vs herbal classification drives duty and permit form.',
  })
  extras.push({
    id: 'prod-gmp-cert',
    side: 'export',
    label: 'Current manufacturing-site GMP certificate issuer, scope, and date recorded',
    required: true,
    notes: 'Prefer EudraGMDP-visible EU-GMP evidence when supplying the EEA.',
  })
  return extras
}

function gmpOpenQuestions(gmp: GmpRecognitionProfile): OpenQuestion[] {
  return [
    {
      id: 'oq-gmp-framework',
      question: `Does this corridor’s quality path match framework “${gmp.label}”?`,
      whyItMatters: gmp.summary.slice(0, 180) + (gmp.summary.length > 180 ? '…' : ''),
    },
    {
      id: 'oq-gmp-path',
      question: 'Is the manufacturing site already holding destination-recognised GMP evidence?',
      whyItMatters: 'Usually the longest uncertainty on export-side critical path.',
    },
    {
      id: 'oq-mra-scope',
      question: 'If relying on an MRA/ACAA/CETA instrument, is this exact SKU inside operational product scope?',
      whyItMatters: 'Mutual recognition is annex- and authority-specific — not automatic for all cannabis presentations.',
    },
    {
      id: 'oq-importer-scope',
      question: 'Does the named importer’s licence cover this product class and storage condition?',
      whyItMatters: 'Permit grants fail late when the party on the form is out of scope.',
    },
    {
      id: 'oq-spec',
      question: 'Is the destination specification and analytical method set contractually locked?',
      whyItMatters: 'Prevents COA rejects after the batch is already produced.',
    },
    {
      id: 'oq-volume',
      question: 'Is trial volume large enough to amortise fixed permit and testing costs?',
      whyItMatters: 'Use landed-cost sensitivity before committing commercial sample size.',
    },
  ]
}

export function buildCorridorDepth(opts: {
  origin: string
  destination: string
  productClass: ProductClass | 'any'
  exportWeeks: number
  importWeeks: number
}): CorridorDepthBundle {
  const key = `${opts.origin}-${opts.destination}`
  const gmpRecognition = buildGmpRecognition(opts.origin, opts.destination)

  const workstreams: Workstream[] = [
    {
      id: 'ws-export-licence',
      name: 'Origin export / narcotics licence',
      side: 'export',
      canRunInParallelWith: ['ws-import-permit', 'ws-gmp', 'ws-quality-agreement'],
      description: 'Competent-authority export authorisation and supporting corporate evidence.',
    },
    {
      id: 'ws-gmp',
      name: 'Site GMP / recognition evidence',
      side: 'export',
      canRunInParallelWith: ['ws-export-licence', 'ws-import-permit'],
      description: `Audit and certificate path aimed at destination recognition (${gmpRecognition.label}).`,
    },
    {
      id: 'ws-import-permit',
      name: 'Destination import / narcotics permit',
      side: 'import',
      canRunInParallelWith: ['ws-export-licence', 'ws-gmp', 'ws-quality-agreement'],
      description: 'Importer-side permit and named-party alignment with commercial contract.',
    },
    {
      id: 'ws-quality-agreement',
      name: 'Quality agreement & specification lock',
      side: 'parallel',
      canRunInParallelWith: ['ws-export-licence', 'ws-import-permit', 'ws-gmp'],
      description: 'COA methods, release limits, deviations, and change control between parties.',
    },
    {
      id: 'ws-transport',
      name: 'Controlled transport & GDP legs',
      side: 'parallel',
      canRunInParallelWith: ['ws-import-permit'],
      description: 'Carrier selection, narcotics transport paperwork, temperature and security plan.',
    },
  ]

  const sequential = opts.exportWeeks + opts.importWeeks
  const parallelHeuristic = Math.max(opts.exportWeeks, opts.importWeeks)
  const criticalPathNarrative = [
    `If export and import workstreams are run strictly back-to-back, playbook step weeks sum to ~${sequential} weeks.`,
    `If origin GMP/export preparation and destination import preparation run in parallel, a planning heuristic is closer to ~${parallelHeuristic} weeks (max of the two sides) plus transport booking buffer.`,
    `GMP recognition posture for this pair: ${gmpRecognition.label}.`,
    'Playbook steps do not encode formal dependencies — treat this as orientation, not a Gantt from the competent authorities.',
  ].join(' ')

  return {
    workstreams,
    failureModes: [...GENERIC_FAILURES, ...(CORRIDOR_FAILURE_EXTRAS[key] ?? [])],
    productDocDeltas: productDocDeltas(opts.productClass),
    openQuestions: gmpOpenQuestions(gmpRecognition),
    criticalPathNarrative,
    gmpRecognition,
  }
}
