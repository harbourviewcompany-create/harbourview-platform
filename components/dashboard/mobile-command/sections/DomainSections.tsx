'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import type { GeneticsSourceMeta } from '../props'
import {
  MOBILE_COMMAND_COPY,
  formatStatus,
  type DirectoryRecord,
  type MobileCommandTool,
  type SectionId,
} from '../contracts'
import {
  CLINICAL_AUTHORITY_ABSENT_COPY,
  CLINICAL_SOURCE_STATE_COPY,
  clinicalAuthoritiesForJurisdiction,
  deriveClinicalSourceState,
  safeClinicalBriefing,
} from '../clinicalCommandContract'
import ClinicalEvidenceExplorer from '../ClinicalEvidenceExplorer'
import { FinancingWorkspacePanel } from '../WorkspacePanels'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'
import '../GeneticsSection.css'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

type GeneticsServiceProvider = {
  id: string
  displayName: string
  service_category: string
  service_summary: string
  country_code: string | null
  jurisdiction_label: string | null
  verification_level: string
}

type GeneticsCollaborationProject = {
  id: string
  slug: string
  title: string
  projectType: string
  status: string
  countryCode: string | null
  jurisdictionLabel: string | null
  publicSummary: string
  evidenceNeeded: string | null
  cta: string
}

type GeneticsPassportRecord = PublicCultivarPassportDTO & DirectoryRecord
export type GeneticsCommandRecords = GeneticsPassportRecord[] & {
  serviceProviders?: GeneticsServiceProvider[]
  collaborationProjects?: GeneticsCollaborationProject[]
  sourceMeta?: GeneticsSourceMeta
}

const ATTENTION_STATES = new Set(['claimed', 'not_assessed', 'disputed', 'expired', 'rejected'])
const REVIEWED_STATES = new Set(['externally_verified', 'admin_reviewed'])

function labelEnum(value: string | null | undefined) {
  return value ? formatStatus(value) : null
}

function originLabel(passport: PublicCultivarPassportDTO) {
  return passport.originJurisdictionLabel || passport.originCountryCode || null
}

function sourceStateLabel(state: string | undefined) {
  if (state === 'stale') return 'Some Genetics source data is outside its configured freshness window.'
  if (state === 'fallback') return 'A controlled Genetics fallback is being shown because a live source was unavailable.'
  if (state === 'error') return 'The public cultivar-passport source is temporarily unavailable.'
  return null
}

export function GeneticsSection({ sectionRef, records, commandHref }: { sectionRef: SectionRef; records: GeneticsCommandRecords; commandHref: CommandHref }) {
  const searchParams = useSearchParams()
  const selectedSlug = searchParams.get('cultivar')
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const serviceProviders = records.serviceProviders ?? []
  const collaborationProjects = records.collaborationProjects ?? []
  const passportMeta = records.sourceMeta?.cultivarPassports
  const sourceNotice = sourceStateLabel(passportMeta?.state)

  const filteredRecords = useMemo(() => records.filter(passport => {
    if (!normalizedQuery) return true
    const searchable = [
      passport.displayName,
      passport.publicSummary,
      passport.breederDisplayName,
      passport.rightsHolderDisplayName,
      passport.originCountryCode,
      passport.originJurisdictionLabel,
      passport.cultivarCategory,
      passport.cannabisCategory,
      passport.claimStatus,
      passport.evidenceScoreSummary,
      passport.verificationSummary,
      ...passport.aliasesPublic,
    ]
    return searchable.some(value => value?.toLocaleLowerCase().includes(normalizedQuery))
  }), [normalizedQuery, records])

  const attention = useMemo(() => records.filter(passport => ATTENTION_STATES.has(passport.claimStatus)), [records])
  const reviewedCount = useMemo(() => records.filter(passport => REVIEWED_STATES.has(passport.claimStatus)).length, [records])
  const publicEvidenceCount = useMemo(() => records.reduce((sum, passport) => sum + passport.publicEvidenceSummaries.length, 0), [records])

  return (
    <SectionShell
      id="genetics"
      sectionRef={sectionRef}
      eyebrow="Genetics"
      title="Cultivar intelligence"
      description={MOBILE_COMMAND_COPY.geneticsCommandDescription}
    >
      {sourceNotice && (
        <div className={`hvm2-genetics-source-state ${passportMeta?.state === 'error' ? 'hvm2-tone-warn' : ''}`} role="status">
          <strong>{formatStatus(passportMeta?.state, 'Source status')}</strong>
          <p>{sourceNotice}</p>
          {passportMeta?.state === 'error' && <Link href={commandHref('genetics')}>Retry Genetics</Link>}
        </div>
      )}

      <div className="hvm2-metric-grid" aria-label="Genetics record status">
        <Metric label="Passports" value={records.length} detail="Public cultivar passports loaded" />
        <Metric label="Reviewed" value={reviewedCount} detail="Externally verified or admin-reviewed claims" />
        <Metric label="Attention" value={attention.length} detail="Claimed, unassessed, disputed, expired or rejected records" />
        <Metric label="Public evidence" value={publicEvidenceCount} detail="Evidence summaries cleared for public display" />
      </div>

      {attention.length > 0 && (
        <div className="hvm2-genetics-block" aria-labelledby="hvm2-genetics-attention">
          <div className="hvm2-genetics-heading">
            <div><span>Attention</span><h3 id="hvm2-genetics-attention">Requires attention</h3></div>
            <span>{attention.length}</span>
          </div>
          <div className="hvm2-genetics-list">
            {attention.slice(0, 4).map(passport => (
              <Link className="hvm2-genetics-attention-row" href={commandHref('genetics', { cultivar: passport.slug })} key={`attention-${passport.id}`}>
                <span><small>{labelEnum(passport.cultivarCategory)}</small><strong>{passport.displayName}</strong></span>
                <StatusPill>{labelEnum(passport.claimStatus)}</StatusPill>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="hvm2-genetics-block" aria-labelledby="hvm2-genetics-passports">
        <div className="hvm2-genetics-heading">
          <div><span>Records</span><h3 id="hvm2-genetics-passports">Cultivar passports</h3></div>
          <span>{filteredRecords.length}{normalizedQuery ? ` / ${records.length}` : ''}</span>
        </div>

        {records.length > 1 && (
          <label className="hvm2-search-field hvm2-genetics-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search cultivars, aliases, breeder or origin"
              aria-label="Search cultivar passports"
            />
          </label>
        )}

        {passportMeta?.state === 'error' && records.length === 0 ? (
          <EmptyState title="Genetics source unavailable" detail="No fallback cultivar passport records were available. Retry without changing the selected Command context." />
        ) : filteredRecords.length > 0 ? (
          <div className="hvm2-genetics-list">
            {filteredRecords.map(passport => {
              const origin = originLabel(passport)
              return (
                <details className="hvm2-genetics-record" key={passport.id} open={selectedSlug === passport.slug || undefined}>
                  <summary>
                    <span>
                      <small>{labelEnum(passport.cultivarCategory)}{passport.cannabisCategory ? ` · ${labelEnum(passport.cannabisCategory)}` : ''}</small>
                      <strong>{passport.displayName}</strong>
                    </span>
                    <StatusPill>{labelEnum(passport.claimStatus)}</StatusPill>
                  </summary>

                  <p>{passport.publicSummary}</p>

                  <dl className="hvm2-genetics-facts">
                    {passport.aliasesPublic.length > 0 && <><dt>Aliases</dt><dd>{passport.aliasesPublic.join(', ')}</dd></>}
                    {passport.breederDisplayName && <><dt>Breeder</dt><dd>{passport.breederDisplayName}</dd></>}
                    {passport.rightsHolderDisplayName && <><dt>Rights holder</dt><dd>{passport.rightsHolderDisplayName}</dd></>}
                    {origin && <><dt>Origin</dt><dd>{origin}</dd></>}
                    {passport.verificationSummary && <><dt>Verification</dt><dd>{passport.verificationSummary}</dd></>}
                    {passport.evidenceScoreSummary && <><dt>Evidence</dt><dd>{passport.evidenceScoreSummary}</dd></>}
                  </dl>

                  {passport.publicEvidenceSummaries.length > 0 && (
                    <div className="hvm2-genetics-subsection">
                      <strong>Public evidence</strong>
                      {passport.publicEvidenceSummaries.slice(0, 4).map(evidence => (
                        <div className="hvm2-genetics-evidence" key={evidence.id}>
                          <span>{labelEnum(evidence.evidenceType)} · {labelEnum(evidence.claimStatus)}</span>
                          <b>{evidence.title}</b>
                          {evidence.publicSummary && <p>{evidence.publicSummary}</p>}
                          {(evidence.sourceLabel || evidence.sourceDate) && <small>{[evidence.sourceLabel, evidence.sourceDate].filter(Boolean).join(' · ')}</small>}
                        </div>
                      ))}
                    </div>
                  )}

                  {passport.countryOpportunitiesPublic.length > 0 && (
                    <div className="hvm2-genetics-subsection">
                      <strong>Country opportunities</strong>
                      {passport.countryOpportunitiesPublic.slice(0, 4).map((opportunity, index) => (
                        <div className="hvm2-genetics-opportunity" key={`${passport.id}-${opportunity.countryCode}-${opportunity.opportunityType}-${index}`}>
                          <span>{opportunity.countryCode}{opportunity.jurisdictionLabel ? ` · ${opportunity.jurisdictionLabel}` : ''}</span>
                          <b>{labelEnum(opportunity.opportunityType)}</b>
                          <StatusPill>{labelEnum(opportunity.status)}</StatusPill>
                          {opportunity.publicNote && <p>{opportunity.publicNote}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {passport.publicCollaborationProjects.length > 0 && (
                    <div className="hvm2-genetics-subsection">
                      <strong>Linked collaboration projects</strong>
                      {passport.publicCollaborationProjects.map(project => (
                        <div className="hvm2-genetics-project" key={project.id}>
                          <span>{labelEnum(project.projectType)} · {labelEnum(project.status)}</span>
                          <b>{project.title}</b>
                          <p>{project.publicSummary}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {passport.accessRequestCtas.length > 0 && (
                    <div className="hvm2-genetics-request-types">
                      <span>Controlled requests supported by this passport</span>
                      <p>{passport.accessRequestCtas.join(' · ')}</p>
                    </div>
                  )}

                  <div className="hvm2-genetics-record-footer">
                    <span>{passport.publicDisclaimer}</span>
                    <Link href={commandHref('genetics', { cultivar: passport.slug })}>Open passport</Link>
                  </div>
                </details>
              )
            })}
          </div>
        ) : records.length > 0 ? (
          <EmptyState title="No matching cultivar passports" detail="Clear or change the search to return to the complete loaded passport set." />
        ) : (
          <EmptyState title="No public cultivar passports loaded" detail={MOBILE_COMMAND_COPY.geneticsEmptyDetail} />
        )}
      </div>

      {(collaborationProjects.length > 0 || serviceProviders.length > 0) && (
        <div className="hvm2-genetics-block" aria-labelledby="hvm2-genetics-network">
          <div className="hvm2-genetics-heading">
            <div><span>Network</span><h3 id="hvm2-genetics-network">Genetics collaborations & services</h3></div>
            <span>{collaborationProjects.length + serviceProviders.length}</span>
          </div>
          <div className="hvm2-genetics-network-grid">
            {collaborationProjects.slice(0, 3).map(project => (
              <article key={project.id}>
                <span>{labelEnum(project.projectType)} · {labelEnum(project.status)}</span>
                <strong>{project.title}</strong>
                <p>{project.publicSummary}</p>
              </article>
            ))}
            {serviceProviders.slice(0, 3).map(provider => (
              <article key={provider.id}>
                <span>{labelEnum(provider.service_category)} · {labelEnum(provider.verification_level)}</span>
                <strong>{provider.displayName}</strong>
                <p>{provider.service_summary}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="hvm2-genetics-boundary" role="note">
        <strong>{MOBILE_COMMAND_COPY.geneticsBoundaryTitle}</strong>
        <p>{MOBILE_COMMAND_COPY.geneticsBoundaryDetail}</p>
      </div>
    </SectionShell>
  )
}

export function ClinicalSection({ sectionRef, roleShort, jurisdiction, programStatus, medicalStatus, patientAccess, physicianAccess, commandHref }: {
  sectionRef: SectionRef
  roleShort: string
  jurisdiction: string
  programStatus?: string | null
  medicalStatus?: string | null
  patientAccess?: string | null
  physicianAccess?: string | null
  commandHref: CommandHref
}) {
  const sourceState = deriveClinicalSourceState({
    programStatus,
    medicalStatus,
    patientAccess,
    physicianAccess,
  })
  const safePatientAccess = safeClinicalBriefing(patientAccess)
  const safePhysicianAccess = safeClinicalBriefing(physicianAccess)
  const jurisdictionStatus = safeClinicalBriefing(programStatus) || safeClinicalBriefing(medicalStatus)
  const authorities = clinicalAuthoritiesForJurisdiction(jurisdiction)
  const [changed, documentAuthority, safetyAuthority, pharmacovigilanceAuthority] = authorities
  const clinicalHref = commandHref('clinical')

  return (
    <SectionShell
      id="clinical"
      sectionRef={sectionRef}
      eyebrow="Clinical"
      title="Professional clinical command"
      description="Primary-authority clinical orientation for medical professionals. Evidence and regulatory status stay distinct from product marketing and genetics."
      action={<Link className="hvm2-text-link" href={clinicalHref}>Open clinician workspace</Link>}
    >
      <ClinicalEvidenceExplorer jurisdiction={jurisdiction} />

      <div className="hvm2-sourcing-note" data-sourcing={sourceState} role={sourceState === 'stale' ? 'status' : undefined}>
        <strong>Jurisdiction briefing · {formatStatus(sourceState)}</strong>
        <p>{CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
      </div>

      {authorities.length === 0 && (
        <div className="hvm2-sourcing-note" data-sourcing="empty" role="status" aria-label="Primary authority coverage">
          <strong>Primary authority · {jurisdiction}</strong>
          <p>{CLINICAL_AUTHORITY_ABSENT_COPY}</p>
        </div>
      )}

      {changed && (
        <div className="hvm2-compliance-grid" aria-label="Clinical command summary">
          <article>
            <span>What changed</span>
            <strong>Current federal framework</strong>
            <p>Use the Cannabis Act and Cannabis Regulations authority rather than legacy ACMPR-era terminology.</p>
            <a className="hvm2-text-link" href={changed.href} target="_blank" rel="noreferrer">Primary authority ↗</a>
          </article>
          <article>
            <span>What requires attention</span>
            <strong>{sourceState === 'loaded' ? 'Verify against source' : 'Briefing needs review'}</strong>
            <p>{sourceState === 'loaded' ? 'Jurisdiction briefing is present; confirm material decisions against the cited authority and professional regulator.' : CLINICAL_SOURCE_STATE_COPY[sourceState]}</p>
          </article>
        </div>
      )}

      <div className="hvm2-horizontal-deck" aria-label="Clinical actions">
        {documentAuthority && (
          <article className="hvm2-directory-card">
            <span>What can I do next</span>
            <h3>Authorization & documentation</h3>
            <p>Review the current federal medical-document requirements before using jurisdiction-specific workflow content.</p>
            <a className="hvm2-text-link" href={documentAuthority.href} target="_blank" rel="noreferrer">Open §273 ↗</a>
          </article>
        )}
        {safetyAuthority && (
          <article className="hvm2-directory-card">
            <span>Patient safety</span>
            <h3>Safety & interactions</h3>
            <p>Open current Health Canada safety and interaction guidance. Harbourview does not present a structured interaction checker until a reviewed interaction contract is wired.</p>
            <a className="hvm2-text-link" href={safetyAuthority.href} target="_blank" rel="noreferrer">Open guidance ↗</a>
          </article>
        )}
        {pharmacovigilanceAuthority && (
          <article className="hvm2-directory-card">
            <span>Pharmacovigilance</span>
            <h3>Adverse-reaction reporting</h3>
            <p>Use the current federal health-professional reporting guidance and capture product identity details required by the authority.</p>
            <a className="hvm2-text-link" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">Reporting guidance ↗</a>
          </article>
        )}
        <article className="hvm2-directory-card">
          <span>Professional education</span>
          <h3>Reviewed clinical modules</h3>
          <p>Open Harbourview&apos;s existing professional-only clinical education surface and its review-status controls.</p>
          <Link className="hvm2-text-link" href="/network/clinical-education">Clinical education →</Link>
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
          <p>{safePhysicianAccess || 'No current reviewed profession-specific briefing is available for this context. Confirm requirements with the applicable provincial or territorial professional regulator.'}</p>
          <Link className="hvm2-text-link" href={clinicalHref}>Clinical workspace →</Link>
        </article>
      </div>

      <div className="hvm2-horizontal-deck" aria-label="Clinical provenance">
        {authorities.map(source => (
          <article className="hvm2-directory-card" key={source.id}>
            <span>{source.evidenceType.replaceAll('-', ' ')}</span>
            <h3>{source.label}</h3>
            <p>{source.purpose}</p>
            <p><strong>{source.jurisdiction}</strong> · {source.evidenceStrength}</p>
            <p>Verified {source.verifiedAt} · {source.sourceName}</p>
            <a className="hvm2-text-link" href={source.href} target="_blank" rel="noreferrer">Primary source ↗</a>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

export function ComplianceSection({ sectionRef, regulatoryTier, outlook, playbookSourcing, marketAccessStatus, pathway, commandHref }: {
  sectionRef: SectionRef
  regulatoryTier?: string | null
  outlook?: string | null
  playbookSourcing: string
  marketAccessStatus?: string | null
  pathway?: string | null
  commandHref: CommandHref
}) {
  const sourcingNote = playbookSourcing.trim()

  return (
    <SectionShell id="compliance" sectionRef={sectionRef} eyebrow="Compliance" title="Regulatory and quality control" description={MOBILE_COMMAND_COPY.complianceDescription} action={<Link className="hvm2-text-link" href={commandHref('compliance')}>Compliance command</Link>}>
      <div className="hvm2-compliance-grid">
        <article><span>Regulatory tier</span><strong>{formatStatus(regulatoryTier)}</strong><p>{outlook || MOBILE_COMMAND_COPY.complianceOutlookFallback}</p></article>
        <article><span>Access pathway</span><strong>{formatStatus(marketAccessStatus)}</strong><p>{pathway || MOBILE_COMMAND_COPY.compliancePathwayFallback}</p></article>
      </div>
      <div className="hvm2-sourcing-note" data-sourcing={sourcingNote ? 'recorded' : 'absent'}>
        <strong>{MOBILE_COMMAND_COPY.playbookSourcingTitle}</strong>
        <p>{sourcingNote || MOBILE_COMMAND_COPY.playbookSourcingAbsent}</p>
      </div>
    </SectionShell>
  )
}

export function NetworkSection({ sectionRef, professionalCount, providerCount, operatorCount, collaborationCount, commandHref }: {
  sectionRef: SectionRef
  professionalCount: number
  providerCount: number
  operatorCount: number
  collaborationCount: number
  commandHref: CommandHref
}) {
  return (
    <SectionShell id="network" sectionRef={sectionRef} eyebrow="Network" title="Reviewed commercial network" description={MOBILE_COMMAND_COPY.networkDescription} action={<Link className="hvm2-text-link" href={commandHref('network')}>Network command</Link>}>
      <div className="hvm2-metric-grid">
        <Metric label="Professionals" value={professionalCount} detail="Reviewed professional records" />
        <Metric label="Service providers" value={providerCount} detail="Approved capability records" />
        <Metric label="Licensed operators" value={operatorCount} detail="Operator records in context" />
        <Metric label="Collaborations" value={collaborationCount} detail="Controlled project opportunities" />
      </div>
    </SectionShell>
  )
}

export function FinancingSection({
  sectionRef,
  countryLabel,
  roleShort,
  activeTool,
  onOpenTool,
  onCloseTool,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleShort: string
  activeTool: MobileCommandTool | null
  onOpenTool: (tool: MobileCommandTool) => void
  onCloseTool: () => void
}) {
  return (
    <SectionShell id="financing" sectionRef={sectionRef} eyebrow="Trade financing" title="Structure the commercial corridor" description={MOBILE_COMMAND_COPY.financingDescription}>
      <article className="hvm2-finance-card">
        <div><span>Active corridor</span><strong>{countryLabel} · {roleShort}</strong></div>
        <ol>
          <li><span>1</span><div><strong>Define transaction</strong><p>Product, volume, origin, destination and timing.</p></div></li>
          <li><span>2</span><div><strong>Verify pathway</strong><p>Licences, permits, quality documents and counterparty readiness.</p></div></li>
          <li><span>3</span><div><strong>Review structure</strong><p>Payment, insurance, logistics and financing requirements.</p></div></li>
        </ol>
        <button type="button" className="hvm2-inline-cta" onClick={() => onOpenTool('financing-intake')}>Start controlled financing review</button>
      </article>
      <FinancingWorkspacePanel open={activeTool === 'financing-intake'} onClose={onCloseTool} />
    </SectionShell>
  )
}