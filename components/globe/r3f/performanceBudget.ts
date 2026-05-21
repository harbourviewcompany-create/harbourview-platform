import { GLOBE_PERFORMANCE_BUDGET } from '@/config/globe/camera'

export type GlobeDeviceClass = 'mobile' | 'desktop'

export function resolveGlobeDeviceClass(viewportWidth = globalThis.innerWidth): GlobeDeviceClass {
  return viewportWidth <= 768 ? 'mobile' : 'desktop'
}

export function resolveDprCeiling({
  deviceClass,
  prefersReducedMotion,
  saveData,
}: {
  deviceClass: GlobeDeviceClass
  prefersReducedMotion: boolean
  saveData: boolean
}): number {
  const defaultCap =
    deviceClass === 'mobile'
      ? GLOBE_PERFORMANCE_BUDGET.maxDprMobile
      : GLOBE_PERFORMANCE_BUDGET.maxDprDesktop

  if (prefersReducedMotion || saveData) return Math.min(defaultCap, 1.25)
  return defaultCap
}

export function shouldDegradePerformance({
  drawCalls,
  triangles,
}: {
  drawCalls: number
  triangles: number
}) {
  return (
    drawCalls > GLOBE_PERFORMANCE_BUDGET.maxDrawCalls ||
    triangles > GLOBE_PERFORMANCE_BUDGET.maxTriangles
  )
}
