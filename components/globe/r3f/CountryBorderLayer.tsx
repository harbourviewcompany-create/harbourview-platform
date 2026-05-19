'use client'

import { Line } from '@react-three/drei'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { lonLatToVector3, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'

function projectBorderRing(points: [number, number][]) {
  return points.map((point) => vector3ToArray(lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET)))
}

export function CountryBorderLayer() {
  return (
    <group>
      {naturalEarthFixturePayload.countries.map((country) =>
        country.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => (
            <Line
              key={`${country.iso3}-${polygonIndex}-${ringIndex}`}
              points={projectBorderRing(ring.points)}
              color="#c6a55a"
              lineWidth={ring.kind === 'outer' ? 0.86 : 0.42}
              transparent
              opacity={ring.kind === 'outer' ? 0.92 : 0.54}
            />
          )),
        ),
      )}
    </group>
  )
}
