export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  // Was [0, 0.6, 7.8] — too tight for continent framing.
  // 11.2 gives a full-continent view with the existing group rotation
  // while still leaving headroom to zoom out to maxDistance.
  initialPosition: [0, 0.6, 11.2] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 3.0,
  maxDistance: 16,
  minPolarAngle: Math.PI * 0.08,
  maxPolarAngle: Math.PI * 0.92,
  distanceByState: {
    country: { min: 4.75, max: 16 },
    selected: { min: 3.0, max: 5.85 },
  },
  polarByState: {
    country: { min: Math.PI * 0.16, max: Math.PI * 0.84 },
    selected: { min: Math.PI * 0.18, max: Math.PI * 0.82 },
  },
  selectedTargetDistanceMax: 0.5,
  enablePan: false,
  enableZoom: true,
  enableDamping: true,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.34,
  flyDurationMs: 960,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  autoRotateSpeed: 0.22,
}

export const GLOBE_PERFORMANCE_BUDGET = {
  mobileTargetFps: 55,
  desktopTargetFps: 60,
  maxDprMobile: 1.75,
  maxDprDesktop: 2,
  maxDrawCalls: 320,
  maxTriangles: 320000,
}
