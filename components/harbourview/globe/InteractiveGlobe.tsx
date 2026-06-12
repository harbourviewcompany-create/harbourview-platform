'use client'

// ---------------------------------------------------------------------------
// DEPRECATED — do not use in new features.
//
// InteractiveGlobe.tsx was the original globe component built on a plain
// sphereGeometry mesh + CountryHitLayer overlay. It has been superseded by
// the full R3F pipeline in GlobeCanvas.tsx (metallic plates, atmospheric glow,
// camera fly-to, quality-tiered LOD, centralised animation).
//
// Retained only because GlobeStage.tsx references evaluateInteractiveReadiness,
// which checks for CountryHitLayer mounting. Once GlobeStage is migrated to
// the new pipeline this file should be deleted.
// ---------------------------------------------------------------------------

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
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

/** @deprecated Use GlobeCanvas from components/globe/r3f/GlobeCanvas.tsx instead. */
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
        camera={{
          position: GLOBE_CAMERA_CONFIG.initialPosition,
          fov:      GLOBE_CAMERA_CONFIG.fov,
          near:     GLOBE_CAMERA_CONFIG.near,
          far:      GLOBE_CAMERA_CONFIG.far,
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <GlobeMesh />
        <CountryHitLayer onReady={setHitLayerMounted} />

        <OrbitControls
          target={GLOBE_CAMERA_CONFIG.initialTarget}
          minDistance={GLOBE_CAMERA_CONFIG.minDistance}
          maxDistance={GLOBE_CAMERA_CONFIG.maxDistance}
          minPolarAngle={GLOBE_CAMERA_CONFIG.minPolarAngle}
          maxPolarAngle={GLOBE_CAMERA_CONFIG.maxPolarAngle}
          enablePan={GLOBE_CAMERA_CONFIG.enablePan}
          enableZoom={GLOBE_CAMERA_CONFIG.enableZoom}
          enableDamping={GLOBE_CAMERA_CONFIG.enableDamping}
          dampingFactor={GLOBE_CAMERA_CONFIG.dampingFactor}
          rotateSpeed={GLOBE_CAMERA_CONFIG.rotateSpeed}
          autoRotate={!reducedMotion}
        />
      </Canvas>
    </div>
  )
}
