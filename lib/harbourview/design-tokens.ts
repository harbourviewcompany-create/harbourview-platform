/**
 * Canonical Harbourview design tokens.
 *
 * Authority: docs/control/DESIGN_SYSTEM.md
 * CSS mirror: styles/design-tokens.css (must stay in sync)
 * Tailwind: tailwind.config.ts reads the same hex via CSS variables where possible.
 *
 * Do not invent alternate navy/gold values in feature CSS — alias to --hv-* instead.
 */

export const hvBrand = {
  /** Page background and hero depth */
  black: '#030508',
  /** Near-black panels / depth voids */
  nearBlack: '#050A10',
  /** Primary brand field (DESIGN_SYSTEM --hv-navy) */
  navy: '#0B1A2F',
  /** Ocean and dark panels (DESIGN_SYSTEM --hv-navy-deep) */
  navyDeep: '#081423',
  /** Slightly lifted navy for secondary panels */
  oceanNavy: '#0A2138',
  /** Primary accent and key phrases */
  gold: '#C6A55A',
  /** Metallic shadow and hover depth */
  goldDeep: '#A8842D',
  /** Lighter gold for labels / hover text */
  goldLight: '#D8BE76',
  /** Primary text on dark fields */
  ivory: '#F5F1E8',
  /** Secondary text only */
  muted: '#9CA3AF',
} as const

export const hvGlobe = {
  oceanBase: '#020914',
  oceanEmissive: '#071a30',
  atmosphereBlue: '#1b4f91',
  plateBase: '#b99b3f',
  plateMid: '#d0b35f',
  /** Hover/focused: richer antique gold — retains metallic identity */
  plateHighlight: '#c8a63d',
  /** Selected: slightly warmer, still fully metallic */
  plateSelected: '#d4ad3a',
  borderMutedGold: '#d7bd72',
  borderMutedGoldSoft: '#f1dfaa',
  sidewallDark: '#111826',
  sidewallDisabled: '#0d1218',
  selectedAccent: '#c9980a',
} as const

/** @deprecated Prefer hvBrand — kept for existing imports */
export const hvTokens = {
  colors: {
    black: hvBrand.black,
    nearBlack: hvBrand.nearBlack,
    deepNavy: hvBrand.navyDeep,
    oceanNavy: hvBrand.oceanNavy,
    gold: hvBrand.gold,
    darkGold: hvBrand.goldDeep,
    offWhite: hvBrand.ivory,
  },
  globe: hvGlobe,
} as const

/** Core CSS custom property names ↔ brand values (for tests / codegen). */
export const hvCssVariableMap = {
  '--hv-black': hvBrand.black,
  '--hv-near-black': hvBrand.nearBlack,
  '--hv-navy': hvBrand.navy,
  '--hv-navy-deep': hvBrand.navyDeep,
  '--hv-ocean-navy': hvBrand.oceanNavy,
  '--hv-gold': hvBrand.gold,
  '--hv-gold-deep': hvBrand.goldDeep,
  '--hv-dark-gold': hvBrand.goldDeep,
  '--hv-gold-light': hvBrand.goldLight,
  '--hv-ivory': hvBrand.ivory,
  '--hv-offwhite': hvBrand.ivory,
  '--hv-muted': hvBrand.muted,
} as const
