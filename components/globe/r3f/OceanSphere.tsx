'use client'

import { useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { FrontSide, MeshPhysicalMaterial, MeshStandardMaterial, Color } from 'three'

// Fresnel rim via onBeforeCompile — no shaderMaterial, no extend, fiber v9 safe.
// Injects into Three.js standard shader pipeline at build time.
function createOceanMaterial() {
  const mat = new MeshPhysicalMaterial({
    // Deep enamel base — near-black with indigo undertone
    color: new Color('#010711'),
    // Deep smoked emissive — visible in shadow without brightening the lit face
    emissive: new Color('#050f22'),
    emissiveIntensity: 0.22,
    // Low roughness → tighter specular, glassier/enamel surface quality
    roughness: 0.62,
    // Faint metalness hint → catches environment reflections like deep lacquer
    metalness: 0.08,
    // Clearcoat gives second sharp reflection layer — reads as polished enamel
    clearcoat: 0.52,
    clearcoatRoughness: 0.06,
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
    shader.uniforms.uRimColor = { value: new Color(0.04, 0.12, 0.28) }
    shader.uniforms.uRimStrength = { value: 1.1 }
    shader.uniforms.uRimPower = { value: 3.2 }
  }

  mat.side = FrontSide
  mat.depthTest = true
  mat.depthWrite = true
  mat.needsUpdate = true
  return mat
}

export function OceanSphere() {
  const matRef = useRef<MeshStandardMaterial | null>(null)

  return (
    <Sphere args={[2.35, 64, 64]} renderOrder={10}>
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
