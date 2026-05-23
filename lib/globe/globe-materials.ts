import type { GlobeLayerId } from '@/types/globe-router'
import { hvTokens } from '@/lib/harbourview/design-tokens'

export interface GlobeMaterialState {
  oceanBase: string
  plateBase: string
  borderColor: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  sidewallColor: string
}

export interface GlobeMaterialFallbackState {
  color: string
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
    oceanBase: hvTokens.globe.oceanBase,
    plateBase: hvTokens.globe.plateBase,
    borderColor: hvTokens.globe.borderMutedGold,
    emissive: '#3d2508',
    emissiveIntensity: 0.28,
    roughness: 0.26,
    metalness: 0.82,
    clearcoat: 0.44,
    clearcoatRoughness: 0.24,
    sidewallColor: hvTokens.globe.sidewallDark,
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
        emissive: hvTokens.globe.borderMutedGold,
        emissiveIntensity: 0.42,
        roughness: 0.58,
      }
    case 'selected':
      return {
        ...base,
        plateBase: hvTokens.globe.plateSelected,
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.48,
        roughness: 0.42,
        metalness: 0.42,
        clearcoat: 0.44,
        clearcoatRoughness: 0.3,
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
        plateBase: hvTokens.globe.sidewallDisabled,
        borderColor: '#4b4f57',
        emissive: '#1f2630',
        emissiveIntensity: 0.08,
        sidewallColor: hvTokens.globe.sidewallDisabled,
      }
    default:
      return base
  }
}

export function resolveCountryStandardMaterialState(state: GlobeMaterialState): GlobeMaterialFallbackState {
  return {
    color: state.plateBase,
    emissive: state.emissive,
    emissiveIntensity: state.emissiveIntensity,
    roughness: state.roughness,
    metalness: Math.min(state.metalness, 0.45),
  }
}
