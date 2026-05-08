import { getPublicRegulatorySignalCountries } from '@/lib/regulatory-signals/public'

export default async function CountriesPage() {
  const countries = await getPublicRegulatorySignalCountries()

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">Signals by Country</h1>
      <div className="grid gap-4">
        {countries.map((c) => (
          <a key={c.countryName} href={`/signals/countries/${c.countryName.toLowerCase().replace(/\s+/g,'-')}`} className="border p-4 rounded-lg">
            <div className="font-medium">{c.countryName}</div>
            <div className="text-xs text-neutral-500">{c.count} signals</div>
          </a>
        ))}
      </div>
    </main>
  )
}
