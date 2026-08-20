'use client'

import { useMemo } from 'react'
import { type SectionId } from '../contracts'
import { countryIso2FromCommandHref } from '../clinicalCommandContract'
import { SectionShell, type SectionRef } from '../SectionUI'
import ClinicalWorkspacePage from '@/components/dashboard/pages/ClinicalWorkspacePage'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

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

  const roleLabel = useMemo(() => {
    if (!roleShort) return ''
    return roleShort
  }, [roleShort])

  // No jurisdiction selected → keep the explicit context-required state
  if (!countryIso2) {
    return (
      <SectionShell
        id="clinical"
        sectionRef={sectionRef}
        eyebrow="Clinical"
        title="Clinical decision surface"
        description="Select a specific jurisdiction before Clinical evaluates authority, evidence, products or safety. No country is substituted."
      >
        <div
          className="hvm2-sourcing-note"
          data-sourcing="limited-coverage"
          role="status"
          data-testid="clinical-mobile-context-required"
        >
          <strong>Jurisdiction required</strong>
          <p>
            Choose a country in Command context. Clinical will not silently use Brazil, Canada, or
            another jurisdiction.
          </p>
        </div>
      </SectionShell>
    )
  }

  // Jurisdiction resolved → render the full Clinical Workspace in the dashboard
  return (
    <div data-testid="clinical-mobile-decision-surface" className="hvm2-clinical-workspace-embed">
      <ClinicalWorkspacePage jurisdiction={countryIso2} roleLabel={roleLabel} embedded />
    </div>
  )
}
