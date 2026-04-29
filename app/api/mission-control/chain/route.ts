import { NextResponse } from 'next/server'
import { dispatchToAgent, isAgentKey, AgentKey } from '@/lib/mission-control-dispatch'

type ChainRequest = {
  sequence: AgentKey[]
  prompt: string
}

export async function POST(req: Request) {
  let body: ChainRequest

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { sequence, prompt } = body

  if (!Array.isArray(sequence) || sequence.length === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid chain sequence' }, { status: 400 })
  }

  let currentPrompt = prompt
  const results = []

  for (const agent of sequence) {
    if (!isAgentKey(agent)) {
      return NextResponse.json({ ok: false, error: 'Invalid agent in chain' }, { status: 400 })
    }

    const result = await dispatchToAgent(agent, currentPrompt)

    results.push({ agent, ...result })

    if (!result.ok) {
      return NextResponse.json({ ok: false, results })
    }

    currentPrompt = `Previous output from ${agent}:\n${result.output}\n\nContinue the mission based on this.`
  }

  return NextResponse.json({ ok: true, results })
}
