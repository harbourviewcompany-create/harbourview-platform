'use client'

import { Sphere } from '@react-three/drei'

const OCEAN_BASE = '#02060c'
const OCEAN_EMISSIVE = '#0a1522'
const OCEAN_SPECULAR_CAP = 0.34

export function OceanSphere() {
  const hasCustomShaderPath = false

  return (
    <Sphere args={[2.35, 96, 96]}>
      {hasCustomShaderPath ? (
        <meshPhysicalMaterial
          color={OCEAN_BASE}
          emissive={OCEAN_EMISSIVE}
          emissiveIntensity={0.18}
          roughness={0.62}
          metalness={0.52}
          clearcoat={0.52}
          clearcoatRoughness={0.44}
          reflectivity={OCEAN_SPECULAR_CAP}
        />
      ) : (
        <meshStandardMaterial
          color={OCEAN_BASE}
          emissive={OCEAN_EMISSIVE}
          emissiveIntensity={0.18}
          roughness={0.88}
          metalness={0.06}
          envMapIntensity={0}
        />
      )}
    </Sphere>
  )
}
