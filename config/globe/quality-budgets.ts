import type { GlobeQualityLevel } from '@/lib/harbourview/globe/quality'

export type GlobeQualityBudget = {
  maxFrameTimeMs: number
  minDeviceMemoryGb: number
  minHardwareConcurrency: number
  maxDpr: number
  sphereSegments: number
  oceanSegments: number
  environmentEnabled: boolean
  materialComplexity: 'high' | 'medium' | 'low' | 'fallback'
  maxCountryMeshes: number
}

export const GLOBE_QUALITY_BUDGETS: Record<GlobeQualityLevel, GlobeQualityBudget> = {
  high: {
    maxFrameTimeMs: 16.7,
    minDeviceMemoryGb: 8,
    minHardwareConcurrency: 8,
    maxDpr: 2,
    sphereSegments: 96,
    oceanSegments: 128,
    environmentEnabled: true,
    materialComplexity: 'high',
    maxCountryMeshes: 260,
  },
  medium: {
    maxFrameTimeMs: 22,
    minDeviceMemoryGb: 6,
    minHardwareConcurrency: 4,
    maxDpr: 1.75,
    sphereSegments: 72,
    oceanSegments: 96,
    environmentEnabled: true,
    materialComplexity: 'medium',
    maxCountryMeshes: 210,
  },
  low: {
    maxFrameTimeMs: 28,
    minDeviceMemoryGb: 4,
    minHardwareConcurrency: 2,
    maxDpr: 1.3,
    sphereSegments: 48,
    oceanSegments: 64,
    environmentEnabled: false,
    materialComplexity: 'low',
    maxCountryMeshes: 140,
  },
  fallback: {
    maxFrameTimeMs: 40,
    minDeviceMemoryGb: 0,
    minHardwareConcurrency: 1,
    maxDpr: 1,
    sphereSegments: 24,
    oceanSegments: 32,
    environmentEnabled: false,
    materialComplexity: 'fallback',
    maxCountryMeshes: 80,
  },
}
