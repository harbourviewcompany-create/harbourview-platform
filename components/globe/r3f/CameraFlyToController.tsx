'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { createCountryFocusPose, type GlobeCameraPose } from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'

function findCountryPose(countryIso2?: string): GlobeCameraPose | null {
  if (!countryIso2) return null

  const country = naturalEarthCountriesPayload.countries.find((candidate) => candidate.iso2 === countryIso2)

  if (!country) return null

  return createCountryFocusPose(country)
}

export function CameraFlyToController({ selectedCountryIso2 }: { selectedCountryIso2?: string }) {
  const { camera } = useThree()
  const targetRef = useRef(new Vector3(...GLOBE_CAMERA_CONFIG.initialTarget))
  const poseRef = useRef<GlobeCameraPose | null>(null)
  const nextPositionRef = useRef(new Vector3())
  const nextTargetRef = useRef(new Vector3())

  useEffect(() => {
    poseRef.current = findCountryPose(selectedCountryIso2)
  }, [selectedCountryIso2])

  useFrame(() => {
    const pose = poseRef.current

    if (!pose) return

    nextPositionRef.current.set(pose.position[0], pose.position[1], pose.position[2])
    nextTargetRef.current.set(pose.target[0], pose.target[1], pose.target[2])

    camera.position.lerp(nextPositionRef.current, 0.035)
    targetRef.current.lerp(nextTargetRef.current, 0.035)
    camera.lookAt(targetRef.current)
    camera.updateProjectionMatrix()
  })

  return null
}
