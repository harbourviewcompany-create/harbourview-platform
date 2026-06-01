'use client'

import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { lonLatToVector3, vector3ToArray, BORDER_OFFSET } from '@/lib/globe/globe-geometry'
import {
  entryMatchesCountryOrParent,
  expandSelectedGlobeSet,
  getRenderableEntryKind,
  isRenderableEntrySelected,
  renderableGlobeEntries,
} from '@/lib/globe/renderable-globe-entries'
import { getViewportClass, resolveBorderStyle } from '@/lib/globe/globe-visual-state'

function projectBorderRing(points: [number, number][]) {
  return points.map((point) => vector3ToArray(lonLatToVector3(point[0], point[1], 2.35 + BORDER_OFFSET)))
}

export function CountryBorderLayer({
  selectedCountryIso2,
  selectedCountryIso2s,
  focusedCountryIso2,
}: {
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  focusedCountryIso2?: string
}) {
  const width = useThree((state) => state.size.width)
  const viewportClass = getViewportClass(width)

  const selectedSet = useMemo(
    () => expandSelectedGlobeSet(selectedCountryIso2, selectedCountryIso2s),
    [selectedCountryIso2, selectedCountryIso2s],
  )

  return (
    <group userData={{ layer: 'country-borders' }}>
      {renderableGlobeEntries.map((entry) =>
        entry.polygons.flatMap((polygon, polygonIndex) =>
          polygon.rings.map((ring, ringIndex) => {
            const isSelected = isRenderableEntrySelected(entry, selectedSet)
            const isFocused = entryMatchesCountryOrParent(entry, focusedCountryIso2)
            const style = resolveBorderStyle({
              viewportClass,
              renderableKind: getRenderableEntryKind(entry),
              ringKind: ring.kind,
              isFocused,
              isSelected,
            })

            return (
              <Line
                key={`${entry.iso3}-${polygonIndex}-${ringIndex}`}
                points={projectBorderRing(ring.points)}
                color={style.color}
                lineWidth={style.lineWidth}
                transparent
                opacity={style.opacity}
              />
            )
          }),
        ),
      )}
    </group>
  )
}
