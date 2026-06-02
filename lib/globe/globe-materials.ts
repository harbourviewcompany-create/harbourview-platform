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
    // Emissive: dark gold at moderate intensity fills shadow side so it reads as
    // dark gold, not black. Lower than before so lighting contrast (not uniform
    // self-glow) creates the 3D depth.
    emissive: '#3f2a08',
    emissiveIntensity: 0.16,
    // Higher metalness + lower roughness = tighter specular lobe = visible hot
    // spot on lit face, soft falloff on tangents, emissive-filled shadows.
    // This gradient reads as polished 3D metal rather than a flat gold disc.
    roughness: 0.38,
    metalness: 0.76,
    // Clearcoat: present but restrained so split key lights don't stack into
    // a blown-out blob — still reads as polished gold without nuking a region.
    clearcoat: 0.38,
    clearcoatRoughness: 0.28,
    sidewallColor: hvTokens.globe.sidewallDark,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#6f4e16'
    base.emissiveIntensity = 0.14
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
        plateBase: '#caa75a',
        emissive: '#7f5d1c',
        emissiveIntensity: 0.22,
        roughness: 0.32,
        metalness: 0.82,
        clearcoat: 0.44,
        clearcoatRoughness: 0.22,
      }
    case 'selected':
      return {
        ...base,
        plateBase: hvTokens.globe.plateSelected,
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: '#8e671f',
        emissiveIntensity: 0.26,
        roughness: 0.28,
        metalness: 0.86,
        clearcoat: 0.48,
        clearcoatRoughness: 0.20,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#13253a',
        emissive: '#d2b26b',
        emissiveIntensity: 0.24,
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
