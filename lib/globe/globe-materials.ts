import type { GlobeLayerId } from '@/types/globe-router'

export interface GlobeMaterialState {
  oceanBase: string
  plateBase: string
  borderColor: string
  selectionAccent: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
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
    oceanBase: '#050b12',
    plateBase: '#0a131d',
    borderColor: '#8f7a4d',
    selectionAccent: '#b99a56',
    emissive: '#0f1c2c',
    emissiveIntensity: 0.1,
    roughness: 0.84,
    metalness: 0.22,
    clearcoat: 0.22,
    clearcoatRoughness: 0.72,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#685333'
    base.emissiveIntensity = 0.14
  }

  if (layerId === 'documentation_burden') {
    base.plateBase = '#161a21'
    base.borderColor = '#746443'
    base.emissive = '#33271b'
  }

  switch (visualState) {
    case 'focused':
      return {
        ...base,
        plateBase: '#111d2b',
        emissive: '#6b5a37',
        emissiveIntensity: 0.2,
        roughness: 0.76,
      }
    case 'selected':
      return {
        ...base,
        plateBase: '#182536',
        borderColor: '#9f8751',
        emissive: '#7a6339',
        selectionAccent: '#c5a561',
        emissiveIntensity: 0.28,
        roughness: 0.68,
        metalness: 0.26,
        clearcoat: 0.3,
        clearcoatRoughness: 0.64,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#152132',
        emissive: '#6f5b36',
        emissiveIntensity: 0.22,
      }
    case 'disabled':
      return {
        ...base,
        plateBase: '#12171d',
        borderColor: '#494741',
        emissive: '#1a2028',
        emissiveIntensity: 0.04,
      }
    default:
      return base
  }
}

export function shouldUseStandardMaterialFallback() {
  return process.env.NEXT_PUBLIC_GLOBE_STANDARD_MATERIAL_FALLBACK === '1'
}
