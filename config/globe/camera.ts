export const GLOBE_CAMERA_CONFIG = {
  fov: 26,
  near: 0.1,
  far: 100,
  position: [0, 0, 4.8] as const,
  target: [0, 0, 0] as const,
  idleAutoRotateSpeed: 0.16,
  activeAutoRotateSpeed: 0.04,
  polarAngle: {
    min: Math.PI * 0.18,
    max: Math.PI * 0.82,
  },
  azimuthAngle: {
    min: -Math.PI,
    max: Math.PI,
  },
  zoom: {
    min: 3.2,
    max: 6.2,
  },
  dampingFactor: 0.08,
  flyDurationMs: 1200,
  fallbackTiltDeg: 18,
  fallbackRotationDeg: -24,
} as const

export const GLOBE_QUALITY_CONFIG = {
  dprDesktop: [1, 1.5] as const,
  dprMobile: [1, 1.25] as const,
  maxDevicePixelRatio: 1.5,
  staticFallbackWidth: 1440,
  staticFallbackHeight: 1440,
  polygonSimplificationDesktop: 1,
  polygonSimplificationMobile: 2,
  maxDrawCalls: 220,
  maxTriangles: 240000,
}
