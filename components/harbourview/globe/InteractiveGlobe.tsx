'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import CountryHitLayer from './CountryHitLayer'
import StaticGlobeFallback from './StaticGlobeFallback'
import { evaluateInteractiveReadiness, logInteractiveFallback } from '@/lib/harbourview/globe/interactive-readiness'

function GlobeMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#0A2138" metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

export default function InteractiveGlobe() {
  const reducedMotion = useReducedMotion()
  const [hitLayerMounted, setHitLayerMounted] = useState(false)
  const readiness = evaluateInteractiveReadiness(hitLayerMounted)

  useEffect(() => {
    if (!readiness.interactiveReady && readiness.fallbackReason) {
      logInteractiveFallback(readiness.fallbackReason)
    }
  }, [readiness.fallbackReason, readiness.interactiveReady])

  if (!readiness.interactiveReady) {
    return <StaticGlobeFallback />
  }

  return (
    <div className="w-full max-w-[520px] aspect-square">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <GlobeMesh />
        <CountryHitLayer onReady={setHitLayerMounted} />

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
