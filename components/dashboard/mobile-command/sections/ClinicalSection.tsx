'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatStatus, type SectionId } from '../contracts'
import {
  CLINICAL_SOURCE_STATE_COPY,
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
  deriveClinicalSourceState,
  safeClinicalBriefing,
} from '../clinicalCommandContract'
import { SectionShell, type SectionRef } from '../SectionUI'
import type { ClinicalPrescriberWorkspaceDTO } from '@/lib/clinical/workspace'

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
  const [workspace, setWorkspace] = useState<ClinicalPrescriberWorkspaceDTO | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    setWorkspace(null)
    if (!countryIso2) {
      setLoadState('idle')
      return
    }
    const controller = new AbortController()
    setLoadState('loading')
    void fetch(`/api/clinical/workspace?jurisdiction=${encodeURIComponent(countryIso2)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as ClinicalPrescriberWorkspaceDTO | null
        if (body) setWorkspace(body)
        setLoadState(body ? 'idle' : 'error')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState('error')
      })
    return () => controller.abort()
  }, [countryIso2])

  const workspaceHref = useMemo(() => {
    if (!countryIso2) return null
    const params = new URLSearchParams({ country: countryIso2 })
    if (roleShort) params.set('role', roleShort)
    return `/dashboard/clinical?${params.toString()}`
  }, [countryIso2, roleShort])

  const sourceState = deriveClinicalSourceState({
    programStatus,
    medicalStatus,
    patientAccess,
    physicianAccess,
    error: loadState === 'error',
    permissionDenied: workspace?.state === 'permission',
    limitedAuthorityCoverage: workspace?.authority.state === 'unknown',
  })
  const jurisdictionLabel = clinicalJurisdictionLabel(countryIso2)
  const safePatientAccess = safeClinicalBriefing(patientAccess)
  const safePhysicianAccess = safeClinicalBriefing(physicianAccess)

  if (!countryIso2) {
    return (
      <SectionShell
        id="clinical"
        sectionRef={sectionRef}
        eyebrow="Clinical"
        title="Clinical decision surface"
        description="Select a specific jurisdiction before Clinical evaluates authority, evidence, products or safety. No country is substituted."
      >
        <div className="hvm2-sourcing-note" data-sourcing="limited-coverage" role="status" data-testid="clinical-mobile-context-required">
          <strong>Jurisdiction required</strong>
          <p>Choose a country in Command context. Clinical will not silently use Brazil, Canada, or another jurisdiction.</p>
        </div>
      </SectionShell>
    )
  }

  const authorityCopy = workspace?.authority.state === 'loaded'
    ? `Authority resolved for ${workspace.authority.professional?.role ?? 'verified clinician'}.`
    : workspace?.authority.state === 'permission'
      ? 'Verified clinician access required.'
      : workspace?.authority.notes ?? 'Professional authority is unresolved.'

  return (
    <SectionShell
      id="clinical"
      sectionRef={sectionRef}
      eyebrow="Clinical"
      title="Clinical decision surface"
      description="Concise jurisdiction, authority, safety and product status. Use the dedicated workspace for full Prescriber OS decisions."
      action={workspaceHref ? <Link className="hvm2-text-link" href={workspaceHref}>Open Clinical workspace</Link> : undefined}
    >
      <div className="hvm2-two-column" aria-label="Clinical decision status" data-testid="clinical-mobile-decision-surface">
        <article>
          <span>Authority</span>
          <h3>{workspace?.authority.state ?? (loadState === 'loading' ? 'loading' : 'unknown')}</h3>
          <p>{authorityCopy}</p>
        </article>
        <article>
          <span>Safety</span>
          <h3>{workspace ? `${workspace.safety.length} structured rules` : 'Checking'}</h3>
          <p>{workspace?.interactionState === 'review-required' ? 'Some interactions are withheld pending inspectable provenance.' : `${workspace?.interactions.length ?? 0} inspectable interaction records.`}</p>
        </article>
        <article>
          <span>Products</span>
          <h3>{workspace ? `${workspace.formulary.length} formulary records` : 'Checking'}</h3>
          <p>No product from another jurisdiction is substituted.</p>
        </article>
        <article>
          <span>Decision</span>
          <h3>{roleShort || 'Professional role unresolved'}</h3>
          <p>No evidence answer is shown until an explicit question or clinical context is submitted.</p>
        </article>
      </div>

      {(safePatientAccess || safePhysicianAccess) && (
        <div className="hvm2-two-column" aria-label="Clinical pathway context">
          <article>
            <span>Patient access</span>
            <p>{safePatientAccess || 'No reviewed patient-access briefing for this jurisdiction.'}</p>
          </article>
          <article>
            <span>Professional pathway</span>
            <p>{safePhysicianAccess || 'Confirm current professional requirements with the governing authority.'}</p>
          </article>
        </div>
      )}

      {workspaceHref && (
        <Link className="hvm2-primary-action" href={workspaceHref}>
          Decision · Evidence · Safety · Products · Regimen · Monitoring →
        </Link>
      )}

      {(sourceState !== 'loaded' || workspace?.state === 'review-required') && (
        <div className="hvm2-sourcing-note" data-sourcing={workspace?.state === 'review-required' ? 'stale' : sourceState} role="status">
          <strong>Clinical · {workspace?.state === 'review-required' ? 'Review required' : formatStatus(sourceState)} · {jurisdictionLabel}</strong>
          <p>{workspace?.state === 'review-required' ? 'Records without exact prescriber-inspectable provenance are withheld rather than presented as current clinical support.' : CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
        </div>
      )}
    </SectionShell>
  )
}
