'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import type { TalentCandidateDTO, TalentJobDTO, TalentJobSearchResponse, TalentPeopleSearchResponse } from '@/lib/talent/contracts'
import styles from './TalentSection.module.css'

type Mode = 'jobs' | 'people'
type LoadState = 'loading' | 'loaded' | 'empty' | 'no_match' | 'degraded' | 'permission' | 'auth' | 'error'

type Props = {
  sectionRef: RefObject<HTMLElement | null>
  records?: unknown[]
  commandHref?: (section: string) => string
}

function contextCountry(params: ReturnType<typeof useSearchParams>) {
  const raw = params.get('country')?.trim().toUpperCase() ?? ''
  return /^[A-Z]{2}/.test(raw) ? raw.slice(0, 2) : null
}

function formatFreshness(job: TalentJobDTO) {
  if (job.lastConfirmedAt) {
    const ms = Date.now() - Date.parse(job.lastConfirmedAt)
    if (Number.isFinite(ms) && ms >= 0) {
      const hours = Math.floor(ms / 3_600_000)
      if (hours < 1) return 'Checked <1h ago'
      if (hours < 48) return `Checked ${hours}h ago`
      return `Checked ${Math.floor(hours / 24)}d ago`
    }
  }
  return job.freshnessState === 'confirmed' ? 'Confirmed' : job.freshnessState.replaceAll('_', ' ')
}

export function TalentSection({ sectionRef }: Props) {
  const params = useSearchParams()
  const country = contextCountry(params)
  const role = params.get('role')?.trim() || null
  const initialMode = params.get('talentMode') === 'people' ? 'people' : 'jobs'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [query, setQuery] = useState('')
  const [workplace, setWorkplace] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [state, setState] = useState<LoadState>('loading')
  const [jobs, setJobs] = useState<TalentJobDTO[]>([])
  const [people, setPeople] = useState<TalentCandidateDTO[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [retryKey, setRetryKey] = useState(0)

  const contextLabel = useMemo(() => [country, role && role !== 'all' ? role : 'All roles'].filter(Boolean).join(' · '), [country, role])

  const writeMode = useCallback((next: Mode) => {
    setMode(next)
    setQuery('')
    setNextCursor(null)
    const url = new URL(window.location.href)
    url.searchParams.set('talentMode', next)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function resolveWorkspace() {
      if (mode !== 'people') return
      try {
        const response = await fetch('/api/org/me', { cache: 'no-store' })
        if (cancelled) return
        if (response.status === 401) {
          setWorkspaceId(null)
          setWorkspaceName(null)
          setState('auth')
          return
        }
        if (!response.ok) {
          setState('degraded')
          return
        }
        const body = await response.json() as { data?: { active_workspace_id?: string | null; org?: { name?: string | null; trade_name?: string | null; legal_name?: string | null } | null } }
        const id = body.data?.active_workspace_id ?? null
        setWorkspaceId(id)
        setWorkspaceName(body.data?.org?.trade_name || body.data?.org?.name || body.data?.org?.legal_name || null)
        if (!id) setState('permission')
      } catch {
        if (!cancelled) setState('degraded')
      }
    }
    void resolveWorkspace()
    return () => { cancelled = true }
  }, [mode, retryKey])

  const load = useCallback(async (append = false) => {
    const cursor = append ? nextCursor : null
    if (mode === 'people' && !workspaceId) return
    if (!append) setState('loading')

    try {
      if (mode === 'jobs') {
        const search = new URLSearchParams({ limit: '24' })
        if (query.trim()) search.set('q', query.trim())
        if (country) search.set('country', country)
        if (workplace) search.set('workplace', workplace)
        if (verifiedOnly) search.set('verified', '1')
        if (cursor) search.set('cursor', cursor)
        const response = await fetch(`/api/talent/jobs/search?${search.toString()}`, { cache: 'no-store' })
        const body = await response.json() as TalentJobSearchResponse
        if (!response.ok) throw new Error('jobs')
        setJobs(current => append ? [...current, ...body.data] : body.data)
        setNextCursor(body.nextCursor)
        setState(body.state === 'loaded' ? 'loaded' : body.state === 'no_match' ? 'no_match' : body.state === 'degraded' ? 'degraded' : 'empty')
        return
      }

      const response = await fetch('/api/talent/people/search', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId, query: query.trim() || null, country, limit: 24, cursor }),
      })
      if (response.status === 401) { setState('auth'); return }
      if (response.status === 403) { setState('permission'); return }
      const body = await response.json() as TalentPeopleSearchResponse
      if (!response.ok) throw new Error('people')
      setPeople(current => append ? [...current, ...body.data] : body.data)
      setNextCursor(body.nextCursor)
      setState(body.state === 'loaded' ? 'loaded' : body.state === 'no_match' ? 'no_match' : 'empty')
    } catch {
      setState('error')
    }
  }, [mode, workspaceId, query, country, workplace, verifiedOnly, nextCursor])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(false) }, query ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [mode, workspaceId, country, workplace, verifiedOnly, retryKey, query]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleSave(jobId: string) {
    const isSaved = saved.has(jobId)
    const response = await fetch(`/api/talent/jobs/${jobId}/save`, { method: isSaved ? 'DELETE' : 'POST' })
    if (!response.ok) return
    setSaved(current => {
      const next = new Set(current)
      if (isSaved) next.delete(jobId); else next.add(jobId)
      return next
    })
  }

  return (
    <section ref={sectionRef} className="hvm2-section" aria-labelledby="talent-heading" data-talent-production="p0">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Talent intelligence</p>
          <h2 id="talent-heading" className={styles.title}>Talent</h2>
        </div>
        {contextLabel && <span className={styles.context}>{contextLabel}</span>}
      </div>

      <div className={styles.modeSwitch} role="tablist" aria-label="Talent mode">
        <button role="tab" aria-selected={mode === 'jobs'} className={mode === 'jobs' ? styles.activeMode : ''} onClick={() => writeMode('jobs')}>Find jobs</button>
        <button role="tab" aria-selected={mode === 'people'} className={mode === 'people' ? styles.activeMode : ''} onClick={() => writeMode('people')}>Find talent</button>
      </div>

      <label className={styles.searchLabel} htmlFor="talent-search">{mode === 'jobs' ? 'Search roles, companies, skills or markets' : 'Search professionals, capabilities, credentials or markets'}</label>
      <input id="talent-search" className={styles.search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={mode === 'jobs' ? 'e.g. EU-GMP QA, export, pharmacist' : 'e.g. EU-GMP QA with Canada experience'} />

      {mode === 'jobs' && (
        <div className={styles.filters} aria-label="Job filters">
          <select aria-label="Workplace type" value={workplace} onChange={event => setWorkplace(event.target.value)}>
            <option value="">Any workplace</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on_site">On-site</option><option value="flexible">Flexible</option>
          </select>
          <label className={styles.check}><input type="checkbox" checked={verifiedOnly} onChange={event => setVerifiedOnly(event.target.checked)} /> Verified employers</label>
          <span className={styles.sort}>Newest first</span>
        </div>
      )}

      {mode === 'people' && workspaceName && <p className={styles.scope}>Searching as {workspaceName}. Candidate visibility and employer blocks are enforced before retrieval.</p>}

      <div aria-live="polite" className={styles.status}>
        {state === 'loading' && 'Loading Talent…'}
        {state === 'no_match' && 'No records match the current search and filters.'}
        {state === 'empty' && (mode === 'jobs' ? 'No publishable open roles are available in this context.' : 'No discoverable professionals are available in this context.')}
        {state === 'degraded' && 'Talent data is temporarily degraded. Retry to request a fresh read.'}
        {state === 'auth' && 'Sign in to use employer talent search.'}
        {state === 'permission' && (workspaceId ? 'Your active organization does not currently have Talent search authority.' : 'Select or create an organization to use Find talent.')}
        {state === 'error' && 'Talent could not be loaded. Retry when ready.'}
      </div>

      {['degraded','error'].includes(state) && <button className={styles.retry} type="button" onClick={() => setRetryKey(value => value + 1)}>Retry</button>}
      {state === 'auth' && <Link className={styles.actionLink} href="/login?next=%2Fdashboard%3Fsection%3Dtalent">Sign in</Link>}
      {state === 'permission' && !workspaceId && <div className={styles.permissionActions}><Link href="/organization/new?next=%2Fdashboard%3Fsection%3Dtalent">Create organization</Link><Link href="/organization/join?next=%2Fdashboard%3Fsection%3Dtalent">Join organization</Link></div>}

      {mode === 'jobs' && jobs.length > 0 && (
        <div className={styles.results} aria-label="Job search results">
          {jobs.map(job => (
            <article key={job.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div><h3>{job.title}</h3><p>{job.employer.name}{job.locationText ? ` · ${job.locationText}` : ''}</p></div>
                {job.employer.verificationStatus === 'verified' && <span className={styles.verified}>Verified employer</span>}
              </div>
              <div className={styles.tags}>{job.employmentType && <span>{job.employmentType.replaceAll('_',' ')}</span>}{job.workplaceType && <span>{job.workplaceType.replaceAll('_',' ')}</span>}<span>{formatFreshness(job)}</span></div>
              <div className={styles.actions}><Link href={`/talent/${job.id}`}>View role</Link><button type="button" onClick={() => void toggleSave(job.id)}>{saved.has(job.id) ? 'Saved' : 'Save'}</button></div>
            </article>
          ))}
        </div>
      )}

      {mode === 'people' && people.length > 0 && (
        <div className={styles.results} aria-label="Talent search results">
          {people.map(person => (
            <article key={person.personId} className={styles.card}>
              <div className={styles.cardTop}><div><h3>{person.displayName || 'Confidential professional'}</h3><p>{person.headline || 'Professional profile'}{person.countryIso2 ? ` · ${person.countryIso2}` : ''}</p></div><span className={styles.discovery}>{person.visibilityMode === 'public' ? 'Public' : 'Permissioned'}</span></div>
              {person.capabilities.length > 0 && <div className={styles.tags}>{person.capabilities.slice(0,4).map(value => <span key={value}>{value}</span>)}</div>}
              {person.credentials.length > 0 && <p className={styles.evidence}>Credential labels: {person.credentials.slice(0,3).join(' · ')}</p>}
              <p className={styles.evidence}>{person.verificationSummary}</p>
            </article>
          ))}
        </div>
      )}

      {nextCursor && state === 'loaded' && <button className={styles.loadMore} type="button" onClick={() => void load(true)}>Load more</button>}
    </section>
  )
}
