'use client'

import { Suspense, useRef } from 'react'
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
  className,
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
  activeLayerId,
  routerStep,
  onHoverCountry,
  onSelectCountry,
}: {
  className?: string
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId: GlobeLayerId
  routerStep?: GlobeRouterStep
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const isCountryState = routerStep === 'country' || !selectedCountryIso2
  const distanceLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.distanceByState.country
    : GLOBE_CAMERA_CONFIG.distanceByState.selected
  const polarLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.polarByState.country
    : GLOBE_CAMERA_CONFIG.polarByState.selected

  return (
    <div className={className ?? 'absolute inset-0 pointer-events-none'}>
      <Canvas
        className="h-full w-full pointer-events-auto"
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
        <ambientLight intensity={0.16} color="#ffe8c0" />
        <directionalLight position={[4, 3, 5]} intensity={1.8} color="#fff8e8" />
        <directionalLight position={[-3, 1, -4]} intensity={0.55} color="#c8a040" />

        <Suspense fallback={null}>
          <Environment preset="sunset" />
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
          minDistance={distanceLimits.min}
          maxDistance={distanceLimits.max}
          minPolarAngle={polarLimits.min}
          maxPolarAngle={polarLimits.max}
        />
      </Canvas>
    </div>
  )
}
