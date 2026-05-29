export default function CountryLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#03070d]">
      {/* Rail skeleton */}
      <div className="h-[52px] w-full animate-pulse" style={{ background: 'rgba(4,9,18,0.97)', borderBottom: '1px solid rgba(198,165,90,0.12)' }} />
      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <div className="w-56 flex-shrink-0 p-4" style={{ background: 'rgba(4,9,18,0.97)', borderRight: '1px solid rgba(198,165,90,0.08)' }}>
          <div className="mb-4 h-24 animate-pulse rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-1.5 h-8 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        {/* Main skeleton */}
        <div className="flex-1 p-5">
          <div className="mb-6">
            <div className="mb-2 h-3 w-32 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="mb-3 h-9 w-56 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-4 w-full max-w-lg animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
