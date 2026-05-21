'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import CountryHitLayer from './CountryHitLayer'

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

  return (
    <div className="w-full max-w-[520px] aspect-square">
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: GLOBE_CAMERA_CONFIG.initialPosition,
          fov: GLOBE_CAMERA_CONFIG.fov,
          near: GLOBE_CAMERA_CONFIG.near,
          far: GLOBE_CAMERA_CONFIG.far,
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <GlobeMesh />
        <CountryHitLayer />

        <OrbitControls
          target={GLOBE_CAMERA_CONFIG.initialTarget}
          minDistance={GLOBE_CAMERA_CONFIG.minDistance}
          maxDistance={GLOBE_CAMERA_CONFIG.maxDistance}
          minPolarAngle={GLOBE_CAMERA_CONFIG.minPolarAngle}
          maxPolarAngle={GLOBE_CAMERA_CONFIG.maxPolarAngle}
          minAzimuthAngle={GLOBE_CAMERA_CONFIG.minAzimuthAngle}
          maxAzimuthAngle={GLOBE_CAMERA_CONFIG.maxAzimuthAngle}
          enablePan={GLOBE_CAMERA_CONFIG.enablePan}
          enableZoom={GLOBE_CAMERA_CONFIG.enableZoom}
          enableDamping={GLOBE_CAMERA_CONFIG.enableDamping}
          dampingFactor={GLOBE_CAMERA_CONFIG.dampingFactor}
          rotateSpeed={GLOBE_CAMERA_CONFIG.rotateSpeed}
          autoRotate={!reducedMotion}
          autoRotateSpeed={GLOBE_CAMERA_CONFIG.autoRotateSpeed}
        />
      </Canvas>
    </div>
  )
}
