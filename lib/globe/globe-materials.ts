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

const TIER_FILL: Record<RegulatoryTier, TierPlate> = {
  // One palette, maximally separated in BOTH hue and lightness so tiers stay
  // distinct under the globe's dramatic lighting falloff and for colour-blind
  // viewers (lightness descends open → closed as a second channel):
  //   legal        = bright emerald   (unmistakably "go")
  //   medical      = warm amber        (lighter, distinct from orange)
  //   domestic     = orange            (clearly separated from amber)
  //   cbd/hemp     = cyan-teal         (cool, reads as "adjacent, not cannabis")
  //   prohibited   = desaturated red   (dark, recedes)
  legal_commercial_access: { plate: '#2fd46f', emissive: '#2fd46f', emissiveIntensity: 0.55, border: '#b6ffce' },
  medical_limited_trade:   { plate: '#f2c53d', emissive: '#f2c53d', emissiveIntensity: 0.55, border: '#ffe9a3' },
  domestic_only:           { plate: '#f07d2e', emissive: '#f07d2e', emissiveIntensity: 0.55, border: '#ffc191' },
  cbd_hemp_only:           { plate: '#2bc2c2', emissive: '#2bc2c2', emissiveIntensity: 0.55, border: '#9ff0f0' },
  prohibited:              { plate: '#b23b3b', emissive: '#b23b3b', emissiveIntensity: 0.32, border: '#e08a8a' },
}

// Back-compat: the palette param still exists at call sites and in the toggle,
// but both options now resolve to the same well-separated fill. The old
// metal/spectrum split was removed because the metallic variant was
// structurally illegible on the lit globe (every tier washed to gold).
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
    // Tier colouring must WIN over the globe's gold metallic lighting, not tint
    // through it. Earlier versions kept metalness/clearcoat and a gold emissive,
    // so every plate was lit by the same gold environment map and the tiers
    // washed into one indistinguishable gold (confirmed on device). Here the
    // tier plate becomes an almost-flat, self-lit fill:
    //   * metalness ~0  → hue is not replaced by the gold env-map reflection
    //   * clearcoat 0   → no gold specular hotspot on the lit face
    //   * emissive = the plate hue itself, at high intensity → shadowed faces
    //     stay ON-COLOUR instead of falling to gold-black, so a country reads
    //     as its tier from every lighting angle, not just where the sun hits.
    // The result looks more like a painted data-map than polished metal — which
    // is the correct tradeoff when the whole point is legibility of the tier.
    base.plateBase = tier.plate
    base.emissive = tier.plate
    base.emissiveIntensity = 0.55
    base.borderColor = tier.border
    base.metalness = 0.05
    base.roughness = 0.85
    base.clearcoat = 0.0
    base.clearcoatRoughness = 1.0
    if (regulatoryTier === 'prohibited') {
      // Prohibited still recedes: dimmer self-glow so reachable markets carry
      // the visual weight, but it stays clearly its own colour.
      base.emissiveIntensity = 0.32
      base.sidewallColor = hvTokens.globe.sidewallDisabled
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
