import type { GlobeLayerId } from '@/types/globe-router'

export interface GlobeMaterialState {
  oceanBase: string
  plateBase: string
  borderColor: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
}

export type GlobeCountryVisualState = 'idle' | 'focused' | 'selected' | 'disabled' | 'multi_market'

export function resolveCountryMaterialState({
  visualState,
  layerId,
}: {
  visualState: GlobeCountryVisualState
  layerId: GlobeLayerId
}): GlobeMaterialState {
  const base: GlobeMaterialState = {
    oceanBase: '#040d18',
    plateBase: '#071a2c',
    borderColor: '#c6a55a',
    emissive: '#0f2942',
    emissiveIntensity: 0.16,
    roughness: 0.72,
    metalness: 0.48,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#9d7a3d'
    base.emissiveIntensity = 0.22
  }

  if (layerId === 'documentation_burden') {
    base.plateBase = '#18202b'
    base.borderColor = '#8b7550'
    base.emissive = '#463521'
  }

  switch (visualState) {
    case 'focused':
      return {
        ...base,
        plateBase: '#0d2a42',
        emissive: '#c6a55a',
        emissiveIntensity: 0.42,
        roughness: 0.58,
      }
    case 'selected':
      return {
        ...base,
        plateBase: '#16324a',
        borderColor: '#f0d58a',
        emissive: '#f0c96a',
        emissiveIntensity: 0.86,
        roughness: 0.42,
        metalness: 0.64,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#13253a',
        emissive: '#d2b26b',
        emissiveIntensity: 0.48,
      }
    case 'disabled':
      return {
        ...base,
        plateBase: '#121821',
        borderColor: '#4b4f57',
        emissive: '#1f2630',
        emissiveIntensity: 0.08,
      }
    default:
      return base
  }
}
