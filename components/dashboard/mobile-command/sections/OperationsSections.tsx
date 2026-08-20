import { JOB_LISTINGS, JOB_SECTOR_LABELS, JOB_TYPE_LABELS } from '../../data/jobsBoard'
import {
  MOBILE_COMMAND_COPY,
  formatStatus,
  type SectionId,
  type SubmissionRecord,
} from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type TalentRecord = (typeof JOB_LISTINGS)[number]
type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

/** Structural shape of the `cc_pathway_steps` rows carried on `pathwayData.steps`. */
export type PathwayStep = {
  id: string
  step_number: number
  title: string
}

export function JurisdictionSection({ sectionRef, countryLabel, flag, region, outlook, pathway, importStatus, exportStatus, medicalStatus, adultUseStatus, regulator, reviewStatus, pathwaySteps, pathwayIsGeneric, commandHref }: {
  sectionRef: SectionRef
  countryLabel: string
  flag: string
  region?: string | null
  outlook?: string | null
  pathway?: string | null
  importStatus?: string | null
  exportStatus?: string | null
  medicalStatus?: string | null
  adultUseStatus?: string | null
  regulator?: string | null
  reviewStatus: string
  pathwaySteps: PathwayStep[]
  /**
   * True when the steps came from the generic role fallback rather than a
   * hand-authored `cc_pathway_templates` row. 34 of 203 countries have a
   * curated row, so this is the common case and must be stated — otherwise a
   * role-level pathway reads as jurisdiction-specific guidance.
   */
  pathwayIsGeneric: boolean
  commandHref: CommandHref
}) {
  void commandHref
  return (
    <SectionShell id="jurisdiction" sectionRef={sectionRef} eyebrow="Jurisdiction context" title={`${countryLabel} market-access context`} description={MOBILE_COMMAND_COPY.jurisdictionDescription}>
      <article className="hvm2-jurisdiction-card">
        <div className="hvm2-jurisdiction-title"><span aria-hidden="true">{flag}</span><div><h3>{countryLabel}</h3><p>{region || 'Global regulated market'}</p></div></div>
        <p>{outlook?.trim() || pathway?.trim() || MOBILE_COMMAND_COPY.jurisdictionFallback}</p>
        <div className="hvm2-status-matrix">
          <div><span>Import</span><strong>{formatStatus(importStatus)}</strong></div>
          <div><span>Export</span><strong>{formatStatus(exportStatus)}</strong></div>
          <div><span>Medical</span><strong>{formatStatus(medicalStatus)}</strong></div>
          <div><span>Adult use</span><strong>{formatStatus(adultUseStatus)}</strong></div>
          <div><span>Regulator</span><strong>{regulator || 'Under review'}</strong></div>
          <div><span>Evidence</span><strong>{reviewStatus}</strong></div>
        </div>
      </article>
      <h3 className="hvm2-subhead">{MOBILE_COMMAND_COPY.pathwayStepsTitle}</h3>
      {pathwaySteps.length > 0 ? (
        <div className="hvm2-pathway-steps" data-pathway-origin={pathwayIsGeneric ? 'generic' : 'curated'}>
          <p>{pathwayIsGeneric ? MOBILE_COMMAND_COPY.pathwayGenericNote : MOBILE_COMMAND_COPY.pathwayCuratedNote}</p>
          <ol>
            {pathwaySteps.map(step => <li key={step.id}><span>{step.step_number}</span><strong>{step.title}</strong></li>)}
          </ol>
        </div>
      ) : <EmptyState title={MOBILE_COMMAND_COPY.pathwayEmpty} detail={MOBILE_COMMAND_COPY.pathwayEmptyDetail} />}
    </SectionShell>
  )
}

export function MarketStatusSection({ sectionRef, wanted, inquiry, proofReview, matched, dealRoom, submissions }: {
  sectionRef: SectionRef
  wanted: number
  inquiry: number
  proofReview: number
  matched: number
  dealRoom: number
  submissions: SubmissionRecord[]
}) {
  const stages: Array<[string, number]> = [['Wanted', wanted], ['Inquiry', inquiry], ['Proof review', proofReview], ['Matched', matched], ['Deal room', dealRoom]]
  return (
    <SectionShell id="market-status" sectionRef={sectionRef} eyebrow="Marketplace status" title="Controlled transaction pipeline" description={MOBILE_COMMAND_COPY.transactionPipeline}>
      <div className="hvm2-pipeline" aria-label="Marketplace pipeline">
        {stages.map(([label, value], index) => <div key={label}><span>{index + 1}</span><strong>{value}</strong><small>{label}</small></div>)}
      </div>
      {submissions.length > 0 && <div className="hvm2-submission-list">{submissions.map(item => <article key={item.id}><div><span>My submission</span><strong>{item.title}</strong></div><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}</div>}
    </SectionShell>
  )
}

export type EvidenceDocument = {
  id: string
  display_name: string
  document_type: string
  verification_status: string
}

export function ReviewGatesSection({ sectionRef, reviewStatus, approved, sourceCoverageCount, proofReview, submissionCount, evidenceDocuments }: {
  sectionRef: SectionRef
  reviewStatus: string
  approved: boolean
  sourceCoverageCount: number
  proofReview: number
  submissionCount: number
  evidenceDocuments: EvidenceDocument[]
}) {
  return (
    <SectionShell id="review-gates" sectionRef={sectionRef} eyebrow="Review / gate status" title="Evidence and release controls" description={MOBILE_COMMAND_COPY.reviewDescription}>
      <div className="hvm2-gate-grid">
        <Metric label="Country review" value={reviewStatus} detail="Jurisdiction intelligence state" tone={approved ? 'ok' : 'warn'} />
        <Metric label="Source coverage" value={sourceCoverageCount} detail="Registered evidence source lanes" />
        <Metric label="Proof review" value={proofReview} detail="Marketplace records awaiting evidence" tone={proofReview > 0 ? 'warn' : 'ok'} />
        <Metric label="My submissions" value={submissionCount} detail="Private records in review workflow" />
      </div>
      <h3 className="hvm2-subhead">{MOBILE_COMMAND_COPY.evidenceDocumentsTitle}</h3>
      {evidenceDocuments.length > 0 ? (
        <div className="hvm2-submission-list">
          {evidenceDocuments.map(doc => (
            <article key={doc.id}>
              <div><span>{formatStatus(doc.document_type, 'Evidence document')}</span><strong>{doc.display_name}</strong></div>
              <StatusPill>{formatStatus(doc.verification_status, 'Pending verification')}</StatusPill>
            </article>
          ))}
        </div>
      ) : <EmptyState title={MOBILE_COMMAND_COPY.evidenceDocumentsEmpty} detail={MOBILE_COMMAND_COPY.evidenceDocumentsEmptyDetail} />}
      <div className="hvm2-control-note"><strong>{MOBILE_COMMAND_COPY.controlTitle}</strong><p>{MOBILE_COMMAND_COPY.controlDetail}</p></div>
    </SectionShell>
  )
}

export function TalentSection({ sectionRef, records, commandHref }: { sectionRef: SectionRef; records: TalentRecord[]; commandHref: CommandHref }) {
  void commandHref
  return (
    <SectionShell id="talent" sectionRef={sectionRef} eyebrow="Talent" title="Roles and operating capability" description={MOBILE_COMMAND_COPY.talentDescription}>
      {records.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {records.map(job => <article className="hvm2-directory-card" key={job.id}><span>{JOB_SECTOR_LABELS[job.sector]} · {job.country}</span><h3>{job.title}</h3><p>{job.company} · {job.city}{job.remote ? ' · Remote' : ''}</p><div className="hvm2-card-meta"><span>{JOB_TYPE_LABELS[job.type]}</span>{job.salary && <span>{job.salary}</span>}</div></article>)}
        </div>
      ) : <EmptyState title="No talent opportunities loaded" detail={MOBILE_COMMAND_COPY.talentEmptyDetail} />}
    </SectionShell>
  )
}
