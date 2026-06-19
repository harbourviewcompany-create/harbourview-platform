import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import {
  listEcosystemVerticals,
  listEnterpriseDealRooms,
  listIntroPackets,
  listCommercialCoordinationWorkflows,
} from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EnterpriseOverviewPage() {
  await requireAdminAuth()

  const [verticalsRes, dealRoomsRes, introPacketsRes, workflowsRes] = await Promise.all([
    listEcosystemVerticals(),
    listEnterpriseDealRooms(),
    listIntroPackets(),
    listCommercialCoordinationWorkflows(),
  ])

  const verticals = verticalsRes.ok ? verticalsRes.data : []
  const dealRooms = dealRoomsRes.ok ? dealRoomsRes.data : []
  const introPacketsList = introPacketsRes.ok ? introPacketsRes.data : []
  const workflows = workflowsRes.ok ? workflowsRes.data : []

  const isFixture =
    (verticalsRes.ok && verticalsRes.source === 'fixture') ||
    (dealRoomsRes.ok && dealRoomsRes.source === 'fixture')

  const totalVerticals = verticals.length
  const activeDealRooms = dealRooms.filter(
    (r) => r.status === 'active' || r.status === 'ready_for_intro'
  ).length
  const sentPackets = introPacketsList.filter((p) => p.status === 'sent').length
  const pendingWorkflows = workflows.filter(
    (w) => w.status === 'ready_for_action' || w.status === 'waiting_counterparty'
  ).length

  const sections = [
    {
      href: '/admin/enterprise/ecosystem',
      eyebrow: 'Ecosystem',
      title: 'Ecosystem Verticals',
      description: 'All operator verticals, record counts, and market coverage',
    },
    {
      href: '/admin/enterprise/operators',
      eyebrow: 'Operations',
      title: 'Operator Workflows',
      description: 'My queue, team queue, follow-ups, and handoffs',
    },
    {
      href: '/admin/enterprise/deal-rooms',
      eyebrow: 'Deals',
      title: 'Deal Rooms',
      description: 'Active deal rooms, intros in progress, and stalled deals',
    },
    {
      href: '/admin/enterprise/intro-packets',
      eyebrow: 'Introductions',
      title: 'Intro Packets',
      description: 'Buyer–seller and counterparty introduction packets',
    },
    {
      href: '/admin/enterprise/document-packets',
      eyebrow: 'Compliance',
      title: 'Document Readiness',
      description: 'Document completeness tracking across all markets',
    },
    {
      href: '/admin/enterprise/dashboards',
      eyebrow: 'Metrics',
      title: 'Dashboard Metrics',
      description: 'KPIs across deal velocity, coverage, and operator load',
    },
    {
      href: '/admin/enterprise/integrations',
      eyebrow: 'Integrations',
      title: 'Strategic Integrations',
      description: 'Planned and active integration connections',
    },
    {
      href: '/admin/enterprise/reputation',
      eyebrow: 'Trust',
      title: 'Reputation Records',
      description: 'Trust scores and relationship quality tracking',
    },
    {
      href: '/admin/enterprise/flywheel',
      eyebrow: 'Data',
      title: 'Data Flywheel',
      description: 'Incoming events enriching the ecosystem dataset',
    },
    {
      href: '/admin/enterprise/coordination',
      eyebrow: 'Workflows',
      title: 'Commercial Coordination',
      description: 'End-to-end workflow coordination across supply, demand, and intros',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Enterprise Overview</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Global commercial coordination — ecosystem, deal rooms, intros, and compliance
          </p>
        </div>
        <FixtureBanner isFixture={isFixture} />
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Ecosystem Verticals</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{totalVerticals}</p>
          <p className="mt-1 text-xs text-zinc-500">Active verticals mapped</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Active Deal Rooms</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{activeDealRooms}</p>
          <p className="mt-1 text-xs text-zinc-500">Active or ready for intro</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Packets Sent</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{sentPackets}</p>
          <p className="mt-1 text-xs text-zinc-500">Intro packets delivered</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Pending Workflows</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{pendingWorkflows}</p>
          <p className="mt-1 text-xs text-zinc-500">Ready or waiting counterparty</p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-[#C6A55A]/40 hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{s.eyebrow}</p>
            <h2 className="mt-1 text-base font-semibold text-[#F5F1E8]">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
