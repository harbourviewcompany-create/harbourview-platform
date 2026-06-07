'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { naturalEarthCountryBorders } from '@/data/globe/natural-earth-country-borders'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { GLOBE_RADIUS, lonLatToVector3, vector3ToArray } from '@/lib/globe/globe-geometry'
import { BORDER_OFFSET } from '@/lib/globe/globe-plate-config'

// Border lines ride above idle plate surface with explicit depth testing.
// depthTest=true on every LineSegments hides far-hemisphere borders behind
// the ocean sphere — no "see-through globe" bleedthrough.
const BORDER_RADIUS = GLOBE_RADIUS + BORDER_OFFSET

// ---------------------------------------------------------------------------
// Build a Float32Array of explicit start–end PAIRS for a set of rings.
// THREE.LineSegments reads positions as [s0, e0, s1, e1, ...] — each pair
// is one independent segment. Rings are closed by looping the last point
// back to the first. No NaN separators needed: each ring contributes its
// own isolated set of pairs.
// ---------------------------------------------------------------------------
function buildSegmentPositions(
  rings: { points: [number, number][] }[],
): Float32Array {
  // Pre-calculate total float count so we can allocate once
  let count = 0
  for (const ring of rings) count += ring.points.length * 2 * 3 // pairs × xyz

  const buf = new Float32Array(count)
  let offset = 0

  for (const ring of rings) {
    const pts = ring.points
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const [aLon, aLat] = pts[i]
      const [bLon, bLat] = pts[(i + 1) % n] // wraps: last→first closes ring
      const [ax, ay, az] = vector3ToArray(lonLatToVector3(aLon, aLat, BORDER_RADIUS))
      const [bx, by, bz] = vector3ToArray(lonLatToVector3(bLon, bLat, BORDER_RADIUS))
      buf[offset++] = ax; buf[offset++] = ay; buf[offset++] = az
      buf[offset++] = bx; buf[offset++] = by; buf[offset++] = bz
    }
  }

  return buf
}

// Collect all outer rings from a list of HarbourviewCountryGeometry objects
function collectOuterRings(
  countries: { polygons: { rings: { kind: string; points: [number, number][] }[] }[] }[],
) {
  const out: { points: [number, number][] }[] = []
  for (const c of countries) {
    for (const polygon of c.polygons) {
      for (const ring of polygon.rings) {
        if (ring.kind === 'outer') out.push(ring)
      }
    }
  }
  return out
}

export function CountryBorderLayer() {
  // -------------------------------------------------------------------------
  // Build geometries once. useMemo ensures these run only on mount, not on
  // every frame — the THREE.BufferGeometry objects are stable references.
  // -------------------------------------------------------------------------

  const worldGeom = useMemo(() => {
    const worldCountries = naturalEarthCountryBorders.filter(
      (c) => c.iso2 !== 'CA' && c.iso2 !== 'US',
    )
    const rings = collectOuterRings(worldCountries)
    const positions = buildSegmentPositions(rings)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [])

  const usGeom = useMemo(() => {
    const rings = collectOuterRings(usStates)
    const positions = buildSegmentPositions(rings)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [])

  const caGeom = useMemo(() => {
    const rings = collectOuterRings(canadaProvinces)
    const positions = buildSegmentPositions(rings)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [])

  // -------------------------------------------------------------------------
  // Materials — one per visual group. LineBasicMaterial is a native WebGL
  // primitive (zero custom shader overhead). At the globe's DPR (1–1.75×),
  // 1 CSS-pixel borders are crisp and cartographically appropriate.
  // -------------------------------------------------------------------------

  const borderShadowMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#4f3212'),
        transparent: true,
        opacity: 0.62,
        depthTest: true,
        depthWrite: false,
      }),
    [],
  )

  // Country borders — primary cartographic hierarchy, authoritative gold
  const worldMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#e8c868'),
        transparent: true,
        opacity: 0.88,
        depthTest: true,
        depthWrite: false,
      }),
    [],
  )

  // US state borders — subordinate to country borders, lower opacity and darker
  const usMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#b8982a'),
        transparent: true,
        opacity: 0.56,
        depthTest: true,
        depthWrite: false,
      }),
    [],
  )

  // CA province borders — subordinate, same hierarchy as US states
  const caMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#b8982a'),
        transparent: true,
        opacity: 0.52,
        depthTest: true,
        depthWrite: false,
      }),
    [],
  )

  return (
    <group renderOrder={30} userData={{ layer: 'country-and-subdivision-borders' }}>
      {/* Bronze underlay creates the darker machined groove beside the reflective edge. */}
      <lineSegments geometry={worldGeom} material={borderShadowMat} renderOrder={29} scale={0.9988} />
      <lineSegments geometry={usGeom} material={borderShadowMat} renderOrder={29} scale={0.9988} />
      <lineSegments geometry={caGeom} material={borderShadowMat} renderOrder={29} scale={0.9988} />
      {/* All world country borders — 1 draw call */}
      <lineSegments
        geometry={worldGeom}
        material={worldMat}
        renderOrder={30}
      />
      {/* All U.S. state borders — 1 draw call */}
      <lineSegments
        geometry={usGeom}
        material={usMat}
        renderOrder={31}
      />
      {/* All Canadian province borders — 1 draw call */}
      <lineSegments
        geometry={caGeom}
        material={caMat}
        renderOrder={32}
      />
    </group>
  )
}
