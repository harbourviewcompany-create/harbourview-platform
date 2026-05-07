import { getPublicRegulatorySignalsByType } from '@/lib/regulatory-signals/public'

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const signals = await getPublicRegulatorySignalsByType(type)

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">{type.replace(/_/g,' ')}</h1>
      <div className="space-y-4">
        {signals.map((s) => (
          <a key={s.id} href={`/signals/${s.slug}`} className="block border p-4 rounded-lg">
            <div className="font-medium">{s.headline}</div>
            <div className="text-xs text-neutral-500">{s.country_name} • {s.signal_date}</div>
          </a>
        ))}
      </div>
    </main>
  )
}
