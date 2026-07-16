import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { ADMIN_NAV_GROUPS } from '@/lib/admin/navConfig';

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
          <nav className="mt-5 space-y-4 text-sm">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#F5F1E8]/40">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        item.status === 'in_progress'
                          ? 'rounded-full border border-dashed border-[#F5F1E8]/25 px-3 py-1.5 text-[#F5F1E8]/50 transition hover:bg-white/5'
                          : 'rounded-full border border-[#C6A55A]/40 px-3 py-1.5 text-[#C6A55A] transition hover:bg-[#C6A55A]/10'
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <form action="/admin/logout" method="post" className="pt-2">
              <button type="submit" className="rounded-full border border-white/20 px-3 py-1.5 text-[#F5F1E8]/70 transition hover:bg-white/10">Sign out</button>
            </form>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}
