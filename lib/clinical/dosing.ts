/**
 * Versioned clinical dosing algorithms.
 * Outputs are decision-support starting points — not prescriptions.
 * Algorithm version MUST be stored on every clinical_calculations row.
 */

export const DOSING_ALGORITHM_VERSION = '2026.08.1' as const

export type WeightBasedCannabinoidInput = {
  weightKg: number
  /** mg/kg/day target for total cannabinoid starting dose */
  mgPerKgPerDay: number
  /** split across this many doses per day */
  dosesPerDay: number
  productThcPercent?: number | null
  productCbdPercent?: number | null
}

export type WeightBasedCannabinoidOutput = {
  totalMgPerDay: number
  mgPerDose: number
  dosesPerDay: number
  thcMgPerDay: number | null
  cbdMgPerDay: number | null
  cautions: string[]
  algorithmVersion: typeof DOSING_ALGORITHM_VERSION
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Conservative weight-based starting dose helper for medical cannabinoid products.
 * Does not encode jurisdiction product law — caller must check authority + formulary.
 */
export function computeWeightBasedCannabinoidDose(
  input: WeightBasedCannabinoidInput,
): WeightBasedCannabinoidOutput {
  const cautions: string[] = []

  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0 || input.weightKg > 400) {
    throw new Error('weightKg must be a positive number ≤ 400')
  }
  if (!Number.isFinite(input.mgPerKgPerDay) || input.mgPerKgPerDay <= 0 || input.mgPerKgPerDay > 50) {
    throw new Error('mgPerKgPerDay out of supported range (0–50)')
  }
  if (!Number.isInteger(input.dosesPerDay) || input.dosesPerDay < 1 || input.dosesPerDay > 8) {
    throw new Error('dosesPerDay must be an integer 1–8')
  }

  if (input.mgPerKgPerDay > 10) {
    cautions.push('High mg/kg/day relative to common starting ranges — confirm indication and titration plan.')
  }
  if (input.weightKg < 40) {
    cautions.push('Lower body weight — paediatric/adolescent protocols may apply; specialist input recommended.')
  }

  const totalMgPerDay = round1(input.weightKg * input.mgPerKgPerDay)
  const mgPerDose = round1(totalMgPerDay / input.dosesPerDay)

  let thcMgPerDay: number | null = null
  let cbdMgPerDay: number | null = null
  const thc = input.productThcPercent
  const cbd = input.productCbdPercent
  if (thc != null && cbd != null && thc + cbd > 0) {
    const ratio = thc / (thc + cbd)
    thcMgPerDay = round1(totalMgPerDay * ratio)
    cbdMgPerDay = round1(totalMgPerDay * (1 - ratio))
    if (thc >= 10) {
      cautions.push('Product THC ≥10% — monitor psychoactive effects and driving/safety advice.')
    }
  }

  cautions.push('Start low, go slow; reassess efficacy and adverse effects at each titration step.')

  return {
    totalMgPerDay,
    mgPerDose,
    dosesPerDay: input.dosesPerDay,
    thcMgPerDay,
    cbdMgPerDay,
    cautions,
    algorithmVersion: DOSING_ALGORITHM_VERSION,
  }
}

export const CALCULATOR_REGISTRY = {
  'cannabinoid.weight_based.v1': {
    key: 'cannabinoid.weight_based.v1' as const,
    title: 'Weight-based cannabinoid starting dose',
    version: DOSING_ALGORITHM_VERSION,
    compute: computeWeightBasedCannabinoidDose,
  },
} as const

export type CalculatorKey = keyof typeof CALCULATOR_REGISTRY
