'use client'

import { Sphere } from '@react-three/drei'

export function OceanSphere() {
  return (
    <Sphere args={[2.35, 96, 96]}>
      <meshPhysicalMaterial
        color="#07121f"
        emissive="#10253c"
        emissiveIntensity={0.24}
        roughness={0.36}
        metalness={0.82}
        clearcoat={1}
        clearcoatRoughness={0.18}
      />
    </Sphere>
  )
}
