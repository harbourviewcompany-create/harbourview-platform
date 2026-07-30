'use client'

import React from 'react'
import type { CountryIntelProfile, PathwayData, JurisdictionPlaybook } from '@/lib/dashboard/dashboardLiveData'

type CountryOption = { iso2: string; label: string }

const PENDING_REVIEW = 'Pending verified source review'

const FIELD_LABELS: Record<string, string> = {
  needs_review: 'Under review',
  stub: 'Data pending',
  pending: 'Pending',
  verified: 'Verified',
  published: 'Published',
  approved: 'Approved',
  review_gated: 'Under review',
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  active: 'Active',
  inactive: 'Inactive',
  restricted: 'Restricted',
  draft: 'Draft',
  in_review: 'In review',
  waived: 'Waived',
}

function fieldValue(value: string | number | null | undefined, fallback = PENDING_REVIEW): string {
  if (typeof value === 'number') return String(value)
  const raw = value && value.trim() ? value.trim() : fallback
  if (FIELD_LABELS[raw]) return FIELD_LABELS[raw]
  return raw
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function SectionCard({
  label,
  title,
  detail,
  tone = 'neutral',
}: {
  label: string
  title: string
  detail?: string
  tone?: 'neutral' | 'ok' | 'warn'
}) {
  return (
    <div className={`hvm-card hvm-card-${tone}`}>
      <div className="hvm-kicker">{label}</div>
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
    </div>
  )
}

function MobileAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children?: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="hvm-accordion" open={defaultOpen}>
      <summary>
        {title}
        <span>⌄</span>
      </summary>
      <div className="hvm-accordion-body">{children}</div>
    </details>
  )
}

/** Count verified / waived / in_review as progress toward "met". */
function isMet(status?: string | null): boolean {
  return status === 'verified' || status === 'waived' || status === 'in_review'
}

function isFullyDone(status?: string | null): boolean {
  return status === 'verified' || status === 'waived'
}

function statusChip(status?: string | null): { label: string; color: string } {
  if (status === 'verified' || status === 'waived') {
    return { label: status === 'waived' ? 'Waived' : 'Verified', color: '#4caf82' }
  }
  if (status === 'in_review') {
    return { label: 'In review', color: '#d4a84b' }
  }
  return { label: 'Not started', color: 'rgba(245,240,232,.45)' }
}

export function AccessPathwayMobile({
  country,
  roleLabel,
  countryIntel,
  pathwayData,
  jurisdictionPlaybook,
}: {
  country: CountryOption
  roleLabel: string
  countryIntel?: CountryIntelProfile | null
  pathwayData?: PathwayData | null
  jurisdictionPlaybook?: JurisdictionPlaybook
}) {
  const pathwaySummary = fieldValue(
    countryIntel?.commercial_pathway_summary,
    'Pathway evidence is under Harbourview review for this country-role context.',
  )
  const reviewState = fieldValue(countryIntel?.review_status, 'Review gated')
  const steps = pathwayData?.steps ?? []
  const requirements = pathwayData?.requirements ?? []
  const statuses = pathwayData?.requirementStatuses ?? []
  const progress = pathwayData?.progress
  const hasSteps = steps.length > 0

  let overallMet = 0
  let overallTotal = 0
  for (const step of steps) {
    const allReqs = requirements.filter(r => r.step_id === step.id)
    const required = allReqs.filter(r => r.is_required)
    const target = required.length > 0 ? required : allReqs
    overallTotal += target.length
    overallMet += target.filter(r => isMet(statuses.find(rs => rs.requirement_id === r.id)?.status)).length
  }
  const overallPct = overallTotal > 0 ? Math.round((overallMet / overallTotal) * 100) : 0

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Access Pathway</h2>
        <p>
          {country.label} · {roleLabel}
        </p>
        {pathwayData?.template ? (
          <blockquote>
            {pathwayData.template.name}
            {progress
              ? ` · Step ${progress.current_step} of ${pathwayData.template.total_steps}`
              : ` · ${pathwayData.template.total_steps} steps`}
          </blockquote>
        ) : (
          <blockquote>{pathwaySummary}</blockquote>
        )}
      </section>

      {hasSteps && (
        <div className="hvm-card" style={{ borderColor: overallPct >= 80 ? 'rgba(76,175,130,.28)' : overallPct > 0 ? 'rgba(212,168,75,.28)' : undefined }}>
          <div className="hvm-kicker">Overall readiness</div>
          <strong style={{ fontSize: 16 }}>
            {overallMet}/{overallTotal} met · {overallPct}%
          </strong>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(245,240,232,.55)' }}>
            Includes verified, waived, and in-review requirements derived from country intelligence and org progress.
          </p>
          <div style={{ marginTop: 12 }}>
            <div className="hvm-conf-bar-track" style={{ height: 8, borderRadius: 4 }}>
              <div
                className="hvm-hist-bar-fill"
                style={{
                  height: '100%',
                  width: `${overallPct}%`,
                  borderRadius: 4,
                  background:
                    overallPct >= 80
                      ? 'linear-gradient(90deg, #4caf82, rgba(76,175,130,.7))'
                      : overallPct > 0
                        ? 'linear-gradient(90deg, #d4a84b, rgba(212,168,75,.65))'
                        : undefined,
                }}
              />
            </div>
          </div>
          {progress?.status && (
            <div className="hvm-ledger-table" role="table" aria-label="Pathway progress" style={{ marginTop: 12 }}>
              <div role="row">
                <strong>Current step</strong>
                <span>
                  {progress.current_step}
                  {pathwayData?.template ? ` of ${pathwayData.template.total_steps}` : ''}
                </span>
              </div>
              <div role="row">
                <strong>Status</strong>
                <span>{fieldValue(progress.status)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasSteps && progress && pathwayData?.template && (
        <div className="hvm-ledger-table" role="table" aria-label="Pathway progress">
          <div role="row">
            <strong>Current step</strong>
            <span>
              {progress.current_step} of {pathwayData.template.total_steps}
            </span>
          </div>
          <div role="row">
            <strong>Overall progress</strong>
            <span>{Math.round((progress.current_step / pathwayData.template.total_steps) * 100)}%</span>
          </div>
          {progress.status && (
            <div role="row">
              <strong>Status</strong>
              <span>{fieldValue(progress.status)}</span>
            </div>
          )}
        </div>
      )}

      <div className="hvm-pathway-steps">
        {hasSteps ? (
          steps.map(step => {
            const allReqs = requirements.filter(r => r.step_id === step.id)
            const required = allReqs.filter(r => r.is_required)
            const target = required.length > 0 ? required : allReqs
            const metCount = target.filter(r => isMet(statuses.find(rs => rs.requirement_id === r.id)?.status)).length
            const verifiedCount = target.filter(r =>
              isFullyDone(statuses.find(rs => rs.requirement_id === r.id)?.status),
            ).length
            const label =
              target.length === 0
                ? 'Not started'
                : metCount === target.length
                  ? 'Complete'
                  : metCount > 0
                    ? 'In progress'
                    : 'Not started'
            const pct = target.length > 0 ? Math.round((metCount / target.length) * 100) : 0

            if (target.length > 0) {
              return (
                <MobileAccordion
                  key={step.id}
                  title={`${step.step_number}. ${step.title} — ${label} · ${metCount}/${target.length} met`}
                  defaultOpen={step.step_number === 1 || metCount > 0}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div className="hvm-conf-bar-track" style={{ height: 6, borderRadius: 3 }}>
                      <div
                        className="hvm-hist-bar-fill"
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 3,
                          background:
                            pct >= 100
                              ? 'linear-gradient(90deg, #4caf82, rgba(76,175,130,.7))'
                              : pct > 0
                                ? 'linear-gradient(90deg, #d4a84b, rgba(212,168,75,.65))'
                                : undefined,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 8,
                        fontSize: 11,
                        color: 'rgba(245,240,232,.5)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      <span style={{ color: '#4caf82' }}>{verifiedCount} verified</span>
                      <span style={{ color: '#d4a84b' }}>{metCount - verifiedCount} in review</span>
                      <span>{target.length - metCount} remaining</span>
                    </div>
                  </div>
                  {step.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: 'rgba(245,240,232,.65)',
                        margin: '0 0 10px',
                        lineHeight: 1.5,
                      }}
                    >
                      {step.description}
                    </p>
                  )}
                  <div className="hvm-list-stack">
                    {target.map(req => {
                      const st = statuses.find(rs => rs.requirement_id === req.id)?.status
                      const chip = statusChip(st)
                      const done = isFullyDone(st)
                      return (
                        <div
                          className="hvm-signal-card"
                          key={req.id}
                          style={{ opacity: done ? 0.85 : 1 }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <strong style={{ fontSize: 14 }}>
                              {done ? '✓ ' : isMet(st) ? '◐ ' : '○ '}{req.title}
                            </strong>
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: '.04em',
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: `1px solid ${chip.color}55`,
                                color: chip.color,
                                background: `${chip.color}14`,
                              }}
                            >
                              {chip.label}
                            </span>
                          </div>
                          {req.description && <p className="hvm-signal-impact">{req.description}</p>}
                          <small>
                            {fieldValue(st, 'Not started')} · {req.evidence_type.replace(/_/g, ' ')}
                          </small>
                        </div>
                      )
                    })}
                  </div>
                </MobileAccordion>
              )
            }

            return (
              <SectionCard
                key={step.id}
                label={`${step.step_number} · ${step.title}`}
                title={step.description ?? 'Complete this step to advance your access pathway.'}
                tone="neutral"
              />
            )
          })
        ) : (
          <>
            <SectionCard
              label="1 · Eligibility"
              title={fieldValue(countryIntel?.market_access_status)}
              detail="Confirm the selected role is permitted to participate in the country pathway."
            />
            <SectionCard
              label="2 · Importer requirements"
              title={fieldValue(countryIntel?.import_status)}
              detail="Importer authorization, permit mechanics, pharmacy or distributor participation, and role-specific limits."
            />
            <SectionCard
              label="3 · Documents"
              title="Licence, authorization, COA and product dossier packet"
              detail="Document requirements loaded from verified regulatory sources once reviewed."
            />
            <SectionCard
              label="4 · Route constraints"
              title="Compliance-gated market access"
              detail="Controlled routes remain Harbourview-mediated."
            />
            <SectionCard
              label="5 · Review status"
              title={reviewState}
              detail="Only reviewed public summary fields appear in the mobile experience."
              tone="warn"
            />
            <SectionCard
              label="Next action"
              title="Open pathway review queue"
              detail="Verify current source evidence, confirm role fit, then release a reviewed access brief."
              tone="ok"
            />
          </>
        )}
      </div>

      {jurisdictionPlaybook && (
        <MobileAccordion title="Jurisdiction playbook">
          <div className="hvm-ledger-table" role="table" aria-label="Jurisdiction playbook">
            {jurisdictionPlaybook.difficulty && (
              <div role="row">
                <strong>Difficulty</strong>
                <span>{jurisdictionPlaybook.difficulty}</span>
              </div>
            )}
            {jurisdictionPlaybook.typical_timeline_months && (
              <div role="row">
                <strong>Timeline</strong>
                <span>{jurisdictionPlaybook.typical_timeline_months} months</span>
              </div>
            )}
            {jurisdictionPlaybook.estimated_cost_range && (
              <div role="row">
                <strong>Est. cost</strong>
                <span>{jurisdictionPlaybook.estimated_cost_range}</span>
              </div>
            )}
          </div>
          {jurisdictionPlaybook.legal_framework_summary && (
            <p
              style={{
                fontSize: 13,
                color: 'rgba(245,240,232,.65)',
                lineHeight: 1.55,
                margin: '10px 0 0',
              }}
            >
              {jurisdictionPlaybook.legal_framework_summary}
            </p>
          )}
          {jurisdictionPlaybook.common_pitfalls.length > 0 && (
            <div className="hvm-list-stack" style={{ marginTop: 10 }}>
              {jurisdictionPlaybook.common_pitfalls.slice(0, 3).map((p, i) => (
                <div className="hvm-signal-card" key={i} style={{ color: 'rgba(229,115,115,.85)' }}>
                  <strong>⚠ {p}</strong>
                </div>
              ))}
            </div>
          )}
        </MobileAccordion>
      )}
    </div>
  )
}
