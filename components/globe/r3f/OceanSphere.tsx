'use client'

import { useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { MeshStandardMaterial, Color } from 'three'

// Fresnel rim via onBeforeCompile — no shaderMaterial, no extend, fiber v9 safe.
// Injects into Three.js standard shader pipeline at build time.
function createOceanMaterial() {
  const mat = new MeshStandardMaterial({
    color: new Color('#071828'),
    emissive: new Color('#14283f'),
    emissiveIntensity: 0.38,
    roughness: 0.82,
    metalness: 0.10,
  })

  mat.onBeforeCompile = (shader) => {
    // Pass view-space position to fragment shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vViewPos;`
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vViewPos = -(modelViewMatrix * vec4(position, 1.0)).xyz;`
    )

    // Fresnel rim + hemisphere shadow in fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vViewPos;
       uniform vec3 uRimColor;
       uniform float uRimStrength;
       uniform float uRimPower;`
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       // Fresnel: brighter at grazing angles (globe limb)
       vec3 viewDir = normalize(vViewPos);
       vec3 n = normalize(vNormal);
       float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), uRimPower);
       gl_FragColor.rgb += uRimColor * fresnel * uRimStrength;`
    )

    shader.uniforms.uRimColor = { value: new Color(0.05, 0.14, 0.34) }
    shader.uniforms.uRimStrength = { value: 0.56 }
    shader.uniforms.uRimPower = { value: 5.2 }
  }

  mat.needsUpdate = true
  return mat
}

export function OceanSphere() {
  const matRef = useRef<MeshStandardMaterial | null>(null)

  return (
    <Sphere args={[2.35, 96, 96]}>
      <primitive
        object={(() => {
          if (!matRef.current) matRef.current = createOceanMaterial()
          return matRef.current
        })()}
        attach="material"
      />
    </Sphere>
  )
}
