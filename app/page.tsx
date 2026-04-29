import type { Metadata } from 'next'
import { CTAButton, GoldLabel } from '@/components/ui'
import { BOOKING_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access, Commercial Intelligence and Strategic Introductions',
  description:
    'Harbourview provides market access backed by intelligence and relationships for serious participants in regulated cannabis markets.',
}

const proofStrip = [
  'Market access',
  'Commercial intelligence',
  'Strategic introductions',
  'Counterparty screening',
]

const corePillars = [
  {
    label: '01',
    title: 'Find the real route',
    body: 'Clarify whether a market, buyer pathway, import lane or partnership route is worth pursuing before time is wasted.',
  },
  {
    label: '02',
    title: 'Screen the counterparties',
    body: 'Separate credible buyers, sellers, distributors, investors and partners from weak signals, noise and poor-fit conversations.',
  },
  {
    label: '03',
    title: 'Open better conversations',
    body: 'Use stronger intelligence, cleaner positioning and warmer commercial context to create higher-quality introductions.',
  },
]

const screens = [
  'Route viability',
  'Buyer and seller fit',
  'Import/export readiness',
  'Pharmacy and distributor pathways',
  'Territory and exclusivity logic',
  'Document and compliance readiness',
  'Investor and strategic partner fit',
  'Market timing and commercial friction',
]

const outputs = [
  {
    label: '01',
    title: 'Market-Access Intelligence Brief',
    body: 'A decision-grade brief showing whether a market, route or commercial pathway is worth pursuing.',
    answers: 'Is this opportunity real, reachable and worth the next step?',
    includes: ['Market snapshot', 'Route viability', 'Commercial friction', 'Recommended next move'],
  },
  {
    label: '02',
    title: 'Counterparty Screen',
    body: 'A focused review of buyers, sellers, distributors, suppliers or partners against a defined mandate.',
    answers: 'Who is credible, who fits and who should be avoided?',
    includes: ['Fit criteria', 'Counterparty shortlist', 'Red flags', 'Introduction logic'],
  },
  {
    label: '03',
    title: 'Mandate Recommendation Memo',
    body: 'A clean commercial recommendation that turns research, screening and outreach into a clear decision.',
    answers: 'What should be advanced, paused, rejected or reframed?',
    includes: ['Reviewed options', 'Ruled-out paths', 'Remaining viable route', 'Action recommendation'],
  },
]

const fit = [
  'Licensed operators entering or expanding in regulated markets',
  'Importers, exporters, distributors and wholesalers seeking credible supply or demand',
  'Investors and strategic partners assessing cannabis opportunities',
  'Serious suppliers needing a cleaner path to qualified commercial conversations',
]

const notFit = [
  'Generic lead generation without qualification',
  'Undisciplined brokerage or public counterparty exposure',
  'Legal advice, regulatory filing execution or compliance sign-off',
  'Lifestyle cannabis promotion, media services or hype-driven market commentary',
]

const process = [
  { n: '01', title: 'Confidential intake', body: 'Capture the objective, market, product, route and commercial constraints.' },
  { n: '02', title: 'Fit and route review', body: 'Assess whether the opportunity is credible, timely and worth advancing.' },
  { n: '03', title: 'Intelligence build', body: 'Map the relevant market, counterparties, proof gaps and execution path.' },
  { n: '04', title: 'Controlled next step', body: 'Move toward a brief, screened introduction, mandate or clear no-go decision.' },
]

export default function HomePage() {
  return (
    <main className="hv-page-shell">
      <section className="hv-hero">
        <div className="hv-hero-grid">
          <div className="hv-hero-copy">
            <GoldLabel>Market access backed by intelligence and relationships</GoldLabel>
            <h1>Better intelligence. Better counterparties. Better outcomes.</h1>
            <p className="hv-hero-lede">
              Harbourview works with serious companies seeking credible buyers, sellers, investors and commercially relevant opportunities across regulated cannabis markets.
            </p>
            <p className="hv-hero-subcopy">
              We help clients assess real opportunities, identify the right counterparties and open stronger commercial conversations. In an industry full of noise, Harbourview is built to improve clarity, fit and access.
            </p>
            <div className="hv-hero-actions">
              <CTAButton href="/intake">Start a Confidential Inquiry</CTAButton>
              {BOOKING_URL && <CTAButton href={BOOKING_URL} variant="outline">Request a Confidential Discussion</CTAButton>}
            </div>
            <div className="hv-proof-strip" aria-label="Harbourview capabilities">
              {proofStrip.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="hv-hero-visual" aria-label="Harbourview commercial intelligence visual">
            <div className="hv-visual-frame">
              <div className="hv-map-orb">
                <span className="hv-route hv-route-one" />
                <span className="hv-route hv-route-two" />
                <span className="hv-route hv-route-three" />
                <span className="hv-node hv-node-one" />
                <span className="hv-node hv-node-two" />
                <span className="hv-node hv-node-three" />
              </div>
              <div className="hv-intel-panel hv-panel-top">
                <span>Route screen</span>
                <strong>Viable with conditions</strong>
              </div>
              <div className="hv-intel-panel hv-panel-bottom">
                <span>Counterparty fit</span>
                <strong>Qualified introductions only</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-section hv-section-dark">
        <div className="hv-section-intro">
          <GoldLabel>What actually matters</GoldLabel>
          <h2>The edge is not access. It is intelligence.</h2>
          <p>
            Access without screening creates wasted calls, weak introductions and credibility loss. Harbourview focuses on the work before the introduction: route logic, counterparty fit, market reality and commercial proof.
          </p>
        </div>
        <div className="hv-pillar-grid">
          {corePillars.map((pillar) => (
            <article className="hv-pillar-card" key={pillar.title}>
              <span>{pillar.label}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hv-section">
        <div className="hv-split">
          <div>
            <GoldLabel>Commercial screen</GoldLabel>
            <h2>Harbourview helps decide what is worth pursuing.</h2>
            <p>
              The goal is not more noise. The goal is fewer better conversations, cleaner mandates and stronger commercial judgment before resources are committed.
            </p>
          </div>
          <div className="hv-check-grid">
            {screens.map((screen) => (
              <div className="hv-check-item" key={screen}>{screen}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-section hv-section-dark" id="example-outputs">
        <div className="hv-section-intro">
          <GoldLabel>Example outputs</GoldLabel>
          <h2>Decision-ready materials, not generic market notes.</h2>
          <p>
            These are the core Harbourview outputs used to turn intake, research and counterparty screening into clearer commercial decisions. They are examples of format and purpose, not client case studies or claimed results.
          </p>
        </div>
        <div className="hv-output-grid hv-example-output-grid">
          {outputs.map((output) => (
            <article className="hv-output-card hv-example-output-card" key={output.title}>
              <div className="hv-output-card-topline">
                <span>{output.label}</span>
                <small>Harbourview output</small>
              </div>
              <h3>{output.title}</h3>
              <p>{output.body}</p>
              <div className="hv-output-answer">
                <strong>Answers</strong>
                <p>{output.answers}</p>
              </div>
              <ul>
                {output.includes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="hv-section">
        <div className="hv-fit-grid">
          <div className="hv-fit-panel">
            <GoldLabel>Strong fit</GoldLabel>
            <h2>Who Harbourview is built for</h2>
            <ul>
              {fit.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="hv-fit-panel hv-fit-panel-muted">
            <GoldLabel>Not the mandate</GoldLabel>
            <h2>What Harbourview is not</h2>
            <ul>
              {notFit.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="hv-section hv-section-dark">
        <div className="hv-section-intro">
          <GoldLabel>Process</GoldLabel>
          <h2>Controlled from first inquiry to next step.</h2>
        </div>
        <div className="hv-process-line">
          {process.map((step) => (
            <article className="hv-process-step" key={step.n}>
              <span>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hv-final-cta">
        <div>
          <GoldLabel>Confidential inquiry</GoldLabel>
          <h2>Bring the opportunity. Harbourview will help pressure-test the route.</h2>
          <p>
            Start with a clear intake so the objective, market, counterparty profile and next move can be assessed properly.
          </p>
          <CTAButton href="/intake">Start a Confidential Inquiry</CTAButton>
        </div>
      </section>
    </main>
  )
}
