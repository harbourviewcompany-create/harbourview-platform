'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'
import {
  formatStatus,
  type SectionId,
} from '../contracts'
import {
  CLINICAL_SOURCE_STATE_COPY,
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
  deriveClinicalSourceState,
  getClinicalAuthoritiesForCountry,
  hasClinicalAuthorityCoverage,
  safeClinicalBriefing,
} from '../clinicalCommandContract'
import ClinicalEvidenceErrorBoundary from '../ClinicalEvidenceErrorBoundary'
import ClinicalEvidenceExplorer from '../ClinicalEvidenceExplorer'
import { SectionShell, type SectionRef } from '../SectionUI'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

export function ClinicalSection({ sectionRef, roleShort, programStatus, medicalStatus, patientAccess, physicianAccess, commandHref }: {
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
  const [formulary, setFormulary] = useState<FormularyProductDTO[]>([])
  const [education, setEducation] = useState<Array<Record<string, unknown>>>([])
  const [interactions, setInteractions] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => {
    if (!countryIso2) return
    let cancelled = false
    Promise.all([
      fetch(`/api/clinical/formulary?country=${encodeURIComponent(countryIso2)}&limit=8`).then((r) => r.json()),
      fetch('/api/clinical/education').then((r) => r.json()),
      fetch('/api/clinical/interactions?limit=6').then((r) => r.json()),
    ]).then(([form, edu, ix]) => {
      if (cancelled) return
      setFormulary(form.products ?? [])
      setEducation(edu.modules ?? [])
      setInteractions(ix.interactions ?? [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [countryIso2])
  const jurisdictionLabel = clinicalJurisdictionLabel(countryIso2)
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const limitedAuthority = !hasClinicalAuthorityCoverage(countryIso2)

  const sourceState = deriveClinicalSourceState({
    programStatus,
    medicalStatus,
    patientAccess,
    physicianAccess,
    limitedAuthorityCoverage: limitedAuthority,
  })
  const safePatientAccess = safeClinicalBriefing(patientAccess)
  const safePhysicianAccess = safeClinicalBriefing(physicianAccess)
  const jurisdictionStatus = safeClinicalBriefing(programStatus) || safeClinicalBriefing(medicalStatus)

  const documentAuthority = authorities.find(item => item.id === 'medical-document')
  const safetyAuthority = authorities.find(item => item.id === 'safety-interactions')
  const pharmacovigilanceAuthority = authorities.find(item => item.id === 'pharmacovigilance')

  return (
    <SectionShell
      id="clinical"
      sectionRef={sectionRef}
      eyebrow="Clinical"
      title="Evidence"
      description="Search reviewed cannabinoid evidence for this jurisdiction. Not patient-specific advice."
      action={<Link className="hvm2-text-link" href={clinicalHref}>Full workspace</Link>}
    >
      <ClinicalEvidenceErrorBoundary>
        <ClinicalEvidenceExplorer commandHref={clinicalHref} />
      </ClinicalEvidenceErrorBoundary>

      {(documentAuthority || safetyAuthority || pharmacovigilanceAuthority) && (
        <div className="hvm2-horizontal-deck" aria-label="Primary sources">
          {documentAuthority && (
            <article className="hvm2-directory-card">
              <span>Authority</span>
              <h3>{documentAuthority.label}</h3>
              <a className="hvm2-text-link" href={documentAuthority.href} target="_blank" rel="noreferrer">Open ↗</a>
            </article>
          )}
          {safetyAuthority && (
            <article className="hvm2-directory-card">
              <span>Safety</span>
              <h3>{safetyAuthority.label}</h3>
              <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">Open ↗</a>
            </article>
          )}
          {pharmacovigilanceAuthority && (
            <article className="hvm2-directory-card">
              <span>Report</span>
              <h3>{pharmacovigilanceAuthority.label}</h3>
              <a className="hvm2-text-link" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">Open ↗</a>
            </article>
          )}
        </div>
      )}

      {formulary.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Formulary">
          {formulary.map((p) => (
            <article className="hvm2-directory-card" key={p.id}>
              <span>Formulary</span>
              <h3>{p.name}</h3>
              <p>{p.authorizationStatus} · {p.cannabinoidProfile}</p>
              {p.primarySourceUrl ? (
                <a className="hvm2-text-link" href={p.primarySourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {interactions.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Interactions">
          {interactions.slice(0, 4).map((ix) => (
            <article className="hvm2-directory-card" key={String(ix.id)}>
              <span>Interaction</span>
              <h3>{String(ix.medicationIngredient)} × {String(ix.cannabinoid)}</h3>
              <p>{String(ix.clinicalSignificance)}</p>
            </article>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Education">
          {education.slice(0, 3).map((m) => (
            <article className="hvm2-directory-card" key={String(m.id)}>
              <span>Education</span>
              <h3>{String(m.title)}</h3>
              <Link className="hvm2-text-link" href={String(m.route || `/network/clinical-education/${m.slug}`)}>Open →</Link>
            </article>
          ))}
        </div>
      )}

      <div className="hvm2-two-column" aria-label="Pathways">
        <article>
          <span>Pathway</span>
          <h3>{jurisdictionStatus || 'Status unavailable'}</h3>
          <p>{safePatientAccess || 'No reviewed patient-access briefing for this context.'}</p>
          <Link className="hvm2-text-link" href={commandHref('jurisdiction')}>Jurisdiction →</Link>
        </article>
        <article>
          <span>Professional</span>
          <h3>{roleShort || 'All roles'}</h3>
          <p>{safePhysicianAccess || 'Confirm requirements with the professional regulator.'}</p>
          <Link className="hvm2-text-link" href={clinicalHref}>Workspace →</Link>
        </article>
      </div>

      {sourceState !== 'loaded' && (
        <div className="hvm2-sourcing-note" data-sourcing={sourceState} role="status">
          <strong>Briefing · {formatStatus(sourceState)} · {jurisdictionLabel}</strong>
          <p>{CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
        </div>
      )}
    </SectionShell>
  )
}
