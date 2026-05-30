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
    emissiveIntensity: 0.26,
    roughness: 0.3,
    metalness: 0.78,
    clearcoat: 0.42,
    clearcoatRoughness: 0.26,
    sidewallColor: hvTokens.globe.sidewallDark,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#9d7a3d'
    base.emissiveIntensity = 0.24
  }

  if (layerId === 'documentation_burden') {
    base.plateBase = '#18202b'
    base.borderColor = '#8b7550'
    base.emissive = '#463521'
    base.emissiveIntensity = 0.2
  }

  switch (visualState) {
    case 'focused':
      return {
        ...base,
        plateBase: '#d9bf78',
        borderColor: '#f0d28a',
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.64,
        roughness: 0.34,
        metalness: 0.66,
        clearcoat: 0.48,
        clearcoatRoughness: 0.28,
      }
    case 'selected':
      return {
        ...base,
        plateBase: '#b79a5a',
        borderColor: '#fff0b0',
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.58,
        roughness: 0.46,
        metalness: 0.38,
        clearcoat: 0.46,
        clearcoatRoughness: 0.32,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#13253a',
        borderColor: '#d8be76',
        emissive: '#d2b26b',
        emissiveIntensity: 0.5,
        metalness: 0.56,
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
    metalness: state.metalness,
  }
}
