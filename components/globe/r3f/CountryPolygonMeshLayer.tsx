'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { PLATE_LIFT, IDLE_EXTRUSION, SELECTED_EXTRUSION } from '@/lib/globe/globe-plate-config'
import { GLOBE_RADIUS, lonLatToVector3, vector3ToArray } from '@/lib/globe/globe-geometry'
import type { GlobeLayerId } from '@/types/globe-router'
const BORDER_METAL = '#c6a55a'
const SELECTED_ACCENT = '#f1d48a'
const SPECULAR_CAP = 0.46
const SELECTED_EDGE_RADIUS = GLOBE_RADIUS + PLATE_LIFT + 0.004 + SELECTED_EXTRUSION

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


function buildEntryEdgeGeometry(entry: (typeof globeEntries)[number]) {
  const positions: number[] = []

  for (const polygon of entry.polygons) {
    for (const ring of polygon.rings) {
      if (ring.kind !== 'outer') continue
      const points = ring.points
      for (let i = 0; i < points.length; i++) {
        const [aLon, aLat] = points[i]
        const [bLon, bLat] = points[(i + 1) % points.length]
        positions.push(...vector3ToArray(lonLatToVector3(aLon, aLat, SELECTED_EDGE_RADIUS)))
        positions.push(...vector3ToArray(lonLatToVector3(bLon, bLat, SELECTED_EDGE_RADIUS)))
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

function SelectedMarketPlateEdge({ entry }: { entry: (typeof globeEntries)[number] }) {
  const geometry = useMemo(() => buildEntryEdgeGeometry(entry), [entry])
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#fff0bd'),
        transparent: true,
        opacity: 0.82,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <lineSegments geometry={geometry} material={material} renderOrder={28} />
}

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
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const matRef = useRef<MeshPhysicalMaterial>(null)
  const targetRef = useRef(emissiveIntensity)

  useEffect(() => {
    targetRef.current = isFocused ? Math.max(emissiveIntensity, 0.44) : emissiveIntensity
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
      {/* Visual mesh — renders the country plate */}
      <mesh geometry={geometry} renderOrder={12}>
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
          specularColor="#fff2c8"
          specularIntensity={0.72}
          iridescence={0.05}
          sheen={0.08}
          sheenColor="#fff0bd"
          depthTest
          depthWrite
        />
      </mesh>
      {/* Hit mesh — inflated invisible surface for pointer events.
          For large countries this is the same geometry. For small countries
          (Singapore, Luxembourg, UAE, etc.) it's larger, improving tap accuracy. */}
      <mesh
        geometry={hitGeometry ?? geometry}
        visible={false}
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
    <group userData={{ layer: 'country-polygon-meshes' }}>
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
          <group key={entry.iso3}>
            <HoverPulseMesh
              geometry={activeGeometry}
              hitGeometry={isSelected ? undefined : hitGeometry}
              color={visualState === 'selected' ? SELECTED_ACCENT : material.plateBase}
              emissive={visualState === 'selected' ? BORDER_METAL : material.emissive}
              emissiveIntensity={material.emissiveIntensity}
              roughness={material.roughness}
              metalness={material.metalness}
              clearcoat={material.clearcoat}
              clearcoatRoughness={material.clearcoatRoughness}
              reflectivity={SPECULAR_CAP}
              isFocused={focusedCountryIso2 === entry.iso2}
              onPointerEnter={() => onHoverCountry?.(entry.iso2)}
              onPointerLeave={() => onHoverCountry?.(undefined)}
              onClick={() => onSelectCountry?.(entry.iso2)}
            />
            {isSelected ? <SelectedMarketPlateEdge entry={entry} /> : null}
          </group>
        )
      })}
    </group>
  )
}
