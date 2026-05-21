'use client'

import { Sphere } from '@react-three/drei'
import { shouldUseStandardMaterialFallback } from '@/lib/globe/globe-materials'

export function OceanSphere() {
  const useStandardMaterialFallback = shouldUseStandardMaterialFallback()

  return (
    <Sphere args={[2.35, 96, 96]}>
      {useStandardMaterialFallback ? (
        <meshStandardMaterial
          color="#050b12"
          emissive="#0d1824"
          emissiveIntensity={0.12}
          roughness={0.88}
          metalness={0.16}
        />
      ) : (
        <meshPhysicalMaterial
          color="#050b12"
          emissive="#0d1824"
          emissiveIntensity={0.14}
          roughness={0.86}
          metalness={0.2}
          clearcoat={0.18}
          clearcoatRoughness={0.78}
        />
      )}
    </Sphere>
  )
}
