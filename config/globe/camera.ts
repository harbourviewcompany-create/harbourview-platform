export const GLOBE_CAMERA_CONFIG = {
  fov: 25,
  near: 0.2,
  far: 48,
  initialPosition: [0, 0.52, 6.55] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 4.3,
  maxDistance: 6.9,
  minPolarAngle: Math.PI * 0.08,
  maxPolarAngle: Math.PI * 0.92,
  distanceByState: {
    country: { min: 5.25, max: 6.9 },
    selected: { min: 4.3, max: 5.75 },
  },
  polarByState: {
    country: { min: Math.PI * 0.22, max: Math.PI * 0.78 },
    selected: { min: Math.PI * 0.24, max: Math.PI * 0.76 },
  },
  selectedTargetDistanceMax: 0.34,
  enablePan: false,
  enableZoom: true,
  enableDamping: true,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.24,
  flyDurationMs: 960,
  minAzimuthAngle: -Math.PI,
  maxAzimuthAngle: Math.PI,
  autoRotateSpeed: 0.24,
}

export const GLOBE_PERFORMANCE_BUDGET = {
  mobileTargetFps: 55,
  desktopTargetFps: 60,
  maxDprMobile: 1.75,
  maxDprDesktop: 2,
  maxDrawCalls: 320,
  maxTriangles: 320000,
}
