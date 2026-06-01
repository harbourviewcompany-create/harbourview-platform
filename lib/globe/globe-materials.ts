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
    plateBase: '#8a6421',
    borderColor: hvTokens.globe.borderMutedGold,
    // Emissive: dark gold at moderate intensity fills shadow side so it reads as
    // dark gold, not black. Lower than before so lighting contrast (not uniform
    // self-glow) creates the 3D depth.
    emissive: '#2f1b08',
    emissiveIntensity: 0.16,
    // Higher metalness + lower roughness = tighter specular lobe = visible hot
    // spot on lit face, soft falloff on tangents, emissive-filled shadows.
    // This gradient reads as polished 3D metal rather than a flat gold disc.
    roughness: 0.26,
    metalness: 0.92,
    // Clearcoat adds a second sharp reflection layer — makes specular highlight
    // look like polished metal rather than painted matte.
    clearcoat: 0.58,
    clearcoatRoughness: 0.18,
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
        plateBase: '#d8b96a',
        emissive: '#6f4a12',
        emissiveIntensity: 0.34,
        roughness: 0.24,
        metalness: 0.96,
        clearcoat: 0.72,
        clearcoatRoughness: 0.14,
      }
    case 'selected':
      return {
        ...base,
        plateBase: '#f1d48a',
        borderColor: '#fff0bd',
        emissive: '#8f641f',
        emissiveIntensity: 0.42,
        roughness: 0.22,
        metalness: 0.98,
        clearcoat: 0.78,
        clearcoatRoughness: 0.12,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#c59a43',
        emissive: '#5b3b11',
        emissiveIntensity: 0.28,
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
