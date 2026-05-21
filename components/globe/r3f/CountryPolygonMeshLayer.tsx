'use client'

import { useEffect, useMemo } from 'react'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { resolveCountryMaterialState, shouldUseStandardMaterialFallback } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

const PLATE_LIFT = 0.026
const IDLE_EXTRUSION = 0.058
const SELECTED_EXTRUSION = 0.094

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
  const useStandardMaterialFallback = shouldUseStandardMaterialFallback()

  const idleGeometries = useMemo(
    () =>
      naturalEarthCountriesPayload.countries.map((country) => ({
        country,
        geometry: createCountryBufferGeometry(country, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
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
          plateLift: PLATE_LIFT,
          extrusionHeight: SELECTED_EXTRUSION,
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
      {idleGeometries.map(({ country, geometry }) => {
        const isSelected = selectedSet.has(country.iso2)
        const activeGeometry = isSelected ? extrudedGeometries.get(country.iso2) ?? geometry : geometry
        const visualState = isSelected
          ? 'selected'
          : focusedCountryIso2 === country.iso2
            ? 'focused'
            : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <mesh
            key={country.iso3}
            geometry={activeGeometry}
            userData={{ iso2: country.iso2, iso3: country.iso3, name: country.name }}
            onPointerEnter={(event) => {
              event.stopPropagation()
              const hit = extractCountryHit(event)
              if (hit) onHoverCountry?.(hit.iso2)
            }}
            onPointerLeave={(event) => {
              event.stopPropagation()
              onHoverCountry?.(undefined)
            }}
            onClick={(event) => {
              event.stopPropagation()
              const hit = extractCountryHit(event)
              if (hit) onSelectCountry?.(hit.iso2)
            }}
          >
            {useStandardMaterialFallback ? (
              <meshStandardMaterial
                color={isSelected ? material.selectionAccent : material.plateBase}
                emissive={material.emissive}
                emissiveIntensity={Math.min(material.emissiveIntensity, 0.26)}
                roughness={Math.max(material.roughness, 0.62)}
                metalness={Math.min(material.metalness, 0.32)}
              />
            ) : (
              <meshPhysicalMaterial
                color={isSelected ? material.selectionAccent : material.plateBase}
                emissive={material.emissive}
                emissiveIntensity={Math.min(material.emissiveIntensity, 0.3)}
                roughness={Math.max(material.roughness, 0.62)}
                metalness={Math.min(material.metalness, 0.34)}
                clearcoat={material.clearcoat}
                clearcoatRoughness={material.clearcoatRoughness}
              />
            )}
          </mesh>
        )
      })}
    </group>
  )
}
