'use client'

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
import { SectionShell, type SectionRef } from '../SectionUI'
import '../ClinicalWorkspace.css'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

function clinicalWorkspaceHref(commandHref: string): string {
  const sourceQuery = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  const source = new URLSearchParams(sourceQuery)
  const target = new URLSearchParams()
  const country = source.get('country')?.trim()
  const role = source.get('role')?.trim()
  if (country) target.set('country', country)
  if (role) target.set('role', role)
  const query = target.toString()
  return `/dashboard/clinical${query ? `?${query}` : ''}`
}

function professionalPathwayLabel(roleShort: string): string {
  const normalized = roleShort.trim().toLocaleLowerCase()
  if (!normalized || normalized === 'all roles' || normalized === 'all') return 'Professional requirements'
  return roleShort
}

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
  const workspaceHref = clinicalWorkspaceHref(clinicalHref)
  const countryIso2 = countryIso2FromCommandHref(clinicalHref)
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
  const professionalLabel = professionalPathwayLabel(roleShort)

  const frameworkAuthority = authorities.find(item => item.id === 'federal-authority')
  const documentAuthority = authorities.find(item => item.id === 'medical-document')
  const safetyAuthority = authorities.find(item => item.id === 'safety-interactions')
  const pharmacovigilanceAuthority = authorities.find(item => item.id === 'pharmacovigilance')

  return (
    <SectionShell
      id="clinical"
      sectionRef={sectionRef}
      eyebrow="Clinical"
      title="Clinical command"
      description={`Decision-ready cannabinoid and medical-cannabis clinical context for ${jurisdictionLabel}.`}
      action={<Link className="hvm2-text-link hvc-open-workspace" href={workspaceHref}>Open Clinical workspace →</Link>}
    >
      <div className="hvc-command-summary" aria-label="Clinical decision summary">
        <article className="hvc-command-card hvc-command-status">
          <span>Status</span>
          <strong>{formatStatus(sourceState)}</strong>
          <p>{CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
        </article>

        <article className="hvc-command-card">
          <span>What changed</span>
          <strong>{frameworkAuthority ? 'Primary framework authority' : 'Authority pack unavailable'}</strong>
          <p>
            {frameworkAuthority
              ? `Use the current ${jurisdictionLabel} primary framework for material clinical decisions.`
              : `No reviewed primary-authority pack is published for ${jurisdictionLabel}; another jurisdiction is not substituted.`}
          </p>
          {frameworkAuthority && <a href={frameworkAuthority.href} target="_blank" rel="noreferrer">Open authority ↗</a>}
        </article>

        <article className="hvc-command-card">
          <span>Needs attention</span>
          <strong>{sourceState === 'loaded' ? 'Confirm applicability' : 'Briefing requires review'}</strong>
          <p>{sourceState === 'loaded' ? 'Check population, formulation, professional scope, source date and jurisdiction before relying on a record.' : CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
        </article>

        <article className="hvc-command-card">
          <span>Evidence</span>
          <strong>Governed evidence workspace</strong>
          <p>Search reviewed evidence and inspect certainty, provenance, conflicts, currentness and formulation context.</p>
          <Link href={workspaceHref}>Search evidence →</Link>
        </article>

        <article className="hvc-command-card">
          <span>Safety</span>
          <strong>{safetyAuthority ? safetyAuthority.label : 'Primary safety guidance'}</strong>
          <p>{safetyAuthority?.purpose ?? 'No reviewed safety authority is registered for this jurisdiction.'}</p>
          {safetyAuthority && <a href={safetyAuthority.href} target="_blank" rel="noreferrer">Open guidance ↗</a>}
        </article>

        <article className="hvc-command-card">
          <span>Professional pathway</span>
          <strong>{professionalLabel}</strong>
          <p>{safePhysicianAccess || 'No reviewed profession-specific pathway is available for this context. Confirm requirements with the applicable professional regulator.'}</p>
          <Link href={workspaceHref}>Open professional workspace →</Link>
        </article>

        <article className="hvc-command-card hvc-command-jurisdiction">
          <span>Jurisdiction pathway</span>
          <strong>{jurisdictionStatus || 'Jurisdiction-specific status unavailable'}</strong>
          <p>{safePatientAccess || 'No current reviewed patient-access briefing is available. Treat the pathway as unknown rather than inferring one.'}</p>
          <Link href={commandHref('jurisdiction')}>Jurisdiction command →</Link>
        </article>
      </div>

      {(documentAuthority || pharmacovigilanceAuthority) && (
        <div className="hvc-command-actions" aria-label="Clinical primary-source actions">
          {documentAuthority && <a href={documentAuthority.href} target="_blank" rel="noreferrer"><span>Authorization</span><strong>{documentAuthority.label}</strong><small>Primary source ↗</small></a>}
          {pharmacovigilanceAuthority && <a href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer"><span>Monitoring</span><strong>{pharmacovigilanceAuthority.label}</strong><small>Primary source ↗</small></a>}
          <Link href="/network/clinical-education"><span>Education</span><strong>Reviewed clinical modules</strong><small>Open modules →</small></Link>
        </div>
      )}

      <details className="hvc-provenance-pack">
        <summary>Sources, provenance and scope</summary>
        <p>{CLINICAL_SCOPE_NOTICE}</p>
        {authorities.length > 0 ? (
          <div className="hvc-provenance-list">
            {authorities.map(source => (
              <a href={source.href} target="_blank" rel="noreferrer" key={`${source.countryIso2}-${source.id}`}>
                <strong>{source.label}</strong>
                <span>{source.sourceName} · verified {source.verifiedAt}</span>
                <span>{source.evidenceStrength}</span>
              </a>
            ))}
          </div>
        ) : (
          <p>No reviewed primary-authority pack is registered for {jurisdictionLabel}.</p>
        )}
      </details>
    </SectionShell>
  )
}
