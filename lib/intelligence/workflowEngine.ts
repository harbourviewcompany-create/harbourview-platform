import 'server-only'
import { getPlaybook } from './jurisdictionPlaybooks'
import type { PlaybookStep, PlaybookRegulator } from './jurisdictionPlaybooks'

/**
 * Corridor Workflow Engine — prototype
 * ─────────────────────────────────────
 * Layer 9 of the Market Entry OS concept ("Workflow Engine — no dependency-graph
 * execution plan generator, doesn't exist yet") was the biggest gap between what
 * the North Star doc describes and what's actually built. This is a first,
 * intentionally narrow attempt at it — built on the jurisdiction_playbooks data
 * that already exists (steps/timeline/cost/regulators/pitfalls per country),
 * rather than the abandoned cannabis_intelligence schema, which was never
 * populated with real schema and would have been a much bigger lift for the
 * same first test.
 *
 * What it does: takes an origin (export side) and destination (import side)
 * country, and merges their two independent playbooks into one corridor-level
 * plan, instead of leaving a human to read both dossiers separately and do the
 * reconciliation themselves.
 *
 * What it deliberately does NOT do: infer step-level dependencies automatically.
 * jurisdiction_playbooks.steps has no "depends_on" field, so there's no honest
 * way to compute a real critical path yet — see criticalPathWeeksEstimate below
 * for the heuristic used instead, and CORRIDOR_NOTES for the one genuine
 * cross-jurisdiction linkage worth surfacing by hand for the corridor this was
 * built and tested against. Automating that detection generally is exactly the
 * kind of thing that would need the normalized cannabis_intelligence tables
 * (licence_types, legal_thresholds) rather than text-matching prose — worth
 * revisiting there if/when this proves out for more corridors.
 */

export type CorridorSide = 'export' | 'import'

export type CorridorStep = PlaybookStep & {
  side: CorridorSide
  country_iso2: string
  country_name: string
}

export type CorridorPlan = {
  origin: { iso2: string; name: string; difficulty: string }
  destination: { iso2: string; name: string; difficulty: string }
  steps: CorridorStep[]
  totalSequentialWeeks: number
  criticalPathWeeksEstimate: number
  estimatedCostRanges: { country_iso2: string; range: string | null }[]
  regulators: { country_iso2: string; regulators: PlaybookRegulator[] }[]
  risks: { country_iso2: string; pitfalls: string[] }[]
  notes: string[]
}

// Cross-jurisdiction insights that require actually reading both sides' legal
// text, not something a jsonb merge can surface on its own. Hand-curated per
// corridor pair as they're found — this is not meant to scale past a handful
// of entries; once it needs to, that's the signal to build real requirement
// matching against structured license/certification tables instead.
const CORRIDOR_NOTES: Record<string, string[]> = {
  'CA-DE': [
    'Canada\u2019s "Ensure GMP compliance under Cannabis Regulations" step and Germany\u2019s ' +
      '"Obtain EU-GMP certificate for manufacturing site" step are the same underlying audit, not ' +
      'two separate ones \u2014 Germany\u2019s BfArM import authorisation explicitly requires a GMP ' +
      'certificate "recognised by the relevant EU competent authority," so the Canadian facility audit ' +
      'should be scoped as an EU-GMP audit from the outset rather than redone for each market.',
  ],
}

function corridorKey(origin: string, destination: string): string {
  return `${origin.toUpperCase()}-${destination.toUpperCase()}`
}

export async function deriveCorridorPlan(
  originIso2: string,
  destinationIso2: string,
): Promise<CorridorPlan | null> {
  const origin = originIso2.trim().toUpperCase()
  const destination = destinationIso2.trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(origin) || !/^[A-Z]{2}$/.test(destination)) return null

  const [originPlaybook, destinationPlaybook] = await Promise.all([
    getPlaybook(origin),
    getPlaybook(destination),
  ])

  if (!originPlaybook || !destinationPlaybook) return null

  const exportSteps: CorridorStep[] = originPlaybook.steps.map((s) => ({
    ...s,
    side: 'export',
    country_iso2: origin,
    country_name: originPlaybook.country_name,
  }))
  const importSteps: CorridorStep[] = destinationPlaybook.steps.map((s) => ({
    ...s,
    side: 'import',
    country_iso2: destination,
    country_name: destinationPlaybook.country_name,
  }))

  const exportWeeks = exportSteps.reduce((acc, s) => acc + s.estimated_weeks, 0)
  const importWeeks = importSteps.reduce((acc, s) => acc + s.estimated_weeks, 0)

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
    // Export-side steps first, then import-side — each list keeps its own
    // internal order (that part IS reliable, it's authored as a sequence).
    // What's a heuristic is treating the two sides as parallelizable at all;
    // see criticalPathWeeksEstimate.
    steps: [...exportSteps, ...importSteps],
    totalSequentialWeeks: exportWeeks + importWeeks,
    // Heuristic, not a real critical-path computation: treats each side's
    // steps as sequential (same internal team usually runs them in order)
    // but assumes the two sides CAN run in parallel with each other, absent
    // any evidence otherwise. This will overstate speed wherever one side's
    // step is genuinely blocking on the other's output (e.g. Germany's BfArM
    // step needs the GMP cert Canada's step produces) \u2014 that's exactly
    // what CORRIDOR_NOTES exists to flag until dependencies are modeled for
    // real.
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
    notes: CORRIDOR_NOTES[corridorKey(origin, destination)] ?? [],
  }
}
