'use client'

import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import {
  createCountryFocusPose,
  easeInOutCubic,
  getInitialCameraPose,
  type GlobeCameraPose,
} from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import type { GlobeRouterStep } from '@/types/globe-router'

function findCountryPose(countryIso2?: string): GlobeCameraPose | null {
  if (!countryIso2) return null

  const country = naturalEarthCountriesPayload.countries.find((candidate) => candidate.iso2 === countryIso2)

  if (!country) return null

  return createCountryFocusPose(country)
}

function poseFromVectors(position: Vector3, target: Vector3): GlobeCameraPose {
  return {
    position: [position.x, position.y, position.z],
    target: [target.x, target.y, target.z],
  }
}

function posesEqual(a: GlobeCameraPose, b: GlobeCameraPose, epsilon = 0.001): boolean {
  return (
    Math.abs(a.position[0] - b.position[0]) < epsilon &&
    Math.abs(a.position[1] - b.position[1]) < epsilon &&
    Math.abs(a.position[2] - b.position[2]) < epsilon &&
    Math.abs(a.target[0] - b.target[0]) < epsilon &&
    Math.abs(a.target[1] - b.target[1]) < epsilon &&
    Math.abs(a.target[2] - b.target[2]) < epsilon
  )
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function clampPoseDistance(pose: GlobeCameraPose): GlobeCameraPose {
  const position = new Vector3(...pose.position)
  const target = new Vector3(...pose.target)
  const offset = position.clone().sub(target)
  const safeOffset = offset.lengthSq() > 0.000001 ? offset : new Vector3(0, 0, 1)
  const clampedDistance = clamp(safeOffset.length(), GLOBE_CAMERA_CONFIG.minDistance, GLOBE_CAMERA_CONFIG.maxDistance)
  const nextPosition = target.clone().add(safeOffset.normalize().multiplyScalar(clampedDistance))

  return {
    position: [nextPosition.x, nextPosition.y, nextPosition.z],
    target: pose.target,
  }
}

export interface CameraFlyOrbitControlsLike {
  target: Vector3
  update: () => void
}

export function CameraFlyToController({
  selectedCountryIso2,
  routerStep,
  controlsRef,
}: {
  selectedCountryIso2?: string
  routerStep?: GlobeRouterStep
  controlsRef?: RefObject<CameraFlyOrbitControlsLike | null>
}) {
  const { camera } = useThree()

  const fromPoseRef = useRef<GlobeCameraPose>(getInitialCameraPose())
  const toPoseRef = useRef<GlobeCameraPose>(getInitialCameraPose())
  const startTimeRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  const positionVecRef = useRef(new Vector3())
  const targetVecRef = useRef(new Vector3())

  useEffect(() => {
    const wantsCountryFocus = !!selectedCountryIso2 && routerStep !== 'country'
    const countryPose = wantsCountryFocus ? findCountryPose(selectedCountryIso2) : null
    const desired = clampPoseDistance(countryPose ?? getInitialCameraPose())

    if (posesEqual(desired, toPoseRef.current) && !isAnimatingRef.current) {
      return
    }

    const currentTarget = controlsRef?.current?.target ?? targetVecRef.current
    fromPoseRef.current = clampPoseDistance(poseFromVectors(camera.position, currentTarget))
    toPoseRef.current = desired
    startTimeRef.current = null
    isAnimatingRef.current = true
  }, [camera, controlsRef, routerStep, selectedCountryIso2])

  useFrame(() => {
    if (!isAnimatingRef.current) return

    const now = performance.now()
    if (startTimeRef.current === null) {
      startTimeRef.current = now
    }

    const elapsed = now - startTimeRef.current
    const duration = GLOBE_CAMERA_CONFIG.flyDurationMs
    const rawProgress = duration > 0 ? elapsed / duration : 1
    const progress = rawProgress >= 1 ? 1 : rawProgress
    const eased = easeInOutCubic(progress)

    const from = fromPoseRef.current
    const to = toPoseRef.current

    positionVecRef.current.set(
      from.position[0] + (to.position[0] - from.position[0]) * eased,
      from.position[1] + (to.position[1] - from.position[1]) * eased,
      from.position[2] + (to.position[2] - from.position[2]) * eased,
    )
    targetVecRef.current.set(
      from.target[0] + (to.target[0] - from.target[0]) * eased,
      from.target[1] + (to.target[1] - from.target[1]) * eased,
      from.target[2] + (to.target[2] - from.target[2]) * eased,
    )

    camera.position.copy(positionVecRef.current)
    camera.lookAt(targetVecRef.current)

    const controls = controlsRef?.current
    if (controls) {
      controls.target.copy(targetVecRef.current)
      controls.update()
    } else {
      camera.updateProjectionMatrix()
    }

    if (progress >= 1) {
      isAnimatingRef.current = false
      startTimeRef.current = null
    }
  })

  return null
}
