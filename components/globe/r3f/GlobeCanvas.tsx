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
import { downgradeQuality, getInitialQuality, getQualityBudget } from '@/lib/harbourview/globe/quality'
import type { GlobeLayerId, GlobeRouterStep } from '@/types/globe-router'

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
  const initialQuality = useMemo(() => getInitialQuality(), [])
  const selectedCount = selectedCountryIso2s.length + (selectedCountryIso2 ? 1 : 0)
  const quality = selectedCount > 180 ? downgradeQuality(initialQuality) : initialQuality
  const budget = getQualityBudget(quality)

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, budget.maxDpr]}
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
          {budget.environmentEnabled ? <Environment preset="night" /> : null}
          <group rotation={[0.12, -0.8, 0]}>
            <OceanSphere segments={budget.oceanSegments} materialComplexity={budget.materialComplexity} />
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
