'use client'

import { useEffect, useMemo } from 'react'
import { DoubleSide } from 'three'
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
  const hasCustomShaderPath = false

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
            {hasCustomShaderPath ? (
              <meshPhysicalMaterial
                color={visualState === 'selected' ? SELECTED_ACCENT : material.plateBase}
                emissive={visualState === 'selected' ? BORDER_METAL : material.emissive}
                emissiveIntensity={visualState === 'selected' ? 0.28 : material.emissiveIntensity}
                roughness={material.roughness}
                metalness={material.metalness}
                side={DoubleSide}
                clearcoat={visualState === 'selected' ? 0.42 : 0.22}
                clearcoatRoughness={0.58}
                reflectivity={SPECULAR_CAP}
              />
            ) : (
              <meshStandardMaterial
                color={visualState === 'selected' ? SELECTED_ACCENT : material.plateBase}
                emissive={visualState === 'selected' ? BORDER_METAL : material.emissive}
                emissiveIntensity={visualState === 'selected' ? 0.22 : material.emissiveIntensity}
                roughness={material.roughness}
                metalness={material.metalness}
                side={DoubleSide}
              />
            )}
          </mesh>
        )
      })}
    </group>
  )
}
