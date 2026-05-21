export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  initialPosition: [0, 0.6, 7.8] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 3.8,
  maxDistance: 9.4,
  minPolarAngle: Math.PI * 0.22,
  maxPolarAngle: Math.PI * 0.78,
  enablePan: false,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.7,
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
