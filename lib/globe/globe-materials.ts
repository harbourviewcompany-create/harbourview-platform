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

export type GlobeCountryVisualState = 'idle' | 'focused' | 'searchFocused' | 'selected' | 'modalContext' | 'disabled' | 'multi_market'

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
    emissive: '#7c691f',
    emissiveIntensity: 0.22,
    // Higher metalness + lower roughness = tighter specular lobe = visible hot
    // spot on lit face, soft falloff on tangents, emissive-filled shadows.
    // This gradient reads as polished 3D metal rather than a flat gold disc.
    roughness: 0.34,
    metalness: 0.46,
    // Clearcoat adds a second sharp reflection layer — makes specular highlight
    // look like polished metal rather than painted matte.
    clearcoat: 0.34,
    clearcoatRoughness: 0.24,
    sidewallColor: hvTokens.globe.sidewallDark,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#8f7628'
    base.emissiveIntensity = 0.18
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
        plateBase: hvTokens.globe.plateHighlight,
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.32,
        roughness: 0.36,
        metalness: 0.52,
      }
    case 'searchFocused':
    case 'modalContext':
    case 'selected':
      return {
        ...base,
        plateBase: hvTokens.globe.plateSelected,
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.34,
        roughness: 0.38,
        metalness: 0.5,
        clearcoat: 0.38,
        clearcoatRoughness: 0.28,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#d9bd6c',
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: '#d8c16e',
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
