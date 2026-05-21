'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import CountryHitLayer from './CountryHitLayer'
import { downgradeQuality, getInitialQuality, getQualityBudget, resolveQualityTier, type GlobeQualityLevel } from '@/lib/harbourview/globe/quality'

function GlobeMesh({ segments }: { segments: number }) {
  return (
    <mesh>
      <sphereGeometry args={[1, segments, segments]} />
      <meshStandardMaterial color="#0A2138" metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

export default function InteractiveGlobe() {
  const reducedMotion = useReducedMotion()
  const initialQuality = useMemo(() => getInitialQuality(), [])
  const [quality, setQuality] = useState<GlobeQualityLevel>(initialQuality)
  const budget = getQualityBudget(quality)

  return (
    <div className="w-full max-w-[520px] aspect-square">
      <Canvas
        dpr={[1, budget.maxDpr]}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        onCreated={({ gl }) => {
          const maxTextureSize = gl.capabilities.maxTextureSize
          if (maxTextureSize < 4096) {
            setQuality(resolveQualityTier({ capabilityFailure: true }))
            return
          }

          if (quality === 'high' && maxTextureSize < 8192) {
            setQuality(downgradeQuality(quality))
          }
        }}
      >
        <ambientLight intensity={budget.materialComplexity === 'high' ? 0.5 : 0.42} />
        <directionalLight position={[5, 5, 5]} intensity={budget.materialComplexity === 'fallback' ? 0.75 : 1} />

        <GlobeMesh segments={budget.sphereSegments} />
        <CountryHitLayer />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
