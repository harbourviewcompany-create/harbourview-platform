import 'server-only'
import { getPlaybook } from './jurisdictionPlaybooks'
import type { PlaybookStep, PlaybookRegulator } from './jurisdictionPlaybooks'
import {
  TRADE_CORRIDORS,
  type ProductClass,
  type TradeCorridor,
} from './tradeCorridors'

/**
 * Corridor Workflow Engine — Execution Plan v1
 * ─────────────────────────────────────────────
 * Layer 9 of the Market Entry OS ("Workflow Engine"). Built on jurisdiction_playbooks
 * (steps/timeline/cost/regulators/pitfalls) rather than the abandoned cannabis_intelligence
 * schema. Merges origin + destination playbooks into one corridor-level plan.
 *
 * v1 additions (2026-08-18):
 * - product class awareness via TRADE_CORRIDORS
 * - documentation checklist stubs (export / import sides)
 * - confidence + freshness from playbook last_verified_at
 * - expanded hand-curated CORRIDOR_NOTES
 *
 * Still deliberately NOT automatic step-level dependency graphs — playbook steps have
 * no depends_on field. criticalPathWeeksEstimate remains a heuristic.
 */

export type CorridorSide = 'export' | 'import'

export type CorridorStep = PlaybookStep & {
  side: CorridorSide
  country_iso2: string
  country_name: string
}

export type DocChecklistItem = {
  id: string
  side: CorridorSide
  label: string
  required: boolean
  notes?: string
}

export type CorridorTrustMeta = {
  originVerifiedAt: string | null
  destinationVerifiedAt: string | null
  /** 0–1 heuristic from presence of verified dates + step coverage */
  confidence: number
  confidenceLabel: 'orientation' | 'partial' | 'reviewed'
  asOf: string
  disclaimer: string
}

export type CorridorPlan = {
  origin: { iso2: string; name: string; difficulty: string }
  destination: { iso2: string; name: string; difficulty: string }
  productClass: ProductClass | 'any'
  corridorRef: TradeCorridor | null
  steps: CorridorStep[]
  totalSequentialWeeks: number
  criticalPathWeeksEstimate: number
  estimatedCostRanges: { country_iso2: string; range: string | null }[]
  regulators: { country_iso2: string; regulators: PlaybookRegulator[] }[]
  risks: { country_iso2: string; pitfalls: string[] }[]
  documentationChecklist: DocChecklistItem[]
  notes: string[]
  trust: CorridorTrustMeta
}

const CORRIDOR_NOTES: Record<string, string[]> = {
  'CA-DE': [
    "Canada's GMP step under Cannabis Regulations and Germany's EU-GMP manufacturing-site requirement are the same underlying audit path — scope the Canadian facility audit as EU-GMP from the outset rather than redoing it for each EU market.",
    'BfArM narcotics import authorisation typically expects a recognised EU competent-authority GMP certificate; allow parallel preparation of Health Canada export licence paperwork while the audit window is scheduled.',
  ],
  'CA-AU': [
    'TGA ODC import permits and Health Canada export licences are independent clocks — start both early; neither is a substitute for the other.',
    'Narcotic Drugs Act 1967 pathways are product-class sensitive; finished products and extracts often face different evidence packs than bulk flower.',
  ],
  'PT-DE': [
    'Intra-EU movement still requires narcotics transport permits even when EU-GMP is already satisfied — do not treat free movement of goods as narcotics-free movement.',
  ],
  'NL-DE': [
    'Among tracked corridors this pair has the lowest structural friction, but OMC wholesale authorisation and narcotics transport paperwork remain mandatory.',
  ],
  'CO-DE': [
    'INVIMA + EU-GMP recognition and BfArM import timing often dominate the critical path; treat Colombian export readiness and German import readiness as parallel workstreams with a late merge on the import permit.',
  ],
}

const BASE_EXPORT_DOCS: DocChecklistItem[] = [
  {
    id: 'exp-licence',
    side: 'export',
    label: 'Export / narcotics export licence from origin competent authority',
    required: true,
  },
  {
    id: 'exp-gmp',
    side: 'export',
    label: 'Site GMP / EU-GMP (or destination-recognised equivalent) evidence pack',
    required: true,
  },
  {
    id: 'exp-coa',
    side: 'export',
    label: 'Batch COA / analytical dossier aligned to destination specification',
    required: true,
  },
  {
    id: 'exp-commercial',
    side: 'export',
    label: 'Commercial invoice, packing list, and transport chain-of-custody plan',
    required: true,
  },
]

const BASE_IMPORT_DOCS: DocChecklistItem[] = [
  {
    id: 'imp-permit',
    side: 'import',
    label: 'Import / narcotics import permit from destination competent authority',
    required: true,
  },
  {
    id: 'imp-importer-auth',
    side: 'import',
    label: 'Importer wholesale / controlled-substance authorisation on file',
    required: true,
  },
  {
    id: 'imp-release',
    side: 'import',
    label: 'Customs / controlled-goods release pathway documented',
    required: true,
  },
  {
    id: 'imp-quality',
    side: 'import',
    label: 'Receiving QC / GDP-aligned handling SOP referenced',
    required: false,
    notes: 'Orientation only — operator-specific SOPs are not published here.',
  },
]

function corridorKey(origin: string, destination: string): string {
  return `${origin.toUpperCase()}-${destination.toUpperCase()}`
}

function findCorridorRef(
  origin: string,
  destination: string,
  product: ProductClass | 'any',
): TradeCorridor | null {
  const match = TRADE_CORRIDORS.find(
    (c) => c.from === origin && c.to === destination,
  )
  if (!match) return null
  if (product !== 'any' && !match.productClasses.includes(product)) return null
  return match
}

function buildTrust(
  originVerifiedAt: string | null,
  destinationVerifiedAt: string | null,
  stepCount: number,
): CorridorTrustMeta {
  const hasOrigin = Boolean(originVerifiedAt)
  const hasDest = Boolean(destinationVerifiedAt)
  let confidence = 0.35
  if (hasOrigin) confidence += 0.2
  if (hasDest) confidence += 0.2
  if (stepCount >= 4) confidence += 0.15
  if (stepCount >= 8) confidence += 0.1
  confidence = Math.min(1, Math.round(confidence * 100) / 100)

  let confidenceLabel: CorridorTrustMeta['confidenceLabel'] = 'orientation'
  if (confidence >= 0.75) confidenceLabel = 'reviewed'
  else if (confidence >= 0.5) confidenceLabel = 'partial'

  return {
    originVerifiedAt,
    destinationVerifiedAt,
    confidence,
    confidenceLabel,
    asOf: new Date().toISOString().slice(0, 10),
    disclaimer:
      'Orientation-level corridor plan only. Harbourview does not publish operator identities, commercial terms, or private route analysis on this surface. Verify all requirements with competent authorities before acting.',
  }
}

export type DeriveCorridorPlanOptions = {
  productClass?: ProductClass | 'any'
}

export async function deriveCorridorPlan(
  originIso2: string,
  destinationIso2: string,
  options: DeriveCorridorPlanOptions = {},
): Promise<CorridorPlan | null> {
  const origin = originIso2.trim().toUpperCase()
  const destination = destinationIso2.trim().toUpperCase()
  const productClass = options.productClass ?? 'any'

  if (!/^[A-Z]{2}$/.test(origin) || !/^[A-Z]{2}$/.test(destination)) return null
  if (origin === destination) return null

  const [originPlaybook, destinationPlaybook] = await Promise.all([
    getPlaybook(origin),
    getPlaybook(destination),
  ])

  if (!originPlaybook || !destinationPlaybook) return null

  const exportSteps: CorridorStep[] = originPlaybook.steps.map((s) => ({
    ...s,
    side: 'export' as const,
    country_iso2: origin,
    country_name: originPlaybook.country_name,
  }))
  const importSteps: CorridorStep[] = destinationPlaybook.steps.map((s) => ({
    ...s,
    side: 'import' as const,
    country_iso2: destination,
    country_name: destinationPlaybook.country_name,
  }))

  const exportWeeks = exportSteps.reduce((acc, s) => acc + (s.estimated_weeks || 0), 0)
  const importWeeks = importSteps.reduce((acc, s) => acc + (s.estimated_weeks || 0), 0)
  const steps = [...exportSteps, ...importSteps]

  const corridorRef = findCorridorRef(origin, destination, productClass)

  return {
    origin: {
      iso2: origin,
      name: originPlaybook.country_name,
      difficulty: originPlaybook.difficulty,
    },
    destination: {
      iso2: destination,
      name: destinationPlaybook.country_name,
      difficulty: destinationPlaybook.difficulty,
    },
    productClass,
    corridorRef,
    steps,
    totalSequentialWeeks: exportWeeks + importWeeks,
    // Heuristic: sides treated as parallelizable unless CORRIDOR_NOTES say otherwise.
    criticalPathWeeksEstimate: Math.max(exportWeeks, importWeeks),
    estimatedCostRanges: [
      { country_iso2: origin, range: originPlaybook.estimated_cost_range },
      { country_iso2: destination, range: destinationPlaybook.estimated_cost_range },
    ],
    regulators: [
      { country_iso2: origin, regulators: originPlaybook.key_regulators },
      { country_iso2: destination, regulators: destinationPlaybook.key_regulators },
    ],
    risks: [
      { country_iso2: origin, pitfalls: originPlaybook.common_pitfalls },
      { country_iso2: destination, pitfalls: destinationPlaybook.common_pitfalls },
    ],
    documentationChecklist: [...BASE_EXPORT_DOCS, ...BASE_IMPORT_DOCS],
    notes: CORRIDOR_NOTES[corridorKey(origin, destination)] ?? [],
    trust: buildTrust(
      originPlaybook.last_verified_at,
      destinationPlaybook.last_verified_at,
      steps.length,
    ),
  }
}

/** List corridor pairs that have both a TRADE_CORRIDORS entry and can be planned when playbooks exist. */
export function listTrackedCorridorPairs(): { from: string; to: string; label: string }[] {
  return TRADE_CORRIDORS.map((c) => ({ from: c.from, to: c.to, label: c.label }))
}
