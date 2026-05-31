'use client'

import { Suspense, useCallback, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, SSAO, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { OceanSphere } from './OceanSphere'
import { AtmosphereGlow } from './AtmosphereGlow'
import { AtmosphereLayer } from './AtmosphereLayer'
import { CountryBorderLayer } from './CountryBorderLayer'
import { CountryPolygonMeshLayer } from './CountryPolygonMeshLayer'
import { CountryGlobeLabel } from './CountryGlobeLabel'
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
          state.gl.toneMapping = ACESFilmicToneMapping
          state.gl.toneMappingExposure = 1.05
          // Expose invalidate so pointer callbacks above can request a frame.
          invalidateRef.current = state.invalidate
        }}
      >
        <color attach="background" args={['#01050d']} />

        {/* Lights: drop the sunset HDRI (CDN hit, warm cast) in favour of
            a hemisphere light that reads as cold deep space. */}
        <ambientLight intensity={0.48} color="#fff4d6" />
        <directionalLight position={[4, 3, 5]} intensity={1.9} color="#fff8e8" />
        <directionalLight position={[-3, 1, -4]} intensity={0.35} color="#d4c060" />
        <directionalLight position={[-4, -1, -3]} intensity={0.55} color="#c8a030" />
        <hemisphereLight args={['#1a2840', '#030a14', 0.45]} />

        <Suspense fallback={null}>
          {/* 3 500 stars — blue-white with varied brightness, reads as deep space */}
          <Stars
            radius={18}
            depth={6}
            count={3500}
            factor={1.8}
            saturation={0.5}
            fade
            speed={0}
          />

          {/* Atmosphere glow: BackSide Fresnel sphere, sits outside the rotating group */}
          <AtmosphereLayer />

          <group rotation={[0.12, -0.8, 0]}>
            {/* Atmosphere halo — rendered outside the ocean sphere */}
            <AtmosphereGlow />
            <OceanSphere />
            <CountryPolygonMeshLayer
              selectedCountryIso2={selectedCountryIso2}
              selectedCountryIso2s={selectedCountryIso2s}
              focusedCountryIso2={focusedCountryIso2}
              activeLayerId={activeLayerId}
              onHoverCountry={handleHoverCountry}
              onSelectCountry={onSelectCountry}
            />
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
        />

        {/*
          Post-processing effects — composed in a single render pass.
          multisampling={0}: MSAA disabled (required for SSAO normal-pass).
          enableNormalPass: provides the normal buffer SSAO needs for depth-aware occlusion.
        */}
        <EffectComposer multisampling={0} enableNormalPass>
          {/*
            SSAO — darkens the concave seams between raised country plates.
            radius=18: ~18px screen-space sampling radius, tuned to plate-edge scale.
            intensity=2.5: strong enough to see in the valleys, not so much it muddies flats.
            luminanceInfluence=0.9: keeps bright (lit) plate faces mostly unaffected.
          */}
          <SSAO
            blendFunction={BlendFunction.MULTIPLY}
            samples={16}
            rings={4}
            luminanceInfluence={0.9}
            radius={18}
            bias={0.5}
            intensity={2.5}
            worldDistanceThreshold={0.4}
            worldDistanceFalloff={0.1}
            worldProximityThreshold={0.06}
            worldProximityFalloff={0.04}
          />
          {/*
            Bloom — selected/hovered plates pulse above luminanceThreshold so their
            emissive glow bleeds into adjacent pixels, reading as internal light.
            mipmapBlur produces a natural, high-quality bloom without ringing.
          */}
          <Bloom
            luminanceThreshold={0.78}
            luminanceSmoothing={0.2}
            intensity={0.5}
            radius={0.7}
            mipmapBlur
          />
          {/*
            Vignette — darkens screen edges, pushes attention inward to the globe.
            offset/darkness tuned to feel like ambient edge fall-off, not a heavy frame.
          */}
          <Vignette eskil={false} offset={0.22} darkness={0.65} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
