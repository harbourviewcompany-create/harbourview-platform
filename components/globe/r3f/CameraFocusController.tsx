'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { getGlobeCountryGeometry } from '@/lib/globe/country-geometry-store'
import { createCountryFocusPose } from '@/lib/globe/camera-focus'

export function CameraFocusController({ selectedCountryIso2 }: { selectedCountryIso2?: string }) {
  const { camera } = useThree()
  const progressRef = useRef(1)
  const targetPose = useMemo(() => {
    const country = getGlobeCountryGeometry(selectedCountryIso2)
    return country ? createCountryFocusPose(country) : undefined
  }, [selectedCountryIso2])

  useFrame(() => {
    if (!targetPose || progressRef.current >= 1) return

    progressRef.current = Math.min(1, progressRef.current + 0.035)
    const eased = 1 - Math.pow(1 - progressRef.current, 3)
    const nextPosition = new Vector3(...targetPose.position)
    camera.position.lerp(nextPosition, eased * 0.06)
    camera.lookAt(...targetPose.target)
    camera.updateProjectionMatrix()
  })

  if (targetPose && progressRef.current === 1) {
    progressRef.current = 0
  }

  return null
}
