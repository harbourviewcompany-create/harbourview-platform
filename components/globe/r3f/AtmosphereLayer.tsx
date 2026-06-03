'use client'

import { useRef } from 'react'
import { Sphere } from '@react-three/drei'
import { AdditiveBlending, BackSide, MeshBasicMaterial, Color } from 'three'

// Atmosphere radius is ~7% larger than OceanSphere (2.35) so it wraps outside.
const ATMO_RADIUS = 2.52

function createAtmosphereMaterial() {
  const mat = new MeshBasicMaterial({
    color: new Color('#183f78'),
    transparent: true,
    opacity: 1,
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  })

  mat.onBeforeCompile = (shader) => {
    // Fresnel: opacity is ~0 when looking head-on, ~1 at the limb.
    // Rendered BackSide so the glow wraps around the globe perimeter from
    // the viewer's perspective without covering the surface directly.
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
       float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.2);
       gl_FragColor.a *= fresnel * 0.46;`,
    )
  }

  mat.needsUpdate = true
  return mat
}

export function AtmosphereLayer() {
  const matRef = useRef<MeshBasicMaterial | null>(null)

  return (
    <Sphere args={[ATMO_RADIUS, 64, 64]} renderOrder={60}>
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
