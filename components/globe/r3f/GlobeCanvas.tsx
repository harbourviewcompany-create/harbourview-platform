'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { GlobeTierPalette, RegulatoryTier } from '@/lib/globe/globe-materials'
import { featureFlags } from '@/lib/harbourview/feature-flags'
import {
  GLOBE_INTRO,
  shouldCompleteIntro,
  shouldForceGoldPlates,
  type GlobeIntroPhase,
} from '@/lib/globe/globe-intro'

// Keeps frameloop="demand" alive while OrbitControls autoRotate is active.
// OrbitControls does not call state.invalidate() internally, so without this
// the globe freezes on initial load when nothing has been interacted with yet.
function AutoRotateInvalidator({ active }: { active: boolean }) {
  useFrame((state) => {
    if (active) state.invalidate()
  })
  return null
}

/**
 * Drives the gold intro orbit on wall-clock time and notifies when the spin
 * window has elapsed. Parent combines this with `loading` to unlock tiers.
 */
function IntroSpinClock({
  active,
  onElapsed,
}: {
  active: boolean
  onElapsed: (elapsedMs: number) => void
}) {
  const startedAtRef = useRef<number | null>(null)

  useFrame(() => {
    if (!active) return
    const now = performance.now()
    if (startedAtRef.current === null) startedAtRef.current = now
    onElapsed(now - startedAtRef.current)
  })

  useEffect(() => {
    if (!active) startedAtRef.current = null
  }, [active])

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
  tierPalette = 'metal',
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
  tierPalette?: GlobeTierPalette
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)
  const { liveData, loading } = useGlobe()
  const [introPhase, setIntroPhase] = useState<GlobeIntroPhase>('spinning')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const spinElapsedMsRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setPrefersReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const forceGold = shouldForceGoldPlates({ introPhase, prefersReducedMotion })

  // iso2 → reviewed tier. Undefined when the flag is off OR during the gold
  // intro, which forces every plate through the neutral gold material path.
  const tierByIso2 = useMemo(() => {
    if (forceGold) return undefined
    if (!featureFlags.globeRegulatoryTiers) return undefined
    const map: Record<string, RegulatoryTier> = {}
    for (const country of liveData.countries) {
      if (country.regulatoryTier) map[country.iso2] = country.regulatoryTier
    }
    return map
  }, [liveData.countries, forceGold])

  const isCountryState = routerStep === 'country' || !selectedCountryIso2
  const distanceLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.distanceByState.country
    : GLOBE_CAMERA_CONFIG.distanceByState.selected
  const polarLimits = isCountryState
    ? GLOBE_CAMERA_CONFIG.polarByState.country
    : GLOBE_CAMERA_CONFIG.polarByState.selected

  const invalidateRef = useRef<(() => void) | null>(null)
  const handleHoverCountry = useCallback(
    (iso2?: string) => {
      if (forceGold) return
      invalidateRef.current?.()
      onHoverCountry?.(iso2)
    },
    [onHoverCountry, forceGold],
  )

  const handleSelectCountry = useCallback(
    (iso2: string) => {
      if (forceGold) return
      onSelectCountry?.(iso2)
    },
    [onSelectCountry, forceGold],
  )

  const tryCompleteIntro = useCallback(() => {
    if (introPhase === 'ready') return
    if (
      shouldCompleteIntro({
        spinElapsedMs: spinElapsedMsRef.current,
        loading,
        prefersReducedMotion,
      })
    ) {
      setIntroPhase('ready')
    }
  }, [introPhase, loading, prefersReducedMotion])

  useEffect(() => {
    tryCompleteIntro()
  }, [tryCompleteIntro, loading])

  const handleSpinElapsed = useCallback(
    (elapsedMs: number) => {
      spinElapsedMsRef.current = elapsedMs
      tryCompleteIntro()
    },
    [tryCompleteIntro],
  )

  // Auto-rotate: forced during intro; idle rules after ready.
  const isHovering = !!focusedCountryIso2
  const isSelected = !!selectedCountryIso2
  const introSpinning = forceGold && !prefersReducedMotion
  const shouldAutoRotate = introSpinning || (!isHovering && !isSelected)
  const autoRotateSpeed = introSpinning
    ? GLOBE_INTRO.spinAutoRotateSpeed
    : GLOBE_CAMERA_CONFIG.autoRotateSpeed

  return (
    <div
      className={className ?? 'absolute inset-0 pointer-events-none'}
      style={{ cursor: !forceGold && isHovering ? 'pointer' : 'default' }}
      data-globe-intro={introPhase}
      data-globe-force-gold={forceGold ? 'true' : 'false'}
    >
      <Canvas
        className="h-full w-full pointer-events-auto"
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
          state.gl.toneMapping = ACESFilmicToneMapping
          state.gl.toneMappingExposure = 0.54
          invalidateRef.current = state.invalidate
        }}
      >
        <color attach="background" args={['#010810']} />
        <MetallicEnvironment />

        <ambientLight intensity={0.22} color="#f4dfad" />
        <directionalLight position={[4.5, 0.6, 4.2]} intensity={0.62} color="#fff3c4" />
        <directionalLight position={[-4.8, -0.4, -3.5]} intensity={0.26} color="#c99f4a" />
        <hemisphereLight args={['#243b5e', '#080409', 0.26]} />

        <Suspense fallback={null}>
          <Stars
            radius={30}
            depth={10}
            count={3500}
            factor={1.2}
            saturation={0}
            fade
            speed={0}
          />

          <group rotation={[0.08, 0.3, 0]}>
            <AtmosphereGlow />
            <OceanSphere />
            <CountryPolygonMeshLayer
              selectedCountryIso2={selectedCountryIso2}
              subNationalIso2s={subNationalIso2s}
              selectedCountryIso2s={selectedCountryIso2s}
              focusedCountryIso2={forceGold ? undefined : focusedCountryIso2}
              activeLayerId={activeLayerId}
              tierByIso2={tierByIso2}
              tierPalette={tierPalette}
              onHoverCountry={handleHoverCountry}
              onSelectCountry={handleSelectCountry}
            />
            <DataVizLayer countries={liveData.countries} signalsByIso2={liveData.signalsByIso2} />
            <CountryBorderLayer />
            {!forceGold && focusedCountryIso2 && <CountryGlobeLabel iso2={focusedCountryIso2} />}
          </group>
          <CameraFlyToController
            selectedCountryIso2={selectedCountryIso2}
            routerStep={routerStep}
            controlsRef={controlsRef as RefObject<CameraFlyOrbitControlsLike | null>}
          />
        </Suspense>

        <AutoRotateInvalidator active={shouldAutoRotate} />
        <IntroSpinClock active={introSpinning} onElapsed={handleSpinElapsed} />
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
          autoRotateSpeed={autoRotateSpeed}
          enableZoom={!forceGold && GLOBE_CAMERA_CONFIG.enableZoom}
          enableRotate={!forceGold}
          minAzimuthAngle={GLOBE_CAMERA_CONFIG.minAzimuthAngle}
          maxAzimuthAngle={GLOBE_CAMERA_CONFIG.maxAzimuthAngle}
        />
      </Canvas>
    </div>
  )
}
