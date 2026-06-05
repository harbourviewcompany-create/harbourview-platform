import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';

export const dynamic = 'force-dynamic';

const dashboardCards = [
  { title: 'Intake Queue', href: '/admin/marketplace/intake-queue', eyebrow: 'Seller submissions', description: 'Review and approve incoming seller submissions from the marketplace intake form. Approve to publish live listings.', status: 'Live — Supabase backed' },
  { title: 'Marketplace inquiries', href: '/admin/inquiries', eyebrow: 'Inbound queue', description: 'Review buyer requests, seller submissions, quote routing requests and operator response status.', status: 'Supabase-backed when admin review is enabled' },
  { title: 'Listing provenance', href: '/admin/listings', eyebrow: 'Private review', description: 'Inspect internal source, evidence, availability and seller authorization context before public exposure.', status: 'Protected provenance surface' },
  { title: 'Deal dashboard', href: '/admin/deal-dashboard', eyebrow: 'Introduction routing', description: 'Monitor active genetics-routing introductions, stalled deals, prime-score opportunities and deal status movement.', status: 'Admin/operator mutation path required' },
  { title: 'Sources', href: '/admin/sources', eyebrow: 'Source control', description: 'Review source intake records and controlled source-review workflow before candidate promotion.', status: 'Private intake surface' },
  { title: 'Candidates', href: '/admin/candidates', eyebrow: 'Candidate review', description: 'Inspect candidate records and review state before any marketplace or public-surface movement.', status: 'Private candidate surface' },
  { title: 'Intelligence Automation', href: '/admin/intelligence-automation', eyebrow: 'Intelligence layer', description: 'Source registry, signal inbox, relationship memory, counterparty scoring, agent queues, evidence vault, and market graph.', status: 'Fixture-backed — issue #458' },
  { title: 'Autonomous Agents', href: '/admin/agents', eyebrow: 'Watcher network', description: 'Scheduled source watchers, crawl adapters, signal extraction pipeline, scoring updates, and analyst workflow screens.', status: 'Fixture-backed — issue #461' },
  { title: 'Proprietary Intelligence', href: '/admin/proprietary-intelligence', eyebrow: 'Prediction engine', description: 'Proprietary datasets, reinforcement loops, commercial predictions, relationship trust, AI copilots, and operator command center.', status: 'Fixture-backed — issue #462' },
  { title: 'Enterprise Coordination', href: '/admin/enterprise', eyebrow: 'Ecosystem layer', description: 'Ecosystem verticals, deal rooms, intro packets, document-readiness packets, and enterprise dashboards.', status: 'Fixture-backed — issue #463' },
  { title: 'Monetization & Partners', href: '/admin/monetization', eyebrow: 'Revenue layer', description: 'Paid access surfaces, partner ecosystem registry, revenue intelligence, institutional reports, and market briefs.', status: 'Fixture-backed — issue #464' },
];

export default async function AdminHubPage() {
  await requireAdminAuth();
  const adminDataConfigured = getAdminDataClient().ok;
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Dashboard hub</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Admin/operator control surface</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/68">Protected entry point for marketplace review, provenance inspection, source/candidate workflow, controlled deal operations, and intelligence automation.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-[#F5F1E8]/72">
            <span className="block text-xs uppercase tracking-[0.2em] text-[#C6A55A]">Admin data plane</span>
            <span className="mt-2 block text-lg font-semibold text-[#F5F1E8]">{adminDataConfigured ? 'Configured' : 'Review data disabled'}</span>
            <p className="mt-2 leading-6">{adminDataConfigured ? 'Server-side Supabase admin review reads are available for protected admin routes.' : 'Set HARBOURVIEW_ADMIN_REVIEW_ENABLED=true and SUPABASE_SERVICE_ROLE_KEY before using Supabase-backed review queues.'}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link key={card.href} href={card.href} className="group rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-5 transition hover:border-[#C6A55A]/55 hover:bg-[#10213A]">
            <span className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{card.eyebrow}</span>
            <h3 className="mt-3 text-xl font-semibold text-[#F5F1E8] group-hover:text-[#D8BC73]">{card.title}</h3>
            <p className="mt-3 min-h-20 text-sm leading-6 text-[#F5F1E8]/65">{card.description}</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/55">{card.status}</div>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[#F5F1E8]/65">
        <h3 className="text-base font-semibold text-[#F5F1E8]">Dashboard boundary</h3>
        <p className="mt-2">This hub is private to admin/operator sessions. It must remain separate from public marketplace, intelligence, education, compliance and network routes.</p>
      </div>
    </section>
  );
}
