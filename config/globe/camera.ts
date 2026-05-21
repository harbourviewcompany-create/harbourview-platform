export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  initialPosition: [0, 0.6, 7.8] as [number, number, number],
  initialTarget: [0, 0, 0] as [number, number, number],
  minDistance: 4.8,
  maxDistance: 8.2,
  minPolarAngle: Math.PI * 0.28,
  maxPolarAngle: Math.PI * 0.72,
  enablePan: false,
  dampingFactor: 0.085,
  rotateSpeed: 0.52,
  zoomSpeed: 0.42,
  disableZoomOnPrimaryHomepageMode: true,
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
