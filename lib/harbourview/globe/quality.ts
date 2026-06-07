export type GlobeQualityLevel = 'high' | 'medium' | 'low' | 'fallback'

const FRAME_BUDGET_MS = 16.7
const WARMUP_BAILOUT_AVERAGE_MS = 34
const WARMUP_BAILOUT_P95_MS = 42

export type GlobeRuntimeSignals = {
  reducedMotion: boolean
  supportsWebGL: boolean
  deviceMemoryGb?: number
  hardwareConcurrency?: number
  gpuHint?: 'high' | 'medium' | 'low'
  warmupFrameTimesMs?: number[]
}

export function classifyGpuHint(rendererText?: string): 'high' | 'medium' | 'low' {
  if (!rendererText) return 'medium'

  const value = rendererText.toLowerCase()

  if (/(swiftshader|llvmpipe|software|microsoft basic render)/.test(value)) return 'low'
  if (/(intel\(r\) uhd|intel\(r\) hd|apple m1|apple m2)/.test(value)) return 'medium'
  if (/(rtx|radeon rx|apple m3|max|pro|adreno 7|arc a)/.test(value)) return 'high'

  return 'medium'
}

export function shouldBailoutToFallback(frameTimesMs: number[]): boolean {
  if (frameTimesMs.length < 6) return false

  const sorted = [...frameTimesMs].sort((a, b) => a - b)
  const average = frameTimesMs.reduce((sum, value) => sum + value, 0) / frameTimesMs.length
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  const p95 = sorted[p95Index]

  return average >= WARMUP_BAILOUT_AVERAGE_MS || p95 >= WARMUP_BAILOUT_P95_MS
}

export function selectQualityLevel(signals: GlobeRuntimeSignals): GlobeQualityLevel {
  if (signals.reducedMotion || !signals.supportsWebGL) return 'fallback'

  if (signals.warmupFrameTimesMs && shouldBailoutToFallback(signals.warmupFrameTimesMs)) {
    return 'fallback'
  }

  const memory = signals.deviceMemoryGb ?? 8
  const cores = signals.hardwareConcurrency ?? 8
  const gpu = signals.gpuHint ?? 'medium'

  if (gpu === 'high' && memory >= 8 && cores >= 8) return 'high'
  if (gpu === 'low' || memory <= 4 || cores <= 4) return 'low'

  return 'medium'
}

export function getInitialQuality(): GlobeQualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }

  return selectQualityLevel({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    supportsWebGL: true,
    deviceMemoryGb: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  })
}

export const qualityTuning: Record<GlobeQualityLevel, { latitudeBands: number; longitudeBands: number; rotationSpeed: number; maxPixelRatio: number; warmupFrames: number }> = {
  high: { latitudeBands: 96, longitudeBands: 96, rotationSpeed: 0.000047, maxPixelRatio: 2, warmupFrames: 36 },
  medium: { latitudeBands: 72, longitudeBands: 72, rotationSpeed: 0.000041, maxPixelRatio: 1.6, warmupFrames: 30 },
  low: { latitudeBands: 48, longitudeBands: 48, rotationSpeed: 0.00003, maxPixelRatio: 1.3, warmupFrames: 20 },
  fallback: { latitudeBands: 0, longitudeBands: 0, rotationSpeed: 0, maxPixelRatio: 1, warmupFrames: 0 },
}

export { FRAME_BUDGET_MS }
