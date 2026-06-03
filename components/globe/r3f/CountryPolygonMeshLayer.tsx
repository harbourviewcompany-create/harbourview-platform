'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { FrontSide, type MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { PLATE_LIFT, IDLE_EXTRUSION, SELECTED_EXTRUSION } from '@/lib/globe/globe-plate-config'
import type { GlobeLayerId } from '@/types/globe-router'
const SPECULAR_CAP = 0.24

// Countries whose bbox area (lon-span × lat-span) is below this threshold get an
// inflated invisible hit mesh so they're tappable on mobile.
const SMALL_COUNTRY_BBOX_THRESHOLD_DEG2 = 8

function bboxArea(bbox: [number, number, number, number]) {
  return Math.abs(bbox[2] - bbox[0]) * Math.abs(bbox[3] - bbox[1])
}

// All renderable entries: provinces replace CA, states replace US
const globeEntries = [
  ...naturalEarthCountriesPayload.countries.filter((c) => c.iso2 !== 'CA' && c.iso2 !== 'US'),
  ...canadaProvinces,
  ...usStates,
]

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
          side={FrontSide}
          depthTest
          depthWrite
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      {isSelected ? (
        <mesh geometry={geometry} scale={1.004} renderOrder={24}>
          <meshBasicMaterial
            color={SELECTED_GLOW}
            transparent
            opacity={0.18}
            blending={AdditiveBlending}
            side={BackSide}
            depthTest
            depthWrite={false}
          />
        </mesh>
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
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
  onHoverCountry,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  focusedCountryIso2?: string
  selectedCountryIso2s: string[]
  activeLayerId: GlobeLayerId
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const idleGeometries = useMemo(
    () =>
      globeEntries.map((entry) => ({
        entry,
        geometry: createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'surface',
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
    [],
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
          geometryMode: 'surface',
        }),
      )
    }
    return map
  }, [selectedSet])

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
            onClick={() => onSelectCountry?.(entry.iso2)}
          />
        )
      })}
    </group>
  )
}
