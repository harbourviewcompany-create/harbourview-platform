import type { GlobeLayerId } from '@/types/globe-router'
import { hvTokens } from '@/lib/harbourview/design-tokens'

/**
 * Reviewed regulatory access tier, sourced from `countries.regulatory_tier`.
 *
 * `null`/undefined means NOT YET REVIEWED and must render as the neutral plate.
 * It is not a claim. Never map an unreviewed country onto a tier colour, and
 * never derive a tier from `market_access_status` / `import_status` /
 * `export_status` — those columns are unsourced and contain false values
 * (US shows `export_status = 'active'` despite federal Schedule I).
 */
export type RegulatoryTier =
  | 'legal_commercial_access'
  | 'medical_limited_trade'
  | 'domestic_only'
  | 'cbd_hemp_only'
  | 'prohibited'

export type GlobeTierPalette = 'metal' | 'spectrum'

interface TierPlate {
  plate: string
  emissive: string
  emissiveIntensity: number
  border: string
}

const TIER_FILL: Record<RegulatoryTier, TierPlate> = {
  legal_commercial_access: { plate: '#2fd46f', emissive: '#2fd46f', emissiveIntensity: 0.55, border: '#e8fff0' },
  medical_limited_trade:   { plate: '#f2c53d', emissive: '#f2c53d', emissiveIntensity: 0.55, border: '#fff6d0' },
  domestic_only:           { plate: '#f07d2e', emissive: '#f07d2e', emissiveIntensity: 0.55, border: '#ffe0c2' },
  cbd_hemp_only:           { plate: '#2bc2c2', emissive: '#2bc2c2', emissiveIntensity: 0.55, border: '#d4ffff' },
  prohibited:              { plate: '#c44a4a', emissive: '#c44a4a', emissiveIntensity: 0.36, border: '#ffc4c4' },
}

/** Unverified / no evidence — slate, never gold (gold reads as a positive claim). */
const UNVERIFIED_PLATE: TierPlate = {
  plate: '#3d4a5c',
  emissive: '#3d4a5c',
  emissiveIntensity: 0.16,
  border: '#8b9bb0',
}

const TIER_PALETTES: Record<GlobeTierPalette, Record<RegulatoryTier, TierPlate>> = {
  metal: TIER_FILL,
  spectrum: TIER_FILL,
}

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
  regulatoryTier,
  palette = 'metal',
}: {
  visualState: GlobeCountryVisualState
  layerId: GlobeLayerId
  regulatoryTier?: RegulatoryTier | null
  palette?: GlobeTierPalette
}): GlobeMaterialState {
  const hasTier = Boolean(regulatoryTier)
  const tierPlate = hasTier ? TIER_PALETTES[palette][regulatoryTier as RegulatoryTier] : null

  const base: GlobeMaterialState = hasTier && tierPlate
    ? {
        oceanBase: hvTokens.globe.oceanBase,
        plateBase: tierPlate.plate,
        borderColor: tierPlate.border,
        emissive: tierPlate.emissive,
        emissiveIntensity: tierPlate.emissiveIntensity,
        roughness: 0.85,
        metalness: 0.05,
        clearcoat: 0.0,
        clearcoatRoughness: 1.0,
        sidewallColor:
          regulatoryTier === 'prohibited'
            ? hvTokens.globe.sidewallDisabled
            : hvTokens.globe.sidewallDark,
      }
    : {
        oceanBase: hvTokens.globe.oceanBase,
        plateBase: UNVERIFIED_PLATE.plate,
        borderColor: UNVERIFIED_PLATE.border,
        emissive: UNVERIFIED_PLATE.emissive,
        emissiveIntensity: UNVERIFIED_PLATE.emissiveIntensity,
        roughness: 0.78,
        metalness: 0.12,
        clearcoat: 0.05,
        clearcoatRoughness: 0.9,
        sidewallColor: hvTokens.globe.sidewallDark,
      }

  if (layerId === 'opportunity_heat' && !hasTier) {
    base.emissiveIntensity = 0.1
  }

  if (layerId === 'documentation_burden' && !hasTier) {
    base.plateBase = '#18202b'
    base.borderColor = '#8b7550'
    base.emissive = '#463521'
  }

  switch (visualState) {
    case 'focused':
      return {
        ...base,
        borderColor: hasTier ? '#ffffff' : '#c5d0e0',
        emissiveIntensity: Math.min(0.85, base.emissiveIntensity + 0.22),
        roughness: hasTier ? 0.72 : 0.55,
      }
    case 'searchFocused':
    case 'modalContext':
    case 'selected':
      return {
        ...base,
        borderColor: hasTier ? '#ffffff' : '#e2e8f0',
        emissiveIntensity: Math.min(0.95, base.emissiveIntensity + 0.3),
        roughness: hasTier ? 0.65 : 0.45,
      }
    case 'multi_market':
      return {
        ...base,
        borderColor: hasTier ? tierPlate!.border : '#d8c16e',
        emissiveIntensity: Math.min(0.8, base.emissiveIntensity + 0.15),
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
