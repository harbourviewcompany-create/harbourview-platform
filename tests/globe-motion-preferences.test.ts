import { describe, expect, it } from 'vitest'
import { GLOBE_CAMERA_CONFIG } from '@/config/globe/camera'
import { getOrbitControlsMotionConfig } from '@/components/globe/r3f/GlobeCanvas'
import { getFlyToMotionProfile } from '@/components/globe/r3f/CameraFlyToController'

describe('globe reduced-motion branches', () => {
  it('disables autorotation and damping when reduced motion is preferred', () => {
    const config = getOrbitControlsMotionConfig(true)

    expect(config.autoRotate).toBe(false)
    expect(config.autoRotateSpeed).toBe(0)
    expect(config.enableDamping).toBe(false)
    expect(config.dampingFactor).toBe(1)
    expect(config.rotateSpeed).toBe(0.2)
  })

  it('keeps autorotation and camera damping in standard motion mode', () => {
    const config = getOrbitControlsMotionConfig(false)

    expect(config.autoRotate).toBe(true)
    expect(config.autoRotateSpeed).toBe(0.2)
    expect(config.enableDamping).toBe(true)
    expect(config.dampingFactor).toBe(GLOBE_CAMERA_CONFIG.dampingFactor)
    expect(config.rotateSpeed).toBe(GLOBE_CAMERA_CONFIG.rotateSpeed)
  })

  it('skips fly-to animation and country-focus retargeting for reduced motion', () => {
    const profile = getFlyToMotionProfile(true)

    expect(profile.shouldAnimate).toBe(false)
    expect(profile.flyDurationMs).toBe(0)
    expect(profile.allowCountryFocus).toBe(false)
  })

  it('uses configured fly-to behavior when reduced motion is not requested', () => {
    const profile = getFlyToMotionProfile(false)

    expect(profile.shouldAnimate).toBe(true)
    expect(profile.flyDurationMs).toBe(GLOBE_CAMERA_CONFIG.flyDurationMs)
    expect(profile.allowCountryFocus).toBe(true)
  })
})
