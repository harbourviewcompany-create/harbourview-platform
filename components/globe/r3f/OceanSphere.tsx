'use client'

import { useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { MeshPhysicalMaterial, Color } from 'three'

// MeshPhysicalMaterial adds a clearcoat layer — a second, sharper specular
// highlight that sits above the base roughness surface. On the ocean this reads
// as the reflective glassy skin of water over a dark deep-sea body.
function createOceanMaterial() {
  const mat = new MeshPhysicalMaterial({
    color: new Color('#030c18'),
    emissive: new Color('#0e1f35'),
    emissiveIntensity: 0.24,
    roughness: 0.72,
    metalness: 0.04,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
  })

  mat.onBeforeCompile = (shader) => {
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
    shader.uniforms.uRimColor = { value: new Color(0.06, 0.12, 0.28) }
    shader.uniforms.uRimStrength = { value: 1.4 }
    shader.uniforms.uRimPower = { value: 3.4 }
  }

  mat.needsUpdate = true
  return mat
}

export function OceanSphere() {
  const matRef = useRef<MeshPhysicalMaterial | null>(null)

  // 64×64: indistinguishable from 96×96 at globe camera distances, saves ~4 900 triangles.
  return (
    <Sphere args={[2.35, 64, 64]}>
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
