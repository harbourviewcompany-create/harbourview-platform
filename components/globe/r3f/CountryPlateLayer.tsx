'use client'

import { Cylinder } from '@react-three/drei'
import { buildFixtureCountryFeatures, getCountryFocusVector, vector3ToArray } from '@/lib/globe/globe-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import type { GlobeLayerId } from '@/types/globe-router'

export function CountryPlateLayer({
  selectedCountryIso2,
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
}: {
  selectedCountryIso2?: string
  focusedCountryIso2?: string
  selectedCountryIso2s: string[]
  activeLayerId: GlobeLayerId
}) {
  const features = buildFixtureCountryFeatures()

  return (
    <group>
      {features.map((feature) => {
        const state = selectedCountryIso2 === feature.iso2 || selectedCountryIso2s.includes(feature.iso2)
          ? 'selected'
          : focusedCountryIso2 === feature.iso2
            ? 'focused'
            : 'idle'

        const material = resolveCountryMaterialState({
          visualState: state,
          layerId: activeLayerId,
        })

        const vector = getCountryFocusVector(feature)

        return (
          <group
            key={feature.iso2}
            position={vector3ToArray({
              x: vector.x * 2.44,
              y: vector.y * 2.44,
              z: vector.z * 2.44,
            })}
          >
            <Cylinder args={[0.09, 0.12, state === 'selected' ? 0.1 : 0.06, 6]}>
              <meshPhysicalMaterial
                color={material.plateBase}
                emissive={material.emissive}
                emissiveIntensity={material.emissiveIntensity}
                roughness={material.roughness}
                metalness={material.metalness}
              />
            </Cylinder>
          </group>
        )
      })}
    </group>
  )
}
