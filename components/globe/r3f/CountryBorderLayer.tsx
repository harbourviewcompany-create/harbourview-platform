'use client'

import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { naturalEarthCountryBorders } from '@/data/globe/natural-earth-country-borders'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { GLOBE_RADIUS, lonLatToVector3, vector3ToArray } from '@/lib/globe/globe-geometry'

// Reference distance at which lineWidth values were tuned (mid-zoom)
const REFERENCE_DISTANCE = 5.5
const MOBILE_VIEWPORT_WIDTH = 640

// Country/state/province plates render at radius + plateLift + extrusionHeight.
// Idle plates top out at ~GLOBE_RADIUS + 0.084 and selected US/Canada subdivision
// plates top out at ~GLOBE_RADIUS + 0.122. Borders must sit above the selected
// plate surface or the selected state/province meshes visually bury the lines,
// which is most obvious on iPhone-sized viewports after selecting United States.
const VISIBLE_BORDER_OFFSET = 0.13
const VISIBLE_BORDER_RADIUS = GLOBE_RADIUS + VISIBLE_BORDER_OFFSET

function projectBorderRing(points: [number, number][]) {
  return points.map((point) => vector3ToArray(lonLatToVector3(point[0], point[1], VISIBLE_BORDER_RADIUS)))
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}

function getLinePresentation(distance: number, viewportWidth: number) {
  const distanceScale = clamp(distance / REFERENCE_DISTANCE, 0.52, 1.6)
  const isMobile = viewportWidth <= MOBILE_VIEWPORT_WIDTH
  const mobileBoost = isMobile ? 1.38 : 1

  return {
    countryOuterWidth: clamp(0.86 * distanceScale * mobileBoost, isMobile ? 0.74 : 0.42, 1.55),
    countryHoleWidth: clamp(0.42 * distanceScale * mobileBoost, isMobile ? 0.34 : 0.18, 0.78),
    subdivisionOuterWidth: clamp(0.82 * distanceScale * mobileBoost, isMobile ? 0.76 : 0.36, 1.46),
    subdivisionHoleWidth: clamp(0.4 * distanceScale * mobileBoost, isMobile ? 0.32 : 0.16, 0.72),
    subdivisionOuterOpacity: isMobile ? 0.96 : 0.82,
    subdivisionHoleOpacity: isMobile ? 0.66 : 0.46,
  }
}

export function CountryBorderLayer() {
  const { camera, size } = useThree()
  // Scale line width with camera distance so borders feel consistent across zoom levels.
  // Mobile receives a minimum width/opacity floor because the country and role overlays
  // reduce visible map area and the closer mobile camera otherwise makes state lines read faint.
  const presentation = getLinePresentation(camera.position.length(), size.width)

  return (
    <group renderOrder={30} userData={{ layer: 'country-and-subdivision-borders' }}>
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
                lineWidth={ring.kind === 'outer' ? presentation.countryOuterWidth : presentation.countryHoleWidth}
                transparent
                opacity={ring.kind === 'outer' ? 0.78 : 0.46}
                depthWrite={false}
                depthTest={false}
                renderOrder={30}
              />
            )),
          ),
        )}
      {/* Canadian province borders — same subdivision tuning as US states */}
      {canadaProvinces.map((province) =>
        province.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => (
            <Line
              key={`${province.iso3}-${polygonIndex}-${ringIndex}`}
              points={projectBorderRing(ring.points)}
              color="#c6a55a"
              lineWidth={ring.kind === 'outer' ? presentation.subdivisionOuterWidth : presentation.subdivisionHoleWidth}
              transparent
              opacity={ring.kind === 'outer' ? presentation.subdivisionOuterOpacity : presentation.subdivisionHoleOpacity}
              depthWrite={false}
              depthTest={false}
              renderOrder={31}
            />
          )),
        ),
      )}
      {/* U.S. state borders — preserve the full desktop state registry on mobile */}
      {usStates.map((state) =>
        state.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => (
            <Line
              key={`${state.iso3}-${polygonIndex}-${ringIndex}`}
              points={projectBorderRing(ring.points)}
              color="#d8be76"
              lineWidth={ring.kind === 'outer' ? presentation.subdivisionOuterWidth : presentation.subdivisionHoleWidth}
              transparent
              opacity={ring.kind === 'outer' ? presentation.subdivisionOuterOpacity : presentation.subdivisionHoleOpacity}
              depthWrite={false}
              depthTest={false}
              renderOrder={32}
            />
          )),
        ),
      )}
    </group>
  )
}
