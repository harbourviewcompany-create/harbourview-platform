'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { OceanSphere } from './OceanSphere'
import { CountryBorderLayer } from './CountryBorderLayer'
import { CountryPolygonMeshLayer } from './CountryPolygonMeshLayer'
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from './CameraFlyToController'
import type { GlobeLayerId, GlobeRouterStep } from '@/types/globe-router'
import { resolveDprCeiling, resolveGlobeDeviceClass, shouldDegradePerformance } from './performanceBudget'

function GlobeRuntimeBudgetController({
  onDegrade,
}: {
  onDegrade: () => void
}) {
  const { gl } = useThree()
  const degradeTriggeredRef = useRef(false)

  useFrame((_, delta) => {
    if (degradeTriggeredRef.current || delta <= 0) return

    const drawCalls = gl.info.render.calls
    const triangles = gl.info.render.triangles

    if (shouldDegradePerformance({ drawCalls, triangles })) {
      degradeTriggeredRef.current = true
      onDegrade()
    }
  })

  return null
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
  const [shouldDegrade, setShouldDegrade] = useState(false)
  const [dprCeiling, setDprCeiling] = useState(1.75)

  useEffect(() => {
    const media = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const deviceClass = resolveGlobeDeviceClass()

    const recomputeDpr = () => {
      setDprCeiling(
        resolveDprCeiling({
          deviceClass,
          prefersReducedMotion: media.matches,
          saveData: Boolean(connection?.saveData),
        }),
      )
    }

    recomputeDpr()
    media.addEventListener('change', recomputeDpr)
    return () => media.removeEventListener('change', recomputeDpr)
  }, [])

  const layerSelection = useMemo(() => {
    if (!shouldDegrade) {
      return {
        showEnvironment: true,
        showPolygons: true,
      }
    }

    return {
      showEnvironment: false,
      showPolygons: false,
    }
  }, [shouldDegrade])

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, dprCeiling]}
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
          {layerSelection.showEnvironment ? <Environment preset="night" /> : null}
          <group rotation={[0.12, -0.8, 0]}>
            <OceanSphere />
            <CountryBorderLayer />
            {layerSelection.showPolygons ? (
              <CountryPolygonMeshLayer
                selectedCountryIso2={selectedCountryIso2}
                selectedCountryIso2s={selectedCountryIso2s}
                focusedCountryIso2={focusedCountryIso2}
                activeLayerId={activeLayerId}
                onHoverCountry={onHoverCountry}
                onSelectCountry={onSelectCountry}
              />
            ) : null}
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
        <GlobeRuntimeBudgetController onDegrade={() => setShouldDegrade(true)} />
      </Canvas>
    </div>
  )
}
