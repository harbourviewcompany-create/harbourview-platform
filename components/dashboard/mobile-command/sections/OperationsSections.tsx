import Link from 'next/link'
import { JOB_LISTINGS, JOB_SECTOR_LABELS, JOB_TYPE_LABELS } from '../../data/jobsBoard'
import {
  MOBILE_COMMAND_COPY,
  formatStatus,
  type DirectoryRecord,
  type SubmissionRecord,
} from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type TalentRecord = (typeof JOB_LISTINGS)[number]

export function JurisdictionSection({ sectionRef, countryLabel, flag, region, outlook, pathway, importStatus, exportStatus, medicalStatus, adultUseStatus, regulator, reviewStatus, routeHref }: {
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
  routeHref: (path: string) => string
}) {
  return (
    <SectionShell id="jurisdiction" sectionRef={sectionRef} eyebrow="Jurisdiction context" title={`${countryLabel} market-access context`} description="Country status, regulator, access posture and commercial pathway remain tied to the selected role." action={<Link className="hvm2-text-link" href={routeHref('/markets')}>All markets</Link>}>
      <article className="hvm2-jurisdiction-card">
        <div className="hvm2-jurisdiction-title"><span>{flag}</span><div><h3>{countryLabel}</h3><p>{region || 'Global regulated market'}</p></div></div>
        <p>{outlook?.trim() || pathway?.trim() || 'Regulatory and commercial pathway detail remains subject to controlled evidence review.'}</p>
        <div className="hvm2-status-matrix">
          <div><span>Import</span><strong>{formatStatus(importStatus)}</strong></div>
          <div><span>Export</span><strong>{formatStatus(exportStatus)}</strong></div>
          <div><span>Medical</span><strong>{formatStatus(medicalStatus)}</strong></div>
          <div><span>Adult use</span><strong>{formatStatus(adultUseStatus)}</strong></div>
          <div><span>Regulator</span><strong>{regulator || 'Under review'}</strong></div>
          <div><span>Evidence</span><strong>{reviewStatus}</strong></div>
        </div>
      </article>
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

export function ReviewGatesSection({ sectionRef, reviewStatus, approved, dataCompleteness, sourceCoverageCount, proofReview, submissionCount }: {
  sectionRef: SectionRef
  reviewStatus: string
  approved: boolean
  dataCompleteness: string
  sourceCoverageCount: number
  proofReview: number
  submissionCount: number
}) {
  return (
    <SectionShell id="review-gates" sectionRef={sectionRef} eyebrow="Review / gate status" title="Evidence and release controls" description={MOBILE_COMMAND_COPY.reviewDescription}>
      <div className="hvm2-gate-grid">
        <Metric label="Country review" value={reviewStatus} detail="Jurisdiction intelligence state" tone={approved ? 'ok' : 'warn'} />
        <Metric label="Data coverage" value={dataCompleteness} detail={`${sourceCoverageCount} source coverage lanes`} />
        <Metric label="Proof review" value={proofReview} detail="Marketplace records awaiting evidence" tone={proofReview > 0 ? 'warn' : 'ok'} />
        <Metric label="My submissions" value={submissionCount} detail="Private records in review workflow" />
      </div>
      <div className="hvm2-control-note"><strong>{MOBILE_COMMAND_COPY.controlTitle}</strong><p>{MOBILE_COMMAND_COPY.controlDetail}</p></div>
    </SectionShell>
  )
}

export function DirectoriesSection({ sectionRef, records, routeHref }: { sectionRef: SectionRef; records: DirectoryRecord[]; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="directories" sectionRef={sectionRef} eyebrow="Directories" title="Reviewed professionals, providers and operators" description={MOBILE_COMMAND_COPY.directoryDescription} action={<Link className="hvm2-text-link" href={routeHref('/reviewed-connections')}>Reviewed connections</Link>}>
      {records.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {records.map(item => <article className="hvm2-directory-card" key={`${item.kind}-${item.id}`}><span>{item.kind}</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}
        </div>
      ) : <EmptyState title="No reviewed directory records loaded" detail="Professionals, providers and operators will appear after projection and review requirements are satisfied." />}
    </SectionShell>
  )
}

export function TalentSection({ sectionRef, records, dashboardHref }: { sectionRef: SectionRef; records: TalentRecord[]; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="talent" sectionRef={sectionRef} eyebrow="Talent" title="Roles and operating capability" description="Talent opportunities remain separated from counterparty records and are filtered to the active jurisdiction or role where possible." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'jobs' })}>Jobs workspace</Link>}>
      {records.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {records.map(job => <article className="hvm2-directory-card" key={job.id}><span>{JOB_SECTOR_LABELS[job.sector]} · {job.country}</span><h3>{job.title}</h3><p>{job.company} · {job.city}{job.remote ? ' · Remote' : ''}</p><div className="hvm2-card-meta"><span>{JOB_TYPE_LABELS[job.type]}</span>{job.salary && <span>{job.salary}</span>}</div></article>)}
        </div>
      ) : <EmptyState title="No talent opportunities loaded" detail="The talent section remains active and will populate from the approved jobs dataset." />}
    </SectionShell>
  )
}
