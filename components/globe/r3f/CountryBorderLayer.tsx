'use client'

import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { naturalEarthCountryBorders } from '@/data/globe/natural-earth-country-borders'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { lonLatToVector3, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'

// Reference distance at which lineWidth values were tuned (mid-zoom)
const REFERENCE_DISTANCE = 5.5

function projectBorderRing(points: [number, number][]) {
  return points.map((point) => vector3ToArray(lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET)))
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}

export function CountryBorderLayer() {
  const { camera } = useThree()
  // Scale line width with camera distance so borders feel consistent across zoom levels
  const dist = camera.position.length()
  const scale = clamp(dist / REFERENCE_DISTANCE, 0.4, 1.6)

  const countryOuter = clamp(0.86 * scale, 0.3, 1.4)
  const countryHole = clamp(0.42 * scale, 0.15, 0.7)
  const subOuter = clamp(0.72 * scale, 0.25, 1.2)
  const subHole = clamp(0.36 * scale, 0.12, 0.6)

  return (
    <group>
      {/* Non-Canada, non-US countries — 50m resolution for clean border lines */}
      {naturalEarthCountryBorders
        .filter((c) => c.iso2 !== 'CA' && c.iso2 !== 'US')
        .map((country) =>
          country.polygons.flatMap((polygon, polygonIndex) =>
            polygon.rings.map((ring, ringIndex) => (
              <Line
                key={`${country.iso2}-${polygonIndex}-${ringIndex}`}
                points={projectBorderRing(ring.points)}
                color="#c6a55a"
                lineWidth={ring.kind === 'outer' ? countryOuter : countryHole}
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
              lineWidth={ring.kind === 'outer' ? subOuter : subHole}
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
              lineWidth={ring.kind === 'outer' ? subOuter : subHole}
              transparent
              opacity={ring.kind === 'outer' ? 0.78 : 0.42}
            />
          )),
        ),
      )}
    </group>
  )
}
