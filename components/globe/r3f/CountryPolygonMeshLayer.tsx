'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

const PLATE_LIFT = 0.026
const IDLE_EXTRUSION = 0.058
const SELECTED_EXTRUSION = 0.094
const BORDER_METAL = '#8b7343'
const SELECTED_ACCENT = '#b79a5a'
const SPECULAR_CAP = 0.32

// All renderable entries: provinces replace CA, states replace US
const globeEntries = [
  ...naturalEarthCountriesPayload.countries.filter((c) => c.iso2 !== 'CA' && c.iso2 !== 'US'),
  ...canadaProvinces,
  ...usStates,
]

function HoverPulseMesh({
  geometry,
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

  useFrame((_, delta) => {
    if (!matRef.current) return
    const cur = matRef.current.emissiveIntensity
    const tgt = targetRef.current
    if (Math.abs(cur - tgt) < 0.001) return
    matRef.current.emissiveIntensity = cur + (tgt - cur) * Math.min(delta * 9, 1)
  })

  return (
    <mesh
      geometry={geometry}
      onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter() }}
      onPointerLeave={(e) => { e.stopPropagation(); onPointerLeave() }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
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
      />
    </mesh>
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
      })),
    [],
  )

  useEffect(() => {
    return () => {
      idleGeometries.forEach(({ geometry }) => geometry.dispose())
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
      {idleGeometries.map(({ entry, geometry }) => {
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
        )
      })}
    </group>
  )
}
