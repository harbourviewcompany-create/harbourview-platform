'use client'

import { useMemo } from 'react'
import { AdditiveBlending, ShaderMaterial, FrontSide } from 'three'
import { Sphere } from '@react-three/drei'

// Atmosphere limb-glow layer — sits just outside the ocean sphere (r=2.35).
// Uses additive blending so it brightens whatever is behind it.
// Intensity peaks at grazing angles (the "limb") and falls to zero
// at the centre of the visible disc — exactly how planetary atmospheres look.
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
  uniform float uCoefficient;
  uniform float uPower;

  void main() {
    vec3  viewDir   = normalize(-vPosition);
    float rimFactor = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float intensity = uCoefficient * pow(rimFactor, uPower);
    gl_FragColor    = vec4(uGlowColor, intensity);
  }
`

export function AtmosphereGlow() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader:   VERT,
        fragmentShader: FRAG,
        uniforms: {
          // Thin blue-white haze — cold, not warm
          uGlowColor:   { value: [0.12, 0.32, 0.86] },
          uCoefficient: { value: 0.34 },
          // Higher power = thinner restrained band at limb; no milky shell
          uPower:       { value: 7.2 },
        },
        blending:    AdditiveBlending,
        side:        FrontSide,
        transparent: true,
        depthWrite:  false,
        depthTest:   true,
      }),
    [],
  )

  // 2.5% larger than OceanSphere (r=2.35) for a thin atmospheric rim.
  return (
    <Sphere args={[2.41, 64, 64]}>
      <primitive object={material} attach="material" />
    </Sphere>
  )
}
