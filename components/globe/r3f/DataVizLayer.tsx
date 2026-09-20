/**
 * Live market intelligence markers for the globe.
 *
 * Country markers show aggregate opportunity/activity. Signal markers show
 * individual live intelligence events at the evidence-backed country centroid
 * supplied by the signal's country_iso2. Multiple events at one centroid are
 * stacked vertically so we do not invent sub-country precision that the data
 * does not contain.
 */
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MeshPhongMaterial,
  Object3D,
  SphereGeometry,
} from 'three'
import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'
import { PLATE_LIFT, IDLE_EXTRUSION } from '@/lib/globe/globe-plate-config'

type DataVizLayerProps = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
}

const GLOBE_SURFACE_RADIUS = 2.35 + PLATE_LIFT + IDLE_EXTRUSION
const MARKER_LIFT = 0.01
const EVENT_BASE_LIFT = 0.035
const EVENT_STACK_LIFT = 0.008
const MAX_SIGNAL_MARKERS = 500

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
const EVENT_COLOR = new Color('#e8c547')
const EVENT_HOT_COLOR = new Color('#fff0b8')

export function DataVizLayer({ countries, signalsByIso2 }: DataVizLayerProps) {
  const countryMeshRef = useRef<InstancedMesh>(null)
  const signalMeshRef = useRef<InstancedMesh>(null)
  const countryDummy = useMemo(() => new Object3D(), [])
  const signalDummy = useMemo(() => new Object3D(), [])

  const countryCount = countries.length
  const countryByIso2 = useMemo(
    () => new Map(countries.map((country) => [country.iso2, country])),
    [countries],
  )

  const signalEvents = useMemo(
    () =>
      Object.values(signalsByIso2)
        .flat()
        .filter((signal) => signal.countryIso2 && countryByIso2.has(signal.countryIso2))
        .slice(0, MAX_SIGNAL_MARKERS),
    [signalsByIso2, countryByIso2],
  )

  const signalCount = signalEvents.length

  const countryGeometry = useMemo(() => new SphereGeometry(0.015, 16, 16), [])
  const signalGeometry = useMemo(() => new SphereGeometry(0.009, 12, 12), [])

  const countryMaterial = useMemo(
    () => new MeshPhongMaterial({ color: '#00ff88', emissive: '#003d20' }),
    [],
  )
  const signalMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: '#e8c547',
        emissive: '#8a6715',
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.92,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  const eventCountsByIso2 = useMemo(() => {
    const counts = new Map<string, number>()
    for (const signal of signalEvents) {
      const iso2 = signal.countryIso2
      if (iso2) counts.set(iso2, (counts.get(iso2) ?? 0) + 1)
    }
    return counts
  }, [signalEvents])

  useFrame((state) => {
    const countryMesh = countryMeshRef.current
    if (countryMesh && countryCount > 0) {
      countries.forEach((country, i) => {
        const { x, y, z } = latLngToVector3(
          country.lat,
          country.lng,
          GLOBE_SURFACE_RADIUS + MARKER_LIFT,
        )
        countryDummy.position.set(x, y, z)
        countryDummy.scale.setScalar(1)
        countryDummy.updateMatrix()
        countryMesh.setMatrixAt(i, countryDummy.matrix)

        const signalCountForCountry = signalsByIso2[country.iso2]?.length ?? 0
        const opportunityFrac = Math.min((country.opportunityScore ?? 0) / 100, 1)
        const activityFrac = Math.min(signalCountForCountry / 10, 1)
        const intensity = Math.max(opportunityFrac, activityFrac)
        countryMesh.setColorAt(i, BASE_COLOR.clone().lerp(HOT_COLOR, intensity))
      })

      countryMesh.instanceMatrix.needsUpdate = true
      if (countryMesh.instanceColor) countryMesh.instanceColor.needsUpdate = true
    }

    const signalMesh = signalMeshRef.current
    if (signalMesh && signalCount > 0) {
      const now = state.clock.elapsedTime
      const stackIndexByIso2 = new Map<string, number>()

      signalEvents.forEach((signal, i) => {
        const country = signal.countryIso2 ? countryByIso2.get(signal.countryIso2) : undefined
        if (!country) return

        const iso2 = country.iso2
        const stackIndex = stackIndexByIso2.get(iso2) ?? 0
        stackIndexByIso2.set(iso2, stackIndex + 1)

        const baseRadius =
          GLOBE_SURFACE_RADIUS +
          EVENT_BASE_LIFT +
          Math.min(stackIndex, 9) * EVENT_STACK_LIFT
        const { x, y, z } = latLngToVector3(country.lat, country.lng, baseRadius)
        signalDummy.position.set(x, y, z)

        const score = Math.max(0, Math.min(100, signal.score ?? 0)) / 100
        const countryActivity = Math.min((eventCountsByIso2.get(iso2) ?? 1) / 10, 1)
        const intensity = Math.max(score, countryActivity)
        const pulse = 0.92 + 0.16 * Math.sin(now * 2.4 + i * 0.37)
        signalDummy.scale.setScalar((0.75 + intensity * 0.8) * pulse)
        signalDummy.updateMatrix()
        signalMesh.setMatrixAt(i, signalDummy.matrix)
        signalMesh.setColorAt(i, EVENT_COLOR.clone().lerp(EVENT_HOT_COLOR, intensity))
      })

      signalMesh.instanceMatrix.needsUpdate = true
      if (signalMesh.instanceColor) signalMesh.instanceColor.needsUpdate = true
      const signalMaterialInstance = signalMesh.material as MeshPhongMaterial
      signalMaterialInstance.opacity = 0.78 + 0.12 * (0.5 + 0.5 * Math.sin(now * 1.4))
      state.invalidate()
    }
  })

  if (countryCount === 0 && signalCount === 0) return null

  return (
    <>
      {countryCount > 0 ? (
        <instancedMesh
          ref={countryMeshRef}
          args={[countryGeometry, countryMaterial, countryCount]}
          frustumCulled={false}
        />
      ) : null}
      {signalCount > 0 ? (
        <instancedMesh
          ref={signalMeshRef}
          args={[signalGeometry, signalMaterial, signalCount]}
          frustumCulled={false}
          renderOrder={35}
        />
      ) : null}
    </>
  )
}
