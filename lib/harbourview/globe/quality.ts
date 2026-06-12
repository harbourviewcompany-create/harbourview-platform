export type GlobeQualityLevel = 'high' | 'medium' | 'low' | 'fallback'

export type GlobeRuntimeSignals = {
  reducedMotion: boolean
  supportsWebGL: boolean
  deviceMemoryGb?: number
  hardwareConcurrency?: number
  gpuHint?: 'high' | 'medium' | 'low'
  warmupFrameTimesMs?: number[]
}

const FRAME_BUDGET_MS       = 16.7
const WARMUP_BAILOUT_AVERAGE_MS = 34
const WARMUP_BAILOUT_P95_MS     = 42

/**
 * Classify a GPU renderer string into a performance tier.
 *
 * Strategy: go low → medium → high in priority order so the first match wins.
 * Patterns are ordered from most-specific to least-specific within each tier
 * to avoid false matches (e.g. "pro" alone would match "Firefox Quantum Pro").
 *
 * Sources: WebGL UNMASKED_RENDERER_WEBGL, Chrome DevTools GPU info, MDN.
 */
export function classifyGpuHint(rendererText?: string): 'high' | 'medium' | 'low' {
  if (!rendererText) return 'medium'
  const v = rendererText.toLowerCase()

  // ── Software / CPU fallbacks ──────────────────────────────────────────────
  if (/(swiftshader|llvmpipe|software rasterizer|microsoft basic render|software renderer|d3d11 vs_5|d3d9)/.test(v))
    return 'low'

  // ── Very low-end mobile ───────────────────────────────────────────────────
  // PowerVR: iPhone 6 and earlier, budget Android
  if (/powervr (sgx|g[46])/.test(v)) return 'low'
  // Mali T/G series below G72 — budget-tier mediatek/exynos (Galaxy A-series, etc.)
  if (/mali-(t[0-9]|g[1-6][0-9]\b)/.test(v)) return 'low'
  // Adreno 3xx — Snapdragon 4xx/5xx era (very old)
  if (/adreno \(tm\) [23][0-9][0-9]/.test(v)) return 'low'
  // Very old Intel HD (4th gen and earlier)
  if (/intel hd graphics [234][0-9]{3}/.test(v)) return 'low'

  // ── Mid-range: integrated / mobile ───────────────────────────────────────
  // Apple M1/M2 — capable but not top-tier for WebGL/R3F purposes
  if (/apple m[12]\b/.test(v)) return 'medium'
  // Intel UHD / Iris Xe — modern integrated
  if (/(intel\(r\) uhd|intel uhd|intel\(r\) iris|intel iris xe)/.test(v)) return 'medium'
  // Adreno 5xx / 6xx — Snapdragon 6xx/7xx (Galaxy S mid, Pixel 6a, etc.)
  if (/adreno \(tm\) [56][0-9][0-9]/.test(v)) return 'medium'
  // Mali G7x and above — mid-range Exynos / Dimensity
  if (/mali-g[789][0-9]/.test(v)) return 'medium'
  // ANGLE (Direct3D backend) — Windows Chrome/Edge on integrated GPU
  if (/angle \(/.test(v) && !/(rtx|radeon rx [5-9]|rx [5-9]|arc a[0-9])/.test(v)) return 'medium'

  // ── High-end: discrete / Apple Silicon Pro ────────────────────────────────
  // Apple M3/M4 base, and any M2/M3/M4 Pro/Max/Ultra
  if (/apple m[34]\b/.test(v)) return 'high'
  if (/apple m[2-4] (pro|max|ultra)/.test(v)) return 'high'
  // NVIDIA RTX (desktop / laptop)
  if (/\brtx [0-9]/.test(v)) return 'high'
  // AMD RX 5000+ (RDNA) and RX 6000/7000 (RDNA2/3)
  if (/radeon (rx [5-9]|r9 fury|vega)/.test(v)) return 'high'
  // Intel Arc
  if (/intel arc a[0-9]/.test(v)) return 'high'
  // Adreno 7xx — Snapdragon 8 Gen series (flagship)
  if (/adreno \(tm\) 7[0-9][0-9]/.test(v)) return 'high'
  // Mali G710 and above — flagship Dimensity 9xxx
  if (/mali-g[1-9][01][05]/.test(v)) return 'high'

  return 'medium'
}

export function shouldBailoutToFallback(frameTimesMs: number[]): boolean {
  if (frameTimesMs.length < 6) return false
  const sorted = [...frameTimesMs].sort((a, b) => a - b)
  const average = frameTimesMs.reduce((s, v) => s + v, 0) / frameTimesMs.length
  const p95 = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)]
  return average >= WARMUP_BAILOUT_AVERAGE_MS || p95 >= WARMUP_BAILOUT_P95_MS
}

/**
 * Select a quality level from runtime signals using a weighted score.
 *
 * Previous approach used strict AND conditions that misclassified high-end
 * mobile (good GPU, 4 cores visible to browser, 4-6 GB device memory).
 * Score-based approach: each signal contributes independently so a strong
 * GPU can offset modest memory/core readings.
 *
 *  Score  → quality
 *  ≥ 4    → high
 *  1–3    → medium
 *  ≤ 0    → low
 */
export function selectQualityLevel(signals: GlobeRuntimeSignals): GlobeQualityLevel {
  if (signals.reducedMotion || !signals.supportsWebGL) return 'fallback'

  if (signals.warmupFrameTimesMs && shouldBailoutToFallback(signals.warmupFrameTimesMs))
    return 'fallback'

  const gpu    = signals.gpuHint ?? 'medium'
  const memory = signals.deviceMemoryGb ?? 8    // unknown → assume capable
  const cores  = signals.hardwareConcurrency ?? 4

  let score = 0

  // GPU tier: most significant signal
  if (gpu === 'high')   score += 3
  else if (gpu === 'medium') score += 1
  else score -= 2 // low GPU is a strong down-vote

  // Memory: ≥8 GB → desktop/pro class; 4–7 GB → typical mid; <4 GB → constrained
  if (memory >= 8)      score += 2
  else if (memory >= 4) score += 1
  else                  score -= 1

  // Cores: browser cap means 4 is common even on good phones — gentle weight
  if (cores >= 8)       score += 1
  else if (cores < 4)   score -= 1

  if (score >= 4) return 'high'
  if (score <= 0) return 'low'
  return 'medium'
}

export function getInitialQuality(): GlobeQualityLevel {
  if (typeof window === 'undefined') return 'medium'

  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')
  const ext = gl?.getExtension('WEBGL_debug_renderer_info')
  const rendererName = ext
    ? (gl?.getParameter((ext as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL) as string | undefined)
    : undefined

  return selectQualityLevel({
    reducedMotion:        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    supportsWebGL:        Boolean(gl),
    deviceMemoryGb:       nav.deviceMemory,
    hardwareConcurrency:  nav.hardwareConcurrency,
    gpuHint:              classifyGpuHint(rendererName),
  })
}

export const qualityTuning: Record<
  GlobeQualityLevel,
  {
    latitudeBands: number
    longitudeBands: number
    rotationSpeed: number
    maxPixelRatio: number
    warmupFrames: number
  }
> = {
  high:     { latitudeBands: 96, longitudeBands: 96, rotationSpeed: 0.000047, maxPixelRatio: 2,   warmupFrames: 36 },
  medium:   { latitudeBands: 72, longitudeBands: 72, rotationSpeed: 0.000041, maxPixelRatio: 1.6, warmupFrames: 30 },
  low:      { latitudeBands: 48, longitudeBands: 48, rotationSpeed: 0.000030, maxPixelRatio: 1.3, warmupFrames: 20 },
  fallback: { latitudeBands: 0,  longitudeBands: 0,  rotationSpeed: 0,        maxPixelRatio: 1,   warmupFrames: 0  },
}

export { FRAME_BUDGET_MS }
