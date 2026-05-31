'use client'

import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { usStates } from '@/data/globe/us-states'
import {
  createCountryFocusPose,
  easeInOutCubic,
  getInitialCameraPose,
  type GlobeCameraPose,
} from '@/lib/globe/camera-focus'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import type { GlobeRouterStep } from '@/types/globe-router'

export function getFlyToMotionProfile(prefersReducedMotion: boolean): {
  shouldAnimate: boolean
  flyDurationMs: number
  allowCountryFocus: boolean
} {
  return {
    shouldAnimate: !prefersReducedMotion,
    flyDurationMs: prefersReducedMotion ? 0 : 900,
    allowCountryFocus: !prefersReducedMotion,
  }
}

function findCountryPose(countryIso2?: string, targetDistanceMax?: number): GlobeCameraPose | null {
  if (!countryIso2) return null

  // US states: iso2 starts with 'US-'
  if (countryIso2.startsWith('US-')) {
    const state = usStates.find((s) => s.iso2 === countryIso2)
    if (state) return createCountryFocusPose(state, { targetDistanceMax })
  }

  // Canadian provinces: iso2 starts with 'CA-'
  if (countryIso2.startsWith('CA-')) {
    const province = canadaProvinces.find((p) => p.iso2 === countryIso2)
    if (province) return createCountryFocusPose(province, { targetDistanceMax })
  }

  // Sovereign countries
  const country = naturalEarthCountriesPayload.countries.find((candidate) => candidate.iso2 === countryIso2)
  if (!country) return null
  return createCountryFocusPose(country, { targetDistanceMax })
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

// ---------------------------------------------------------------------------
// Spherical interpolation helpers (Finding #8)
// ---------------------------------------------------------------------------
// Linear lerp tunnels through the globe when from and to are on opposite
// hemispheres. Slerp traces a great-circle arc around the globe surface,
// which is what users expect when the camera swings to a new country.

const _fromDir = new Vector3()
const _toDir = new Vector3()
const _fromQuat = new Quaternion()
const _toQuat = new Quaternion()
const _zAxis = new Vector3(0, 0, 1)
const _slerpQuat = new Quaternion()

/**
 * Interpolate camera *position* along a great-circle arc.
 * The camera radius (distance from origin) is linearly interpolated
 * separately so the arc can smoothly zoom in/out as it swings.
 */
function slerpCameraPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  out: Vector3,
): void {
  _fromDir.set(from[0], from[1], from[2])
  _toDir.set(to[0], to[1], to[2])

  const fromDist = _fromDir.length()
  const toDist = _toDir.length()

  // Degenerate: if either vector is zero, fall back to linear
  if (fromDist < 1e-6 || toDist < 1e-6) {
    out.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    )
    return
  }

  _fromDir.normalize()
  _toDir.normalize()

  // Build quaternions: rotation from +Z to each direction vector
  _fromQuat.setFromUnitVectors(_zAxis, _fromDir)
  _toQuat.setFromUnitVectors(_zAxis, _toDir)

  // Slerp between the two orientations
  _slerpQuat.copy(_fromQuat).slerp(_toQuat, t)

  // Reconstruct position: apply slerped rotation to +Z, scale by lerped radius
  const interpolatedDist = fromDist + (toDist - fromDist) * t
  out.set(0, 0, 1).applyQuaternion(_slerpQuat).multiplyScalar(interpolatedDist)
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
  const { camera, invalidate } = useThree()

  const fromPoseRef = useRef<GlobeCameraPose>(getInitialCameraPose())
  const toPoseRef = useRef<GlobeCameraPose>(getInitialCameraPose())
  const startTimeRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  const prefersReducedMotionRef = useRef(false)

  const positionVecRef = useRef(new Vector3())
  const targetVecRef = useRef(new Vector3())
  // Slerp: unit-sphere vectors for arc interpolation; recomputed on each fly trigger
  const fromUnitRef = useRef(new Vector3())
  const toUnitRef = useRef(new Vector3())
  const fromDistRef = useRef(0)
  const toDistRef = useRef(0)
  const slerpThetaRef = useRef(0) // cached great-circle angle for Shoemake slerp

  useEffect(() => {
    const wantsCountryFocus = !!selectedCountryIso2 && routerStep !== 'country'
    const shouldCapTarget = routerStep === 'role' || routerStep === 'intent' || routerStep === 'routing'
    const countryPose = wantsCountryFocus
      ? findCountryPose(
          selectedCountryIso2,
          shouldCapTarget ? GLOBE_CAMERA_CONFIG.selectedTargetDistanceMax : undefined,
        )
      : null
    const desired = countryPose ?? getInitialCameraPose()

    if (posesEqual(desired, toPoseRef.current) && !isAnimatingRef.current) return

    const currentTarget = controlsRef?.current?.target ?? targetVecRef.current
    fromPoseRef.current = poseFromVectors(camera.position, currentTarget)
    toPoseRef.current = desired
    // Cache unit vectors + distances for slerp arc interpolation
    fromUnitRef.current.set(...fromPoseRef.current.position)
    fromDistRef.current = fromUnitRef.current.length()
    fromUnitRef.current.normalize()
    toUnitRef.current.set(...toPoseRef.current.position)
    toDistRef.current = toUnitRef.current.length()
    toUnitRef.current.normalize()
    // Cache the great-circle angle once per fly trigger (zero alloc in useFrame)
    const dotAB = Math.min(1, Math.max(-1, fromUnitRef.current.dot(toUnitRef.current)))
    slerpThetaRef.current = Math.acos(dotAB)
    const motionProfile = getFlyToMotionProfile(prefersReducedMotionRef.current)
    if (!motionProfile.shouldAnimate) {
      positionVecRef.current.set(...desired.position)
      targetVecRef.current.set(...desired.target)
      camera.position.copy(positionVecRef.current)
      camera.lookAt(targetVecRef.current)
      const controls = controlsRef?.current
      if (controls) {
        controls.target.copy(targetVecRef.current)
        controls.update()
      } else {
        camera.updateProjectionMatrix()
      }
      isAnimatingRef.current = false
      startTimeRef.current = null
      return
    }

    startTimeRef.current = null
    isAnimatingRef.current = true
    // Kick off the first frame under frameloop="demand"
    invalidate()
  }, [camera, controlsRef, invalidate, routerStep, selectedCountryIso2])

  useFrame(() => {
    if (!isAnimatingRef.current) return

    // Keep requesting frames while the animation runs (#4)
    invalidate()

    const now = performance.now()
    if (startTimeRef.current === null) startTimeRef.current = now

    const elapsed = now - startTimeRef.current
    const duration = getFlyToMotionProfile(prefersReducedMotionRef.current).flyDurationMs
    const rawProgress = duration > 0 ? elapsed / duration : 1
    const progress = Math.min(rawProgress, 1)
    const eased = easeInOutCubic(progress)

    const from = fromPoseRef.current
    const to = toPoseRef.current

    // Camera position: Shoemake slerp on unit sphere + lerp distance.
    // Zero allocations in the hot path — all refs, no new Vector3/Quaternion.
    const dist = fromDistRef.current + (toDistRef.current - fromDistRef.current) * eased
    const theta = slerpThetaRef.current
    if (theta < 0.0001) {
      // Trivially close directions — straight lerp is fine
      positionVecRef.current.set(
        from.position[0] + (to.position[0] - from.position[0]) * eased,
        from.position[1] + (to.position[1] - from.position[1]) * eased,
        from.position[2] + (to.position[2] - from.position[2]) * eased,
      )
    } else {
      const sinTheta = Math.sin(theta)
      const w0 = Math.sin((1 - eased) * theta) / sinTheta // fromUnit weight
      const w1 = Math.sin(eased * theta) / sinTheta        // toUnit weight
      positionVecRef.current
        .copy(fromUnitRef.current).multiplyScalar(w0)
        .addScaledVector(toUnitRef.current, w1)
        .multiplyScalar(dist)
    }

    // Orbit target: simple lerp — it moves a small amount near globe centre.
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
