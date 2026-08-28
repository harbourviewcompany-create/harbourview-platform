'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, Line } from '@react-three/drei'
import { DoubleSide } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { lonLatToVector3, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'
import { candidateBGlobeColors, candidateBGlobeConfig } from '@/lib/harbourview/globeConfig'
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from '@/components/globe/r3f/CameraFlyToController'

const {
  oceanBase: OCEAN_BASE,
  oceanEmissive: OCEAN_EMISSIVE,
  landBase: LAND_BASE,
  border: BORDER_COLOR,
  selectedLand: SELECTED_LAND,
  selectedEmissive: SELECTED_EMISSIVE,
} = candidateBGlobeColors

const { geometry, camera, rotation } = candidateBGlobeConfig

function CandidateBOcean() {
  return (
    <Sphere args={[2.35, 96, 96]}>
      <meshStandardMaterial
        color={OCEAN_BASE}
        emissive={OCEAN_EMISSIVE}
        emissiveIntensity={0.1}
        roughness={0.84}
        metalness={0.04}
      />
    </Sphere>
  )
}

function CandidateBBorders() {
  const borderLines = useMemo(() =>
    naturalEarthCountriesPayload.countries.flatMap((country) =>
      country.polygons.flatMap((polygon, polygonIndex) =>
        polygon.rings.map((ring, ringIndex) => ({
          key: `${country.iso3}-${polygonIndex}-${ringIndex}`,
          points: ring.points.map((point) =>
            vector3ToArray(lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET))
          ),
          isOuter: ring.kind === 'outer',
        }))
      )
    ), [])

  return (
    <group>
      {borderLines.map(({ key, points, isOuter }) => (
        <Line
          key={key}
          points={points}
          color={BORDER_COLOR}
          lineWidth={isOuter ? 0.48 : 0.22}
          transparent
          opacity={isOuter ? 0.34 : 0.16}
        />
      ))}
    </group>
  )
}

function CandidateBCountries({
  selectedCountryIso2,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  onSelectCountry?: (iso2: string) => void
}) {
  const idleGeometries = useMemo(() =>
    naturalEarthCountriesPayload.countries.map((country) => ({
      country,
      geometry: createCountryBufferGeometry(country, {
        plateLift: geometry.plateLift,
        extrusionHeight: geometry.idleExtrusion,
        geometryMode: 'surface',
      }),
    })), [])

  const selectedGeometry = useMemo(() => {
    if (!selectedCountryIso2) return null
    const country = naturalEarthCountriesPayload.countries.find(
      (c) => c.iso2 === selectedCountryIso2
    )
    if (!country) return null
    return {
      iso2: selectedCountryIso2,
      geometry: createCountryBufferGeometry(country, {
        plateLift: geometry.plateLift + 0.001,
        extrusionHeight: geometry.selectedExtrusion,
        geometryMode: 'surface',
      }),
    }
  }, [selectedCountryIso2])

  useEffect(() => {
    return () => {
      idleGeometries.forEach(({ geometry: countryGeometry }) => countryGeometry.dispose())
    }
  }, [idleGeometries])

  useEffect(() => {
    return () => {
      selectedGeometry?.geometry.dispose()
    }
  }, [selectedGeometry])

  return (
    <group userData={{ layer: 'candidate-b-countries' }}>
      {idleGeometries.map(({ country, geometry: countryGeometry }) => {
        const isSelected = selectedCountryIso2 === country.iso2
        const activeGeometry = isSelected && selectedGeometry ? selectedGeometry.geometry : countryGeometry

        return (
          <mesh
            key={country.iso3}
            geometry={activeGeometry}
            userData={{ iso2: country.iso2 }}
            onClick={(event) => {
              event.stopPropagation()
              const hit = extractCountryHit(event)
              if (hit) onSelectCountry?.(hit.iso2)
            }}
          >
            <meshStandardMaterial
              color={isSelected ? SELECTED_LAND : LAND_BASE}
              emissive={isSelected ? SELECTED_EMISSIVE : '#081827'}
              emissiveIntensity={isSelected ? 0.14 : 0.025}
              roughness={isSelected ? 0.76 : 0.88}
              metalness={0.04}
              side={DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface CandidateBGlobeProps {
  selectedCountryIso2?: string
  onSelectCountry?: (iso2: string) => void
  reducedMotion?: boolean
}

export function CandidateBGlobe({
  selectedCountryIso2,
  onSelectCountry,
  reducedMotion = false,
}: CandidateBGlobeProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)

  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="candidate-b-webgl-globe">
      <Canvas
        className="h-full w-full pointer-events-auto"
        dpr={[1, 1.5]}
        aria-label="Harbourview country globe"
        camera={{
          fov: camera.fov,
          near: camera.near,
          far: camera.far,
          position: camera.position,
        }}
      >
        <color attach="background" args={['#03070D']} />
        <ambientLight intensity={0.24} color="#c8deff" />
        <directionalLight position={[3, 4, 5]} intensity={0.72} color="#fff4e0" />

        <Suspense fallback={null}>
          <group rotation={rotation}>
            <CandidateBOcean />
            <CandidateBBorders />
            <CandidateBCountries
              selectedCountryIso2={selectedCountryIso2}
              onSelectCountry={onSelectCountry}
            />
          </group>

          <CameraFlyToController
            selectedCountryIso2={selectedCountryIso2}
            routerStep={selectedCountryIso2 ? 'role' : 'country'}
            controlsRef={controlsRef as RefObject<CameraFlyOrbitControlsLike | null>}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.072}
          rotateSpeed={0.36}
          minDistance={5.2}
          maxDistance={8.4}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.66}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.08}
        />
      </Canvas>
    </div>
  )
}
