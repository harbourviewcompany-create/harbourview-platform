'use client'

import { useEffect, useMemo } from 'react'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { BORDER_OFFSET, lonLatToVector3 } from '@/lib/globe/globe-geometry'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { extractCountryHit } from '@/lib/globe/country-hit-testing'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

const PLATE_LIFT = BORDER_OFFSET + 0.003
const FLAT_EXTRUSION = 0.001
const PROXY_MARKER_RADIUS = 0.013
const PROXY_VERTEX_THRESHOLD = 16
const PROXY_BBOX_THRESHOLD = 3.8

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
          extrusionHeight: FLAT_EXTRUSION,
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

  const tinyCountrySet = useMemo(() => {
    const set = new Set<string>()

    for (const country of naturalEarthCountriesPayload.countries) {
      const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')
      const rawVertexCount = outerRing?.points.length ?? 0
      const [minLon, minLat, maxLon, maxLat] = country.bbox
      const bboxSpan = Math.max(Math.abs(maxLon - minLon), Math.abs(maxLat - minLat))

      if (rawVertexCount <= PROXY_VERTEX_THRESHOLD || bboxSpan <= PROXY_BBOX_THRESHOLD) {
        set.add(country.iso2)
      }
    }

    return set
  }, [])

  return (
    <group userData={{ layer: 'country-polygon-meshes' }}>
      {idleGeometries.map(({ country, geometry }) => {
        const isSelected = selectedSet.has(country.iso2)
        const isTinyCountry = tinyCountrySet.has(country.iso2)
        const visualState = isSelected
          ? 'selected'
          : focusedCountryIso2 === country.iso2
            ? 'focused'
            : 'idle'
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })
        const centroidVector = lonLatToVector3(country.centroid[0], country.centroid[1], 2.35 + PLATE_LIFT + 0.0012)

        if (isTinyCountry) {
          return (
            <mesh
              key={country.iso3}
              position={[centroidVector.x, centroidVector.y, centroidVector.z]}
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
              <sphereGeometry args={[PROXY_MARKER_RADIUS, 10, 8]} />
              <meshPhysicalMaterial
                color={material.borderColor}
                emissive={material.emissive}
                emissiveIntensity={material.emissiveIntensity}
                roughness={0.58}
                metalness={0.12}
                transparent
                opacity={isSelected ? 0.9 : 0.7}
              />
            </mesh>
          )
        }

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
              clearcoat={visualState === 'selected' ? 0.4 : 0.22}
              clearcoatRoughness={0.35}
              transparent
              opacity={visualState === 'selected' ? 0.68 : 0.52}
            />
          </mesh>
        )
      })}
    </group>
  )
}
