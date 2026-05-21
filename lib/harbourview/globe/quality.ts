import { GLOBE_QUALITY_BUDGETS } from '@/config/globe/quality-budgets'

export type GlobeQualityLevel = 'high' | 'medium' | 'low' | 'fallback'

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number
}

export type QualityProbe = {
  deviceMemoryGb?: number
  hardwareConcurrency?: number
  saveDataEnabled?: boolean
  capabilityFailure?: boolean
  forcedLowMemory?: boolean
}

const QUALITY_ORDER: GlobeQualityLevel[] = ['high', 'medium', 'low', 'fallback']

export function getInitialQuality(): GlobeQualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const nav = navigator as NavigatorWithMemory
  return resolveQualityTier({
    deviceMemoryGb: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    saveDataEnabled: (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  })
}

export function resolveQualityTier(probe: QualityProbe): GlobeQualityLevel {
  if (probe.capabilityFailure) return 'fallback'

  const deviceMemoryGb = probe.forcedLowMemory ? 2 : probe.deviceMemoryGb
  const hardwareConcurrency = probe.hardwareConcurrency

  for (const tier of QUALITY_ORDER) {
    const budget = GLOBE_QUALITY_BUDGETS[tier]
    const meetsMemory = deviceMemoryGb === undefined || deviceMemoryGb >= budget.minDeviceMemoryGb
    const meetsCpu = hardwareConcurrency === undefined || hardwareConcurrency >= budget.minHardwareConcurrency
    const saveDataPenalty = probe.saveDataEnabled ? tier === 'low' || tier === 'fallback' : true

    if (meetsMemory && meetsCpu && saveDataPenalty) return tier
  }

  return 'fallback'
}

export function downgradeQuality(level: GlobeQualityLevel): GlobeQualityLevel {
  if (level === 'high') return 'medium'
  if (level === 'medium') return 'low'
  return 'fallback'
}

export function getQualityBudget(level: GlobeQualityLevel) {
  return GLOBE_QUALITY_BUDGETS[level]
}
