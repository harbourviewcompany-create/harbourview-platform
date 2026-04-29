'use client'

import { useEffect, useMemo, useState } from 'react'
import { agentRoles, controlRules, missionStages, promptPacks } from '@/lib/mission-control'

type MissionStatus = 'Draft' | 'Assigned' | 'Returned' | 'Audited' | 'Approved' | 'Executed'
type AgentKey = 'ChatGPT' | 'Claude' | 'Perplexity' | 'Gemini'

type AgentOutput = {
  agent: AgentKey
  output: string
  verdict: string
  blockers: string
  confidence: string
  provider: string
  model: string
  updatedAt: string
}

type Mission = {
  id: string
  title: string
  objective: string
  successCondition: string
  constraints: string
  sourceMaterial: string
  status: MissionStatus
  outputs: Record<AgentKey, AgentOutput>
  acceptedFindings: string
  rejectedFindings: string
  contradictions: string
  finalDecision: string
  nextAction: string
  createdAt: string
  updatedAt: string
}

type DispatchResponse = {
  ok: boolean
  output?: string
  blocker?: string
  provider?: string
  model?: string
  missingEnv?: string
}

const statuses: MissionStatus[] = ['Draft', 'Assigned', 'Returned', 'Audited', 'Approved', 'Executed']
const agents: AgentKey[] = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini']
const storageKey = 'harbourview-mission-control-v1'

function emptyOutput(agent: AgentKey): AgentOutput {
  return { agent, output: '', verdict: '', blockers: '', confidence: '', provider: '', model: '', updatedAt: '' }
}

function createEmptyMission(): Mission {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'New Mission',
    objective: '',
    successCondition: '',
    constraints: '',
    sourceMaterial: '',
    status: 'Draft',
    outputs: {
      ChatGPT: emptyOutput('ChatGPT'),
      Claude: emptyOutput('Claude'),
      Perplexity: emptyOutput('Perplexity'),
      Gemini: emptyOutput('Gemini'),
    },
    acceptedFindings: '',
    rejectedFindings: '',
    contradictions: '',
    finalDecision: '',
    nextAction: '',
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeMission(raw: Mission): Mission {
  return {
    ...createEmptyMission(),
    ...raw,
    outputs: {
      ChatGPT: { ...emptyOutput('ChatGPT'), ...(raw.outputs?.ChatGPT || {}) },
      Claude: { ...emptyOutput('Claude'), ...(raw.outputs?.Claude || {}) },
      Perplexity: { ...emptyOutput('Perplexity'), ...(raw.outputs?.Perplexity || {}) },
      Gemini: { ...emptyOutput('Gemini'), ...(raw.outputs?.Gemini || {}) },
    },
  }
}

function buildMissionPrompt(mission: Mission, agent: AgentKey) {
  const promptPack = promptPacks.find((pack) => pack.target === agent)
  const role = agentRoles.find((item) => item.name === agent)

  return `${promptPack?.prompt || ''}

HARBOURVIEW MISSION CONTEXT
Mission title: ${mission.title || 'Untitled mission'}
Objective: ${mission.objective || 'Not provided'}
Success condition: ${mission.successCondition || 'Not provided'}
Constraints: ${mission.constraints || 'None provided'}
Source material: ${mission.sourceMaterial || 'None provided'}
Agent role: ${role?.role || agent}

NON-NEGOTIABLES
- Do not assume missing facts.
- State blockers explicitly.
- Make the output usable by the next agent.
- Sign off as: ${agent}.
`
}

function statusIndex(status: MissionStatus) {
  return statuses.indexOf(status)
}

export function MissionControlClient() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('Claude')
  const [copied, setCopied] = useState('')
  const [loadingAgent, setLoadingAgent] = useState<AgentKey | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as Mission[]).map(normalizeMission)
        setMissions(parsed)
        setSelectedId(parsed[0]?.id || '')
        return
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    const starter = createEmptyMission()
    starter.title = 'Harbourview Chatbot Hub Build'
    starter.objective = 'Build a controlled hub between ChatGPT, Claude, Perplexity and Gemini for programming, app development and operator-grade execution work.'
    starter.successCondition = 'Tyler can create a mission, generate exact agent prompts, dispatch configured agents, collect outputs, audit contradictions, approve a final decision and track execution state.'
    starter.constraints = 'Do not start with full autonomous agents. Do not hand Tyler tasks that ChatGPT can do directly. Prioritize controlled orchestration, auditability and fast execution.'
    starter.status = 'Assigned'
    setMissions([starter])
    setSelectedId(starter.id)
  }, [])

  useEffect(() => {
    if (missions.length) {
      window.localStorage.setItem(storageKey, JSON.stringify(missions))
    }
  }, [missions])

  const mission = useMemo(
    () => missions.find((item) => item.id === selectedId) || missions[0],
    [missions, selectedId],
  )

  const selectedPrompt = mission ? buildMissionPrompt(mission, selectedAgent) : ''

  function updateMission(patch: Partial<Mission>) {
    if (!mission) return
    const updatedAt = new Date().toISOString()
    setMissions((current) =>
      current.map((item) => (item.id === mission.id ? { ...item, ...patch, updatedAt } : item)),
    )
  }

  function updateOutput(agent: AgentKey, patch: Partial<AgentOutput>) {
    if (!mission) return
    const updatedAt = new Date().toISOString()
    updateMission({
      status: statusIndex(mission.status) < statusIndex('Returned') ? 'Returned' : mission.status,
      outputs: {
        ...mission.outputs,
        [agent]: { ...mission.outputs[agent], ...patch, updatedAt },
      },
    })
  }

  function createMission() {
    const next = createEmptyMission()
    setMissions((current) => [next, ...current])
    setSelectedId(next.id)
  }

  function duplicateMission() {
    if (!mission) return
    const now = new Date().toISOString()
    const copy = { ...mission, id: crypto.randomUUID(), title: `${mission.title} copy`, createdAt: now, updatedAt: now }
    setMissions((current) => [copy, ...current])
    setSelectedId(copy.id)
  }

  function deleteMission() {
    if (!mission) return
    const remaining = missions.filter((item) => item.id !== mission.id)
    setMissions(remaining)
    setSelectedId(remaining[0]?.id || '')
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(selectedPrompt)
    setCopied(selectedAgent)
    window.setTimeout(() => setCopied(''), 1300)
  }

  async function dispatchAgent(agent: AgentKey) {
    if (!mission) return

    setLoadingAgent(agent)
    updateOutput(agent, { blockers: '', verdict: 'Running', confidence: '' })

    try {
      const response = await fetch('/api/mission-control/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, prompt: buildMissionPrompt(mission, agent) }),
      })

      const data = (await response.json()) as DispatchResponse

      updateOutput(agent, {
        output: data.output || '',
        blockers: data.blocker || '',
        verdict: data.ok ? 'Returned' : 'Blocked',
        confidence: data.ok ? 'Provider returned response' : data.missingEnv ? `Missing ${data.missingEnv}` : 'Dispatch failed',
        provider: data.provider || '',
        model: data.model || '',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown bridge failure.'
      updateOutput(agent, {
        output: '',
        blockers: message,
        verdict: 'Blocked',
        confidence: 'Client dispatch failed',
      })
    } finally {
      setLoadingAgent(null)
    }
  }

  async function dispatchAll() {
    for (const agent of agents) {
      await dispatchAgent(agent)
    }
  }

  if (!mission) {
    return (
      <section className="hv-section">
        <button className="mc-button mc-button-primary" onClick={createMission}>Create first mission</button>
      </section>
    )
  }

  const completedOutputs = agents.filter((agent) => mission.outputs[agent].output.trim()).length
  const blockedOutputs = agents.filter((agent) => mission.outputs[agent].blockers.trim()).length

  return (
    <div className="mc-shell">
      <section className="mc-hero">
        <div>
          <span className="mc-kicker">Harbourview Mission Control</span>
          <h1>Chatbot orchestration hub</h1>
          <p>
            Create the mission once, generate exact prompts, dispatch configured agents, collect outputs, audit contradictions and lock the final decision.
          </p>
        </div>
        <div className="mc-hero-actions">
          <button className="mc-button mc-button-primary" onClick={createMission}>New mission</button>
          <button className="mc-button" onClick={duplicateMission}>Duplicate</button>
          <button className="mc-button mc-button-danger" onClick={deleteMission}>Delete</button>
        </div>
      </section>

      <section className="mc-grid mc-grid-main">
        <aside className="mc-panel mc-sidebar">
          <h2>Missions</h2>
          <div className="mc-mission-list">
            {missions.map((item) => (
              <button
                key={item.id}
                className={item.id === mission.id ? 'mc-mission active' : 'mc-mission'}
                onClick={() => setSelectedId(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.status}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="mc-stack">
          <section className="mc-panel">
            <div className="mc-panel-head">
              <div>
                <span className="mc-kicker">Mission brief</span>
                <h2>Define the work once</h2>
              </div>
              <select value={mission.status} onChange={(event) => updateMission({ status: event.target.value as MissionStatus })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="mc-form-grid">
              <label>
                Mission title
                <input value={mission.title} onChange={(event) => updateMission({ title: event.target.value })} />
              </label>
              <label>
                Success condition
                <input value={mission.successCondition} onChange={(event) => updateMission({ successCondition: event.target.value })} />
              </label>
              <label className="mc-span">
                Objective
                <textarea value={mission.objective} onChange={(event) => updateMission({ objective: event.target.value })} />
              </label>
              <label>
                Constraints
                <textarea value={mission.constraints} onChange={(event) => updateMission({ constraints: event.target.value })} />
              </label>
              <label>
                Source material / links / repo notes
                <textarea value={mission.sourceMaterial} onChange={(event) => updateMission({ sourceMaterial: event.target.value })} />
              </label>
            </div>
          </section>

          <section className="mc-panel">
            <div className="mc-panel-head">
              <div>
                <span className="mc-kicker">Agent bridge</span>
                <h2>Run configured agents</h2>
              </div>
              <div className="mc-score">{completedOutputs}/4 returned · {blockedOutputs} blocked</div>
            </div>
            <div className="mc-agent-tabs">
              {agents.map((agent) => (
                <button key={agent} className={agent === selectedAgent ? 'active' : ''} onClick={() => setSelectedAgent(agent)}>{agent}</button>
              ))}
            </div>
            <pre className="mc-prompt">{selectedPrompt}</pre>
            <div className="mc-approval-row">
              <button className="mc-button mc-button-primary" onClick={() => dispatchAgent(selectedAgent)} disabled={loadingAgent !== null}>
                {loadingAgent === selectedAgent ? `Running ${selectedAgent}` : `Run ${selectedAgent}`}
              </button>
              <button className="mc-button" onClick={dispatchAll} disabled={loadingAgent !== null}>
                {loadingAgent ? `Running ${loadingAgent}` : 'Run all configured'}
              </button>
              <button className="mc-button" onClick={copyPrompt}>{copied ? `Copied ${copied}` : 'Copy prompt'}</button>
            </div>
          </section>

          <section className="mc-panel">
            <div className="mc-panel-head">
              <div>
                <span className="mc-kicker">Output intake</span>
                <h2>Agent returns</h2>
              </div>
            </div>
            <div className="mc-output-grid">
              {agents.map((agent) => {
                const output = mission.outputs[agent]
                return (
                  <article key={agent} className="mc-output-card">
                    <h3>{agent}</h3>
                    {(output.provider || output.model) && <small>{output.provider} {output.model}</small>}
                    <input placeholder="Verdict" value={output.verdict} onChange={(event) => updateOutput(agent, { verdict: event.target.value })} />
                    <input placeholder="Confidence / reliability" value={output.confidence} onChange={(event) => updateOutput(agent, { confidence: event.target.value })} />
                    <textarea placeholder="Agent output appears here, or paste full output manually" value={output.output} onChange={(event) => updateOutput(agent, { output: event.target.value })} />
                    <textarea placeholder="Blockers / unresolved issues" value={output.blockers} onChange={(event) => updateOutput(agent, { blockers: event.target.value })} />
                    <button className="mc-button" onClick={() => dispatchAgent(agent)} disabled={loadingAgent !== null}>
                      {loadingAgent === agent ? 'Running' : `Retry ${agent}`}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="mc-panel">
            <div className="mc-panel-head">
              <div>
                <span className="mc-kicker">Audit and approval</span>
                <h2>Force the final decision</h2>
              </div>
              <button className="mc-button" onClick={() => updateMission({ status: 'Audited' })}>Mark audited</button>
            </div>
            <div className="mc-form-grid">
              <label>
                Accepted findings
                <textarea value={mission.acceptedFindings} onChange={(event) => updateMission({ acceptedFindings: event.target.value })} />
              </label>
              <label>
                Rejected findings
                <textarea value={mission.rejectedFindings} onChange={(event) => updateMission({ rejectedFindings: event.target.value })} />
              </label>
              <label>
                Contradictions / conflicts
                <textarea value={mission.contradictions} onChange={(event) => updateMission({ contradictions: event.target.value })} />
              </label>
              <label>
                Final decision
                <textarea value={mission.finalDecision} onChange={(event) => updateMission({ finalDecision: event.target.value })} />
              </label>
              <label className="mc-span">
                Next action
                <input value={mission.nextAction} onChange={(event) => updateMission({ nextAction: event.target.value })} />
              </label>
            </div>
            <div className="mc-approval-row">
              <button className="mc-button mc-button-primary" onClick={() => updateMission({ status: 'Approved' })}>Approve final</button>
              <button className="mc-button" onClick={() => updateMission({ status: 'Executed' })}>Mark executed</button>
            </div>
          </section>
        </div>
      </section>

      <section className="mc-panel mc-rules">
        <div>
          <span className="mc-kicker">Operating spine</span>
          <h2>Control rules</h2>
          <ul>{controlRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </div>
        <div>
          <span className="mc-kicker">Pipeline</span>
          <h2>Stages</h2>
          <div className="mc-stage-grid">
            {missionStages.map((stage) => (
              <article key={stage.stage}>
                <strong>{stage.stage} {stage.title}</strong>
                <p>{stage.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
