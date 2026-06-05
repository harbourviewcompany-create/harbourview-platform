'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { FrontSide, BackSide, AdditiveBlending, Color, Vector3, type MeshPhysicalMaterial } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import { createCountryBufferGeometry } from '@/lib/globe/polygon-buffer-geometry'
import { resolveCountryMaterialState } from '@/lib/globe/globe-materials'
import { PLATE_LIFT, IDLE_EXTRUSION, SELECTED_EXTRUSION, SELECTED_GLOW } from '@/lib/globe/globe-plate-config'
import type { GlobeLayerId } from '@/types/globe-router'
const SPECULAR_CAP = 0.42

type MetallicGoldShader = { uniforms: Record<string, { value: unknown }>; vertexShader: string; fragmentShader: string }

type MetallicGoldShaderOptions = {
  isFocused: boolean
  isSelected: boolean
}

function applyMetallicGoldShader(shader: MetallicGoldShader, options: MetallicGoldShaderOptions) {
  shader.uniforms.uAntiqueGold = { value: new Color(options.isSelected ? '#b58623' : '#8a6419') }
  shader.uniforms.uChampagneGold = { value: new Color(options.isSelected ? '#fff0b8' : '#f7dc8a') }
  shader.uniforms.uBronzeGold = { value: new Color(options.isSelected ? '#5b3510' : '#3b260e') }
  shader.uniforms.uRimGold = { value: new Color(options.isSelected || options.isFocused ? '#fff6cf' : '#e8c46b') }
  shader.uniforms.uKeyDirection = { value: new Vector3(0.78, 0.42, 0.46) }
  shader.uniforms.uFillDirection = { value: new Vector3(-0.38, 0.64, -0.66) }
  shader.uniforms.uMetallicFocus = { value: options.isSelected ? 1.0 : options.isFocused ? 0.58 : 0.0 }

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldNormal;
     varying vec3 vHvMetalWorldPosition;`,
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     vHvMetalWorldNormal = normalize(mat3(modelMatrix) * normal);
     vHvMetalWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldNormal;
     varying vec3 vHvMetalWorldPosition;
     uniform vec3 uAntiqueGold;
     uniform vec3 uChampagneGold;
     uniform vec3 uBronzeGold;
     uniform vec3 uRimGold;
     uniform vec3 uKeyDirection;
     uniform vec3 uFillDirection;
     uniform float uMetallicFocus;

     float hvHash(vec3 p) {
       p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
       p += dot(p, p.yzx + 19.19);
       return fract((p.x + p.y) * p.z);
     }

     float hvValueNoise(vec3 p) {
       vec3 i = floor(p);
       vec3 f = fract(p);
       f = f * f * (3.0 - 2.0 * f);
       float n000 = hvHash(i + vec3(0.0, 0.0, 0.0));
       float n100 = hvHash(i + vec3(1.0, 0.0, 0.0));
       float n010 = hvHash(i + vec3(0.0, 1.0, 0.0));
       float n110 = hvHash(i + vec3(1.0, 1.0, 0.0));
       float n001 = hvHash(i + vec3(0.0, 0.0, 1.0));
       float n101 = hvHash(i + vec3(1.0, 0.0, 1.0));
       float n011 = hvHash(i + vec3(0.0, 1.0, 1.0));
       float n111 = hvHash(i + vec3(1.0, 1.0, 1.0));
       float nx00 = mix(n000, n100, f.x);
       float nx10 = mix(n010, n110, f.x);
       float nx01 = mix(n001, n101, f.x);
       float nx11 = mix(n011, n111, f.x);
       float nxy0 = mix(nx00, nx10, f.y);
       float nxy1 = mix(nx01, nx11, f.y);
       return mix(nxy0, nxy1, f.z);
     }`,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     vec3 hvNormal = normalize(vHvMetalWorldNormal);
     vec3 hvViewDir = normalize(cameraPosition - vHvMetalWorldPosition);
     vec3 hvKey = normalize(uKeyDirection);
     vec3 hvFill = normalize(uFillDirection);
     float hvKeyLight = smoothstep(-0.18, 0.82, dot(hvNormal, hvKey));
     float hvFillLight = smoothstep(-0.35, 0.65, dot(hvNormal, hvFill));
     float hvFalloff = smoothstep(0.74, -0.16, dot(hvNormal, hvKey));
     float hvSpec = pow(max(dot(reflect(-hvKey, hvNormal), hvViewDir), 0.0), mix(38.0, 72.0, uMetallicFocus));
     float hvRim = pow(1.0 - clamp(dot(hvNormal, hvViewDir), 0.0, 1.0), 2.35);
     float hvBrush = sin((vHvMetalWorldPosition.x * 28.0) + (vHvMetalWorldPosition.y * 15.0) - (vHvMetalWorldPosition.z * 9.0)) * 0.5 + 0.5;
     float hvFineBrush = sin((vHvMetalWorldPosition.x + vHvMetalWorldPosition.z) * 116.0) * 0.5 + 0.5;
     float hvNoise = hvValueNoise(vHvMetalWorldPosition * 22.0);
     float hvTexture = (hvBrush * 0.075) + (hvFineBrush * 0.028) + ((hvNoise - 0.5) * 0.085);
     vec3 hvLayeredGold = mix(uBronzeGold, uAntiqueGold, 0.58 + hvFillLight * 0.16 + hvTexture);
     hvLayeredGold = mix(hvLayeredGold, uChampagneGold, hvKeyLight * 0.34 + hvSpec * 0.42 + uMetallicFocus * 0.10);
     hvLayeredGold = mix(hvLayeredGold, uBronzeGold, hvFalloff * 0.34);
     hvLayeredGold += uRimGold * hvRim * (0.22 + uMetallicFocus * 0.22);
     hvLayeredGold += uChampagneGold * hvSpec * (0.34 + uMetallicFocus * 0.24);
     diffuseColor.rgb = mix(diffuseColor.rgb, hvLayeredGold, 0.88);`,
  )
}

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

function HoverPulseMesh({
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
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
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
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const matRef = useRef<MeshPhysicalMaterial>(null)
  const targetRef = useRef(emissiveIntensity)

  useEffect(() => {
    targetRef.current = isFocused ? Math.max(emissiveIntensity, 0.36) : emissiveIntensity
  }, [isFocused, emissiveIntensity])

  const metallicGoldShader = useMemo(() => {
    return (shader: MetallicGoldShader) => applyMetallicGoldShader(shader, { isFocused, isSelected })
  }, [isFocused, isSelected])

  useFrame((state, delta) => {
    if (!matRef.current) return
    const cur = matRef.current.emissiveIntensity
    const tgt = targetRef.current
    if (Math.abs(cur - tgt) < 0.001) return
    // Pulse is still animating — request the next frame (#4)
    state.invalidate()
    matRef.current.emissiveIntensity = cur + (tgt - cur) * Math.min(delta * 9, 1)
  })

  return (
    <>
      {/* Visual mesh — renders the country plate. Polygon offset and stable renderOrder keep selected and idle plates above the ocean without fighting boundary strokes. */}
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
          specularIntensity={isSelected ? 1.05 : isFocused ? 0.96 : 0.82}
          sheen={isSelected ? 0.32 : 0.18}
          sheenColor={isSelected ? '#fff0b8' : '#d5a642'}
          sheenRoughness={0.42}
          iridescence={isSelected ? 0.12 : 0.06}
          iridescenceIOR={1.35}
          onBeforeCompile={metallicGoldShader}
          customProgramCacheKey={() => `harbourview-metallic-gold-${isSelected ? 'selected' : isFocused ? 'focused' : 'idle'}`}
          side={FrontSide}
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
      {/* Hit mesh — inflated invisible surface for pointer events.
          For large countries this is the same geometry. For small countries
          (Singapore, Luxembourg, UAE, etc.) it's larger, improving tap accuracy. */}
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
  focusedCountryIso2,
  selectedCountryIso2s,
  activeLayerId,
  onHoverCountry,
  onSelectCountry,
}: {
  selectedCountryIso2?: string
  focusedCountryIso2?: string
  selectedCountryIso2s: string[]
  activeLayerId: GlobeLayerId
  onHoverCountry?: (countryIso2?: string) => void
  onSelectCountry?: (countryIso2: string) => void
}) {
  const idleGeometries = useMemo(
    () =>
      globeEntries.map((entry) => ({
        entry,
        geometry: createCountryBufferGeometry(entry, {
          plateLift: PLATE_LIFT,
          extrusionHeight: IDLE_EXTRUSION,
          geometryMode: 'surface',
        }),
        // Inflated hit geometry for small countries — larger plateLift pushes it
        // slightly above the visual mesh so raycasting hits it first
        hitGeometry:
          bboxArea(entry.bbox) < SMALL_COUNTRY_BBOX_THRESHOLD_DEG2
            ? createCountryBufferGeometry(entry, {
                plateLift: PLATE_LIFT + 0.06,
                extrusionHeight: IDLE_EXTRUSION + 0.04,
                geometryMode: 'surface',
              })
            : undefined,
      })),
    [],
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
    // If CA is selected, highlight all provinces
    if (selectedCountryIso2 === 'CA' || selectedCountryIso2s.includes('CA')) {
      canadaProvinces.forEach((p) => set.add(p.iso2))
    }
    // If US is selected, highlight all states
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
          geometryMode: 'surface',
        }),
      )
    }
    return map
  }, [selectedSet])

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
        const material = resolveCountryMaterialState({ visualState, layerId: activeLayerId })

        return (
          <HoverPulseMesh
            key={entry.iso3}
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
            onPointerEnter={() => onHoverCountry?.(entry.iso2)}
            onPointerLeave={() => onHoverCountry?.(undefined)}
            onClick={() => onSelectCountry?.(entry.iso2)}
          />
        )
      })}
    </group>
  )
}
