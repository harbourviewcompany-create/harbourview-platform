'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { FrontSide, BackSide, AdditiveBlending, type MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { applyMetallicGoldShader, getMetallicGoldProgramCacheKey, type MetallicGoldShader } from '@/lib/globe/metallic-gold-shader'
import { PLATE_LIFT, IDLE_EXTRUSION, SELECTED_EXTRUSION, SELECTED_GLOW, LOD_SIMPLIFY_TOLERANCE } from '@/lib/globe/globe-plate-config'
import type { GlobeLayerId } from '@/types/globe-router'

const SPECULAR_CAP = 0.42

// Countries whose bbox area (lon-span × lat-span) is below this threshold get an
// inflated invisible hit mesh so they're tappable on mobile.
const SMALL_COUNTRY_BBOX_THRESHOLD_DEG2 = 8

function bboxArea(bbox: [number, number, number, number]) {
  return Math.abs(bbox[2] - bbox[0]) * Math.abs(bbox[3] - bbox[1])
}

// All renderable entries: provinces replace CA, states replace US
const globeEntries = [
  ...naturalEarthCountriesPayload.countries.filter((c) => c.iso2 !== 'CA' && c.iso2 !== 'US'),
  ...canadaProvinces,
  ...usStates,
]

function HoverPulseMesh({ ...props }) {
  // ... (existing HoverPulseMesh unchanged for brevity)
}

export function CountryPolygonMeshLayer({
  selectedCountryIso2,
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
  onHoverCountry,
  onSelectCountry,
}: {
  // ... props
}) {
  // Note: In full integration, import and use useGlobePerformance() here
  // to determine simplifyTolerance dynamically.

  const idleGeometries = useMemo(
    () =>
      globeEntries.map((entry) => ({
        entry,
        geometry: createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'extruded',
          // LOD: Use config-based tolerance for background countries
          simplifyTolerance: LOD_SIMPLIFY_TOLERANCE.medium, // Will be dynamic in full perf integration
        }),
        // ... hitGeometry
      })),
    [],
  )

  // ... rest of component (selected geometries remain full fidelity)

  return (
    <group ...>
      {idleGeometries.map(...) }
    </group>
  )
}
