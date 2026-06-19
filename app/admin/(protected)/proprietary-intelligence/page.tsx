import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import {
  listDatasets,
  listPredictions,
  listTrustScores,
  listCopilotTasks,
} from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const sections = [
  { href: '/admin/proprietary-intelligence/datasets', label: 'Datasets', description: 'Proprietary dataset registry — coverage, freshness, and completeness.' },
  { href: '/admin/proprietary-intelligence/reinforcement', label: 'Reinforcement Events', description: 'Signal events that update entity scores and relationship intelligence.' },
  { href: '/admin/proprietary-intelligence/predictions', label: 'Commercial Predictions', description: 'AI-generated fit scores, probabilities, and next-best-action recommendations.' },
  { href: '/admin/proprietary-intelligence/trust', label: 'Trust Scores', description: 'Relationship trust and commercial reliability scores per counterparty.' },
  { href: '/admin/proprietary-intelligence/copilots', label: 'AI Copilot Tasks', description: 'Pending and active copilot tasks across sourcing, deal flow, and intros.' },
  { href: '/admin/proprietary-intelligence/execution', label: 'Execution Queue', description: 'Autonomous execution queue — drafts, follow-ups, and deal stage updates.' },
  { href: '/admin/proprietary-intelligence/command-center', label: 'Command Center', description: 'Operator command items — highest-value actions and priority alerts.' },
  { href: '/admin/proprietary-intelligence/institutional-workflows', label: 'Institutional Workflows', description: 'Structured workflow records for market access, onboarding, and compliance.' },
  { href: '/admin/proprietary-intelligence/metrics', label: 'Strategic Metrics', description: 'Platform-wide intelligence KPIs — coverage, velocity, and confidence.' },
]

export default async function ProprietaryIntelligencePage() {
  await requireAdminAuth()

  const [datasetsResult, predictionsResult, trustResult, copilotResult] = await Promise.all([
    listDatasets(),
    listPredictions(),
    listTrustScores(),
    listCopilotTasks(),
  ])

  const isFixture =
    (datasetsResult.ok && datasetsResult.source === 'fixture') ||
    (predictionsResult.ok && predictionsResult.source === 'fixture') ||
    (trustResult.ok && trustResult.source === 'fixture') ||
    (copilotResult.ok && copilotResult.source === 'fixture')

  const totalDatasets = datasetsResult.ok ? (datasetsResult.data ?? []).length : 0
  const totalPredictions = predictionsResult.ok ? (predictionsResult.data ?? []).length : 0
  const activeTrustScores = trustResult.ok
    ? (trustResult.data ?? []).filter((ts) => ts.status === 'priority' || ts.status === 'watch').length
    : 0
  const pendingCopilotTasks = copilotResult.ok
    ? (copilotResult.data ?? []).filter((t) => t.status === 'ready' || t.status === 'in_progress').length
    : 0

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Admin</p>
        <h1 className="text-3xl font-semibold text-[#F5F1E8]">Proprietary Intelligence</h1>
        <p className="text-sm text-[#F5F1E8]/60">
          Full admin view across datasets, predictions, trust scores, copilot tasks, execution queues, and strategic metrics.
        </p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/55 uppercase tracking-wider">Datasets</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{totalDatasets}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/55 uppercase tracking-wider">Predictions</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{totalPredictions}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/55 uppercase tracking-wider">Active Trust Scores</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{activeTrustScores}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/55 uppercase tracking-wider">Pending Copilot Tasks</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{pendingCopilotTasks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-[#C6A55A]/40 hover:bg-white/[0.05] transition-all cursor-pointer h-full">
              <p className="font-semibold text-[#F5F1E8]">{section.label}</p>
              <p className="mt-2 text-sm text-[#F5F1E8]/55">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
