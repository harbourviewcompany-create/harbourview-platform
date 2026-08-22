'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, ShaderMaterial, FrontSide } from 'three'
import { Sphere } from '@react-three/drei'

// Atmosphere limb-glow layer — sits just outside the ocean sphere (r=2.35).
// Optional heat reaction: uHeatBoost warms + lifts limb intensity when the
// continuous heat layer reports high global activity.

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vec4 mvp  = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvp.xyz;
    gl_Position = projectionMatrix * mvp;
  }
`

const FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform vec3  uGlowColor;
  uniform vec3  uHeatTint;
  uniform float uCoefficient;
  uniform float uPower;
  uniform float uHeatBoost;

  void main() {
    vec3  viewDir   = normalize(-vPosition);
    float rimFactor = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float intensity = uCoefficient * pow(rimFactor, uPower);

    // Subtle warm shift + intensity lift when heat is high
    vec3 tinted = mix(uGlowColor, uHeatTint, clamp(uHeatBoost, 0.0, 1.0) * 0.35);
    float boosted = intensity * (1.0 + clamp(uHeatBoost, 0.0, 1.0) * 0.4);

    gl_FragColor = vec4(tinted, boosted);
  }
`

export type AtmosphereGlowProps = {
  /** 0–1 global heat influence from HeatDensityLayer. */
  heatBoost?: number
}

export function AtmosphereGlow({ heatBoost = 0 }: AtmosphereGlowProps) {
  const matRef = useRef<ShaderMaterial | null>(null)

  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uGlowColor: { value: new Color(0.1, 0.27, 0.72) },
        uHeatTint: { value: new Color(0.91, 0.77, 0.28) }, // #e8c547
        uCoefficient: { value: 0.34 },
        uPower: { value: 4.4 },
        uHeatBoost: { value: 0 },
      },
      blending: AdditiveBlending,
      side: FrontSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    matRef.current = mat
    return mat
  }, [])

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.uHeatBoost.value = heatBoost
    }
  }, [heatBoost])

  return (
    <Sphere args={[2.44, 32, 32]} renderOrder={55}>
      <primitive object={material} attach="material" />
    </Sphere>
  )
}
