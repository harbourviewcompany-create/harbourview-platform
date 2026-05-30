export type GlobeViewportClass = 'mobile' | 'tablet' | 'desktop'

export type GlobeRenderableKind = 'country' | 'admin1'

export type GlobeVisualEmphasis =
  | 'idle'
  | 'focused'
  | 'selected'
  | 'selectedParent'
  | 'admin1Idle'
  | 'admin1Selected'

export interface GlobeBorderStyleArgs {
  viewportClass: GlobeViewportClass
  renderableKind: GlobeRenderableKind
  ringKind: 'outer' | 'hole'
  isFocused: boolean
  isSelected: boolean
}

export interface GlobeBorderStyle {
  color: string
  opacity: number
  lineWidth: number
}

const COUNTRY_BORDER = '#c6a55a'
const ADMIN1_BORDER = '#d8be76'
const FOCUSED_BORDER = '#efd17a'
const SELECTED_BORDER = '#fff0b0'
const HOLE_BORDER = '#9d8755'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getViewportClass(width: number): GlobeViewportClass {
  if (width <= 640) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

function getViewportBoost(viewportClass: GlobeViewportClass) {
  switch (viewportClass) {
    case 'mobile':
      return { lineWidth: 1.34, opacity: 0.13 }
    case 'tablet':
      return { lineWidth: 1.16, opacity: 0.07 }
    default:
      return { lineWidth: 1, opacity: 0 }
  }
}

export function resolveBorderStyle({
  viewportClass,
  renderableKind,
  ringKind,
  isFocused,
  isSelected,
}: GlobeBorderStyleArgs): GlobeBorderStyle {
  const isHole = ringKind === 'hole'
  const viewportBoost = getViewportBoost(viewportClass)

  const base =
    renderableKind === 'admin1'
      ? {
          color: isHole ? HOLE_BORDER : ADMIN1_BORDER,
          opacity: isHole ? 0.36 : 0.58,
          lineWidth: isHole ? 0.34 : 0.74,
        }
      : {
          color: isHole ? HOLE_BORDER : COUNTRY_BORDER,
          opacity: isHole ? 0.45 : 0.88,
          lineWidth: isHole ? 0.42 : 0.86,
        }

  const emphasis = isSelected
    ? {
        color: SELECTED_BORDER,
        opacity: 0.97,
        lineWidth: base.lineWidth + (renderableKind === 'admin1' ? 0.28 : 0.34),
      }
    : isFocused
      ? {
          color: FOCUSED_BORDER,
          opacity: Math.max(base.opacity, 0.92),
          lineWidth: base.lineWidth + (renderableKind === 'admin1' ? 0.18 : 0.24),
        }
      : base

  return {
    color: emphasis.color,
    opacity: clamp(emphasis.opacity + viewportBoost.opacity, 0, 0.99),
    lineWidth: Number((emphasis.lineWidth * viewportBoost.lineWidth).toFixed(3)),
  }
}
