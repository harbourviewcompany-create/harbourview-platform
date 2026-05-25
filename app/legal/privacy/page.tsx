import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Privacy Policy | Harbourview',
  description: 'Harbourview privacy policy — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <>
      <PublicHero eyebrow="Legal" title="Privacy Policy" compact>
        <p className="text-white/62">How Harbourview collects, uses, and protects information provided through this platform.</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-2xl">
          <PublicCard className="p-8 sm:p-10">
            <div className="space-y-8 text-sm leading-8 text-white/62">
              <p>This Privacy Policy describes how Harbourview (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) handles information collected through this website and its associated intake, contact, and listing forms.</p>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Information We Collect</h2>
                <p>We collect information you provide directly — including name, email address, company name, and enquiry details — when you submit a listing, contact form, or intake request. We do not collect payment information. We may collect basic analytics data about site usage through third-party tools.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">How We Use Your Information</h2>
                <p>Information submitted through this platform is used to respond to enquiries, facilitate introductions, review listings, and improve our services. We do not sell or rent personal information to third parties.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Confidentiality</h2>
                <p>Intake and confidential discussion submissions are handled with discretion. Information is not shared with third parties without explicit consent from the submitting party.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Contact</h2>
                <p>For privacy-related enquiries, contact us at{" "}<a href="mailto:harbourviewcompany@gmail.com" className="text-gold underline decoration-gold/40 underline-offset-4 hover:text-gold-light">harbourviewcompany@gmail.com</a>.</p>
              </section>
              <p className="text-xs text-white/30">This policy will be updated as our services develop. Last reviewed: 2025.</p>
            </div>
          </PublicCard>
          <div className="mt-8 flex gap-4">
            <Link href="/" className="btn-intelligence text-sm">← Back to Home</Link>
          </div>
        </div>
      </PublicSection>
    </>
  )
}
