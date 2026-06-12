'use client'

import { useMemo, useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { FrontSide, MeshPhysicalMaterial, Color } from 'three'

function createOceanMaterial(): MeshPhysicalMaterial {
  const mat = new MeshPhysicalMaterial({
    // Deep near-black base — ink/abyss, not silver
    color: new Color('#010812'),
    // Very faint deep-blue self-glow only visible in total shadow
    emissive: new Color('#030b18'),
    emissiveIntensity: 0.14,
    // High roughness = matte/deep — NO specular blobs from directional lights.
    // The ocean should absorb light, not reflect it. Gold land is the specular surface.
    roughness: 0.94,
    // Zero metalness — no PBR environment reflections on the ocean at all
    metalness: 0.0,
    // No clearcoat — clearcoat was the source of the glossy white blobs on ocean
    clearcoat: 0.0,
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

    // Fresnel rim in fragment shader
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
    shader.uniforms.uRimColor = { value: new Color(0.03, 0.09, 0.22) }
    shader.uniforms.uRimStrength = { value: 0.62 }
    shader.uniforms.uRimPower = { value: 4.2 }
  }

  mat.side = FrontSide
  mat.depthTest = true
  mat.depthWrite = true
  mat.needsUpdate = true
  return mat
}

export function OceanSphere() {
  // useMemo: material created once per mount, not on every render.
  // Avoids the fragile inline-IIFE-with-ref anti-pattern.
  const mat = useMemo(() => createOceanMaterial(), [])

  // Dispose when unmounted
  const matRef = useRef(mat)
  matRef.current = mat

  return (
    // 32×32 segments — visually indistinguishable from 64×64 at globe scale,
    // half the vertices on a surface that has no cartographic detail.
    <Sphere args={[2.35, 32, 32]} renderOrder={10}>
      <primitive object={mat} attach="material" />
    </Sphere>
  )
}
