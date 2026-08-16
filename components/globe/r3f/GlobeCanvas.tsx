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
  introTierBlend,
  isIntroInteractionLocked,
  shouldFinishReveal,
  shouldForceGoldPlates,
  shouldStartReveal,
  type GlobeIntroPhase,
} from '@/lib/globe/globe-intro'

function AutoRotateInvalidator({ active }: { active: boolean }) {
  useFrame((state) => {
    if (active) state.invalidate()
  })
  return null
}

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

function IntroRevealClock({
  active,
  onElapsed,
}: {
  active: boolean
  onElapsed: (elapsedMs: number) => void
}) {
  const startedAtRef = useRef<number | null>(null)

  useFrame((state) => {
    if (!active) return
    const now = performance.now()
    if (startedAtRef.current === null) startedAtRef.current = now
    onElapsed(now - startedAtRef.current)
    state.invalidate()
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
  const [revealElapsedMs, setRevealElapsedMs] = useState(0)
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
  const interactionLocked = isIntroInteractionLocked({ introPhase, prefersReducedMotion })
  const tierBlend = introTierBlend({
    introPhase,
    revealElapsedMs,
    prefersReducedMotion,
  })

  // During spinning: omit tiers. During reveal/ready: pass real tier map so
  // the mesh layer can lerp gold → heat.
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
      if (interactionLocked) return
      invalidateRef.current?.()
      onHoverCountry?.(iso2)
    },
    [onHoverCountry, interactionLocked],
  )

  const handleSelectCountry = useCallback(
    (iso2: string) => {
      if (interactionLocked) return
      onSelectCountry?.(iso2)
    },
    [onSelectCountry, interactionLocked],
  )

  const tryAdvanceFromSpin = useCallback(() => {
    if (introPhase !== 'spinning') return
    if (
      !shouldStartReveal({
        spinElapsedMs: spinElapsedMsRef.current,
        loading,
        prefersReducedMotion,
      })
    ) {
      return
    }
    if (prefersReducedMotion) {
      setIntroPhase('ready')
      return
    }
    setRevealElapsedMs(0)
    setIntroPhase('revealing')
  }, [introPhase, loading, prefersReducedMotion])

  useEffect(() => {
    tryAdvanceFromSpin()
  }, [tryAdvanceFromSpin, loading])

  const handleSpinElapsed = useCallback(
    (elapsedMs: number) => {
      spinElapsedMsRef.current = elapsedMs
      tryAdvanceFromSpin()
    },
    [tryAdvanceFromSpin],
  )

  const handleRevealElapsed = useCallback(
    (elapsedMs: number) => {
      setRevealElapsedMs(elapsedMs)
      if (
        introPhase === 'revealing' &&
        shouldFinishReveal({ revealElapsedMs: elapsedMs, prefersReducedMotion })
      ) {
        setIntroPhase('ready')
      }
    },
    [introPhase, prefersReducedMotion],
  )

  const isHovering = !!focusedCountryIso2
  const isSelected = !!selectedCountryIso2
  const introSpinning = introPhase === 'spinning' && !prefersReducedMotion
  const introRevealing = introPhase === 'revealing' && !prefersReducedMotion
  const shouldAutoRotate =
    introSpinning || introRevealing || (!isHovering && !isSelected && introPhase === 'ready')
  const autoRotateSpeed = introSpinning
    ? GLOBE_INTRO.spinAutoRotateSpeed
    : introRevealing
      ? GLOBE_CAMERA_CONFIG.autoRotateSpeed * 2.4
      : GLOBE_CAMERA_CONFIG.autoRotateSpeed

  return (
    <div
      className={className ?? 'absolute inset-0 pointer-events-none'}
      style={{ cursor: !interactionLocked && isHovering ? 'pointer' : 'default' }}
      data-globe-intro={introPhase}
      data-globe-force-gold={forceGold ? 'true' : 'false'}
      data-globe-tier-blend={tierBlend.toFixed(3)}
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
          <Stars radius={30} depth={10} count={3500} factor={1.2} saturation={0} fade speed={0} />

          <group rotation={[0.08, 0.3, 0]}>
            <AtmosphereGlow />
            <OceanSphere />
            <CountryPolygonMeshLayer
              selectedCountryIso2={selectedCountryIso2}
              subNationalIso2s={subNationalIso2s}
              selectedCountryIso2s={selectedCountryIso2s}
              focusedCountryIso2={interactionLocked ? undefined : focusedCountryIso2}
              activeLayerId={activeLayerId}
              tierByIso2={tierByIso2}
              tierPalette={tierPalette}
              introTierBlend={tierBlend}
              onHoverCountry={handleHoverCountry}
              onSelectCountry={handleSelectCountry}
            />
            <DataVizLayer countries={liveData.countries} signalsByIso2={liveData.signalsByIso2} />
            <CountryBorderLayer />
            {!interactionLocked && focusedCountryIso2 && <CountryGlobeLabel iso2={focusedCountryIso2} />}
          </group>
          <CameraFlyToController
            selectedCountryIso2={selectedCountryIso2}
            routerStep={routerStep}
            controlsRef={controlsRef as RefObject<CameraFlyOrbitControlsLike | null>}
          />
        </Suspense>

        <AutoRotateInvalidator active={shouldAutoRotate} />
        <IntroSpinClock active={introSpinning} onElapsed={handleSpinElapsed} />
        <IntroRevealClock active={introRevealing} onElapsed={handleRevealElapsed} />
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
          enableZoom={!interactionLocked && GLOBE_CAMERA_CONFIG.enableZoom}
          enableRotate={!interactionLocked}
          minAzimuthAngle={GLOBE_CAMERA_CONFIG.minAzimuthAngle}
          maxAzimuthAngle={GLOBE_CAMERA_CONFIG.maxAzimuthAngle}
        />
      </Canvas>
    </div>
  )
}
