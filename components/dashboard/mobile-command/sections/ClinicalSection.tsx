'use client'

import type { SectionId } from '../contracts'
import {
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
} from '../clinicalCommandContract'
import ClinicalEvidenceCommandPage from '@/components/dashboard/pages/ClinicalEvidenceCommandPage'
import type { SectionRef } from '../SectionUI'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

/**
 * Mobile Clinical intentionally renders the same Prescriber Operating System
 * surface as desktop Command. This removes the former split between a separate
 * ClinicalSection/Evidence Explorer implementation and the full Clinical page.
 *
 * The legacy briefing props remain in the call contract for compatibility with
 * MobileCommandCentreRebuild, but the governed Prescriber surface obtains its
 * evidence, jurisdiction, product, safety and guideline state from the canonical
 * Clinical APIs rather than re-presenting those briefing fields as a second UI.
 */
export function ClinicalSection({
  sectionRef,
  roleShort,
  commandHref,
}: {
  sectionRef: SectionRef
  roleShort: string
  programStatus?: string | null
  medicalStatus?: string | null
  patientAccess?: string | null
  physicianAccess?: string | null
  commandHref: CommandHref
}) {
  const clinicalHref = commandHref('clinical')
  const countryIso2 = countryIso2FromCommandHref(clinicalHref)
  const jurisdictionLabel = clinicalJurisdictionLabel(countryIso2)

  return (
    <section
      id="clinical"
      ref={sectionRef}
      className="hvm2-section hvm2-clinical-prescriber-os"
      data-clinical-surface="prescriber-os"
    >
      <ClinicalEvidenceCommandPage
        countryLabel={jurisdictionLabel}
        countryIso2={countryIso2}
        roleLabel={roleShort || 'All roles'}
      />
    </section>
  )
}
