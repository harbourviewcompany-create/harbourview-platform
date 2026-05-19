'use client'

import { useMemo } from 'react'
import { getGlobeCountryGeometries } from '@/lib/globe/country-geometry-store'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import type { GlobeLayerId } from '@/types/globe-router'

export function CountryPlateLayer({
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
  const countryMeshes = useMemo(() => {
    return getGlobeCountryGeometries().map((country) => ({
      country,
      geometry: createCountryBufferGeometry(country),
    }))
  }, [])

  return (
    <group>
      {countryMeshes.map(({ country, geometry }) => {
        const state = selectedCountryIso2 === country.iso2 || selectedCountryIso2s.includes(country.iso2)
          ? 'selected'
          : focusedCountryIso2 === country.iso2
            ? 'focused'
            : 'idle'

        const material = resolveCountryMaterialState({
          visualState: state,
          layerId: activeLayerId,
        })

        return (
          <mesh
            key={country.iso2}
            geometry={geometry}
            userData={{ iso2: country.iso2, iso3: country.iso3 }}
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
              clearcoat={state === 'selected' ? 1 : 0.5}
              clearcoatRoughness={state === 'selected' ? 0.18 : 0.32}
            />
          </mesh>
        )
      })}
    </group>
  )
}
