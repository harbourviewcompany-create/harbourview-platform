import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { automationSources, automationSignals, agentQueue, evidenceVault } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const sections = [
  { title: 'Source Registry', href: '/admin/intelligence-automation/sources', eyebrow: 'Data acquisition', description: 'Manage intelligence sources across licence databases, regulator feeds, importer directories, conference lists, and manual relationship inputs.' },
  { title: 'Signal Inbox', href: '/admin/intelligence-automation/signals', eyebrow: 'Signal generation', description: 'Review generated commercial signals. Qualify, convert to opportunities, or link to counterparties and market pathways.' },
  { title: 'Relationship Memory', href: '/admin/intelligence-automation/counterparties', eyebrow: 'Counterparty memory', description: 'Persistent memory for buyers, sellers, importers, distributors, suppliers, and service providers across markets and categories.' },
  { title: 'Counterparty Scoring', href: '/admin/intelligence-automation/scoring', eyebrow: 'Scoring engine', description: 'Fit, readiness, and trust scores with routing priority, follow-up priority, and introduction priority.' },
  { title: 'Agent Work Queues', href: '/admin/intelligence-automation/agents', eyebrow: 'Agent queues', description: 'Deterministic agent queues for source watching, signal analysis, opportunity qualification, document review, and buyer/seller matching.' },
  { title: 'Evidence Vault', href: '/admin/intelligence-automation/evidence', eyebrow: 'Private evidence', description: 'COAs, licences, GACP documents, EU-GMP certificates, spec sheets, meeting notes, and commercial evidence.' },
  { title: 'Market Graph', href: '/admin/intelligence-automation/market-graph', eyebrow: 'Graph layer', description: 'Entities and edges connecting markets, counterparties, pathways, signals, opportunities, documents, and evidence.' },
  { title: 'Commercial Feedback', href: '/admin/intelligence-automation/feedback', eyebrow: 'Feedback loop', description: 'Outcome events that update counterparty scores, routing priorities, and trust levels.' },
];

export default async function IntelligenceAutomationHubPage() {
  await requireAdminAuth();
  const pendingSignals = automationSignals.filter(s => s.stage === 'new' || s.stage === 'needs_review').length;
  const urgentTasks = agentQueue.filter(a => a.priority === 'urgent').length;
  const pendingEvidence = evidenceVault.filter(e => e.reviewStatus === 'pending' || e.reviewStatus === 'needs_action').length;
  const activeSources = automationSources.filter(s => s.status === 'active').length;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Intelligence automation</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Intelligence Automation + Market Graph</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/68">Source acquisition, signal automation, relationship memory, counterparty scoring, agent work queues, private evidence vault, and market graph layer.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active sources', value: activeSources },
              { label: 'Pending signals', value: pendingSignals },
              { label: 'Urgent tasks', value: urgentTasks },
              { label: 'Evidence pending', value: pendingEvidence },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-2xl font-semibold text-[#F5F1E8]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#C6A55A]/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="group rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-5 transition hover:border-[#C6A55A]/55 hover:bg-[#10213A]">
            <span className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{s.eyebrow}</span>
            <h3 className="mt-3 text-xl font-semibold text-[#F5F1E8] group-hover:text-[#D8BC73]">{s.title}</h3>
            <p className="mt-3 min-h-16 text-sm leading-6 text-[#F5F1E8]/65">{s.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
