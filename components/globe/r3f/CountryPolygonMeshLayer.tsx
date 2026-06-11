'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { FrontSide, BackSide, AdditiveBlending, type MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { germanyBundeslaender } from '@/data/globe/germany-bundeslaender'
import { australiaStates } from '@/data/globe/australia-states'

// Sub-national entries keyed by parent iso2.
// US is always expanded (state-level cannabis law relevance).
// All others expand only when explicitly requested (e.g. in BriefingRoom).
const SUB_NATIONALS: Record<string, (typeof canadaProvinces[number])[]> = {
  CA: canadaProvinces,
  US: usStates,
  DE: germanyBundeslaender,
  AU: australiaStates,
}

function buildGlobeEntries(subNationalIso2s: string[]) {
  const expanded = new Set(subNationalIso2s)
  expanded.add('US') // US always split
  const excluded = new Set(Object.keys(SUB_NATIONALS).filter(k => expanded.has(k)))
  return [
    ...naturalEarthCountriesPayload.countries.filter(c => !excluded.has(c.iso2)),
    ...Array.from(expanded).flatMap(iso2 => SUB_NATIONALS[iso2] ?? []),
  ]
}
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { applyMetallicGoldShader, getMetallicGoldProgramCacheKey, type MetallicGoldShader } from '@/lib/globe/metallic-gold-shader'
import { PLATE_LIFT, IDLE_EXTRUSION, SELECTED_EXTRUSION, SELECTED_GLOW, LOD_SIMPLIFY_TOLERANCE } from '@/lib/globe/globe-plate-config'
import type { GlobeLayerId } from '@/types/globe-router'
const SPECULAR_CAP = 0.42

// Countries whose bbox area (lon-span × lat-span) is below this threshold get an
// inflated invisible hit mesh so they're tappable on mobile.
const SMALL_COUNTRY_BBOX_THRESHOLD_DEG2 = 8

function bboxArea(bbox: [number, number, number, number]) {
  return Math.abs(bbox[2] - bbox[0]) * Math.abs(bbox[3] - bbox[1])
}

// All renderable entries: provinces replace CA, states replace US
// globeEntries is now computed per render via buildGlobeEntries(subNationalIso2s)

function HoverPulseMesh({
  geometry,
  hitGeometry,
  color,
  emissive,
  emissiveIntensity,
  roughness,
  metalness,
  clearcoat,
  clearcoatRoughness,
  reflectivity,
  isFocused,
  isSelected,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
  geometry: ReturnType<typeof createCountryBufferGeometry>
  hitGeometry?: ReturnType<typeof createCountryBufferGeometry>
  color: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  isFocused: boolean
  isSelected: boolean
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const matRef = useRef<MeshPhysicalMaterial>(null)
  const targetRef = useRef(emissiveIntensity)

  useEffect(() => {
    targetRef.current = isFocused ? Math.max(emissiveIntensity, 0.36) : emissiveIntensity
  }, [isFocused, emissiveIntensity])

  const metallicGoldShader = useMemo(() => {
    return (shader: MetallicGoldShader) => applyMetallicGoldShader(shader, { isFocused, isSelected })
  }, [isFocused, isSelected])

  useFrame((state, delta) => {
    if (!matRef.current) return
    const cur = matRef.current.emissiveIntensity
    const tgt = targetRef.current
    if (Math.abs(cur - tgt) < 0.001) return
    // Pulse is still animating — request the next frame (#4)
    state.invalidate()
    matRef.current.emissiveIntensity = cur + (tgt - cur) * Math.min(delta * 9, 1)
  })

  return (
    <>
      {/* Visual mesh — renders the country plate. Polygon offset and stable renderOrder keep selected and idle plates above the ocean without fighting boundary strokes. */}
      <mesh geometry={geometry} renderOrder={20}>
        <meshPhysicalMaterial
          ref={matRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
          reflectivity={reflectivity}
          envMapIntensity={isSelected ? 1.18 : isFocused ? 1.02 : 0.86}
          specularIntensity={isSelected ? 1.05 : isFocused ? 0.96 : 0.82}
          sheen={isSelected ? 0.32 : 0.18}
          sheenColor={isSelected ? '#fff0b8' : '#d5a642'}
          sheenRoughness={0.42}
          iridescence={isSelected ? 0.12 : 0.06}
          iridescenceIOR={1.35}
          onBeforeCompile={metallicGoldShader}
          customProgramCacheKey={() => getMetallicGoldProgramCacheKey({ isFocused, isSelected })}
          side={FrontSide}
          depthTest
          depthWrite
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      {isSelected ? (
        <>
          <mesh geometry={geometry} scale={1.004} renderOrder={24}>
            <meshBasicMaterial
              color={SELECTED_GLOW}
              transparent
              opacity={0.12}
              blending={AdditiveBlending}
              side={BackSide}
              depthTest
              depthWrite={false}
            />
          </mesh>
          <mesh geometry={geometry} scale={1.0018} renderOrder={25}>
            <meshBasicMaterial
              color="#fff0b8"
              transparent
              opacity={0.075}
              blending={AdditiveBlending}
              side={FrontSide}
              depthTest
              depthWrite={false}
            />
          </mesh>
        </>
      ) : null}
      {/* Hit mesh — inflated invisible surface for pointer events.
          For large countries this is the same geometry. For small countries
          (Singapore, Luxembourg, UAE, etc.) it's larger, improving tap accuracy. */}
      <mesh
        geometry={hitGeometry ?? geometry}
        visible={false}
        renderOrder={40}
        onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter() }}
        onPointerLeave={(e) => { e.stopPropagation(); onPointerLeave() }}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      />
    </>
  )
}

export function CountryPolygonMeshLayer({
  selectedCountryIso2,
  subNationalIso2s = [],
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
  onHoverCountry,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  subNationalIso2s?: string[]
  focusedCountryIso2?: string
  selectedCountryIso2s: string[]
  activeLayerId: GlobeLayerId
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const globeEntries = useMemo(
    () => buildGlobeEntries(subNationalIso2s),
    // Stringify so a new array ref with same contents doesn't rebuild all geometries
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subNationalIso2s.slice().sort().join(',')],
  )

  const idleGeometries = useMemo(
    () =>
      globeEntries.map((entry) => ({
        entry,
        geometry: createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'extruded',
          simplifyTolerance: LOD_SIMPLIFY_TOLERANCE.medium,
        }),
        // Inflated hit geometry for small countries — larger plateLift pushes it
        // slightly above the visual mesh so raycasting hits it first
        hitGeometry:
          bboxArea(entry.bbox) < SMALL_COUNTRY_BBOX_THRESHOLD_DEG2
            ? createCountryBufferGeometry(entry, {
                plateLift: PLATE_LIFT + 0.06,
                extrusionHeight: IDLE_EXTRUSION + 0.04,
                geometryMode: 'surface',
              })
            : undefined,
      })),
    [globeEntries],
  )

  useEffect(() => {
    return () => {
      idleGeometries.forEach(({ geometry, hitGeometry }) => {
        geometry.dispose()
        hitGeometry?.dispose()
      })
    }
  }, [idleGeometries])

  const selectedSet = useMemo(() => {
    const set = new Set<string>(selectedCountryIso2s)
    if (selectedCountryIso2) set.add(selectedCountryIso2)
    // If CA is selected, highlight all provinces
    if (selectedCountryIso2 === 'CA' || selectedCountryIso2s.includes('CA')) {
      canadaProvinces.forEach((p) => set.add(p.iso2))
    }
    // If US is selected, highlight all states
    if (selectedCountryIso2 === 'US' || selectedCountryIso2s.includes('US')) {
      usStates.forEach((s) => set.add(s.iso2))
    }
    return set
  }, [selectedCountryIso2, selectedCountryIso2s])

  const extrudedGeometries = useMemo(() => {
    if (selectedSet.size === 0) return new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    const map = new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    for (const entry of globeEntries) {
      if (!selectedSet.has(entry.iso2)) continue
      map.set(
        entry.iso2,
        createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT + 0.002,
          extrusionHeight: SELECTED_EXTRUSION,
          geometryMode: 'extruded',
        }),
      )
    }
    return map
  }, [selectedSet, globeEntries])

  useEffect(() => {
    return () => {
      extrudedGeometries.forEach((geometry) => geometry.dispose())
    }
  }, [extrudedGeometries])

  return (
    <group renderOrder={20} userData={{ layer: 'country-polygon-meshes' }}>
      {idleGeometries.map(({ entry, geometry, hitGeometry }) => {
        const isSelected = selectedSet.has(entry.iso2)
        const activeGeometry = isSelected ? extrudedGeometries.get(entry.iso2) ?? geometry : geometry
        const visualState = isSelected
          ? 'selected'
          : focusedCountryIso2 === entry.iso2
            ? 'focused'
            : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <HoverPulseMesh
            key={entry.iso3}
            geometry={activeGeometry}
            hitGeometry={isSelected ? undefined : hitGeometry}
            color={material.plateBase}
            emissive={material.emissive}
            emissiveIntensity={material.emissiveIntensity}
            roughness={material.roughness}
            metalness={material.metalness}
            clearcoat={material.clearcoat}
            clearcoatRoughness={material.clearcoatRoughness}
            reflectivity={SPECULAR_CAP}
            isFocused={focusedCountryIso2 === entry.iso2}
            isSelected={visualState === 'selected'}
            onPointerEnter={() => onHoverCountry?.(entry.iso2)}
            onPointerLeave={() => onHoverCountry?.(undefined)}
            onClick={() => { onSelectCountry?.(entry.iso2) }}
          />
        )
      })}
    </group>
  )
}
