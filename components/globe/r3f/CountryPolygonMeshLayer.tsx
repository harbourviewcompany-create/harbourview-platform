'use client'

import { useEffect, useMemo } from 'react'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

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
  const countryGeometries = useMemo(
    () =>
      naturalEarthFixturePayload.countries.map((country) => ({
        country,
        geometry: createCountryBufferGeometry(country, {
          plateLift: 0.026,
          extrusionHeight: selectedCountryIso2 === country.iso2 || selectedCountryIso2s.includes(country.iso2) ? 0.094 : 0.058,
        }),
      })),
    [selectedCountryIso2, selectedCountryIso2s],
  )

  useEffect(() => {
    return () => {
      countryGeometries.forEach(({ geometry }) => geometry.dispose())
    }
  }, [countryGeometries])

  return (
    <group userData={{ layer: 'country-polygon-meshes' }}>
      {countryGeometries.map(({ country, geometry }) => {
        const visualState = selectedCountryIso2 === country.iso2 || selectedCountryIso2s.includes(country.iso2)
          ? 'selected'
          : focusedCountryIso2 === country.iso2
            ? 'focused'
            : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <mesh
            key={country.iso3}
            geometry={geometry}
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
            <meshPhysicalMaterial
              color={material.plateBase}
              emissive={material.emissive}
              emissiveIntensity={material.emissiveIntensity}
              roughness={material.roughness}
              metalness={material.metalness}
              clearcoat={visualState === 'selected' ? 0.75 : 0.35}
              clearcoatRoughness={0.24}
            />
          </mesh>
        )
      })}
    </group>
  )
}
