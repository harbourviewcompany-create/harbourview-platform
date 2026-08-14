'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MOBILE_COMMAND_COPY,
  formatStatus,
  type DirectoryRecord,
  type MobileCommandTool,
  type SectionId,
} from '../contracts'
import { FinancingWorkspacePanel } from '../WorkspacePanels'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

const REVIEW_ATTENTION = /draft|submitted|needs evidence|disputed|expired|rejected|pending|not assessed/i
const REVIEW_POSITIVE = /reviewed|approved|verified|externally verified|admin reviewed/i

export function GeneticsSection({ sectionRef, records, commandHref }: { sectionRef: SectionRef; records: DirectoryRecord[]; commandHref: CommandHref }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredRecords = useMemo(() => records.filter(item => {
    if (!normalizedQuery) return true
    return [item.kind, item.title, item.subtitle, item.status].some(value => value?.toLocaleLowerCase().includes(normalizedQuery))
  }), [normalizedQuery, records])
  const attention = useMemo(() => records.filter(item => REVIEW_ATTENTION.test(formatStatus(item.status))), [records])
  const reviewedCount = useMemo(() => records.filter(item => REVIEW_POSITIVE.test(formatStatus(item.status))).length, [records])

  return (
    <SectionShell
      id="genetics"
      sectionRef={sectionRef}
      eyebrow="Genetics"
      title="Cultivar intelligence"
      description="Evidence-aware cultivar passport records and their current review state."
    >
      <div className="hvm2-metric-grid" aria-label="Genetics record status">
        <Metric label="Passports" value={records.length} detail="Public cultivar passport records loaded" />
        <Metric label="Reviewed" value={reviewedCount} detail="Records carrying a reviewed or verified state" />
        <Metric label="Needs attention" value={attention.length} detail="Records with an unresolved review state" />
      </div>

      {attention.length > 0 && (
        <div className="hvm2-genetics-block" aria-labelledby="hvm2-genetics-attention">
          <div className="hvm2-genetics-heading">
            <div><span>Attention</span><h3 id="hvm2-genetics-attention">Requires attention</h3></div>
            <span>{attention.length}</span>
          </div>
          <div className="hvm2-genetics-list">
            {attention.slice(0, 3).map(item => (
              <details className="hvm2-genetics-record hvm2-tone-warn" key={`attention-${item.id}`}>
                <summary><span><small>{item.kind}</small><strong>{item.title}</strong></span><StatusPill>{formatStatus(item.status)}</StatusPill></summary>
                <p>{item.subtitle}</p>
              </details>
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
              placeholder="Search cultivar passports"
              aria-label="Search cultivar passports"
            />
          </label>
        )}
        {filteredRecords.length > 0 ? (
          <div className="hvm2-genetics-list">
            {filteredRecords.map(item => (
              <details className="hvm2-genetics-record" key={item.id}>
                <summary>
                  <span><small>{item.kind}</small><strong>{item.title}</strong></span>
                  <StatusPill>{formatStatus(item.status)}</StatusPill>
                </summary>
                <p>{item.subtitle}</p>
                <div className="hvm2-genetics-record-footer">
                  <span>Public passport summary</span>
                  <Link href={commandHref('genetics')}>Keep Genetics context</Link>
                </div>
              </details>
            ))}
          </div>
        ) : records.length > 0 ? (
          <EmptyState title="No matching cultivar passports" detail="Clear or change the search to return to the complete loaded passport set." />
        ) : (
          <EmptyState title="No public cultivar passports loaded" detail={MOBILE_COMMAND_COPY.geneticsEmptyDetail} />
        )}
      </div>

      <div className="hvm2-genetics-boundary" role="note">
        <strong>Current command boundary</strong>
        <p>Programs, private evidence, access requests and genetics intelligence are not represented here unless they are present in the loaded Command data contract. This surface does not infer them from a cultivar passport.</p>
      </div>
    </SectionShell>
  )
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
  const prescriberStatus = physicianAccess?.trim()
    ? 'Guidance available'
    : 'Prescriber pathway review'

  return (
    <SectionShell id="clinical" sectionRef={sectionRef} eyebrow="Clinical" title="Clinical access and education" description={MOBILE_COMMAND_COPY.clinicalDescription} action={<Link className="hvm2-text-link" href={commandHref('clinical')}>Clinical command</Link>}>
      <div className="hvm2-two-column">
        <article><span>Patient access</span><h3>{programStatus || formatStatus(medicalStatus, 'Clinical pathway review')}</h3><p>{patientAccess || MOBILE_COMMAND_COPY.clinicalPatientFallback}</p></article>
        <article><span>Prescriber access</span><h3>{prescriberStatus}</h3><p>{physicianAccess || `${roleShort}: ${MOBILE_COMMAND_COPY.clinicalProfessionalFallback}`}</p></article>
      </div>
    </SectionShell>
  )
}

export function ComplianceSection({ sectionRef, regulatoryTier, outlook, playbookSourcing, marketAccessStatus, pathway, commandHref }: {
  sectionRef: SectionRef
  regulatoryTier?: string | null
  outlook?: string | null
  /**
   * `jurisdiction_playbooks.confidence_label` — sourcing prose describing how
   * the playbook was corroborated, e.g. "high — consistently corroborated
   * across …". It averages ~310 characters and runs to 871, so it is rendered
   * as a note rather than squeezed into a stat value. Resolved by the caller
   * with the usual `readString` fallback, so an absent field arrives as an
   * empty string and this section states plainly that none is recorded.
   */
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
