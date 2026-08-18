'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  formatStatus,
  type SectionId,
} from '../contracts'
import {
  CLINICAL_SCOPE_NOTICE,
  CLINICAL_SOURCE_STATE_COPY,
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
  deriveClinicalSourceState,
  getClinicalAuthoritiesForCountry,
  hasClinicalAuthorityCoverage,
  safeClinicalBriefing,
} from '../clinicalCommandContract'
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
  const [formulary, setFormulary] = useState<Array<{
    id: string
    name: string
    authorizationStatus: string
    cannabinoidProfile: string
    notes: string
    primarySourceUrl?: string | null
  }>>([])
  useEffect(() => {
    if (!countryIso2) return
    let cancelled = false
    fetch(`/api/clinical/formulary?country=${encodeURIComponent(countryIso2)}&limit=10`)
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setFormulary(body.products ?? [])
      })
      .catch(() => {})
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

  const frameworkAuthority = authorities.find(item => item.id === 'federal-authority')
  const documentAuthority = authorities.find(item => item.id === 'medical-document')
  const safetyAuthority = authorities.find(item => item.id === 'safety-interactions')
  const pharmacovigilanceAuthority = authorities.find(item => item.id === 'pharmacovigilance')

  return (
    <SectionShell
      id="clinical"
      sectionRef={sectionRef}
      eyebrow="Clinical"
      title="Professional clinical command"
      description="Reviewed cannabinoid and medical-cannabis clinical reference for medical professionals. Evidence and regulatory status stay distinct from product marketing and genetics. Not a general medicines monograph service."
      action={<Link className="hvm2-text-link" href={clinicalHref}>Open clinician workspace</Link>}
    >
      <div className="hvm2-sourcing-note" data-sourcing="loaded" role="note">
        <strong>Evidence command · {jurisdictionLabel}</strong>
        <p>{CLINICAL_SCOPE_NOTICE}</p>
      </div>

      <ClinicalEvidenceExplorer commandHref={clinicalHref} />

      <div className="hvm2-sourcing-note" data-sourcing={sourceState} role={sourceState === 'stale' || sourceState === 'limited-coverage' ? 'status' : undefined}>
        <strong>Jurisdiction briefing · {formatStatus(sourceState)} · {jurisdictionLabel}</strong>
        <p>{CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
      </div>

      <div className="hvm2-compliance-grid" aria-label="Clinical command summary">
        <article>
          <span>What changed</span>
          <strong>{frameworkAuthority ? 'Primary framework authority' : 'Authority pack unavailable'}</strong>
          <p>
            {frameworkAuthority
              ? `Use current ${jurisdictionLabel} primary authorities rather than legacy or foreign frameworks.`
              : `No reviewed authority pack is published for ${jurisdictionLabel}. Clinical Command will not substitute another country's rules.`}
          </p>
          {frameworkAuthority && (
            <a className="hvm2-text-link" href={frameworkAuthority.href} target="_blank" rel="noreferrer">Primary authority ↗</a>
          )}
        </article>
        <article>
          <span>What requires attention</span>
          <strong>{sourceState === 'loaded' ? 'Verify against source' : 'Briefing needs review'}</strong>
          <p>{sourceState === 'loaded' ? 'Jurisdiction briefing is present; confirm material decisions against the cited authority and professional regulator.' : CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
        </article>
      </div>

      {authorities.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Clinical actions">
          {documentAuthority && (
            <article className="hvm2-directory-card">
              <span>What can I do next</span>
              <h3>{documentAuthority.label}</h3>
              <p>{documentAuthority.purpose}</p>
              <a className="hvm2-text-link" href={documentAuthority.href} target="_blank" rel="noreferrer">Open primary source ↗</a>
            </article>
          )}
          {safetyAuthority && (
            <article className="hvm2-directory-card">
              <span>Patient safety</span>
              <h3>{safetyAuthority.label}</h3>
              <p>{safetyAuthority.purpose}</p>
              <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">Open guidance ↗</a>
            </article>
          )}
          {pharmacovigilanceAuthority && (
            <article className="hvm2-directory-card">
              <span>Pharmacovigilance</span>
              <h3>{pharmacovigilanceAuthority.label}</h3>
              <p>{pharmacovigilanceAuthority.purpose}</p>
              <a className="hvm2-text-link" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">Reporting guidance ↗</a>
            </article>
          )}
          <article className="hvm2-directory-card">
            <span>Professional education</span>
            <h3>Reviewed clinical modules</h3>
            <p>Open Harbourview's existing professional-only clinical education surface and its review-status controls.</p>
            <Link className="hvm2-text-link" href="/network/clinical-education">Clinical education →</Link>
          </article>
        </div>
      )}

      
      {formulary.length > 0 && (
        <div className="hvm2-horizontal-deck" aria-label="Published formulary">
          {formulary.map((p) => (
            <article className="hvm2-directory-card" key={p.id}>
              <span>Formulary</span>
              <h3>{p.name}</h3>
              <p>{p.authorizationStatus} · {p.cannabinoidProfile}</p>
              <p>{p.notes}</p>
              {p.primarySourceUrl ? (
                <a className="hvm2-text-link" href={p.primarySourceUrl} target="_blank" rel="noreferrer">Primary source ↗</a>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <div className="hvm2-two-column" aria-label="Clinical dual surface">
        <article>
          <span>Clinical education</span>
          <h3>Professional education modules</h3>
          <p>Training and orientation for regulated markets — separate from graded evidence records above.</p>
          <Link className="hvm2-text-link" href="/network/clinical-education">Clinical education →</Link>
        </article>
        <article>
          <span>Formulary</span>
          <h3>Authorised product reference</h3>
          <p>Jurisdiction-authorised product classes only. Not marketplace listings. Verify the live authority register before prescribing.</p>
          <Link className="hvm2-text-link" href={clinicalHref}>Open clinical workspace →</Link>
        </article>
      </div>

      <div className="hvm2-two-column" aria-label="Jurisdiction clinical briefing">
        <article>
          <span>Jurisdiction pathway</span>
          <h3>{jurisdictionStatus || 'Jurisdiction-specific status unavailable'}</h3>
          <p>{safePatientAccess || 'No current reviewed patient-access briefing is available for this context. Treat the field as unknown rather than inferring a pathway.'}</p>
          <Link className="hvm2-text-link" href={commandHref('jurisdiction')}>Jurisdiction command →</Link>
        </article>
        <article>
          <span>Professional pathway</span>
          <h3>{roleShort || 'All roles'}</h3>
          <p>{safePhysicianAccess || 'No current reviewed profession-specific briefing is available for this context. Confirm requirements with the applicable professional regulator for this jurisdiction.'}</p>
          <Link className="hvm2-text-link" href={clinicalHref}>Clinical workspace →</Link>
        </article>
      </div>

      {authorities.length > 0 ? (
        <div className="hvm2-horizontal-deck" aria-label="Clinical provenance">
          {authorities.map(source => (
            <article className="hvm2-directory-card" key={`${source.countryIso2}-${source.id}`}>
              <span>{source.evidenceType.replaceAll('-', ' ')}</span>
              <h3>{source.label}</h3>
              <p>{source.purpose}</p>
              <p><strong>{source.jurisdiction}</strong> · {source.evidenceStrength}</p>
              <p>Verified {source.verifiedAt} · {source.sourceName}</p>
              <a className="hvm2-text-link" href={source.href} target="_blank" rel="noreferrer">Primary source ↗</a>
            </article>
          ))}
        </div>
      ) : (
        <div className="hvm2-sourcing-note" data-sourcing="limited-coverage" role="status">
          <strong>No primary-authority pack · {jurisdictionLabel}</strong>
          <p>{CLINICAL_SOURCE_STATE_COPY['limited-coverage']}</p>
        </div>
      )}
    </SectionShell>
  )
}
