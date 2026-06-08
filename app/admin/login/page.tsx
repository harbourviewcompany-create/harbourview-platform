import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Login | Harbourview',
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    signedOut?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (error === 'forbidden') return 'This account does not have the admin or operator role required for admin review.';
  if (error === 'unavailable') return 'Admin sign-in is temporarily unavailable. Try again shortly.';
  if (error === 'invalid') return 'The email or password was not accepted.';
  if (error === 'rate_limited') return 'Too many sign-in attempts. Please wait and try again.';
  return null;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-md">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview internal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">
          Use an existing Harbourview admin or operator account to review marketplace inquiries.
        </p>

        {params?.signedOut ? (
          <div className="mt-6 rounded-xl border border-[#C6A55A]/25 bg-[#C6A55A]/10 p-4 text-sm text-[#F5F1E8]/80">
            You have been signed out.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-xl border border-red-300/30 bg-red-950/20 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <form action="/admin/login/submit" method="post" className="mt-8 space-y-5 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#F5F1E8]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-[#F5F1E8] outline-none transition focus:border-[#C6A55A]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#F5F1E8]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-[#F5F1E8] outline-none transition focus:border-[#C6A55A]"
            />
          </div>
          <button type="submit" className="w-full rounded-full bg-[#C6A55A] px-5 py-3 text-sm font-semibold text-[#081423] transition hover:bg-[#D8BC73]">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
