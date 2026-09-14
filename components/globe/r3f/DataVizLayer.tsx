/**
 * components/globe/r3f/DataVizLayer.tsx
 *
 * Country polygons are keyed by ISO2 and do not require coordinates. This layer
 * is the separate point-marker visualization, so rows without coordinates are
 * intentionally skipped here rather than being removed from the globe dataset.
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
import { PLATE_LIFT, IDLE_EXTRUSION } from '@/lib/globe/globe-plate-config'

type DataVizLayerProps = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
}

const GLOBE_SURFACE_RADIUS = 2.35 + PLATE_LIFT + IDLE_EXTRUSION
const MARKER_LIFT = 0.01

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

const BASE_COLOR = new Color('#2f6f4f')
const HOT_COLOR = new Color('#00ff88')

function hasCoordinates(country: GlobeCountryMarker): country is GlobeCountryMarker & { lat: number; lng: number } {
  return Number.isFinite(country.lat) && Number.isFinite(country.lng)
}

export function DataVizLayer({ countries, signalsByIso2 }: DataVizLayerProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const markerCountries = useMemo(() => countries.filter(hasCoordinates), [countries])

  const geometry = useMemo(() => new SphereGeometry(0.015, 16, 16), [])
  const material = useMemo(
    () => new MeshPhongMaterial({ color: '#00ff88', emissive: '#003d20' }),
    []
  )

  const count = markerCountries.length

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    markerCountries.forEach((country, i) => {
      const { x, y, z } = latLngToVector3(country.lat, country.lng, GLOBE_SURFACE_RADIUS + MARKER_LIFT)
      dummy.position.set(x, y, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const signalCount = signalsByIso2[country.iso2]?.length ?? 0
      const opportunityFrac = Math.min((country.opportunityScore ?? 0) / 100, 1)
      const activityFrac = Math.min(signalCount / 10, 1)
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
