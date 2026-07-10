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
  | 'prohibited'

/**
 * Tier palettes.
 *
 * `metal` is the default and matches the doctrine set in
 * config/globe/semantic-layers.ts: no rainbow heatmap, no warning-red. Meaning
 * is carried by *luminance* (bright gold → open, slate → closed), so it stays
 * legible in greyscale and for red/green colour-blind users.
 *
 * `spectrum` is the conventional choropleth reading. It is faster to parse for
 * viewers with full colour vision, at the cost of (a) the premium metal
 * identity, and (b) legibility for ~8% of men with deuteranopia/protanopia,
 * for whom the green/red poles collapse. Kept opt-in for that reason. Its
 * lightness still descends open → closed so it degrades gracefully.
 */
export type GlobeTierPalette = 'metal' | 'spectrum'

interface TierPlate {
  plate: string
  emissive: string
  emissiveIntensity: number
  border: string
}

const TIER_PALETTES: Record<GlobeTierPalette, Record<RegulatoryTier, TierPlate>> = {
  metal: {
    legal_commercial_access: { plate: '#d4ad3a', emissive: '#9a7c12', emissiveIntensity: 0.26, border: '#f1dfaa' },
    medical_limited_trade:   { plate: '#a8873f', emissive: '#6d5820', emissiveIntensity: 0.18, border: '#c8ab6a' },
    domestic_only:           { plate: '#6d5c30', emissive: '#3f3416', emissiveIntensity: 0.12, border: '#8b7550' },
    prohibited:              { plate: '#28303a', emissive: '#141a22', emissiveIntensity: 0.05, border: '#4b525c' },
  },
  spectrum: {
    legal_commercial_access: { plate: '#3fb96b', emissive: '#166534', emissiveIntensity: 0.24, border: '#8ff0b4' },
    medical_limited_trade:   { plate: '#e0b93c', emissive: '#8a6b12', emissiveIntensity: 0.20, border: '#f7e39a' },
    domestic_only:           { plate: '#e08340', emissive: '#8a4416', emissiveIntensity: 0.16, border: '#f7bd8f' },
    prohibited:              { plate: '#c0453f', emissive: '#6d1a17', emissiveIntensity: 0.10, border: '#f09a95' },
  },
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
  /** Undefined/null = unreviewed. Renders neutral; makes no claim. */
  regulatoryTier?: RegulatoryTier | null
  palette?: GlobeTierPalette
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
    roughness: 0.20,
    metalness: 0.92,
    // Clearcoat adds a second sharp reflection layer — makes specular highlight
    // look like polished metal rather than painted matte.
    clearcoat: 0.35,
    clearcoatRoughness: 0.22,
    sidewallColor: hvTokens.globe.sidewallDark,
  }

  if (layerId === 'opportunity_heat') {
    base.emissive = '#8f7628'
    base.emissiveIntensity = 0.12
  }

  if (layerId === 'documentation_burden') {
    base.plateBase = '#18202b'
    base.borderColor = '#8b7550'
    base.emissive = '#463521'
  }

  // Regulatory tier tints the *idle* plate. Interaction states below
  // deliberately override it: a country the user has focused or selected must
  // still read as focused/selected, because that feedback matters more in the
  // moment than the tier does. The tier is re-readable as soon as focus moves
  // away, and the legend carries the meaning regardless.
  if (regulatoryTier) {
    const tier = TIER_PALETTES[palette][regulatoryTier]
    base.plateBase = tier.plate
    base.emissive = tier.emissive
    base.emissiveIntensity = tier.emissiveIntensity
    base.borderColor = tier.border
    if (regulatoryTier === 'prohibited') {
      // Closed markets should not glint like metal — drop the polish so they
      // recede rather than competing with reachable markets for attention.
      base.metalness = 0.35
      base.roughness = 0.72
      base.clearcoat = 0.0
      base.sidewallColor = hvTokens.globe.sidewallDisabled
    } else if (palette === 'spectrum') {
      // Saturated pigment reads as paint, not metal. Pull metalness down or the
      // specular lobe desaturates the hue into a grey glint at grazing angles.
      base.metalness = 0.28
      base.roughness = 0.58
      base.clearcoat = 0.12
    }
  }

  switch (visualState) {
    case 'focused':
      return {
        ...base,
        plateBase: hvTokens.globe.plateHighlight,
        // Focused border: bright crisp gold edge-lift — precise, not blobby
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: '#9a7c12',
        emissiveIntensity: 0.26,
        roughness: 0.16,
        metalness: 0.95,
        clearcoat: 0.42,
        clearcoatRoughness: 0.20,
      }
    case 'searchFocused':
    case 'modalContext':
    case 'selected':
      return {
        ...base,
        plateBase: hvTokens.globe.plateSelected,
        // Selected border: maximum brightness to feel locked/activated
        borderColor: '#f4e18e',
        emissive: hvTokens.globe.selectedAccent,
        emissiveIntensity: 0.28,
        roughness: 0.11,
        metalness: 0.98,
        clearcoat: 0.55,
        clearcoatRoughness: 0.16,
      }
    case 'multi_market':
      return {
        ...base,
        plateBase: '#d9bd6c',
        borderColor: hvTokens.globe.borderMutedGoldSoft,
        emissive: '#d8c16e',
        emissiveIntensity: 0.20,
        roughness: 0.25,
        metalness: 0.9,
        clearcoat: 0.58,
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
