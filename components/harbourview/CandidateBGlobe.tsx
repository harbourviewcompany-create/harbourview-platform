'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, Line } from '@react-three/drei'
import { BufferAttribute, Color, DoubleSide, Vector3 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import {
  lonLatToVector3,
  vector3ToArray,
  BORDER_OFFSET,
} from '@/lib/globe/globe-geometry'
import {
  CameraFlyToController,
  type CameraFlyOrbitControlsLike,
} from '@/components/globe/r3f/CameraFlyToController'

// Candidate B visual constants — dark enamel with machined metallic-gold country plates
const OCEAN_BASE = '#040d18'
const OCEAN_EMISSIVE = '#071525'
const LAND_BASE = '#9f742a'
const LAND_SHADOW = '#4f3011'
const LAND_HIGHLIGHT = '#f4d98e'
const LAND_CHAMPAGNE = '#fff0bd'
const BORDER_COLOR = '#edca78'
const BORDER_SHADOW = '#6a4218'
const SELECTED_LAND = '#d5a64d'
const SELECTED_SHADOW = '#73501f'
const SELECTED_HIGHLIGHT = '#fff1b8'
const SELECTED_EMISSIVE = '#b9822f'

const PLATE_LIFT = 0.022
const IDLE_EXTRUSION = 0.052
const SELECTED_EXTRUSION = 0.088

const KEY_LIGHT_VECTOR = new Vector3(-0.46, 0.62, 0.64).normalize()
const FILL_LIGHT_VECTOR = new Vector3(0.62, -0.18, 0.76).normalize()
const VIEW_VECTOR = new Vector3(0, 0, 1)

type MetallicGoldPalette = {
  base: string
  shadow: string
  highlight: string
  champagne: string
}

const IDLE_GOLD_PALETTE: MetallicGoldPalette = {
  base: LAND_BASE,
  shadow: LAND_SHADOW,
  highlight: LAND_HIGHLIGHT,
  champagne: LAND_CHAMPAGNE,
}

const SELECTED_GOLD_PALETTE: MetallicGoldPalette = {
  base: SELECTED_LAND,
  shadow: SELECTED_SHADOW,
  highlight: SELECTED_HIGHLIGHT,
  champagne: LAND_CHAMPAGNE,
}

function pseudoRandom(value: number) {
  return (Math.sin(value) * 43758.5453123) % 1
}

function applyMachinedGoldVertexColors(
  geometry: ReturnType<typeof createCountryBufferGeometry>,
  palette: MetallicGoldPalette,
) {
  const position = geometry.getAttribute('position') as
    | BufferAttribute
    | undefined

  if (!position) return geometry

  const base = new Color(palette.base)
  const shadow = new Color(palette.shadow)
  const highlight = new Color(palette.highlight)
  const champagne = new Color(palette.champagne)
  const normal = new Vector3()
  const color = new Color()
  const colors = new Float32Array(position.count * 3)

  for (let i = 0; i < position.count; i += 1) {
    normal.set(position.getX(i), position.getY(i), position.getZ(i)).normalize()

    const longitude = Math.atan2(normal.z, normal.x)
    const latitude = Math.asin(normal.y)
    const key = Math.max(normal.dot(KEY_LIGHT_VECTOR), 0)
    const fill = Math.max(normal.dot(FILL_LIGHT_VECTOR), 0)
    const facing = Math.max(normal.dot(VIEW_VECTOR), 0)
    const rim = Math.pow(1 - facing, 2.2)
    const brushed = Math.sin(longitude * 42 + latitude * 13) * 0.5 + 0.5
    const engraved = Math.sin(latitude * 74 + longitude * 5) * 0.5 + 0.5
    const grain = Math.abs(
      pseudoRandom(
        (normal.x * 13.17 + normal.y * 71.9 + normal.z * 29.4) * 91.7,
      ),
    )
    const highlightMix = Math.min(
      1,
      Math.pow(key, 1.85) * 0.78 + Math.pow(fill, 3.2) * 0.22,
    )
    const shadowMix = Math.min(
      0.82,
      Math.pow(1 - key, 1.35) * 0.58 + rim * 0.18,
    )
    const brushLift =
      (brushed - 0.5) * 0.14 + (engraved - 0.5) * 0.075 + (grain - 0.5) * 0.045

    color.copy(base)
    color.lerp(shadow, shadowMix)
    color.lerp(highlight, Math.min(0.72, highlightMix + brushLift))
    color.lerp(champagne, Math.max(0, Math.pow(key, 8.0) * 0.34 + rim * 0.16))

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

// Europe-forward camera aimed at Central Europe / Germany
const CANDIDATE_B_CAMERA = {
  fov: 28,
  near: 0.1,
  far: 100,
  position: [0.62, 4.8, 4.6] as [number, number, number],
}

// Slight tilt + minimal y-rotation to bring Germany to center
const GLOBE_ROTATION: [number, number, number] = [0.08, -0.18, 0]

function createMachinedGoldShader(selected: boolean) {
  const highlightStrength = selected ? '0.62' : '0.46'
  const brushStrength = selected ? '0.20' : '0.15'
  const rimStrength = selected ? '0.18' : '0.12'
  const shadowStrength = selected ? '0.22' : '0.30'

  return (shader: { vertexShader: string; fragmentShader: string }) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vMachinedObjectNormal;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
vMachinedObjectNormal = normalize(normal);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vMachinedObjectNormal;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 machinedNormal = normalize(vMachinedObjectNormal);
        vec3 machinedKey = normalize(vec3(-0.46, 0.62, 0.64));
        vec3 machinedFill = normalize(vec3(0.62, -0.18, 0.76));
        float machinedLongitude = atan(machinedNormal.z, machinedNormal.x);
        float machinedLatitude = asin(machinedNormal.y);
        float machinedKeyLight = max(dot(machinedNormal, machinedKey), 0.0);
        float machinedFillLight = max(dot(machinedNormal, machinedFill), 0.0);
        float machinedBrush = sin(machinedLongitude * 86.0 + machinedLatitude * 18.0) * 0.5 + 0.5;
        float machinedEngraving = sin(machinedLatitude * 116.0 - machinedLongitude * 9.0) * 0.5 + 0.5;
        float machinedFineGrain = sin((machinedNormal.x * 41.0 + machinedNormal.y * 73.0 + machinedNormal.z * 29.0) * 37.0) * 0.5 + 0.5;
        float machinedRim = pow(1.0 - clamp(abs(machinedNormal.z), 0.0, 1.0), 2.1);
        float machinedSpecular = pow(machinedKeyLight, 6.0) * ${highlightStrength} + pow(machinedFillLight, 8.0) * 0.18 + machinedRim * ${rimStrength};
        vec3 machinedShadow = vec3(0.27, 0.16, 0.055);
        vec3 machinedHighlight = vec3(1.0, 0.86, 0.48);
        vec3 machinedChampagne = vec3(1.0, 0.94, 0.70);
        diffuseColor.rgb = mix(diffuseColor.rgb, machinedShadow, (1.0 - machinedKeyLight) * ${shadowStrength});
        diffuseColor.rgb = mix(diffuseColor.rgb, machinedHighlight, clamp(machinedSpecular + (machinedBrush - 0.5) * ${brushStrength}, 0.0, 0.74));
        diffuseColor.rgb = mix(diffuseColor.rgb, machinedChampagne, pow(machinedKeyLight, 14.0) * 0.24);
        diffuseColor.rgb *= 0.93 + machinedBrush * 0.13 + machinedFineGrain * 0.035 - machinedEngraving * 0.045;`,
      )
  }
}

const idleMachinedGoldShader = createMachinedGoldShader(false)
const selectedMachinedGoldShader = createMachinedGoldShader(true)

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
  const borderLines = useMemo(
    () =>
      naturalEarthCountriesPayload.countries.flatMap((country) =>
        country.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => ({
            key: `${country.iso3}-${polygonIndex}-${ringIndex}`,
            points: ring.points.map((point) =>
              vector3ToArray(
                lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET),
              ),
            ),
            isOuter: ring.kind === 'outer',
          })),
        ),
      ),
    [],
  )

  return (
    <group>
      {borderLines.map(({ key, points, isOuter }) => (
        <Line
          key={key}
          points={points}
          color={BORDER_SHADOW}
          lineWidth={isOuter ? 1.12 : 0.5}
          transparent
          opacity={isOuter ? 0.36 : 0.2}
        />
      ))}
      {borderLines.map(({ key, points, isOuter }) => (
        <Line
          key={`${key}-bevel-highlight`}
          points={points}
          color={BORDER_COLOR}
          lineWidth={isOuter ? 0.58 : 0.26}
          transparent
          opacity={isOuter ? 0.72 : 0.38}
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
  const idleGeometries = useMemo(
    () =>
      naturalEarthCountriesPayload.countries.map((country) => ({
        country,
        geometry: applyMachinedGoldVertexColors(
          createCountryBufferGeometry(country, {
            plateLift: PLATE_LIFT,
            extrusionHeight: IDLE_EXTRUSION,
            geometryMode: 'surface',
          }),
          IDLE_GOLD_PALETTE,
        ),
      })),
    [],
  )

  const selectedGeometry = useMemo(() => {
    if (!selectedCountryIso2) return null
    const country = naturalEarthCountriesPayload.countries.find(
      (c) => c.iso2 === selectedCountryIso2,
    )
    if (!country) return null
    return {
      iso2: selectedCountryIso2,
      geometry: applyMachinedGoldVertexColors(
        createCountryBufferGeometry(country, {
          plateLift: PLATE_LIFT + 0.002,
          extrusionHeight: SELECTED_EXTRUSION,
          geometryMode: 'surface',
        }),
        SELECTED_GOLD_PALETTE,
      ),
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
        const activeGeometry =
          isSelected && selectedGeometry ? selectedGeometry.geometry : geometry

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
            <meshPhysicalMaterial
              vertexColors
              color="#ffffff"
              emissive={isSelected ? SELECTED_EMISSIVE : '#2b1807'}
              emissiveIntensity={isSelected ? 0.08 : 0.025}
              metalness={isSelected ? 0.88 : 0.78}
              roughness={isSelected ? 0.26 : 0.34}
              clearcoat={isSelected ? 0.42 : 0.26}
              clearcoatRoughness={isSelected ? 0.18 : 0.28}
              reflectivity={isSelected ? 0.72 : 0.54}
              onBeforeCompile={
                isSelected ? selectedMachinedGoldShader : idleMachinedGoldShader
              }
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

export function CandidateBGlobe({
  selectedCountryIso2,
  onSelectCountry,
}: CandidateBGlobeProps) {
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
        <ambientLight intensity={0.16} color="#8ca7c5" />
        <hemisphereLight args={['#ffe7b2', '#07121f', 0.34]} />
        <directionalLight
          position={[-3.8, 5.4, 4.8]}
          intensity={1.7}
          color="#fff1c8"
        />
        <directionalLight
          position={[4.8, -1.4, 3.6]}
          intensity={0.58}
          color="#b9d8ff"
        />
        <pointLight
          position={[-4.2, 1.2, -3.4]}
          intensity={1.8}
          color="#d7a64b"
          distance={8.5}
        />

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
            controlsRef={
              controlsRef as RefObject<CameraFlyOrbitControlsLike | null>
            }
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
