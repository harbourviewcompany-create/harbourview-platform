export const candidateBGlobeConfig = {
  camera: {
    fov: 28,
    near: 0.1,
    far: 100,
    position: [0.62, 4.8, 4.6] as [number, number, number],
  },
  rotation: [0.08, -0.18, 0] as [number, number, number],
  geometry: {
    plateLift: 0.012,
    idleExtrusion: 0.018,
    selectedExtrusion: 0.026,
  },
  label: {
    visibleMs: 2200,
  },
} as const

export const candidateBGlobeColors = {
  oceanBase: '#040d18',
  oceanEmissive: '#071525',
  landBase: '#0d1e2d',
  border: '#c6a55a',
  selectedLand: '#183048',
  selectedEmissive: '#c8a85e',
} as const
