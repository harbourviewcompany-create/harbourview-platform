import { clinicalEducationAssets, clinicalEducationDisclaimer } from '@/lib/fixtures/clinical-education-monetization'
import Link from 'next/link'

export default function DownloadsPage() {
  return (
    <section className="bg-white py-16">
      <div className="page-container">
        <h1 className="text-3xl font-bold text-navy">Clinical Education Resources</h1>
        <p className="mt-4 text-gray-500">Professional resources for regulated-market education.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {clinicalEducationAssets.map((item) => (
            <div key={item.id} className="border p-6 rounded-lg">
              <h2 className="font-semibold text-navy">{item.title}</h2>
              <p className="text-sm text-gray-500 mt-2">{item.publicSummary}</p>
              <Link href={item.ctaHref} className="mt-4 inline-block text-gold">
                {item.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs text-gray-400">{clinicalEducationDisclaimer}</p>
      </div>
    </section>
  )
}
