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

const statuses: MissionStatus[] = ['Draft', 'Assigned', 'Returned', 'Audited', 'Approved', 'Executed']
const agents: AgentKey[] = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini']
const storageKey = 'harbourview-mission-control-v1'

function emptyOutput(agent: AgentKey): AgentOutput {
  return { agent, output: '', verdict: '', blockers: '', confidence: '', updatedAt: '' }
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

export function MissionControlClient() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('Claude')
  const [loadingAgent, setLoadingAgent] = useState<AgentKey | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as Mission[]
      setMissions(parsed)
      setSelectedId(parsed[0]?.id || '')
      return
    }

    const starter = createEmptyMission()
    starter.title = 'Harbourview Chatbot Hub Build'
    starter.objective = 'Build chatbot hub'
    starter.status = 'Assigned'
    setMissions([starter])
    setSelectedId(starter.id)
  }, [])

  useEffect(() => {
    if (missions.length) {
      window.localStorage.setItem(storageKey, JSON.stringify(missions))
    }
  }, [missions])

  const mission = missions.find((m) => m.id === selectedId)

  function updateMission(patch: Partial<Mission>) {
    if (!mission) return
    setMissions((current) => current.map((m) => (m.id === mission.id ? { ...m, ...patch } : m)))
  }

  async function dispatch(agent: AgentKey) {
    if (!mission) return

    setLoadingAgent(agent)

    const prompt = buildMissionPrompt(mission, agent)

    const res = await fetch('/api/mission-control/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, prompt }),
    })

    const data = await res.json()

    setLoadingAgent(null)

    updateMission({
      outputs: {
        ...mission.outputs,
        [agent]: {
          ...mission.outputs[agent],
          output: data.output || '',
          blockers: data.blocker || '',
          updatedAt: new Date().toISOString(),
        },
      },
    })
  }

  if (!mission) return null

  return (
    <div className="hv-section">
      <h1>Mission Control</h1>

      <h2>Dispatch agents</h2>
      {agents.map((agent) => (
        <div key={agent}>
          <button onClick={() => dispatch(agent)} disabled={loadingAgent === agent}>
            {loadingAgent === agent ? `Running ${agent}...` : `Run ${agent}`}
          </button>
          <pre>{mission.outputs[agent].output}</pre>
          <pre style={{ color: 'red' }}>{mission.outputs[agent].blockers}</pre>
        </div>
      ))}
    </div>
  )
}
