export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  initialPosition: [0, 0.6, 7.8] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 3.85,
  maxDistance: 8.2,
  minPolarAngle: Math.PI * 0.08,
  maxPolarAngle: Math.PI * 0.92,
  distanceByState: {
    country: { min: 4.65, max: 8.2 },
    selected: { min: 3.85, max: 6.35 },
  },
  polarByState: {
    country: { min: Math.PI * 0.1, max: Math.PI * 0.9 },
    selected: { min: Math.PI * 0.12, max: Math.PI * 0.88 },
  },
  selectedTargetDistanceMax: 0.58,
  enablePan: false,
  enableZoom: false,
  enableDamping: true,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.34,
  flyDurationMs: 960,
  minAzimuthAngle: -Math.PI,
  maxAzimuthAngle: Math.PI,
  autoRotateSpeed: 0.4,
}

export const GLOBE_PERFORMANCE_BUDGET = {
  mobileTargetFps: 55,
  desktopTargetFps: 60,
  maxDprMobile: 1.75,
  maxDprDesktop: 2,
  maxDrawCalls: 320,
  maxTriangles: 320000,
}
