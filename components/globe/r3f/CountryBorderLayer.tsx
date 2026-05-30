'use client'

import { Line } from '@react-three/drei'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { lonLatToVector3, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'

function projectBorderRing(points: [number, number][]) {
  return points.map((point) => vector3ToArray(lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET)))
}

export function CountryBorderLayer() {
  return (
    <group>
      {/* Non-Canada, non-US countries */}
      {naturalEarthCountriesPayload.countries
        .filter((c) => c.iso2 !== 'CA' && c.iso2 !== 'US')
        .map((country) =>
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
      {/* Canadian province borders — slightly thinner than country borders */}
      {canadaProvinces.map((province) =>
        province.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => (
            <Line
              key={`${province.iso3}-${polygonIndex}-${ringIndex}`}
              points={projectBorderRing(ring.points)}
              color="#c6a55a"
              lineWidth={ring.kind === 'outer' ? 0.72 : 0.36}
              transparent
              opacity={ring.kind === 'outer' ? 0.78 : 0.42}
            />
          )),
        ),
      )}
      {/* U.S. state borders — slightly thinner than country borders */}
      {usStates.map((state) =>
        state.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => (
            <Line
              key={`${state.iso3}-${polygonIndex}-${ringIndex}`}
              points={projectBorderRing(ring.points)}
              color="#c6a55a"
              lineWidth={ring.kind === 'outer' ? 0.72 : 0.36}
              transparent
              opacity={ring.kind === 'outer' ? 0.78 : 0.42}
            />
          )),
        ),
      )}
    </group>
  )
}
