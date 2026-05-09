import type { ReactNode } from 'react'

import {
  calculateRelationshipStrength,
  reliabilityBand,
  repeatCounterpartyProfiles,
  topRelationshipProfiles,
  recommendOperator,
  type RelationshipProfile,
} from '@/lib/introduction-routing/relationshipIntelligence'

type RelationshipIntelligencePanelProps = {
  profiles: RelationshipProfile[]
}

export function RelationshipIntelligencePanel({ profiles }: RelationshipIntelligencePanelProps) {
  const topProfiles = topRelationshipProfiles(profiles)
  const repeatProfiles = repeatCounterpartyProfiles(profiles)
  const recommendedOperator = recommendOperator({
    market: 'Germany',
    profiles,
  })

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Relationship Profiles">
          {topProfiles.map((profile) => {
            const strength = calculateRelationshipStrength(profile)
            return (
              <div key={profile.counterparty_name} className="border-b border-white/10 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-[#C6A55A]">{profile.counterparty_name}</div>
                  <div className="text-xs text-gray-400">{strength}</div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {reliabilityBand(profile.reliability_score || 0)} · Successes {profile.successful_introductions_count || 0}
                </div>
              </div>
            )
          })}
        </Panel>

        <Panel title="Repeat Counterparties">
          {repeatProfiles.map((profile) => (
            <div key={profile.counterparty_name} className="border-b border-white/10 py-3 text-sm">
              <div className="font-medium">{profile.counterparty_name}</div>
              <div className="text-xs text-gray-400">
                Repeat engagements: {profile.repeat_counterparty_count || 0}
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <Panel title="Operator Recommendation Logic">
        <div className="text-sm text-gray-300">
          Recommended operator for Germany pathway routing:
        </div>
        <div className="mt-2 text-lg font-semibold text-[#C6A55A]">
          {recommendedOperator || 'No recommendation available'}
        </div>
      </Panel>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#C6A55A]">{title}</h3>
      <div>{children}</div>
    </div>
  )
}
