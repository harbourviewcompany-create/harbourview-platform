import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Harbourview Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED !== 'true') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b border-[#C6A55A]/25 pb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview internal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin Review</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">
            Isolated operational scaffold for reviewing marketplace inquiries, listing provenance and internal workflow. Do not expose this route through public navigation until authentication and role checks are finalized.
          </p>
          <nav className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/inquiries" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">
              Inquiries
            </Link>
            <Link href="/admin/listings" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A] transition hover:bg-[#C6A55A]/10">
              Listing provenance
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}
