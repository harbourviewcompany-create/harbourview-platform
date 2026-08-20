'use client'

import NetworkCommandClient from '@/components/network/NetworkCommandClient'
import { SectionShell, type SectionRef } from '../SectionUI'
import type { SectionId } from '../contracts'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

export function NetworkSection({
  sectionRef,
  professionalCount,
  providerCount,
  operatorCount,
  collaborationCount,
  commandHref,
}: {
  sectionRef: SectionRef
  professionalCount: number
  providerCount: number
  operatorCount: number
  collaborationCount: number
  commandHref: CommandHref
}) {
  void professionalCount
  void providerCount
  void operatorCount
  void collaborationCount
  void commandHref

  return (
    <SectionShell
      id="network"
      sectionRef={sectionRef}
      eyebrow="Network"
      title="Commercial Network Command"
      description="Resolve the best reviewed counterparties, requirements, relationship state and next action for the active commercial objective."
    >
      <NetworkCommandClient compact />
    </SectionShell>
  )
}
