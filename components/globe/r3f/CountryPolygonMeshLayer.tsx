'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

const PLATE_LIFT = 0.026
const IDLE_EXTRUSION = 0.058
const SELECTED_EXTRUSION = 0.094
const BORDER_METAL = '#8b7343'
const SELECTED_ACCENT = '#b79a5a'
const SPECULAR_CAP = 0.32

// Hover emissive pulse — animates toward target on each frame
function HoverPulseMesh({
  geometry,
  isSelected,
  isFocused,
  material,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
  geometry: ReturnType<typeof createCountryBufferGeometry>
  isSelected: boolean
  isFocused: boolean
  material: ReturnType<typeof resolveCountryMaterialState>
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const matRef = useRef<MeshPhysicalMaterial>(null)
  const targetEmissive = useRef(material.emissiveIntensity)

  useEffect(() => {
    targetEmissive.current = isFocused
      ? Math.max(material.emissiveIntensity, 0.46)
      : material.emissiveIntensity
  }, [isFocused, material.emissiveIntensity])

  useFrame((_, delta) => {
    if (!matRef.current) return
    const cur = matRef.current.emissiveIntensity
    const tgt = targetEmissive.current
    if (Math.abs(cur - tgt) < 0.001) return
    matRef.current.emissiveIntensity = cur + (tgt - cur) * Math.min(delta * 8, 1)
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
        color={isSelected ? SELECTED_ACCENT : material.plateBase}
        emissive={isSelected ? BORDER_METAL : material.emissive}
        emissiveIntensity={material.emissiveIntensity}
        roughness={material.roughness}
        metalness={material.metalness}
        clearcoat={material.clearcoat}
        clearcoatRoughness={material.clearcoatRoughness}
        reflectivity={SPECULAR_CAP}
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
      naturalEarthCountriesPayload.countries.map((country) => ({
        country,
        geometry: createCountryBufferGeometry(country, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'surface',
        }),
      })),
    [],
  )

  useEffect(() => {
    return () => { idleGeometries.forEach(({ geometry }) => geometry.dispose()) }
  }, [idleGeometries])

  const selectedSet = useMemo(() => {
    const set = new Set<string>(selectedCountryIso2s)
    if (selectedCountryIso2) set.add(selectedCountryIso2)
    return set
  }, [selectedCountryIso2, selectedCountryIso2s])

  const extrudedGeometries = useMemo(() => {
    if (selectedSet.size === 0) return new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    const map = new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    for (const country of naturalEarthCountriesPayload.countries) {
      if (!selectedSet.has(country.iso2)) continue
      map.set(
        country.iso2,
        createCountryBufferGeometry(country, {
          plateLift: PLATE_LIFT + 0.002,
          extrusionHeight: SELECTED_EXTRUSION,
          geometryMode: 'surface',
        }),
      )
    }
    return map
  }, [selectedSet])

  useEffect(() => {
    return () => { extrudedGeometries.forEach((geometry) => geometry.dispose()) }
  }, [extrudedGeometries])

  return (
    <group userData={{ layer: 'country-polygon-meshes' }}>
      {idleGeometries.map(({ country, geometry }) => {
        const isSelected = selectedSet.has(country.iso2)
        const isFocused = focusedCountryIso2 === country.iso2
        const activeGeometry = isSelected ? extrudedGeometries.get(country.iso2) ?? geometry : geometry
        const visualState = isSelected ? 'selected' : isFocused ? 'focused' : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <HoverPulseMesh
            key={country.iso3}
            geometry={activeGeometry}
            isSelected={isSelected}
            isFocused={isFocused}
            material={material}
            onPointerEnter={() => onHoverCountry?.(country.iso2)}
            onPointerLeave={() => onHoverCountry?.(undefined)}
            onClick={() => {
              const hit = country
              if (hit) onSelectCountry?.(hit.iso2)
            }}
          />
        )
      })}
    </group>
  )
}
