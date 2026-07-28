/**
 * Versioned clinical dosing algorithms.
 * Outputs are decision-support starting points — not prescriptions.
 * Algorithm version MUST be stored on every clinical_calculations row.
 */

export const DOSING_ALGORITHM_VERSION = '2026.08.2' as const

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

/**
 * Hard ceiling for a *starting* dose. This is a conservative interim value,
 * not a clinically-validated maximum — it exists so the system fails closed
 * rather than silently accepting a value far outside normal starting-dose
 * ranges. MUST be reviewed and set by qualified clinical/legal review before
 * this calculator is used with any real patient. Do not raise this constant
 * without that review; if a real clinician needs a legitimate exception, that
 * is a jurisdiction/formulary decision, not a client-input decision.
 */
export const HARD_MAX_MG_PER_KG_PER_DAY = 15 as const

/** Starting-dose values above this are flagged for extra clinician attention but not blocked. */
export const CAUTION_MG_PER_KG_PER_DAY = 10 as const

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Conservative weight-based starting dose helper for medical cannabinoid products.
 * Does not encode jurisdiction product law — caller must check authority + formulary.
 * Does not encode jurisdiction-specific maximum dose limits — this is a known gap;
 * jurisdiction-specific ceilings should be layered on top of HARD_MAX_MG_PER_KG_PER_DAY
 * once each jurisdiction's formulary/legal limits are captured (see
 * docs/control/CLINICAL_WORKFLOWS.md, "Still application-layer" section).
 */
export function computeWeightBasedCannabinoidDose(
  input: WeightBasedCannabinoidInput,
): WeightBasedCannabinoidOutput {
  const cautions: string[] = []

  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0 || input.weightKg > 400) {
    throw new Error('weightKg must be a positive number ≤ 400')
  }
  if (!Number.isFinite(input.mgPerKgPerDay) || input.mgPerKgPerDay <= 0) {
    throw new Error('mgPerKgPerDay must be a positive number')
  }
  if (input.mgPerKgPerDay > HARD_MAX_MG_PER_KG_PER_DAY) {
    throw new Error(
      `mgPerKgPerDay (${input.mgPerKgPerDay}) exceeds the hard safety ceiling of ` +
        `${HARD_MAX_MG_PER_KG_PER_DAY} mg/kg/day for a starting dose. This ceiling is an ` +
        `interim safety bound pending clinical/legal review, not a clinical judgment call — ` +
        `it cannot be overridden from client input.`,
    )
  }
  if (!Number.isInteger(input.dosesPerDay) || input.dosesPerDay < 1 || input.dosesPerDay > 8) {
    throw new Error('dosesPerDay must be an integer 1–8')
  }

  if (input.mgPerKgPerDay > CAUTION_MG_PER_KG_PER_DAY) {
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
