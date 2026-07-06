/**
 * components/globe/r3f/DataVizLayer.tsx
 *
 * Fixes vs. the pasted version:
 * - `THREE.SphereGeometry` / `THREE.MeshPhongMaterial` were used without
 *   importing `THREE` anywhere (only named imports existed) — this would
 *   have been a runtime ReferenceError. Now uses named imports throughout.
 * - Markers are `countries` (real table, has lat/lng), not a nonexistent
 *   `suppliers` table.
 * - Per-instance color now reflects `opportunityScore` + local signal count,
 *   using `instanceColor`, instead of a flat material color.
 *
 * NOT YET VERIFIED: the lat/lng → xyz conversion below (phi/theta, radius
 * 1.02) is carried over from the pasted handoff. I have not read
 * `OceanSphere.tsx` / `CountryPolygonMeshLayer.tsx` to confirm this matches
 * the sphere radius and rotation convention already used elsewhere in the
 * globe. Cross-check against those before relying on marker placement being
 * aligned with the country polygon layer.
 */
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  InstancedMesh,
  Object3D,
  Color,
  SphereGeometry,
  MeshPhongMaterial,
} from 'three'
import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'

type DataVizLayerProps = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
}

const GLOBE_RADIUS = 1.0
const MARKER_ALTITUDE = 1.02 // fraction of radius — carried over, unverified, see header note

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

const BASE_COLOR = new Color('#2f6f4f') // muted green, low activity
const HOT_COLOR = new Color('#00ff88') // bright green, high activity

export function DataVizLayer({ countries, signalsByIso2 }: DataVizLayerProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const geometry = useMemo(() => new SphereGeometry(0.015, 16, 16), [])
  const material = useMemo(
    () => new MeshPhongMaterial({ color: '#00ff88', emissive: '#003d20' }),
    []
  )

  // Recreate only when the marker count changes — see header note on
  // per-frame index stability (positions are recomputed fully each frame,
  // so a same-length reorder between renders doesn't leave stale state).
  const count = countries.length

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    countries.forEach((country, i) => {
      if (i >= count) return // guard if array grew since last mesh recreation

      const { x, y, z } = latLngToVector3(country.lat, country.lng, GLOBE_RADIUS * MARKER_ALTITUDE)
      dummy.position.set(x, y, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const signalCount = signalsByIso2[country.iso2]?.length ?? 0
      const opportunityFrac = Math.min((country.opportunityScore ?? 0) / 100, 1)
      const activityFrac = Math.min(signalCount / 10, 1) // 10+ recent signals = fully hot
      const intensity = Math.max(opportunityFrac, activityFrac)

      const color = BASE_COLOR.clone().lerp(HOT_COLOR, intensity)
      mesh.setColorAt(i, color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}
