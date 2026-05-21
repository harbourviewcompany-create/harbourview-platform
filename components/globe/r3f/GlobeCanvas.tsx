'use client'

import { Suspense, useMemo, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { OceanSphere } from './OceanSphere'
import { CountryBorderLayer } from './CountryBorderLayer'
import { CountryPolygonMeshLayer } from './CountryPolygonMeshLayer'
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from './CameraFlyToController'
import type { GlobeLayerId, GlobeRouterStep } from '@/types/globe-router'

type GlobeInteractiveEligibility = {
  interactive: boolean
  reason: 'enabled' | 'flag_disabled' | 'reduced_motion_strict' | 'low_perf' | 'webgl_unavailable'
}

const INTERACTIVE_GLOBE_FLAG = process.env.NEXT_PUBLIC_INTERACTIVE_GLOBE ?? ''
const REDUCED_MOTION_MODE = process.env.NEXT_PUBLIC_GLOBE_REDUCED_MOTION_MODE ?? 'strict'

function isInteractiveGlobeFlagEnabled() {
  const normalized = INTERACTIVE_GLOBE_FLAG.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'enabled'
}

function prefersReducedMotionStrictly() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function isLowPerformanceDevice() {
  const threads = navigator.hardwareConcurrency ?? 0
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0
  return (threads > 0 && threads <= 4) || (memory > 0 && memory <= 4)
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(window.WebGLRenderingContext && context)
  } catch {
    return false
  }
}

function resolveInteractiveGlobeEligibility(): GlobeInteractiveEligibility {
  if (!isInteractiveGlobeFlagEnabled()) {
    return { interactive: false, reason: 'flag_disabled' }
  }

  if (REDUCED_MOTION_MODE === 'strict' && prefersReducedMotionStrictly()) {
    return { interactive: false, reason: 'reduced_motion_strict' }
  }

  if (isLowPerformanceDevice()) {
    return { interactive: false, reason: 'low_perf' }
  }

  if (!supportsWebGL()) {
    return { interactive: false, reason: 'webgl_unavailable' }
  }

  return { interactive: true, reason: 'enabled' }
}

function GlobeStaticFallbackPanel({ reason }: { reason: GlobeInteractiveEligibility['reason'] }) {
  return (
    <div className="absolute inset-0" data-globe-render-mode="static-fallback" data-globe-fallback-reason={reason}>
      <div className="h-full w-full bg-[radial-gradient(120%_100%_at_50%_40%,rgba(28,57,97,0.34)_0%,rgba(2,11,22,0.96)_64%,#01050d_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(198,165,90,0.08)_0%,transparent_38%,transparent_62%,rgba(198,165,90,0.06)_100%)]" />
    </div>
  )
}

export function GlobeCanvas({
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
  activeLayerId,
  routerStep,
  onHoverCountry,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId: GlobeLayerId
  routerStep?: GlobeRouterStep
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const eligibility = useMemo(resolveInteractiveGlobeEligibility, [])

  if (!eligibility.interactive) {
    return <GlobeStaticFallbackPanel reason={eligibility.reason} />
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{
          fov: GLOBE_CAMERA_CONFIG.fov,
          near: GLOBE_CAMERA_CONFIG.near,
          far: GLOBE_CAMERA_CONFIG.far,
          position: GLOBE_CAMERA_CONFIG.initialPosition,
        }}
      >
        <color attach="background" args={['#01050d']} />
        <ambientLight intensity={0.38} color="#b8d6ff" />
        <directionalLight position={[4, 3, 5]} intensity={1.1} color="#fff6df" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <group rotation={[0.12, -0.8, 0]}>
            <OceanSphere />
            <CountryBorderLayer />
            <CountryPolygonMeshLayer
              selectedCountryIso2={selectedCountryIso2}
              selectedCountryIso2s={selectedCountryIso2s}
              focusedCountryIso2={focusedCountryIso2}
              activeLayerId={activeLayerId}
              onHoverCountry={onHoverCountry}
              onSelectCountry={onSelectCountry}
            />
          </group>
          <CameraFlyToController
            selectedCountryIso2={selectedCountryIso2}
            routerStep={routerStep}
            controlsRef={controlsRef as RefObject<CameraFlyOrbitControlsLike | null>}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={GLOBE_CAMERA_CONFIG.enablePan}
          enableDamping
          dampingFactor={GLOBE_CAMERA_CONFIG.dampingFactor}
          rotateSpeed={GLOBE_CAMERA_CONFIG.rotateSpeed}
          zoomSpeed={GLOBE_CAMERA_CONFIG.zoomSpeed}
          minDistance={GLOBE_CAMERA_CONFIG.minDistance}
          maxDistance={GLOBE_CAMERA_CONFIG.maxDistance}
          minPolarAngle={GLOBE_CAMERA_CONFIG.minPolarAngle}
          maxPolarAngle={GLOBE_CAMERA_CONFIG.maxPolarAngle}
        />
      </Canvas>
    </div>
  )
}
