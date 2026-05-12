import type { Metadata } from 'next';
import { AiGatewayClient } from '@/components/ai-gateway-client';

export const metadata: Metadata = {
  title: 'Harbourview AI Gateway',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AiGatewayPage() {
  return (
    <main className="min-h-screen bg-[#01050d] px-6 py-12 text-white sm:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-gold/80">Protected assistant</p>
          <h1 className="font-serif text-4xl font-semibold tracking-[-0.04em] text-[#F5F1E8] md:text-5xl">
            Harbourview AI Gateway
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/62">
            Authenticated streaming route for controlled assistant access. Requests are validated server-side, rate-limited and sent through the Vercel AI Gateway without exposing provider credentials to the browser.
          </p>
        </div>
        <AiGatewayClient />
      </section>
    </main>
  );
}
