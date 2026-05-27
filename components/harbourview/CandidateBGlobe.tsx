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
import { CameraFlyToController, type CameraFlyOrbitControlsLike } from '@/components/globe/r3f/CameraFlyToController'

// Candidate B visual constants — dark, restrained, intelligence surface
const OCEAN_BASE = '#040d18'
const OCEAN_EMISSIVE = '#071525'
const LAND_BASE = '#0d1e2d'
const BORDER_COLOR = '#c6a55a'
const SELECTED_LAND = '#183048'
const SELECTED_EMISSIVE = '#c8a85e'

const PLATE_LIFT = 0.022
const IDLE_EXTRUSION = 0.052
const SELECTED_EXTRUSION = 0.088

// Europe-forward camera aimed at Central Europe / Germany
const CANDIDATE_B_CAMERA = {
  fov: 28,
  near: 0.1,
  far: 100,
  position: [0.62, 4.8, 4.6] as [number, number, number],
}

// Slight tilt + minimal y-rotation to bring Germany to center
const GLOBE_ROTATION: [number, number, number] = [0.08, -0.18, 0]

function CandidateBOcean() {
  return (
    <Sphere args={[2.35, 96, 96]}>
      <meshStandardMaterial
        color={OCEAN_BASE}
        emissive={OCEAN_EMISSIVE}
        emissiveIntensity={0.14}
        roughness={0.72}
        metalness={0.38}
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
          lineWidth={isOuter ? 0.72 : 0.32}
          transparent
          opacity={isOuter ? 0.52 : 0.28}
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
        plateLift: PLATE_LIFT,
        extrusionHeight: IDLE_EXTRUSION,
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
        plateLift: PLATE_LIFT + 0.002,
        extrusionHeight: SELECTED_EXTRUSION,
        geometryMode: 'surface',
      }),
    }
  }, [selectedCountryIso2])

  useEffect(() => {
    return () => {
      idleGeometries.forEach(({ geometry }) => geometry.dispose())
    }
  }, [idleGeometries])

  useEffect(() => {
    return () => {
      selectedGeometry?.geometry.dispose()
    }
  }, [selectedGeometry])

  return (
    <group userData={{ layer: 'candidate-b-countries' }}>
      {idleGeometries.map(({ country, geometry }) => {
        const isSelected = selectedCountryIso2 === country.iso2
        const activeGeometry = isSelected && selectedGeometry ? selectedGeometry.geometry : geometry

        return (
          <mesh
            key={country.iso3}
            geometry={activeGeometry}
            userData={{ iso2: country.iso2 }}
            onClick={(e) => {
              e.stopPropagation()
              const hit = extractCountryHit(e)
              if (hit) onSelectCountry?.(hit.iso2)
            }}
          >
            <meshStandardMaterial
              color={isSelected ? SELECTED_LAND : LAND_BASE}
              emissive={isSelected ? SELECTED_EMISSIVE : '#0a1a28'}
              emissiveIntensity={isSelected ? 0.26 : 0.06}
              roughness={isSelected ? 0.52 : 0.76}
              metalness={isSelected ? 0.28 : 0.18}
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
}

export function CandidateBGlobe({ selectedCountryIso2, onSelectCountry }: CandidateBGlobeProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null)

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        className="h-full w-full pointer-events-auto"
        dpr={[1, 1.5]}
        aria-label="Harbourview country globe"
        camera={{
          fov: CANDIDATE_B_CAMERA.fov,
          near: CANDIDATE_B_CAMERA.near,
          far: CANDIDATE_B_CAMERA.far,
          position: CANDIDATE_B_CAMERA.position,
        }}
      >
        <color attach="background" args={['#03070D']} />
        <ambientLight intensity={0.28} color="#c8deff" />
        <directionalLight position={[3, 4, 5]} intensity={0.9} color="#fff4e0" />

        <Suspense fallback={null}>
          <group rotation={GLOBE_ROTATION}>
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
          rotateSpeed={0.44}
          minDistance={5.2}
          maxDistance={8.4}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.66}
          autoRotate
          autoRotateSpeed={0.18}
        />
      </Canvas>
    </div>
  )
}
