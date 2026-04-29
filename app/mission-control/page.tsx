import type { Metadata } from 'next'
import { CTAButton, GoldLabel } from '@/components/ui'
import { agentRoles, controlRules, missionStages, promptPacks } from '@/lib/mission-control'

export const metadata: Metadata = {
  title: 'Harbourview Mission Control | Chatbot Orchestration Hub',
  description:
    'A controlled manual orchestration hub for generating, assigning, auditing and approving multi-agent AI work.',
}

export default function MissionControlPage() {
  return (
    <main className="hv-page-shell">
      <section className="hv-section">
        <GoldLabel>Mission Control</GoldLabel>
        <h1>Multi-agent hub</h1>
        <p>
          This is the first working layer of your chatbot hub. It gives you controlled orchestration before automation.
        </p>
        <div style={{ marginTop: 20 }}>
          <CTAButton href="#">Create mission</CTAButton>
        </div>
      </section>

      <section className="hv-section hv-section-dark">
        <h2>Agent roles</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {agentRoles.map((a) => (
            <div key={a.name}>
              <strong>{a.name}</strong>
              <p>{a.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hv-section">
        <h2>Control rules</h2>
        <ul>
          {controlRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="hv-section hv-section-dark">
        <h2>Execution stages</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {missionStages.map((s) => (
            <div key={s.stage}>
              <strong>{s.stage} - {s.title}</strong>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hv-section">
        <h2>Prompt packs</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {promptPacks.map((p) => (
            <div key={p.title}>
              <strong>{p.title}</strong>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{p.prompt}</pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
