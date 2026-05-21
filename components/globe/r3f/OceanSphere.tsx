'use client'

import { Sphere } from '@react-three/drei'

export function OceanSphere({
  segments,
  materialComplexity,
}: {
  segments: number
  materialComplexity: 'high' | 'medium' | 'low' | 'fallback'
}) {
  return (
    <Sphere args={[2.35, segments, segments]}>
      <meshPhysicalMaterial
        color="#07121f"
        emissive="#10253c"
        emissiveIntensity={materialComplexity === 'fallback' ? 0.08 : materialComplexity === 'low' ? 0.16 : 0.24}
        roughness={materialComplexity === 'high' ? 0.36 : 0.5}
        metalness={materialComplexity === 'high' ? 0.82 : 0.68}
        clearcoat={materialComplexity === 'high' ? 1 : 0}
        clearcoatRoughness={materialComplexity === 'high' ? 0.18 : 0.5}
      />
    </Sphere>
  )
}
