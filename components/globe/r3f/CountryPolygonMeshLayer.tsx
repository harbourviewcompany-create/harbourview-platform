'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { FrontSide, BackSide, DoubleSide, AdditiveBlending, type MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { germanyBundeslaender } from '@/data/globe/germany-bundeslaender'
import { australiaStates } from '@/data/globe/australia-states'

// Sub-national entries keyed by parent iso2.
// US is always expanded (state-level cannabis law relevance).
// All others expand only when explicitly requested (e.g. in BriefingRoom).
const SUB_NATIONALS: Record<string, (typeof canadaProvinces[number])[]> = {
  CA: canadaProvinces,
  US: usStates,
  DE: germanyBundeslaender,
  AU: australiaStates,
}

function buildGlobeEntries(subNationalIso2s: string[]) {
  const expanded = new Set(subNationalIso2s)
  expanded.add('US') // US always split
  expanded.add('CA') // CA always split (provinces)
  const excluded = new Set(Object.keys(SUB_NATIONALS).filter(k => expanded.has(k)))
  return [
    ...naturalEarthCountriesPayload.countries.filter(c => !excluded.has(c.iso2)),
    ...Array.from(expanded).flatMap(iso2 => SUB_NATIONALS[iso2] ?? []),
  ]
}
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState, type GlobeTierPalette, type RegulatoryTier } from '@/lib/globe/globe-materials'
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

// ---------------------------------------------------------------------------
// HoverPulseMesh
//
// Renders a single country plate. Emissive pulse animation is NOT handled
// here — it was moved to the single centralized useFrame in
// CountryPolygonMeshLayer, reducing useFrame subscriptions from ~250 to 1.
//
// Contract with parent:
//   registerMat(iso2, mat | null) — called on mount (mat) and unmount (null)
//   scheduleAnimation(iso2, target) — called when pulse target changes
// ---------------------------------------------------------------------------
function HoverPulseMesh({
  iso2,
  geometry,
  hitGeometry,
  color,
  emissive,
  emissiveIntensity,
  roughness,
  metalness,
  clearcoat,
  clearcoatRoughness,
  reflectivity,
  isFocused,
  isSelected,
  registerMat,
  scheduleAnimation,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
  iso2: string
  geometry: ReturnType<typeof createCountryBufferGeometry>
  hitGeometry?: ReturnType<typeof createCountryBufferGeometry>
  color: string
  emissive: string
  emissiveIntensity: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  isFocused: boolean
  isSelected: boolean
  registerMat: (iso2: string, mat: MeshPhysicalMaterial | null) => void
  scheduleAnimation: (iso2: string, target: number) => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const matRef = useRef<MeshPhysicalMaterial>(null)

  // Register mat with the parent animation registry on mount; deregister on unmount.
  useEffect(() => {
    if (matRef.current) registerMat(iso2, matRef.current)
    return () => { registerMat(iso2, null) }
    // iso2 is stable per-entry; registerMat is useCallback-stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso2, registerMat])

  // Whenever focus/intensity changes, push the new target to the parent scheduler.
  // The parent's single useFrame lerps all active animations.
  useEffect(() => {
    const target = isFocused ? Math.max(emissiveIntensity, 0.36) : emissiveIntensity
    scheduleAnimation(iso2, target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso2, isFocused, emissiveIntensity, scheduleAnimation])

  const metallicGoldShader = useMemo(() => {
    return (shader: MetallicGoldShader) => applyMetallicGoldShader(shader, { isFocused, isSelected })
  }, [isFocused, isSelected])

  return (
    <>
      {/* Visual mesh — renders the country plate. */}
      <mesh geometry={geometry} renderOrder={20}>
        <meshPhysicalMaterial
          ref={matRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
          reflectivity={reflectivity}
          envMapIntensity={isSelected ? 0.95 : isFocused ? 0.76 : 0.60}
          specularIntensity={isSelected ? 1.15 : isFocused ? 1.05 : 0.94}
          sheen={isSelected ? 0.32 : 0.18}
          sheenColor={isSelected ? '#fff0b8' : '#d5a642'}
          sheenRoughness={0.42}
          iridescence={isSelected ? 0.12 : 0.06}
          iridescenceIOR={1.35}
          onBeforeCompile={metallicGoldShader}
          customProgramCacheKey={() => getMetallicGoldProgramCacheKey({ isFocused, isSelected })}
          side={DoubleSide}
          depthTest
          depthWrite
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      {isSelected ? (
        <>
          <mesh geometry={geometry} scale={1.004} renderOrder={24}>
            <meshBasicMaterial
              color={SELECTED_GLOW}
              transparent
              opacity={0.12}
              blending={AdditiveBlending}
              side={BackSide}
              depthTest
              depthWrite={false}
            />
          </mesh>
          <mesh geometry={geometry} scale={1.0018} renderOrder={25}>
            <meshBasicMaterial
              color="#fff0b8"
              transparent
              opacity={0.075}
              blending={AdditiveBlending}
              side={FrontSide}
              depthTest
              depthWrite={false}
            />
          </mesh>
        </>
      ) : null}
      {/* Hit mesh — inflated invisible surface for pointer events. */}
      <mesh
        geometry={hitGeometry ?? geometry}
        visible={false}
        renderOrder={40}
        onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter() }}
        onPointerLeave={(e) => { e.stopPropagation(); onPointerLeave() }}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      />
    </>
  )
}

export function CountryPolygonMeshLayer({
  selectedCountryIso2,
  subNationalIso2s = [],
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
  tierByIso2,
  tierPalette = 'metal',
  onHoverCountry,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  subNationalIso2s?: string[]
  focusedCountryIso2?: string
  selectedCountryIso2s: string[]
  activeLayerId: GlobeLayerId
  /**
   * iso2 → reviewed regulatory tier. Absent key = unreviewed = neutral plate.
   * Undefined map entirely = tier colouring disabled (feature flag off).
   */
  tierByIso2?: Record<string, RegulatoryTier | null>
  tierPalette?: GlobeTierPalette
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  // ---------------------------------------------------------------------------
  // Centralised emissive-pulse animation
  //
  // Previously each HoverPulseMesh registered its own useFrame, resulting in
  // ~250 subscriptions that R3F iterates every frame regardless of whether
  // anything is animating. Now a single useFrame handles all active lerps.
  //
  // matRegistry  — iso2 → MeshPhysicalMaterial (registered on mesh mount)
  // targetMap    — iso2 → target emissiveIntensity (set when state changes)
  // animating    — set of iso2s currently lerping (added by scheduleAnimation,
  //                removed when settled)
  // ---------------------------------------------------------------------------
  const matRegistry = useRef(new Map<string, MeshPhysicalMaterial>())
  const targetMap   = useRef(new Map<string, number>())
  const animating   = useRef(new Set<string>())
  const { invalidate } = useThree()

  const registerMat = useCallback((iso2: string, mat: MeshPhysicalMaterial | null) => {
    if (mat) {
      matRegistry.current.set(iso2, mat)
    } else {
      matRegistry.current.delete(iso2)
      targetMap.current.delete(iso2)
      animating.current.delete(iso2)
    }
  }, [])

  const scheduleAnimation = useCallback((iso2: string, target: number) => {
    targetMap.current.set(iso2, target)
    animating.current.add(iso2)
    invalidate()
  }, [invalidate])

  // Single useFrame — only does work when animating.size > 0
  useFrame((state, delta) => {
    if (animating.current.size === 0) return
    const settled: string[] = []
    for (const iso2 of animating.current) {
      const mat    = matRegistry.current.get(iso2)
      const target = targetMap.current.get(iso2)
      if (!mat || target === undefined) { settled.push(iso2); continue }
      const cur = mat.emissiveIntensity
      if (Math.abs(cur - target) < 0.001) {
        mat.emissiveIntensity = target
        settled.push(iso2)
        continue
      }
      mat.emissiveIntensity = cur + (target - cur) * Math.min(delta * 9, 1)
      state.invalidate()
    }
    for (const iso2 of settled) animating.current.delete(iso2)
  })

  // ---------------------------------------------------------------------------
  // Geometry and entry memos
  // ---------------------------------------------------------------------------

  // Stringify dep to avoid rebuilding all geometries when the array ref changes
  // but contents are identical. The join is computed inside useMemo so the
  // outer render path pays only the useMemo cache-check cost per render.
  const subNationalKey = useMemo(
    () => subNationalIso2s.slice().sort().join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subNationalIso2s],
  )

  const globeEntries = useMemo(
    () => buildGlobeEntries(subNationalIso2s),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subNationalKey],
  )

  const idleGeometries = useMemo(
    () =>
      globeEntries.map((entry) => ({
        entry,
        geometry: createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'extruded',
          simplifyTolerance: LOD_SIMPLIFY_TOLERANCE.medium,
        }),
        hitGeometry:
          bboxArea(entry.bbox) < SMALL_COUNTRY_BBOX_THRESHOLD_DEG2
            ? createCountryBufferGeometry(entry, {
                plateLift: PLATE_LIFT + 0.06,
                extrusionHeight: IDLE_EXTRUSION + 0.04,
                geometryMode: 'surface',
              })
            : undefined,
      })),
    [globeEntries],
  )

  useEffect(() => {
    return () => {
      idleGeometries.forEach(({ geometry, hitGeometry }) => {
        geometry.dispose()
        hitGeometry?.dispose()
      })
    }
  }, [idleGeometries])

  const selectedSet = useMemo(() => {
    const set = new Set<string>(selectedCountryIso2s)
    if (selectedCountryIso2) set.add(selectedCountryIso2)
    if (selectedCountryIso2 === 'CA' || selectedCountryIso2s.includes('CA')) {
      canadaProvinces.forEach((p) => set.add(p.iso2))
    }
    if (selectedCountryIso2 === 'US' || selectedCountryIso2s.includes('US')) {
      usStates.forEach((s) => set.add(s.iso2))
    }
    return set
  }, [selectedCountryIso2, selectedCountryIso2s])

  const extrudedGeometries = useMemo(() => {
    if (selectedSet.size === 0) return new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    const map = new Map<string, ReturnType<typeof createCountryBufferGeometry>>()
    for (const entry of globeEntries) {
      if (!selectedSet.has(entry.iso2)) continue
      map.set(
        entry.iso2,
        createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT + 0.002,
          extrusionHeight: SELECTED_EXTRUSION,
          geometryMode: 'extruded',
        }),
      )
    }
    return map
  }, [selectedSet, globeEntries])

  useEffect(() => {
    return () => {
      extrudedGeometries.forEach((geometry) => geometry.dispose())
    }
  }, [extrudedGeometries])

  return (
    <group renderOrder={20} userData={{ layer: 'country-polygon-meshes' }}>
      {idleGeometries.map(({ entry, geometry, hitGeometry }) => {
        const isSelected = selectedSet.has(entry.iso2)
        const activeGeometry = isSelected ? extrudedGeometries.get(entry.iso2) ?? geometry : geometry
        const visualState = isSelected
          ? 'selected'
          : focusedCountryIso2 === entry.iso2
            ? 'focused'
            : 'idle'
        // Sub-national entries carry a hyphenated iso2 ('CA-AB', 'US-CO') plus a
        // `parentIso2`. A regulatory tier is a national-law claim and we have no
        // state-level review, so subdivisions inherit the parent's tier. Without
        // the parentIso2 fallback every province/state would silently miss the
        // lookup and render neutral.
        const tierIso2 = (entry as { parentIso2?: string }).parentIso2 ?? entry.iso2
        const material = resolveCountryMaterialState({
          visualState,
          layerId: activeLayerId,
          regulatoryTier: tierByIso2?.[tierIso2] ?? null,
          palette: tierPalette,
        })

        return (
          <HoverPulseMesh
            key={entry.iso3}
            iso2={entry.iso2}
            geometry={activeGeometry}
            hitGeometry={isSelected ? undefined : hitGeometry}
            color={material.plateBase}
            emissive={material.emissive}
            emissiveIntensity={material.emissiveIntensity}
            roughness={material.roughness}
            metalness={material.metalness}
            clearcoat={material.clearcoat}
            clearcoatRoughness={material.clearcoatRoughness}
            reflectivity={SPECULAR_CAP}
            isFocused={focusedCountryIso2 === entry.iso2}
            isSelected={visualState === 'selected'}
            registerMat={registerMat}
            scheduleAnimation={scheduleAnimation}
            onPointerEnter={() => onHoverCountry?.(entry.iso2)}
            onPointerLeave={() => onHoverCountry?.(undefined)}
            onClick={() => { onSelectCountry?.(entry.iso2) }}
          />
        )
      })}
    </group>
  )
}
