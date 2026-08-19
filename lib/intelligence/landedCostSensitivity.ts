/**
 * Landed-cost sensitivity and explicit assumptions — orientation only.
 */

import {
  calcLandedCost,
  EXPORTER_ORIGINS,
  DESTINATION_MARKETS,
  FREIGHT_CORRIDORS,
  type LandedProductType,
  type LandedCostResult,
} from '@/components/dashboard/data/landedCostData'

export type SensitivityScenario = {
  id: string
  label: string
  description: string
  totalLandedPerKg: { low: number; high: number }
  deltaVsBaseMidPct: number | null
}

export type LandedAssumptions = {
  currency: 'USD'
  dutyRatePct: number
  dutyBasis: string
  freightSource: 'corridor_row' | 'default_band'
  transitDays: number | null
  fixedCostsCalledOut: string[]
  modelLimits: string[]
}

function mid(r: { low: number; high: number }): number {
  return (r.low + r.high) / 2
}

function scaleRange(r: { low: number; high: number }, factor: number) {
  return { low: r.low * factor, high: r.high * factor }
}

export function buildLandedAssumptions(
  origin: string,
  destination: string,
  product: LandedProductType,
  result: LandedCostResult,
): LandedAssumptions {
  const dest = DESTINATION_MARKETS.find((d) => d.iso2 === destination)
  const corridor = FREIGHT_CORRIDORS.find(
    (c) => c.originIso2 === origin && c.destIso2 === destination,
  )
  const dutyRatePct = dest?.dutyRatePct[product] ?? 0

  return {
    currency: 'USD',
    dutyRatePct,
    dutyBasis:
      dutyRatePct > 0
        ? `Model applies ${dutyRatePct}% on production cost mid-band only (not full CIF). Confirm HS code with broker.`
        : 'Reference table shows 0% duty for this product class at this destination — still confirm HS classification.',
    freightSource: result.corridorFound ? 'corridor_row' : 'default_band',
    transitDays: corridor?.transitDays ?? null,
    fixedCostsCalledOut: [
      'Export permit (per shipment)',
      'Export documentation fixed overhead',
      'Import permit (per shipment unless annual)',
      'Customs clearance',
      'Batch testing (amortised by volume)',
    ],
    modelLimits: [
      'Not a commercial quote; bands are orientation reference data.',
      'No FX path — all figures already expressed in USD reference terms.',
      'No insurance, demurrage, or storage beyond GDP distribution per-kg stub.',
      'Wholesale targets are market orientation, not guaranteed sell prices.',
    ],
  }
}

export function buildSensitivityScenarios(
  origin: string,
  destination: string,
  product: LandedProductType,
  volumeKg: number,
  base: LandedCostResult,
): SensitivityScenario[] {
  if (!base.available) return []

  const baseMid = mid(base.totalLandedPerKg)

  const freightUp = calcLandedCost(origin, destination, product, volumeKg)
  // Approximate freight ±20% by adjusting totals from base components
  const freightLowBand = {
    low: base.totalLandedPerKg.low - base.freightPerKg.low * 0.2,
    high: base.totalLandedPerKg.high - base.freightPerKg.high * 0.2,
  }
  const freightHighBand = {
    low: base.totalLandedPerKg.low + base.freightPerKg.low * 0.2,
    high: base.totalLandedPerKg.high + base.freightPerKg.high * 0.2,
  }

  const volHalf = calcLandedCost(origin, destination, product, Math.max(1, volumeKg / 2))
  const volDouble = calcLandedCost(origin, destination, product, Math.min(5000, volumeKg * 2))

  const prodUp = {
    low: base.totalLandedPerKg.low + base.productionCostPerKg.low * 0.1,
    high: base.totalLandedPerKg.high + base.productionCostPerKg.high * 0.1,
  }

  const scenarios: SensitivityScenario[] = [
    {
      id: 'base',
      label: 'Base case',
      description: `${volumeKg} kg · published reference bands`,
      totalLandedPerKg: base.totalLandedPerKg,
      deltaVsBaseMidPct: 0,
    },
    {
      id: 'freight-down',
      label: 'Freight −20%',
      description: 'Air freight band reduced 20% (surcharge unchanged)',
      totalLandedPerKg: freightLowBand,
      deltaVsBaseMidPct: baseMid ? ((mid(freightLowBand) - baseMid) / baseMid) * 100 : null,
    },
    {
      id: 'freight-up',
      label: 'Freight +20%',
      description: 'Air freight band increased 20%',
      totalLandedPerKg: freightHighBand,
      deltaVsBaseMidPct: baseMid ? ((mid(freightHighBand) - baseMid) / baseMid) * 100 : null,
    },
    {
      id: 'vol-half',
      label: `Volume ${Math.max(1, Math.round(volumeKg / 2))} kg`,
      description: 'Half volume — fixed costs amortise less favourably',
      totalLandedPerKg: volHalf.totalLandedPerKg,
      deltaVsBaseMidPct: baseMid
        ? ((mid(volHalf.totalLandedPerKg) - baseMid) / baseMid) * 100
        : null,
    },
    {
      id: 'vol-double',
      label: `Volume ${Math.min(5000, volumeKg * 2)} kg`,
      description: 'Double volume — fixed costs spread further',
      totalLandedPerKg: volDouble.totalLandedPerKg,
      deltaVsBaseMidPct: baseMid
        ? ((mid(volDouble.totalLandedPerKg) - baseMid) / baseMid) * 100
        : null,
    },
    {
      id: 'prod-up',
      label: 'Production +10%',
      description: 'Ex-works production band stressed +10%',
      totalLandedPerKg: prodUp,
      deltaVsBaseMidPct: baseMid ? ((mid(prodUp) - baseMid) / baseMid) * 100 : null,
    },
  ]

  // silence unused if tree-shaken
  void freightUp
  void scaleRange
  void EXPORTER_ORIGINS

  return scenarios
}
