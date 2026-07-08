'use client'

import { Suspense, useCallback, useEffect, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { ACESFilmicToneMapping, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { OceanSphere } from './OceanSphere'
import { AtmosphereGlow } from './AtmosphereGlow'
import { CountryBorderLayer } from './CountryBorderLayer'
import { CountryPolygonMeshLayer } from './CountryPolygonMeshLayer'
import { CountryGlobeLabel } from './CountryGlobeLabel'
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from './CameraFlyToController'
import { DataVizLayer } from './DataVizLayer'
import { useGlobe } from '../GlobeProvider'
import type { GlobeLayerId, GlobeRouterStep } from '@/types/globe-router'

// Keeps frameloop="demand" alive while OrbitControls autoRotate is active.
// OrbitControls does not call state.invalidate() internally, so without this
// the globe freezes on initial load when nothing has been interacted with yet.
function AutoRotateInvalidator({ active }: { active: boolean }) {
  useFrame((state) => {
    if (active) state.invalidate()
  })
  return null
}

function MetallicEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmremGenerator = new PMREMGenerator(gl)
    const roomEnvironment = new RoomEnvironment()
    const environmentMap = pmremGenerator.fromScene(roomEnvironment, 0.04).texture
    const previousEnvironment = scene.environment

    scene.environment = environmentMap

    return () => {
      scene.environment = previousEnvironment
      environmentMap.dispose()
      roomEnvironment.dispose()
      pmremGenerator.dispose()
    }
  }, [gl, scene])

  return null
}

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
  subNationalIso2s = [],
  onHoverCountry,
  onSelectCountry,
}: {
  className?: string
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
  activeLayerId: GlobeLayerId
  routerStep?: GlobeRouterStep
  subNationalIso2s?: string[]
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const { liveData } = useGlobe()
  const isCountryState = routerStep === 'country' || !selectedCountryIso2
  const distanceLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.distanceByState.country
    : GLOBE_CAMERA_CONFIG.distanceByState.selected
  const polarLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.polarByState.country
    : GLOBE_CAMERA_CONFIG.polarByState.selected

  // Wrap hover callbacks to also invalidate the canvas so frameloop="demand"
  // re-renders when pointer enters/leaves a country plate.
  const invalidateRef = useRef<(() => void) | null>(null)
  const handleHoverCountry = useCallback(
    (iso2?: string) => {
      invalidateRef.current?.()
      onHoverCountry?.(iso2)
    },
    [onHoverCountry],
  )

  // Auto-rotate only when nothing is hovered or selected
  const isHovering = !!focusedCountryIso2
  const isSelected = !!selectedCountryIso2
  const shouldAutoRotate = !isHovering && !isSelected

  return (
    <div
      className={className ?? 'absolute inset-0 pointer-events-none'}
      // Pointer cursor whenever a country plate is hovered
      style={{ cursor: isHovering ? 'pointer' : 'default' }}
    >
      <Canvas
        className="h-full w-full pointer-events-auto"
        // Only render when something changes — saves GPU on idle.
        // Components that animate must call state.invalidate() inside useFrame.
        frameloop="demand"
        dpr={[1, 1.75]}
        aria-label="Harbourview country globe"
        camera={{
          fov: GLOBE_CAMERA_CONFIG.fov,
          near: GLOBE_CAMERA_CONFIG.near,
          far: GLOBE_CAMERA_CONFIG.far,
          position: GLOBE_CAMERA_CONFIG.initialPosition,
        }}
        onCreated={(state) => {
          // ACES Filmic tone mapping — whole-scene response curve.
          // Richer shadow detail, compressed highlights, graded look.
          // Exposure pulled to 0.78 so ACES knee compresses specular peaks
          // before they clip to white — highlights feel surface-driven, not pasted.
          state.gl.toneMapping = ACESFilmicToneMapping
          state.gl.toneMappingExposure = 0.54
          // Expose invalidate so pointer callbacks above can request a frame.
          invalidateRef.current = state.invalidate
        }}
      >
        <color attach="background" args={['#010810']} />
        <MetallicEnvironment />

        {/* Metallic plate lighting: equatorial key + opposite fill at Y≈0 so neither
            hemisphere gets extra illumination. Two lights only — eliminates hotspot scatter. */}
        <ambientLight intensity={0.22} color="#f4dfad" />
        <directionalLight position={[4.5, 0.6, 4.2]} intensity={0.62} color="#fff3c4" />
        <directionalLight position={[-4.8, -0.4, -3.5]} intensity={0.26} color="#c99f4a" />
        <hemisphereLight args={['#243b5e', '#080409', 0.26]} />

        <Suspense fallback={null}>
          {/* 3 500 stars — enough to read as deep space, negligible GPU cost */}
          <Stars
            radius={18}
            depth={6}
            count={3500}
            factor={1.2}
            saturation={0}
            fade
            speed={0}
          />

          <group rotation={[0.08, 0.3, 0]}>
            {/* Single restrained cobalt atmospheric rim — no second neon shell. */}
            <AtmosphereGlow />
            <OceanSphere />
            <CountryPolygonMeshLayer
              selectedCountryIso2={selectedCountryIso2}
              subNationalIso2s={subNationalIso2s}
              selectedCountryIso2s={selectedCountryIso2s}
              focusedCountryIso2={focusedCountryIso2}
              activeLayerId={activeLayerId}
              onHoverCountry={handleHoverCountry}
              onSelectCountry={onSelectCountry}
            />
            <DataVizLayer countries={liveData.countries} signalsByIso2={liveData.signalsByIso2} />
            {/* Border strokes render after polygon plates so U.S. subdivisions remain legible on mobile. */}
            <CountryBorderLayer />
            {/* Hover label — floats above the plate centroid while hovering */}
            {focusedCountryIso2 && <CountryGlobeLabel iso2={focusedCountryIso2} />}
          </group>
          <CameraFlyToController
            selectedCountryIso2={selectedCountryIso2}
            routerStep={routerStep}
            controlsRef={controlsRef as RefObject<CameraFlyOrbitControlsLike | null>}
          />
        </Suspense>

        {/* Drive frame invalidation while autoRotate is active */}
        <AutoRotateInvalidator active={shouldAutoRotate} />
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
          autoRotate={shouldAutoRotate}
          autoRotateSpeed={GLOBE_CAMERA_CONFIG.autoRotateSpeed}
          enableZoom={GLOBE_CAMERA_CONFIG.enableZoom}
          minAzimuthAngle={GLOBE_CAMERA_CONFIG.minAzimuthAngle}
          maxAzimuthAngle={GLOBE_CAMERA_CONFIG.maxAzimuthAngle}
        />

        {/* Post-processing effects — restrained bloom and vignette only, with no normal-pass occlusion mask over high-latitude geometry. */}
      </Canvas>
    </div>
  )
}
