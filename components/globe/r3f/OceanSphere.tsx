'use client'

import { Sphere } from '@react-three/drei'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { ShaderMaterial } from 'three'

// Fresnel rim: glows at grazing angles (limb of the globe)
// Shadow gradient: darker on the away-from-light hemisphere
const OceanShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: [0.008, 0.024, 0.047],       // #02060c
    uEmissive:  [0.039, 0.082, 0.133],        // #0a1522
    uRimColor:  [0.08, 0.14, 0.32],           // cool blue rim
    uRimStrength: 1.6,
    uRimPower: 3.2,
    uShadowStrength: 0.44,
    uLightDir: [0.57, 0.42, 0.71],            // matches directionalLight [4,3,5] normalised
  },
  // vertex
  /*glsl*/`
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewDir = normalize(-mvPos.xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  // fragment
  /*glsl*/`
    uniform vec3 uBaseColor;
    uniform vec3 uEmissive;
    uniform vec3 uRimColor;
    uniform float uRimStrength;
    uniform float uRimPower;
    uniform float uShadowStrength;
    uniform vec3 uLightDir;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Fresnel: 1 at grazing angle, 0 facing camera
      float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), uRimPower);
      
      // Hemisphere shadow: darken away-from-light side
      float ndotl = dot(vNormal, normalize(uLightDir));
      float shadow = mix(1.0 - uShadowStrength, 1.0, max(ndotl, 0.0));
      
      vec3 color = (uBaseColor + uEmissive) * shadow;
      color += uRimColor * fresnel * uRimStrength;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ OceanShaderMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    oceanShaderMaterial: React.PropsWithRef<{
      uTime?: number
      uBaseColor?: [number, number, number]
      uEmissive?: [number, number, number]
      uRimColor?: [number, number, number]
      uRimStrength?: number
      uRimPower?: number
      uShadowStrength?: number
      uLightDir?: [number, number, number]
    }>
  }
}

export function OceanSphere() {
  const matRef = useRef<ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (matRef.current) {
      ;(matRef.current as unknown as { uTime: number }).uTime = clock.elapsedTime
    }
  })

  return (
    <Sphere args={[2.35, 96, 96]}>
      <oceanShaderMaterial ref={matRef} />
    </Sphere>
  )
}
