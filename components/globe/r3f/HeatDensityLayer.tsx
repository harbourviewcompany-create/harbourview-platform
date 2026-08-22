'use client'

/**
 * HeatDensityLayer — continuous spherical density heatmap.
 * Texture build is owned by useHeatDensityTexture (worker + throttle + reuse).
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Mesh, ShaderMaterial, SphereGeometry } from 'three'
import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'
import { HEAT_CONFIG, HEAT_RESOLUTION, type HeatQuality, resolveHeatQuality } from '@/lib/globe/heat-density'
import { useHeatDensityTexture } from '@/lib/globe/useHeatDensityTexture'

type HeatDensityLayerProps = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
  intensity?: number
  prefersReducedMotion?: boolean
  quality?: HeatQuality
  onHeatBoost?: (boost: number) => void
}

const VERT = /* glsl */ `
  uniform sampler2D uDensityMap;
  uniform float uMaxAltitude;
  uniform float uSurfaceRadius;
  uniform float uDensityFloor;

  varying vec2 vUv;
  varying float vDensity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  vec2 sphereUv(vec3 p) {
    float lng = atan(p.z, -p.x);
    float lat = asin(clamp(p.y, -1.0, 1.0));
    return vec2(
      (lng + 3.14159265) / (2.0 * 3.14159265),
      (lat + 1.57079633) / 3.14159265
    );
  }

  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec3 dir = normalize(position);
    vUv = sphereUv(dir);
    float density = texture2D(uDensityMap, vUv).r;
    density = max(0.0, density - uDensityFloor) / max(0.001, 1.0 - uDensityFloor);
    vDensity = density;

    float alt = uMaxAltitude * smoothstep(0.15, 1.0, density);
    vec3 displaced = dir * uSurfaceRadius + normal * alt;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;
  uniform vec3 uColorPeak;
  uniform float uOpacity;
  uniform float uHeatInfluence;
  uniform float uTime;
  uniform float uBreathe;

  varying vec2 vUv;
  varying float vDensity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  vec3 heatColor(float t) {
    if (t < 0.35) {
      return mix(uColorLow, uColorMid, smoothstep(0.0, 0.35, t));
    } else if (t < 0.7) {
      return mix(uColorMid, uColorHot, smoothstep(0.35, 0.7, t));
    }
    return mix(uColorHot, uColorPeak, smoothstep(0.7, 1.0, t));
  }

  void main() {
    float d = vDensity * uHeatInfluence;
    if (uBreathe > 0.5) {
      float breathe = 0.97 + 0.03 * sin(uTime * 0.7 + vUv.x * 6.0);
      d *= breathe;
    }

    if (d < 0.02) discard;

    vec3 col = heatColor(d);

    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.8);
    col += col * fresnel * 0.25;

    float emit = smoothstep(0.4, 1.0, d);
    col += col * emit * 0.45;

    float alpha = uOpacity * smoothstep(0.02, 0.25, d);
    gl_FragColor = vec4(col, alpha);
  }
`

export function HeatDensityLayer({
  countries,
  signalsByIso2,
  intensity = 1,
  prefersReducedMotion = false,
  quality: qualityProp,
  onHeatBoost,
}: HeatDensityLayerProps) {
  const meshRef = useRef<Mesh>(null)
  const matRef = useRef<ShaderMaterial | null>(null)

  const quality = qualityProp ?? resolveHeatQuality({ prefersReducedMotion })
  const res = HEAT_RESOLUTION[quality]
  const maxAltitude = prefersReducedMotion || quality === 'low' ? 0 : HEAT_CONFIG.maxAltitude
  const breathe = prefersReducedMotion || quality === 'low' ? 0 : 1

  const { texture, boost, ready } = useHeatDensityTexture({
    countries,
    signalsByIso2,
    prefersReducedMotion,
    quality,
  })

  useEffect(() => {
    onHeatBoost?.(boost)
  }, [boost, onHeatBoost])

  const geometry = useMemo(
    () => new SphereGeometry(1, res.segmentsW, res.segmentsH),
    [res.segmentsW, res.segmentsH],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDensityMap: { value: null },
        uColorLow: { value: new Color('#0a1628') },
        uColorMid: { value: new Color('#1a7a5c') },
        uColorHot: { value: new Color('#e8c547') },
        uColorPeak: { value: new Color('#f5f0e0') },
        uOpacity: { value: 0.82 },
        uMaxAltitude: { value: maxAltitude },
        uSurfaceRadius: { value: HEAT_CONFIG.surfaceRadius },
        uDensityFloor: { value: HEAT_CONFIG.densityFloor },
        uTime: { value: 0 },
        uHeatInfluence: { value: intensity },
        uBreathe: { value: breathe },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })
    matRef.current = mat
    return mat
  }, [])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useEffect(() => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uDensityMap.value = texture
    mat.uniforms.uHeatInfluence.value = intensity
    mat.uniforms.uMaxAltitude.value = maxAltitude
    mat.uniforms.uBreathe.value = breathe
  }, [texture, intensity, maxAltitude, breathe])

  useFrame((state) => {
    if (!matRef.current || breathe < 0.5) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    state.invalidate()
  })

  if (!ready || !texture) return null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      renderOrder={30}
      frustumCulled={false}
    />
  )
}
