import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Harbourview Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAuth();
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b border-[#C6A55A]/25 pb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview internal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin Review</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">Authenticated admin/operator workspace for marketplace review, intelligence automation, and internal workflow.</p>
          <nav className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link href="/admin/hub" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Hub</Link>
            <Link href="/admin/members" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Members</Link>
            <Link href="/admin/inquiries" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Inquiries</Link>
            <Link href="/admin/listings" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Listings</Link>
            <Link href="/admin/deal-dashboard" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Deal dashboard</Link>
            <Link href="/admin/routing/genetics" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Genetics routing</Link>
            <Link href="/admin/sources" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Sources</Link>
            <Link href="/admin/candidates" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Candidates</Link>
            <Link href="/admin/intelligence-automation" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Intelligence</Link>
            <Link href="/admin/counterparties" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Counterparties</Link>
            <Link href="/admin/orgs" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Orgs</Link>
            <Link href="/admin/applications" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Applications</Link>
            <Link href="/admin/genetics/review" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Genetics review</Link>
            <Link href="/admin/agents" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Agents</Link>
            <Link href="/admin/proprietary-intelligence" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Prop. Intelligence</Link>
            <Link href="/admin/enterprise" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Enterprise</Link>
            <Link href="/admin/monetization" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Monetization</Link>
            <Link href="/admin/partners" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Partners</Link>
            <Link href="/admin/reports" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Reports</Link>
            <Link href="/admin/governance" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Governance</Link>
            <Link href="/admin/global-expansion" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Global Expansion</Link>
            <Link href="/admin/regulatory-pathways" className="rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">Regulatory Pathways</Link>
            <form action="/admin/logout" method="post">
              <button type="submit" className="rounded-full border border-white/20 px-3 py-1.5 text-[#F5F1E8]/70 transition hover:bg-white/10">Sign out</button>
            </form>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}

