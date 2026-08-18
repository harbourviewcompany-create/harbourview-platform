'use client'

import { FormEvent, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { NetworkCandidateDTO, NetworkCommandDTO } from '@/lib/network/types'
import './NetworkCommand.css'

type DraftRequirement = {
  id: string
  type: 'jurisdiction' | 'capability' | 'licence_activity' | 'gmp_certified' | 'consultation_available'
  value: string
  hard: boolean
}

type Props = {
  initialData?: NetworkCommandDTO | null
  compact?: boolean
}

function label(value: string | null | undefined): string {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function requirementLabel(requirement: DraftRequirement): string {
  if (requirement.type === 'jurisdiction') return `Jurisdiction: ${requirement.value.toUpperCase()}`
  if (requirement.type === 'capability') return `Capability: ${requirement.value}`
  if (requirement.type === 'licence_activity') return `Licensed activity: ${requirement.value}`
  if (requirement.type === 'gmp_certified') return 'GMP certified'
  return 'Consultation available'
}

function fitLabel(candidate: NetworkCandidateDTO) {
  const { fit } = candidate
  if (fit.totalRequirements === 0) return 'Mission fit not evaluated'
  return `${fit.satisfiedCount} of ${fit.totalRequirements} requirements satisfied`
}

export default function NetworkCommandClient({ initialData = null, compact = false }: Props) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<NetworkCommandDTO | null>(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<NetworkCandidateDTO | null>(null)
  const [missionOpen, setMissionOpen] = useState(false)
  const [introTarget, setIntroTarget] = useState<NetworkCandidateDTO | null>(null)
  const [interactionTarget, setInteractionTarget] = useState<NetworkCandidateDTO | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missionName, setMissionName] = useState('')
  const [missionObjective, setMissionObjective] = useState('')
  const [requirements, setRequirements] = useState<DraftRequirement[]>([])
  const [requirementType, setRequirementType] = useState<DraftRequirement['type']>('jurisdiction')
  const [requirementValue, setRequirementValue] = useState('')
  const [introReason, setIntroReason] = useState('')
  const [interactionSummary, setInteractionSummary] = useState('')
  const [interactionOutcome, setInteractionOutcome] = useState('')

  const activeMission = useMemo(
    () => data?.missions.find(mission => mission.id === data.activeMissionId) ?? null,
    [data],
  )
  const bestCandidate = data?.candidates[0] ?? null

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      const country = searchParams.get('country')
      const role = searchParams.get('role')
      if (country) params.set('country', country)
      if (role) params.set('role', role)
      const response = await fetch(`/api/network/command${params.size ? `?${params.toString()}` : ''}`, { cache: 'no-store' })
      const payload = await response.json() as { command?: NetworkCommandDTO; error?: string }
      if (!response.ok || !payload.command) throw new Error(payload.error || 'Network Command is unavailable.')
      setData(payload.command)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Network Command is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useState(() => {
    if (!initialData) void refresh()
    return undefined
  })

  function addRequirement() {
    const requiresValue = !['gmp_certified', 'consultation_available'].includes(requirementType)
    const value = requirementValue.trim()
    if (requiresValue && !value) return
    setRequirements(current => [...current, {
      id: `${Date.now()}-${current.length}`,
      type: requirementType,
      value,
      hard: true,
    }])
    setRequirementValue('')
  }

  async function createMission(event: FormEvent) {
    event.preventDefault()
    if (!missionName.trim() || !missionObjective.trim()) return
    setBusyId('mission')
    setError(null)
    try {
      const response = await fetch('/api/network/missions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: missionName.trim(),
          objective: missionObjective.trim(),
          countryIso2: data?.context.countryIso2,
          requirements: requirements.map(requirement => ({
            requirementType: requirement.type,
            label: requirementLabel(requirement),
            hardRequirement: requirement.hard,
            countryIso2: requirement.type === 'jurisdiction' ? requirement.value.toUpperCase() : null,
            capabilityCode: requirement.type === 'capability' ? requirement.value : null,
            licenceActivity: requirement.type === 'licence_activity' ? requirement.value : null,
          })),
        }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Mission creation failed.')
      setMissionOpen(false)
      setMissionName('')
      setMissionObjective('')
      setRequirements([])
      setSuccess('Mission created. Network candidates were re-evaluated against its requirements.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mission creation failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleWatch(candidate: NetworkCandidateDTO) {
    setBusyId(`watch:${candidate.id}`)
    setError(null)
    try {
      const response = candidate.watch.watched && candidate.watch.watchId
        ? await fetch(`/api/network/watch/${candidate.watch.watchId}`, { method: 'DELETE' })
        : await fetch('/api/network/watch', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              sourceKind: candidate.sourceKind,
              sourceId: candidate.sourceId,
              title: candidate.name,
              subtitle: candidate.subtitle,
              jurisdiction: candidate.jurisdictionLabel ?? candidate.countryIso2,
            }),
          })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Watch update failed.')
      setSuccess(candidate.watch.watched ? `${candidate.name} removed from Watchlist.` : `${candidate.name} added to Watchlist.`)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Watch update failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function requestIntroduction(event: FormEvent) {
    event.preventDefault()
    if (!introTarget || !introReason.trim()) return
    setBusyId(`intro:${introTarget.id}`)
    setError(null)
    try {
      const response = await fetch('/api/network/introduction-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          missionId: activeMission?.id ?? null,
          target: {
            entityId: introTarget.entityId,
            sourceKind: introTarget.sourceKind,
            sourceId: introTarget.sourceId,
          },
          reason: introReason.trim(),
          requestedDisclosureScope: 'identity_and_business_context',
        }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Introduction request failed.')
      setSuccess(`Introduction request submitted for ${introTarget.name}.`)
      setIntroTarget(null)
      setIntroReason('')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Introduction request failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function logInteraction(event: FormEvent) {
    event.preventDefault()
    if (!interactionTarget || !interactionSummary.trim()) return
    setBusyId(`interaction:${interactionTarget.id}`)
    setError(null)
    try {
      const response = await fetch('/api/network/interactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          missionId: activeMission?.id ?? null,
          entityId: interactionTarget.entityId,
          sourceKind: interactionTarget.sourceKind,
          sourceId: interactionTarget.sourceId,
          interactionType: 'commercial_contact',
          direction: 'outbound',
          summary: interactionSummary.trim(),
          outcome: interactionOutcome.trim() || null,
        }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Interaction could not be recorded.')
      setSuccess(`Interaction recorded for ${interactionTarget.name}.`)
      setInteractionTarget(null)
      setInteractionSummary('')
      setInteractionOutcome('')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Interaction could not be recorded.')
    } finally {
      setBusyId(null)
    }
  }

  if (!data && loading) {
    return <div className="hv-network-state" role="status"><strong>Loading Network Command…</strong><span>Resolving current context, candidates and private workspace state.</span></div>
  }

  if (!data) {
    return <div className="hv-network-state hv-network-state-error" role="alert"><strong>Network Command unavailable</strong><span>{error || 'Retry the request.'}</span><button type="button" onClick={() => void refresh()}>Retry</button></div>
  }

  const missionRequirementSummary = activeMission
    ? `${activeMission.requirements.filter(requirement => requirement.status === 'active').length} active requirements`
    : 'No mission selected'

  return (
    <div className={`hv-network-command${compact ? ' hv-network-command-compact' : ''}`} data-state={data.dataState}>
      {!compact && (
        <header className="hv-network-header">
          <div>
            <span className="hv-network-eyebrow">HARBOURVIEW · NETWORK COMMAND</span>
            <h1>Commercial relationship and opportunity network</h1>
            <p>Turn reviewed counterparties, capabilities, licences and relationship history into an evidence-aware route to a commercial objective.</p>
          </div>
          <div className="hv-network-context">
            <span>{data.context.countryIso2 ?? 'Global'} · {data.context.roleId ? label(data.context.roleId) : 'All roles'}</span>
            <Link href="/dashboard">Back to Command</Link>
          </div>
        </header>
      )}

      {(error || success || data.dataWarnings.length > 0) && (
        <div className="hv-network-notices" aria-live="polite">
          {error && <div className="hv-network-notice is-error">{error}</div>}
          {success && <div className="hv-network-notice is-success">{success}</div>}
          {data.dataWarnings.map(warning => <div className="hv-network-notice" key={warning}>{warning}</div>)}
        </div>
      )}

      <section className="hv-network-mission" aria-labelledby="network-mission-heading">
        <div className="hv-network-section-kicker">MISSION</div>
        {activeMission ? (
          <>
            <div className="hv-network-mission-head">
              <div>
                <h2 id="network-mission-heading">{activeMission.name}</h2>
                <p>{activeMission.objective}</p>
              </div>
              <button type="button" className="hv-network-secondary" onClick={() => setMissionOpen(true)} disabled={!data.permissions.canCreateMission}>New mission</button>
            </div>
            <div className="hv-network-mission-meta">
              <span>{missionRequirementSummary}</span>
              {bestCandidate?.fit.totalRequirements ? <span>{bestCandidate.fit.satisfiedCount} satisfied by best current candidate</span> : <span>Add structured requirements to evaluate fit</span>}
            </div>
            {activeMission.requirements.length > 0 && (
              <div className="hv-network-requirement-row">
                {activeMission.requirements.filter(item => item.status === 'active').map(requirement => (
                  <span key={requirement.id}>{requirement.label}{requirement.hardRequirement ? '' : ' · preferred'}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="hv-network-mission-empty">
            <div>
              <h2 id="network-mission-heading">Define the outcome, not just the search</h2>
              <p>Create a commercial mission and explicit requirements. Network will only mark a requirement satisfied when the current data actually supports it.</p>
            </div>
            {data.permissions.canCreateMission ? (
              <button type="button" className="hv-network-primary" onClick={() => setMissionOpen(true)}>Create mission</button>
            ) : (
              <Link className="hv-network-primary" href="/organization/new">Connect organization</Link>
            )}
          </div>
        )}
      </section>

      <section className="hv-network-best" aria-labelledby="network-best-heading">
        <div className="hv-network-section-head">
          <div>
            <span className="hv-network-section-kicker">{activeMission ? 'BEST AVAILABLE ROUTE' : 'REVIEWED NETWORK'}</span>
            <h2 id="network-best-heading">{activeMission ? 'Highest-fit current candidate' : 'Start with a reviewed record'}</h2>
          </div>
          <span>{data.candidates.length} in context</span>
        </div>

        {bestCandidate ? (
          <CandidateCard
            candidate={bestCandidate}
            featured
            busy={busyId === `watch:${bestCandidate.id}`}
            onView={() => setSelected(bestCandidate)}
            onWatch={() => void toggleWatch(bestCandidate)}
            onIntro={() => { setIntroTarget(bestCandidate); setIntroReason(activeMission ? `Request an introduction in support of: ${activeMission.objective}` : '') }}
            onInteraction={() => setInteractionTarget(bestCandidate)}
          />
        ) : (
          <div className="hv-network-state">
            <strong>No candidate records in the current context</strong>
            <span>This means the current authorized data returned no records. It does not establish that no market or counterparty exists.</span>
          </div>
        )}
      </section>

      {data.candidates.length > 1 && (
        <section className="hv-network-results" aria-labelledby="network-results-heading">
          <div className="hv-network-section-head">
            <div><span className="hv-network-section-kicker">CANDIDATES</span><h2 id="network-results-heading">Other reviewed routes</h2></div>
          </div>
          <div className="hv-network-candidate-list">
            {data.candidates.slice(1).map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                busy={busyId === `watch:${candidate.id}`}
                onView={() => setSelected(candidate)}
                onWatch={() => void toggleWatch(candidate)}
                onIntro={() => { setIntroTarget(candidate); setIntroReason(activeMission ? `Request an introduction in support of: ${activeMission.objective}` : '') }}
                onInteraction={() => setInteractionTarget(candidate)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="hv-network-coverage" aria-label="Network coverage metadata">
        <div><span>Professionals</span><strong>{data.coverage.professionals}</strong></div>
        <div><span>Service providers</span><strong>{data.coverage.serviceProviders}</strong></div>
        <div><span>Licensed operators</span><strong>{data.coverage.licensedOperators}</strong></div>
        <div><span>Collaborations</span><strong>{data.coverage.collaborations}</strong></div>
      </section>

      {data.activity.length > 0 && (
        <section className="hv-network-activity" aria-labelledby="network-activity-heading">
          <div className="hv-network-section-head"><div><span className="hv-network-section-kicker">ACTIVITY</span><h2 id="network-activity-heading">Relationship history</h2></div></div>
          {data.activity.slice(0, compact ? 4 : 10).map(item => (
            <div className="hv-network-activity-row" key={`${item.kind}-${item.id}`}>
              <span>{label(item.kind)}</span>
              <strong>{item.summary}</strong>
              <small>{item.status ? `${label(item.status)} · ` : ''}{new Date(item.occurredAt).toLocaleDateString()}</small>
            </div>
          ))}
        </section>
      )}

      {missionOpen && (
        <div className="hv-network-modal-backdrop" role="presentation" onMouseDown={() => setMissionOpen(false)}>
          <form className="hv-network-modal" onSubmit={createMission} onMouseDown={event => event.stopPropagation()} aria-label="Create Network mission">
            <div className="hv-network-modal-head"><div><span>NEW MISSION</span><h2>Define a commercial objective</h2></div><button type="button" onClick={() => setMissionOpen(false)} aria-label="Close">×</button></div>
            <label>Name<input value={missionName} onChange={event => setMissionName(event.target.value)} placeholder="Germany importer route" required maxLength={160} /></label>
            <label>Objective<textarea value={missionObjective} onChange={event => setMissionObjective(event.target.value)} placeholder="Identify a qualified importer/distributor for…" required maxLength={2000} rows={4} /></label>
            <div className="hv-network-requirement-builder">
              <strong>Structured requirements</strong>
              <div>
                <select value={requirementType} onChange={event => setRequirementType(event.target.value as DraftRequirement['type'])}>
                  <option value="jurisdiction">Jurisdiction</option>
                  <option value="capability">Capability</option>
                  <option value="licence_activity">Licensed activity</option>
                  <option value="gmp_certified">GMP certified</option>
                  <option value="consultation_available">Consultation available</option>
                </select>
                {!['gmp_certified', 'consultation_available'].includes(requirementType) && <input value={requirementValue} onChange={event => setRequirementValue(event.target.value)} placeholder={requirementType === 'jurisdiction' ? 'DE' : 'Import'} />}
                <button type="button" onClick={addRequirement}>Add</button>
              </div>
              {requirements.length > 0 && <div className="hv-network-requirement-row">{requirements.map(requirement => <button type="button" key={requirement.id} onClick={() => setRequirements(current => current.filter(item => item.id !== requirement.id))}>{requirementLabel(requirement)} ×</button>)}</div>}
            </div>
            <div className="hv-network-modal-actions"><button type="button" className="hv-network-secondary" onClick={() => setMissionOpen(false)}>Cancel</button><button className="hv-network-primary" disabled={busyId === 'mission'}>{busyId === 'mission' ? 'Creating…' : 'Create mission'}</button></div>
          </form>
        </div>
      )}

      {introTarget && (
        <div className="hv-network-modal-backdrop" role="presentation" onMouseDown={() => setIntroTarget(null)}>
          <form className="hv-network-modal" onSubmit={requestIntroduction} onMouseDown={event => event.stopPropagation()} aria-label="Request introduction">
            <div className="hv-network-modal-head"><div><span>CONTROLLED INTRODUCTION</span><h2>{introTarget.name}</h2></div><button type="button" onClick={() => setIntroTarget(null)} aria-label="Close">×</button></div>
            <p className="hv-network-modal-copy">The request enters review before identity/business-context disclosure. An introduction is not represented as complete until the controlled lifecycle reaches introduced.</p>
            <label>Why this introduction matters<textarea value={introReason} onChange={event => setIntroReason(event.target.value)} required maxLength={2000} rows={5} /></label>
            <div className="hv-network-modal-actions"><button type="button" className="hv-network-secondary" onClick={() => setIntroTarget(null)}>Cancel</button><button className="hv-network-primary" disabled={busyId === `intro:${introTarget.id}`}>{busyId === `intro:${introTarget.id}` ? 'Submitting…' : 'Submit request'}</button></div>
          </form>
        </div>
      )}

      {interactionTarget && (
        <div className="hv-network-modal-backdrop" role="presentation" onMouseDown={() => setInteractionTarget(null)}>
          <form className="hv-network-modal" onSubmit={logInteraction} onMouseDown={event => event.stopPropagation()} aria-label="Record interaction">
            <div className="hv-network-modal-head"><div><span>RELATIONSHIP MEMORY</span><h2>{interactionTarget.name}</h2></div><button type="button" onClick={() => setInteractionTarget(null)} aria-label="Close">×</button></div>
            <label>Interaction summary<textarea value={interactionSummary} onChange={event => setInteractionSummary(event.target.value)} required maxLength={4000} rows={5} placeholder="What happened, with whom, and what matters next?" /></label>
            <label>Outcome<input value={interactionOutcome} onChange={event => setInteractionOutcome(event.target.value)} maxLength={1000} placeholder="Optional outcome or next step" /></label>
            <div className="hv-network-modal-actions"><button type="button" className="hv-network-secondary" onClick={() => setInteractionTarget(null)}>Cancel</button><button className="hv-network-primary" disabled={busyId === `interaction:${interactionTarget.id}`}>{busyId === `interaction:${interactionTarget.id}` ? 'Saving…' : 'Record interaction'}</button></div>
          </form>
        </div>
      )}

      {selected && <CandidateDetail candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function CandidateCard({ candidate, featured = false, busy, onView, onWatch, onIntro, onInteraction }: {
  candidate: NetworkCandidateDTO
  featured?: boolean
  busy: boolean
  onView: () => void
  onWatch: () => void
  onIntro: () => void
  onInteraction: () => void
}) {
  return (
    <article className={`hv-network-candidate${featured ? ' is-featured' : ''}`} data-fit={candidate.fit.verdict}>
      <div className="hv-network-candidate-top">
        <div>
          <span>{label(candidate.kind)}{candidate.countryIso2 ? ` · ${candidate.countryIso2}` : ''}</span>
          <h3>{candidate.name}</h3>
          {candidate.subtitle && <p>{candidate.subtitle}</p>}
        </div>
        <span className={`hv-network-fit is-${candidate.fit.verdict}`}>{label(candidate.fit.verdict)}</span>
      </div>

      <div className="hv-network-fit-line"><strong>{fitLabel(candidate)}</strong>{candidate.fit.unknown.length > 0 && <span>{candidate.fit.unknown.length} unresolved</span>}</div>

      {candidate.licences.length > 0 && (
        <div className="hv-network-facts">
          <span>Licence: Active</span>
          {candidate.licences[0].licenceClass && <span>{candidate.licences[0].licenceClass}</span>}
          {candidate.licences.some(licence => licence.gmpCertified) && <span>GMP certified</span>}
        </div>
      )}

      <div className="hv-network-relationship">
        <span>Relationship</span>
        <strong>{candidate.relationship.state === 'recorded' ? `${candidate.relationship.interactionCount} recorded interaction${candidate.relationship.interactionCount === 1 ? '' : 's'}` : 'No recorded relationship'}</strong>
      </div>

      {candidate.unknowns.length > 0 && <p className="hv-network-unknown">Unknown: {candidate.unknowns[0]}</p>}
      {candidate.introduction.status && <div className="hv-network-intro-status">Introduction · {label(candidate.introduction.status)}</div>}

      <div className="hv-network-actions">
        <button type="button" onClick={onView}>View</button>
        {candidate.availableActions.includes(candidate.watch.watched ? 'unwatch' : 'watch') && <button type="button" onClick={onWatch} disabled={busy}>{busy ? 'Updating…' : candidate.watch.watched ? 'Unwatch' : 'Watch'}</button>}
        {candidate.availableActions.includes('request_introduction') && <button type="button" className="is-primary" onClick={onIntro}>Request introduction</button>}
        {candidate.availableActions.includes('log_interaction') && <button type="button" onClick={onInteraction}>Log interaction</button>}
      </div>
    </article>
  )
}

function CandidateDetail({ candidate, onClose }: { candidate: NetworkCandidateDTO; onClose: () => void }) {
  return (
    <div className="hv-network-detail-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="hv-network-detail" onMouseDown={event => event.stopPropagation()} aria-label={`${candidate.name} Network detail`}>
        <div className="hv-network-modal-head"><div><span>{label(candidate.kind)} · {candidate.countryIso2 ?? 'Jurisdiction unknown'}</span><h2>{candidate.name}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></div>
        {candidate.summary && <p className="hv-network-detail-summary">{candidate.summary}</p>}
        <section><h3>Mission fit</h3><dl><dt>Status</dt><dd>{label(candidate.fit.verdict)}</dd><dt>Satisfied</dt><dd>{candidate.fit.satisfied.length ? candidate.fit.satisfied.join(' · ') : 'None established'}</dd><dt>Blocked</dt><dd>{candidate.fit.blocked.length ? candidate.fit.blocked.join(' · ') : 'None established'}</dd><dt>Unknown</dt><dd>{candidate.fit.unknown.length ? candidate.fit.unknown.join(' · ') : 'None'}</dd></dl></section>
        <section><h3>Evidence and verification</h3>{candidate.evidenceSummary.map((item, index) => <div className="hv-network-evidence" key={`${item.label}-${index}`}><strong>{item.label}</strong><span>{label(item.status)}{item.verifiedAt ? ` · ${new Date(item.verifiedAt).toLocaleDateString()}` : ' · verification date unavailable'}</span></div>)}</section>
        {candidate.licences.length > 0 && <section><h3>Active licence projection</h3>{candidate.licences.map((licence, index) => <div className="hv-network-evidence" key={`${licence.licenceClass}-${index}`}><strong>{licence.licenceClass || 'Licence class not supplied'}</strong><span>{[licence.issuingRegulator, ...licence.authorizedActivities].filter(Boolean).join(' · ') || 'Authorized activity detail unavailable'}</span></div>)}</section>}
        <section><h3>Relationship</h3><dl><dt>State</dt><dd>{candidate.relationship.state === 'recorded' ? 'Recorded' : 'No recorded relationship'}</dd><dt>Interactions</dt><dd>{candidate.relationship.interactionCount}</dd><dt>Last interaction</dt><dd>{candidate.relationship.lastInteractionAt ? new Date(candidate.relationship.lastInteractionAt).toLocaleDateString() : 'None recorded'}</dd></dl></section>
        {(candidate.unknowns.length > 0 || candidate.warnings.length > 0) && <section><h3>Unknowns and cautions</h3>{[...candidate.unknowns, ...candidate.warnings].map(item => <p className="hv-network-unknown" key={item}>{item}</p>)}</section>}
      </aside>
    </div>
  )
}
