'use client'

import { featureFlags } from '@/lib/harbourview/feature-flags'
import StaticGlobeFallback from './StaticGlobeFallback'
import CanvasErrorBoundary from './CanvasErrorBoundary'
import { HarbourviewGlobeClientLoader } from './HarbourviewGlobeClientLoader'
import HarbourviewGlobeRouteController from './HarbourviewGlobeRouteController'

export default function GlobeStage() {
  if (!featureFlags.interactiveGlobe) {
    return <StaticGlobeFallback />
  }

  return (
    <div className="relative w-full max-w-[520px] aspect-square" aria-label="Interactive Harbourview globe">
      <CanvasErrorBoundary>
        <HarbourviewGlobeClientLoader />
      </CanvasErrorBoundary>
      <HarbourviewGlobeRouteController />
    </div>
  )
}
