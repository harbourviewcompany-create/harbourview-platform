'use client'

import { Line } from '@react-three/drei'
import { buildFixtureCountryFeatures, projectRingToSphere, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'

export function CountryBorderLayer() {
  const features = buildFixtureCountryFeatures()

  return (
    <group>
      {features.map((feature) =>
        feature.rings.map((ring, index) => {
          const points = projectRingToSphere(ring, 2.35 + BORDER_OFFSET).map(vector3ToArray)

          return (
            <Line
              key={`${feature.iso2}-${index}`}
              points={points}
              color="#c6a55a"
              lineWidth={0.8}
              transparent
              opacity={0.88}
            />
          )
        }),
      )}
    </group>
  )
}
