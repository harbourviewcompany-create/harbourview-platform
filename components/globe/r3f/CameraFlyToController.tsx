'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { naturalEarthFixturePayload } from '@/data/globe/natural-earth-fixture'
import { createCountryFocusPose, type GlobeCameraPose } from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'

function findCountryPose(countryIso2?: string): GlobeCameraPose | null {
  if (!countryIso2) return null

  const country = naturalEarthFixturePayload.countries.find((candidate) => candidate.iso2 === countryIso2)

  if (!country) return null

  return createCountryFocusPose(country)
}

export function CameraFlyToController({ selectedCountryIso2 }: { selectedCountryIso2?: string }) {
  const { camera } = useThree()
  const targetRef = useRef(new Vector3(...GLOBE_CAMERA_CONFIG.initialTarget))
  const poseRef = useRef<GlobeCameraPose | null>(null)

  useEffect(() => {
    poseRef.current = findCountryPose(selectedCountryIso2)
  }, [selectedCountryIso2])

  useFrame(() => {
    const pose = poseRef.current

    if (!pose) return

    const nextPosition = new Vector3(...pose.position)
    const nextTarget = new Vector3(...pose.target)

    camera.position.lerp(nextPosition, 0.035)
    targetRef.current.lerp(nextTarget, 0.035)
    camera.lookAt(targetRef.current)
    camera.updateProjectionMatrix()
  })

  return null
}
