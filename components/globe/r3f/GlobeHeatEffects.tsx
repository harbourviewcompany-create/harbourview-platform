'use client'

/**
 * Selective post-processing for the heat layer.
 * Only mounts when heatmap + bloom flags are on and motion is allowed.
 * Threshold is tuned so metallic plates / ocean stay mostly unbloomed.
 */

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export type GlobeHeatEffectsProps = {
  enabled: boolean
}

export function GlobeHeatEffects({ enabled }: GlobeHeatEffectsProps) {
  if (!enabled) return null

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.35}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette offset={0.25} darkness={0.4} />
    </EffectComposer>
  )
}
