import Link from 'next/link'
import {
  MOBILE_COMMAND_COPY,
  formatStatus,
  type DirectoryRecord,
} from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

export function GeneticsSection({ sectionRef, records, dashboardHref }: { sectionRef: SectionRef; records: DirectoryRecord[]; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="genetics" sectionRef={sectionRef} eyebrow="Genetics" title="Cultivar and program intelligence" description="Reviewed cultivar passports and genetics records remain tied to evidence and controlled requests." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'genetics' })}>Genetics workspace</Link>}>
      {records.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {records.map(item => <article className="hvm2-directory-card" key={item.id}><span>Cultivar passport</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}
        </div>
      ) : <EmptyState title="No reviewed genetics records loaded" detail="Genetics remains available through controlled program and evidence requests." />}
    </SectionShell>
  )
}

export function ClinicalSection({ sectionRef, roleShort, programStatus, medicalStatus, patientAccess, physicianAccess, routeHref }: {
  sectionRef: SectionRef
  roleShort: string
  programStatus?: string | null
  medicalStatus?: string | null
  patientAccess?: string | null
  physicianAccess?: string | null
  routeHref: (path: string) => string
}) {
  return (
    <SectionShell id="clinical" sectionRef={sectionRef} eyebrow="Clinical" title="Clinical access and education" description="Country-specific patient, prescriber and pharmacy context is kept separate from commercial claims." action={<Link className="hvm2-text-link" href={routeHref('/network/clinical-education')}>Clinical education</Link>}>
      <div className="hvm2-two-column">
        <article><span>Patient access</span><h3>{programStatus || formatStatus(medicalStatus, 'Clinical pathway review')}</h3><p>{patientAccess || 'Patient-access detail is available when supported by reviewed jurisdiction evidence.'}</p></article>
        <article><span>Prescriber access</span><h3>{roleShort}</h3><p>{physicianAccess || 'Prescribing, dispensing and professional obligations remain jurisdiction-specific and evidence-gated.'}</p></article>
      </div>
    </SectionShell>
  )
}

export function ComplianceSection({ sectionRef, regulatoryTier, outlook, dataCompleteness, playbookStatus, marketAccessStatus, pathway, dashboardHref }: {
  sectionRef: SectionRef
  regulatoryTier?: string | null
  outlook?: string | null
  dataCompleteness: string
  playbookStatus: string
  marketAccessStatus?: string | null
  pathway?: string | null
  dashboardHref: (changes: Record<string, string>) => string
}) {
  return (
    <SectionShell id="compliance" sectionRef={sectionRef} eyebrow="Compliance" title="Regulatory and quality control" description="Import/export, licensing, quality and evidence requirements are consolidated for the active market-role combination." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'compliance' })}>Compliance workspace</Link>}>
      <div className="hvm2-compliance-grid">
        <article><span>Regulatory tier</span><strong>{formatStatus(regulatoryTier)}</strong><p>{outlook || 'Regulatory outlook requires reviewed source support.'}</p></article>
        <article><span>Quality posture</span><strong>{dataCompleteness}</strong><p>{playbookStatus}</p></article>
        <article><span>Access pathway</span><strong>{formatStatus(marketAccessStatus)}</strong><p>{pathway || 'Licence, permit, customs and quality gates remain jurisdiction-specific.'}</p></article>
      </div>
    </SectionShell>
  )
}

export function NetworkSection({ sectionRef, professionalCount, providerCount, operatorCount, collaborationCount, routeHref }: {
  sectionRef: SectionRef
  professionalCount: number
  providerCount: number
  operatorCount: number
  collaborationCount: number
  routeHref: (path: string) => string
}) {
  return (
    <SectionShell id="network" sectionRef={sectionRef} eyebrow="Network" title="Reviewed commercial network" description="Professionals, service providers, licensed operators and collaboration projects remain available through controlled Harbourview access paths." action={<Link className="hvm2-text-link" href={routeHref('/network')}>Network workspace</Link>}>
      <div className="hvm2-metric-grid">
        <Metric label="Professionals" value={professionalCount} detail="Reviewed professional records" />
        <Metric label="Service providers" value={providerCount} detail="Approved capability records" />
        <Metric label="Licensed operators" value={operatorCount} detail="Operator records in context" />
        <Metric label="Collaborations" value={collaborationCount} detail="Controlled project opportunities" />
      </div>
    </SectionShell>
  )
}

export function FinancingSection({ sectionRef, countryLabel, roleShort, routeHref }: { sectionRef: SectionRef; countryLabel: string; roleShort: string; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="financing" sectionRef={sectionRef} eyebrow="Trade financing" title="Structure the commercial corridor" description={MOBILE_COMMAND_COPY.financingDescription} action={<Link className="hvm2-text-link" href={routeHref('/marketplace/financing')}>Financing intake</Link>}>
      <article className="hvm2-finance-card">
        <div><span>Active corridor</span><strong>{countryLabel} · {roleShort}</strong></div>
        <ol>
          <li><span>1</span><div><strong>Define transaction</strong><p>Product, volume, origin, destination and timing.</p></div></li>
          <li><span>2</span><div><strong>Verify pathway</strong><p>Licences, permits, quality documents and counterparty readiness.</p></div></li>
          <li><span>3</span><div><strong>Review structure</strong><p>Payment, insurance, logistics and financing requirements.</p></div></li>
        </ol>
        <Link href={routeHref('/marketplace/financing')}>Start controlled financing review</Link>
      </article>
    </SectionShell>
  )
}
