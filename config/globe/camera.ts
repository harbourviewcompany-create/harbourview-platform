export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  initialPosition: [0, 0.6, 7.8] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 4.6,
  maxDistance: 8.2,
  minPolarAngle: Math.PI * 0.3,
  maxPolarAngle: Math.PI * 0.7,
  distanceByState: {
    country: { min: 5.8, max: 8.2 },
    selected: { min: 4.9, max: 7.1 },
  },
  polarByState: {
    country: { min: Math.PI * 0.36, max: Math.PI * 0.64 },
    selected: { min: Math.PI * 0.32, max: Math.PI * 0.68 },
  },
  selectedTargetDistanceMax: 1.8,
  enablePan: false,
  enableZoom: false,
  enableDamping: true,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.2,
  flyDurationMs: 880,
}

export const GLOBE_PERFORMANCE_BUDGET = {
  mobileTargetFps: 55,
  desktopTargetFps: 60,
  maxDprMobile: 1.75,
  maxDprDesktop: 2,
  maxDrawCalls: 220,
  maxTriangles: 240000,
}
