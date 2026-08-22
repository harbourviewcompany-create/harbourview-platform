'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { parseEducationCountry, type EducationCommandModule, type EducationCommandResponse, type EducationCommandView, type EducationGoal } from '@/lib/education/command'
import type { MobileCommandCentreProps } from '../props'
import type { SectionId } from '../contracts'
import { SectionShell, type SectionRef } from '../SectionUI'
import { HarbourviewCard } from '@/components/ui/HarbourviewPanel'
import styles from './EducationCommandSection.module.css'

type EducationTile = MobileCommandCentreProps['eduCategories'][number] | NonNullable<MobileCommandCentreProps['liveTiles']>[number]

type Props = {
  sectionRef: SectionRef
  roleShort: string
  tiles: EducationTile[]
  commandHref: (section: SectionId, params?: Record<string, string>) => string
}

type LoadState = 'loading' | 'loaded' | 'permission' | 'error'

const VIEWS: Array<{ id: EducationCommandView; label: string }> = [
  { id: 'now', label: 'Now' },
  { id: 'paths', label: 'Paths' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'practice', label: 'Practice' },
  { id: 'library', label: 'Library' },
]

const GOALS: Array<{ id: 'all' | EducationGoal; label: string }> = [
  { id: 'all', label: 'All goals' },
  { id: 'market_access', label: 'Enter a market' },
  { id: 'quality', label: 'Quality readiness' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'learn', label: 'Learn' },
]

const EVIDENCE_LABEL: Record<EducationCommandModule['evidenceState'], string> = {
  current: 'Current',
  stale: 'Stale',
  conflicting: 'Conflicting',
  review_required: 'Review required',
  unknown: 'Currentness unknown',
}

function validView(value: string | null): EducationCommandView {
  return VIEWS.some(view => view.id === value) ? value as EducationCommandView : 'now'
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function fallbackTitle(tile: EducationTile): string {
  const value = (tile as { title?: unknown }).title
  return typeof value === 'string' && value.trim() ? value : 'Published learning module'
}

function fallbackDescription(tile: EducationTile): string {
  const row = tile as { desc?: unknown; description?: unknown }
  const value = typeof row.desc === 'string' ? row.desc : typeof row.description === 'string' ? row.description : ''
  return value.trim() || 'Published Harbourview education content.'
}

function fallbackSlug(tile: EducationTile): string {
  const value = (tile as { slug?: unknown }).slug
  return typeof value === 'string' && value.trim() ? value : 'overview'
}

function Status({ state }: { state: EducationCommandModule['evidenceState'] }) {
  return <span className={`${styles.status} ${styles[`status_${state}`]}`}>{EVIDENCE_LABEL[state]}</span>
}

function ModuleCard({ module, commandHref }: { module: EducationCommandModule; commandHref: Props['commandHref'] }) {
  const verifiedDate = formatDate(module.lastReviewedAt)
  return (
    <HarbourviewCard tone="default" className={styles.moduleCard} data-education-module={module.slug}>
      <div className={styles.cardTopline}>
        <span>{module.trackLabel}</span>
        <Status state={module.evidenceState} />
      </div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <div className={styles.metaRow}>
        {module.jurisdictionMatch ? <span>Jurisdiction matched</span> : <span>General / role scope</span>}
        {verifiedDate ? <span>Reviewed {verifiedDate}</span> : <span>Review date unavailable</span>}
      </div>
      {module.overlayTopics.length > 0 ? (
        <div className={styles.topicRow} aria-label="Jurisdiction topics">
          {module.overlayTopics.slice(0, 4).map(topic => <span key={topic}>{topic}</span>)}
        </div>
      ) : null}
      <div className={styles.actions}>
        <Link href={commandHref('education', { module: module.slug, educationView: 'library' })} className={styles.primaryAction}>
          Open module
        </Link>
        {module.goal === 'market_access' ? <Link href={commandHref('jurisdiction')} className={styles.secondaryAction}>Return to route</Link> : null}
        {module.goal === 'regulatory' ? <Link href={commandHref('regulatory')} className={styles.secondaryAction}>Regulatory watch</Link> : null}
        {module.goal === 'quality' ? <Link href={commandHref('compliance')} className={styles.secondaryAction}>Compliance</Link> : null}
      </div>
    </HarbourviewCard>
  )
}

export function EducationSection({ sectionRef, roleShort, tiles, commandHref }: Props) {
  const searchParams = useSearchParams()
  const country = parseEducationCountry(searchParams.get('country'))
  const role = searchParams.get('role')
  const selectedModuleSlug = searchParams.get('module')
  const [view, setView] = useState<EducationCommandView>(() => validView(searchParams.get('educationView')))
  const [goal, setGoal] = useState<'all' | EducationGoal>('all')
  const [query, setQuery] = useState('')
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [data, setData] = useState<EducationCommandResponse | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  useEffect(() => {
    if (selectedModuleSlug) setView('library')
  }, [selectedModuleSlug])

  const load = useCallback(async (signal: AbortSignal) => {
    setLoadState('loading')
    try {
      if (!country) {
        setLoadState('error')
        setData(null)
        return
      }
      const params = new URLSearchParams({ country })
      if (role) params.set('role', role)
      const response = await fetch(`/api/dashboard/education-command?${params.toString()}`, {
        credentials: 'same-origin',
        signal,
        headers: { Accept: 'application/json' },
      })
      if (response.status === 401 || response.status === 403) {
        setLoadState('permission')
        setData(null)
        return
      }
      if (!response.ok) throw new Error(`Education Command returned ${response.status}`)
      const payload = await response.json() as EducationCommandResponse
      setData(payload)
      setLoadState('loaded')
    } catch (error) {
      if (signal.aborted) return
      console.error('[EducationCommand] load failed:', error)
      setLoadState('error')
      setData(null)
    }
  }, [country, role])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load, retryNonce])

  const filteredModules = useMemo(() => {
    if (!data) return []
    const normalized = query.trim().toLowerCase()
    return data.modules.filter(module => {
      if (goal !== 'all' && module.goal !== goal) return false
      if (!normalized) return true
      const haystack = `${module.title} ${module.description} ${module.trackLabel} ${module.overlayTopics.join(' ')}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [data, goal, query])

  const selectedModule = data?.modules.find(module => module.slug === selectedModuleSlug) ?? null
  const attentionModules = data?.modules.filter(module => module.evidenceState !== 'current') ?? []
  const operationalPath = data?.paths.find(path => path.kind === 'operational_pathway') ?? null

  const fallbackLibrary = (
    <div className={styles.stack}>
      <div className={styles.stateCard}>
        <strong>Live Education Command unavailable</strong>
        <p>The richer command projection could not be loaded. Published module links remain available below without qualification or currentness claims.</p>
      </div>
      {tiles.map((tile, index) => (
        <article className={styles.moduleCard} key={`${fallbackSlug(tile)}-${index}`}>
          <div className={styles.cardTopline}><span>Published module</span><span className={styles.status}>Metadata unavailable</span></div>
          <h3>{fallbackTitle(tile)}</h3>
          <p>{fallbackDescription(tile)}</p>
          <Link href={commandHref('education', { module: fallbackSlug(tile), educationView: 'library' })} className={styles.primaryAction}>Open module</Link>
        </article>
      ))}
    </div>
  )

  return (
    <SectionShell
      id="education"
      sectionRef={sectionRef}
      eyebrow="Context / education command"
      title="Education Command"
      description={`${roleShort} · Learn what changed, resolve knowledge gaps, inspect evidence and return directly to the work.`}
    >
      <div className={styles.command} data-testid="education-command">
        <nav className={styles.tabs} aria-label="Education Command views">
          {VIEWS.map(item => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? styles.tabActive : styles.tab}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {loadState === 'loading' ? (
          <div className={styles.stateCard} aria-live="polite" data-testid="education-loading">
            <strong>Loading live education context…</strong>
            <p>Checking published modules, jurisdiction overlays, regulatory changes and supported pathway evidence.</p>
          </div>
        ) : null}

        {loadState === 'permission' ? (
          <div className={styles.stateCard} role="status" data-testid="education-permission">
            <strong>Education Command requires authenticated access</strong>
            <p>No education intelligence or organization evidence is shown without an authenticated session.</p>
          </div>
        ) : null}

        {loadState === 'error' ? (
          <div className={styles.stack} data-testid="education-error">
            <div className={styles.stateCard} role="alert">
              <strong>{country ? 'Education Command could not load' : 'Select a market to load Education Command'}</strong>
              <p>{country
                ? 'Live context is unavailable. Retry without losing the selected market or role.'
                : 'Education Command does not invent a default jurisdiction. Choose a country in Command, then return here.'}</p>
              {country ? (
                <button type="button" className={styles.primaryAction} onClick={() => setRetryNonce(value => value + 1)}>Retry</button>
              ) : null}
            </div>
            {fallbackLibrary}
          </div>
        ) : null}

        {loadState === 'loaded' && data ? (
          <>
            <div className={styles.contextBar}>
              <div><span>Market</span><strong>{data.context.countryLabel}</strong></div>
              <div><span>Role</span><strong>{data.context.roleLabel}</strong></div>
              <div><span>Source state</span><strong>{data.sourceState === 'loaded' ? 'Live' : data.sourceState === 'degraded' ? 'Degraded' : 'No modules'}</strong></div>
            </div>

            {data.sourceState === 'degraded' ? (
              <div className={styles.warning} data-testid="education-degraded">
                <strong>Some education sources are degraded.</strong>
                <span>Available records are shown; unavailable fields are not inferred.</span>
              </div>
            ) : null}

            {view === 'now' ? (
              <div className={styles.stack} data-testid="education-now">
                <div className={styles.summaryGrid}>
                  <button type="button" onClick={() => setView('now')}><strong>{data.impacts.length}</strong><span>Relevant changes</span></button>
                  <button type="button" onClick={() => setView('library')}><strong>{attentionModules.length}</strong><span>Currentness flags</span></button>
                  <button type="button" onClick={() => setView('paths')}><strong>{data.paths.length}</strong><span>Available paths</span></button>
                </div>

                <div className={styles.sectionHeading}>
                  <div><span>What changed</span><h3>Changes in this operating context</h3></div>
                  <Link href={commandHref('regulatory')}>Open regulatory watch →</Link>
                </div>

                {data.impacts.length > 0 ? data.impacts.map(impact => (
                  <article className={styles.impactCard} key={impact.id}>
                    <div className={styles.cardTopline}>
                      <span>{impact.kind === 'regulatory_change' ? 'Jurisdiction change' : 'Regulatory signal'}</span>
                      {impact.confidence != null ? <span>Confidence {Math.round(impact.confidence)}%</span> : null}
                    </div>
                    <h3>{impact.title}</h3>
                    <div className={styles.impactBlock}><span>What changed</span><p>{impact.whatChanged}</p></div>
                    <div className={styles.impactBlock}><span>Why it matters</span><p>{impact.whyItMatters || 'The source record does not contain a verified commercial-impact statement.'}</p></div>
                    <div className={styles.impactBlock}><span>What do I need to do?</span><p>{impact.recommendedAction || 'No source-backed operator action is attached to this change. Review the evidence before acting.'}</p></div>
                    <div className={styles.metaRow}>
                      {impact.sourceLabel ? <span>{impact.sourceLabel}</span> : <span>Source label unavailable</span>}
                      {formatDate(impact.occurredAt) ? <span>{formatDate(impact.occurredAt)}</span> : null}
                    </div>
                    {impact.moduleSlug ? (
                      <Link href={commandHref('education', { module: impact.moduleSlug, educationView: 'library' })} className={styles.secondaryAction}>
                        Open related learning · topic match
                      </Link>
                    ) : null}
                  </article>
                )) : (
                  <div className={styles.stateCard} data-testid="education-empty-changes">
                    <strong>No verified change items loaded</strong>
                    <p>This is not interpreted as “nothing changed.” Open Regulatory watch for the broader source stream.</p>
                  </div>
                )}

                <div className={styles.sectionHeading}><div><span>Requires attention</span><h3>Evidence and currentness</h3></div></div>
                {attentionModules.length > 0 ? attentionModules.slice(0, 4).map(module => (
                  <ModuleCard module={module} commandHref={commandHref} key={module.id} />
                )) : (
                  <div className={styles.stateCard}><strong>No module currentness flags</strong><p>Only modules with source-backed review metadata can be positively marked current.</p></div>
                )}

                <div className={styles.sectionHeading}><div><span>Do next</span><h3>Continue into the work</h3></div></div>
                <div className={styles.actionGrid}>
                  <Link href={commandHref('jurisdiction')}>Build / inspect route<span>Market-access dependencies →</span></Link>
                  <Link href={commandHref('compliance')}>Check compliance<span>Quality and readiness →</span></Link>
                  <button type="button" onClick={() => setView('practice')}>Practice<span>Available scenarios and exercises →</span></button>
                </div>
              </div>
            ) : null}

            {view === 'paths' ? (
              <div className={styles.stack} data-testid="education-paths">
                <div className={styles.goalScroller} aria-label="Learning goal">
                  {GOALS.map(item => <button type="button" key={item.id} onClick={() => setGoal(item.id)} className={goal === item.id ? styles.goalActive : styles.goal}>{item.label}</button>)}
                </div>

                {data.context.allRoles ? (
                  <div className={styles.infoCard}>
                    <strong>All roles is an aggregate view</strong>
                    <p>Role-scoped and general published learning stays visible. Select a role to add role-specific organization pathway evidence; no role is silently assumed.</p>
                  </div>
                ) : null}

                {operationalPath && (goal === 'all' || goal === 'market_access') ? (
                  <article className={styles.pathCard}>
                    <div className={styles.cardTopline}><span>Operational dependency path</span><span>Evidence state, not qualification</span></div>
                    <h3>{operationalPath.title}</h3>
                    <p>{operationalPath.description}</p>
                    <div className={styles.steps}>
                      {operationalPath.steps.map(step => (
                        <div className={styles.step} key={step.id}>
                          <div><span>{String(step.order).padStart(2, '0')}</span><strong>{step.title}</strong><em>{step.state.replace('_', ' ')}</em></div>
                          {step.requirements.length > 0 ? (
                            <ul>{step.requirements.map(requirement => <li key={requirement.id}><span>{requirement.title}</span><strong>{requirement.state.replace('_', ' ')}</strong></li>)}</ul>
                          ) : <p>No requirement records attached.</p>}
                        </div>
                      ))}
                    </div>
                    <Link href={commandHref('jurisdiction')} className={styles.primaryAction}>Open full market-access route</Link>
                  </article>
                ) : null}

                {data.paths.filter(path => path.kind === 'education_track' && (goal === 'all' || path.goal === goal)).map(path => (
                  <article className={styles.pathCard} key={path.id}>
                    <div className={styles.cardTopline}><span>Published learning path</span><span>{path.modules.length} modules</span></div>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                    <div className={styles.pathModules}>
                      {path.modules.map(slug => {
                        const mod = data.modules.find(item => item.slug === slug)
                        return mod ? <Link key={slug} href={commandHref('education', { module: slug, educationView: 'library' })}>{mod.title}<span>{EVIDENCE_LABEL[mod.evidenceState]} →</span></Link> : null
                      })}
                    </div>
                  </article>
                ))}

                {data.paths.filter(path => path.kind === 'education_track' && (goal === 'all' || path.goal === goal)).length === 0 && !(operationalPath && (goal === 'all' || goal === 'market_access')) ? (
                  <div className={styles.stateCard} data-testid="education-no-path-match"><strong>No path matches this goal</strong><p>Change the goal filter; the system does not synthesize an unsupported pathway.</p></div>
                ) : null}
              </div>
            ) : null}

            {view === 'qualifications' ? (
              <div className={styles.stack} data-testid="education-qualifications">
                <div className={styles.infoCard}>
                  <strong>Competency is not the same as content completion</strong>
                  <p>{data.capabilities.explanation}</p>
                </div>
                <div className={styles.capabilityList}>
                  <div><span>Learner progress</span><strong>{data.capabilities.learnerProgress ? 'Connected' : 'Not connected'}</strong></div>
                  <div><span>Assessment attempts</span><strong>{data.capabilities.assessmentAttempts ? 'Connected' : 'Not connected'}</strong></div>
                  <div><span>Qualifications</span><strong>{data.capabilities.qualificationRecords ? 'Connected' : 'Not assessed'}</strong></div>
                  <div><span>Credentials</span><strong>{data.capabilities.credentialRecords ? 'Connected' : 'Not connected'}</strong></div>
                  <div><span>Team qualification matrix</span><strong>{data.capabilities.teamQualificationMatrix ? 'Connected' : 'Not connected'}</strong></div>
                  <div><span>Organization pathway evidence</span><strong>{data.capabilities.organizationPathwayProgress ? 'Available' : 'No saved evidence state'}</strong></div>
                </div>
                {operationalPath ? (
                  <article className={styles.pathCard}>
                    <div className={styles.cardTopline}><span>Organization / market readiness</span><span>Separate from learner competency</span></div>
                    <h3>{operationalPath.title}</h3>
                    <p>These are existing requirement evidence states. They are not course completions, certifications or proof that a person is qualified.</p>
                    <Link href={commandHref('jurisdiction')} className={styles.primaryAction}>Inspect readiness evidence</Link>
                  </article>
                ) : null}
                <div className={styles.stateCard}>
                  <strong>Retraining trigger state: not connected</strong>
                  <p>The repository contains review/currentness metadata, but no learner qualification lineage that safely supports automatic retraining assignments yet.</p>
                </div>
              </div>
            ) : null}

            {view === 'practice' ? (
              <div className={styles.stack} data-testid="education-practice">
                {data.practice.length > 0 ? data.practice.map(item => (
                  <article className={styles.practiceCard} key={item.id}>
                    <div className={styles.cardTopline}><span>{item.kind}</span><span>{item.moduleTitle}</span></div>
                    <h3>{item.heading}</h3>
                    <p>{item.body}</p>
                    <Link href={commandHref('education', { module: item.moduleSlug, educationView: 'library' })} className={styles.primaryAction}>Open in module</Link>
                  </article>
                )) : (
                  <div className={styles.stateCard} data-testid="education-empty-practice">
                    <strong>No scenario or assessment engine is connected</strong>
                    <p>Practice only appears when a published module contains an explicit scenario, exercise, checklist, assessment or practice section. No simulation is fabricated from prose.</p>
                  </div>
                )}
              </div>
            ) : null}

            {view === 'library' ? (
              <div className={styles.stack} data-testid="education-library">
                {selectedModule ? (
                  <article className={styles.moduleDetail}>
                    <div className={styles.cardTopline}><span>{selectedModule.trackLabel}</span><Status state={selectedModule.evidenceState} /></div>
                    <h3>{selectedModule.title}</h3>
                    <p>{selectedModule.description}</p>
                    <div className={styles.evidenceGrid}>
                      <div><span>Audience</span><strong>{selectedModule.audience.length ? selectedModule.audience.join(', ').replaceAll('_', ' ') : 'Not specified'}</strong></div>
                      <div><span>Jurisdiction</span><strong>{selectedModule.jurisdictionMatch ? data.context.countryLabel : 'No verified country overlay'}</strong></div>
                      <div><span>Review status</span><strong>{selectedModule.reviewStatus?.replaceAll('_', ' ') || 'Not available'}</strong></div>
                      <div><span>Last reviewed</span><strong>{formatDate(selectedModule.lastReviewedAt) || 'Not available'}</strong></div>
                      <div><span>Next review</span><strong>{formatDate(selectedModule.nextReviewDueAt) || 'Not available'}</strong></div>
                      <div><span>Confidence</span><strong>{selectedModule.publicationConfidence || 'Not available'}</strong></div>
                    </div>
                    {selectedModule.sections.length > 0 ? selectedModule.sections.map((section, index) => (
                      <section className={styles.moduleSection} key={`${selectedModule.id}:${index}`}>
                        <span>{String(index + 1).padStart(2, '0')}</span><div><h4>{section.heading}</h4><p>{section.body}</p></div>
                      </section>
                    )) : <div className={styles.stateCard}><strong>Module outline unavailable</strong><p>The published record has no loaded section content.</p></div>}
                    <div className={styles.actions}>
                      <Link href={commandHref('education', { educationView: 'library' })} className={styles.secondaryAction}>Back to library</Link>
                      {selectedModule.goal === 'market_access' ? <Link href={commandHref('jurisdiction')} className={styles.primaryAction}>Return to route</Link> : null}
                    </div>
                  </article>
                ) : (
                  <>
                    <div className={styles.libraryControls}>
                      <label><span>Search published learning</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="GMP, export, pharmacy…" /></label>
                      <div className={styles.goalScroller}>{GOALS.map(item => <button type="button" key={item.id} onClick={() => setGoal(item.id)} className={goal === item.id ? styles.goalActive : styles.goal}>{item.label}</button>)}</div>
                    </div>
                    {filteredModules.length > 0 ? filteredModules.map(module => <ModuleCard key={module.id} module={module} commandHref={commandHref} />) : (
                      <div className={styles.stateCard} data-testid="education-no-match"><strong>No published learning matches</strong><p>Clear the search or goal filter. No replacement modules are inferred.</p></div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            <details className={styles.limitations}>
              <summary>Coverage and capability limits</summary>
              <ul>{data.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul>
            </details>
          </>
        ) : null}
      </div>
    </SectionShell>
  )
}
