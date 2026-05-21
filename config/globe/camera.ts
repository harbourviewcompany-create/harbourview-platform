export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  initialPosition: [0, 0.6, 7.8] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 5.8,
  maxDistance: 8.6,
  minPolarAngle: Math.PI * 0.3,
  maxPolarAngle: Math.PI * 0.7,
  enablePan: false,
  dampingFactor: 0.085,
  rotateSpeed: 0.38,
  zoomSpeed: 0,
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
