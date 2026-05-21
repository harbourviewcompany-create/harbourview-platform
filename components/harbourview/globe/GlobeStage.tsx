'use client'

import dynamic from 'next/dynamic'
import { featureFlags } from '@/lib/harbourview/feature-flags'
import { evaluateInteractiveReadiness, logInteractiveFallback } from '@/lib/harbourview/globe/interactive-readiness'
import StaticGlobeFallback from './StaticGlobeFallback'
import GlobeLoader from './GlobeLoader'
import CanvasErrorBoundary from './CanvasErrorBoundary'

const InteractiveGlobe = dynamic(() => import('./InteractiveGlobe'), {
  ssr: false,
  loading: () => <GlobeLoader />,
})

export default function GlobeStage() {
  if (!featureFlags.interactiveGlobe) {
    return <StaticGlobeFallback />
  }

  const readiness = evaluateInteractiveReadiness(false)

  if (!readiness.interactiveReady && readiness.fallbackReason === 'geometry-payload-missing') {
    logInteractiveFallback(readiness.fallbackReason)
    return <StaticGlobeFallback />
  }

  return (
    <CanvasErrorBoundary>
      <InteractiveGlobe />
    </CanvasErrorBoundary>
  )
}
