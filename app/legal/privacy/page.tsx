import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Harbourview privacy policy — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-300 max-w-2xl">
            How Harbourview collects, uses, and protects information provided
            through this platform.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          <div className="card p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
            <p>
              This Privacy Policy describes how Harbourview (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
              handles information collected through this website and its associated
              intake, contact, and marketplace forms.
            </p>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Information We Collect</h2>
              <p>
                We collect information you provide directly — including name, email
                address, company name, and enquiry details — when you submit a
                listing, contact form, or intake request. We do not collect payment
                information. We may collect basic analytics data about site usage
                through third-party tools.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">How We Use Your Information</h2>
              <p>
                Information submitted through this platform is used to respond to
                enquiries, facilitate introductions, review listings, and improve
                our services. We do not sell or rent personal information to third
                parties.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Confidentiality</h2>
              <p>
                Intake and confidential discussion submissions are handled with
                discretion. Information is not shared with third parties without
                explicit consent from the submitting party.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Contact</h2>
              <p>
                For privacy-related enquiries, contact us at{' '}
                <a
                  href="mailto:harbourviewcompany@gmail.com"
                  className="text-navy underline hover:text-gold"
                >
                  harbourviewcompany@gmail.com
                </a>
                .
              </p>
            </div>

            <p className="text-xs text-gray-400">
              This policy will be updated as our services develop. Last reviewed: 2025.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/" className="btn-outline text-sm px-6 py-2.5">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
