'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { OceanSphere } from './OceanSphere'
import { CountryBorderLayer } from './CountryBorderLayer'
import { CountryPolygonMeshLayer } from './CountryPolygonMeshLayer'
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from './CameraFlyToController'
import type { GlobeLayerId, GlobeRouterStep } from '@/types/globe-router'

export function getOrbitControlsMotionConfig(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      autoRotate: false,
      autoRotateSpeed: 0,
      enableDamping: false,
      dampingFactor: 1,
      rotateSpeed: 0.2,
    }
  }

  return {
    autoRotate: true,
    autoRotateSpeed: 0.2,
    enableDamping: true,
    dampingFactor: GLOBE_CAMERA_CONFIG.dampingFactor,
    rotateSpeed: GLOBE_CAMERA_CONFIG.rotateSpeed,
  }
}

export function GlobeCanvas({
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
  activeLayerId,
  routerStep,
  onHoverCountry,
  onSelectCountry,
  enablePointerCapture = true,
}: {
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId: GlobeLayerId
  routerStep?: GlobeRouterStep
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
  enablePointerCapture?: boolean
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const isInteractiveGlobeEnabled = process.env.NEXT_PUBLIC_HARBOURVIEW_INTERACTIVE_GLOBE === 'true'
  const cameraConfig = useMemo(
    () => ({
      minDistance: prefersReducedMotion ? GLOBE_CAMERA_CONFIG.reducedMotionDistance : GLOBE_CAMERA_CONFIG.minDistance,
      maxDistance: prefersReducedMotion ? GLOBE_CAMERA_CONFIG.reducedMotionDistance : GLOBE_CAMERA_CONFIG.maxDistance,
      enableRotate: !prefersReducedMotion,
      autoRotate: !prefersReducedMotion,
    }),
    [prefersReducedMotion],
  )

  if (!isInteractiveGlobeEnabled) return null

  return (
    <div className="absolute inset-0 -z-0" aria-hidden="true">
      <Canvas
        data-testid="globe-canvas"
        className={enablePointerCapture ? 'pointer-events-auto' : 'pointer-events-none'}
        dpr={[1, 1.75]}
        aria-label="Harbourview country globe"
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
          zoomSpeed={prefersReducedMotion ? 0 : GLOBE_CAMERA_CONFIG.zoomSpeed}
          enableZoom={!prefersReducedMotion}
          enableRotate={cameraConfig.enableRotate}
          autoRotate={cameraConfig.autoRotate}
          autoRotateSpeed={GLOBE_CAMERA_CONFIG.autoRotateSpeed}
          minDistance={cameraConfig.minDistance}
          maxDistance={cameraConfig.maxDistance}
          minPolarAngle={GLOBE_CAMERA_CONFIG.minPolarAngle}
          maxPolarAngle={GLOBE_CAMERA_CONFIG.maxPolarAngle}
        />
      </Canvas>
    </div>
  )
}
