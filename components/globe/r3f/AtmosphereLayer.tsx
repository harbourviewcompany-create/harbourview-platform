'use client'

import { useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { AdditiveBlending, BackSide, MeshBasicMaterial, Color } from 'three'

// Single, restrained atmospheric shell. It is intentionally thinner than the
// previous dual-shell treatment so the rim reads as credible atmosphere rather
// than a neon halo, and it sits behind opaque land/ocean depth.
const ATMO_RADIUS = 2.48

function createAtmosphereMaterial() {
  const mat = new MeshBasicMaterial({
    color: new Color('#1d55b6'),
    transparent: true,
    opacity: 0.42,
    side: BackSide,
    depthTest: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vNormal;
       varying vec3 vViewDir;`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vNormal;
       varying vec3 vViewDir;`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vNormal = normalize(normalMatrix * normal);
       vViewDir = normalize(-mvPosition.xyz);`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 5.8);
       gl_FragColor.a *= smoothstep(0.22, 0.92, fresnel) * 0.42;`,
    )
  }

  mat.needsUpdate = true
  return mat
}

export function AtmosphereLayer() {
  const matRef = useRef<MeshBasicMaterial | null>(null)

  return (
    <Sphere args={[ATMO_RADIUS, 64, 64]} renderOrder={4}>
      <primitive
        object={(() => {
          if (!matRef.current) matRef.current = createAtmosphereMaterial()
          return matRef.current
        })()}
        attach="material"
      />
    </Sphere>
  )
}
