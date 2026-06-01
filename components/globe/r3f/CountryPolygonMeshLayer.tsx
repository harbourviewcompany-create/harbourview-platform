'use client'

import { useEffect, useMemo } from 'react'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import {
  expandSelectedGlobeSet,
  isRenderableEntrySelected,
  renderableGlobeEntries,
} from '@/lib/globe/renderable-globe-entries'
import type { GlobeLayerId } from '@/types/globe-router'

const PLATE_LIFT = 0.026
const IDLE_EXTRUSION = 0.058
const SELECTED_EXTRUSION = 0.094
const BORDER_METAL = '#8b7343'
const SELECTED_ACCENT = '#b79a5a'
const SPECULAR_CAP = 0.32

type CountryGeometry = ReturnType<typeof createCountryBufferGeometry>

function CountryPlateMesh({
  geometry,
  color,
  emissive,
  emissiveIntensity,
  roughness,
  metalness,
  clearcoat,
  clearcoatRoughness,
  reflectivity,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
  geometry: CountryGeometry
  color: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  return (
    <mesh
      geometry={geometry}
      onPointerEnter={(event) => {
        event.stopPropagation()
        onPointerEnter()
      }}
      onPointerLeave={(event) => {
        event.stopPropagation()
        onPointerLeave()
      }}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <meshPhysicalMaterial
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
      renderableGlobeEntries.map((entry) => ({
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

  const selectedSet = useMemo(
    () => expandSelectedGlobeSet(selectedCountryIso2, selectedCountryIso2s),
    [selectedCountryIso2, selectedCountryIso2s],
  )

  const extrudedGeometries = useMemo(() => {
    if (selectedSet.size === 0) return new Map<string, CountryGeometry>()

    const map = new Map<string, CountryGeometry>()

    for (const entry of renderableGlobeEntries) {
      if (!isRenderableEntrySelected(entry, selectedSet)) continue

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
        const isSelected = isRenderableEntrySelected(entry, selectedSet)
        const activeGeometry = isSelected ? extrudedGeometries.get(entry.iso2) ?? geometry : geometry
        const visualState = isSelected
          ? 'selected'
          : focusedCountryIso2 === entry.iso2 || focusedCountryIso2 === entry.parentIso2
            ? 'focused'
            : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <CountryPlateMesh
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
            onPointerEnter={() => onHoverCountry?.(entry.iso2)}
            onPointerLeave={() => onHoverCountry?.(undefined)}
            onClick={() => onSelectCountry?.(entry.iso2)}
          />
        )
      })}
    </group>
  )
}
