import Link from 'next/link'

export default function CountryNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#03070d] px-6 text-center">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
        404 · Harbourview
      </p>
      <h1 className="mb-3 font-serif text-3xl text-white">Country not found</h1>
      <p className="mb-7 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
        This jurisdiction isn&apos;t mapped to a Harbourview dashboard record, or the URL doesn&apos;t match a tracked country.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.12)', border: '1px solid rgba(198,165,90,0.3)', color: '#F0D39A' }}
        >
          Browse all jurisdictions
        </Link>
        <Link
          href="/"
          className="rounded-xl px-5 py-2.5 text-sm transition-all hover:opacity-70"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(243,240,234,0.5)' }}
        >
          Return to globe
        </Link>
      </div>
    </div>
  )
}
