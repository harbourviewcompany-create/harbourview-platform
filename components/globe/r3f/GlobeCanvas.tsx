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

export function GlobeCanvas({
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
  activeLayerId,
  routerStep,
  onHoverCountry,
  onSelectCountry,
  quality = 'high',
}: {
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId: GlobeLayerId
  routerStep?: GlobeRouterStep
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
  quality?: 'high' | 'medium' | 'low'
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={quality === 'low' ? [1, 1.2] : quality === 'medium' ? [1, 1.5] : [1, 1.75]}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
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
          enableZoom={false}
        />
      </Canvas>
    </div>
  )
}
