import type { CSSProperties } from 'react'

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const OFF_WHITE = '#F5F1E8'

export type WhatHappensNextStep = {
  title: string
  body: string
}

type WhatHappensNextProps = {
  eyebrow?: string
  title?: string
  intro?: string
  steps: WhatHappensNextStep[]
}

const wrapStyle: CSSProperties = {
  border: '1px solid rgba(198,165,90,0.18)',
  background: 'linear-gradient(180deg, rgba(198,165,90,0.06), rgba(8,20,35,0.38))',
  padding: '24px',
  margin: '28px 0 34px',
}

const eyebrowStyle: CSSProperties = {
  display: 'block',
  marginBottom: '10px',
  color: GOLD,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  margin: '0 0 10px',
  color: OFF_WHITE,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: 1.2,
}

const introStyle: CSSProperties = {
  margin: '0 0 20px',
  color: MUTED,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '13px',
  lineHeight: 1.65,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
}

const stepStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: '12px',
  alignItems: 'start',
}

const numberStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: '28px',
  height: '28px',
  border: '1px solid rgba(198,165,90,0.28)',
  borderRadius: '999px',
  color: GOLD,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '11px',
  fontWeight: 700,
}

const stepTitleStyle: CSSProperties = {
  margin: '0 0 3px',
  color: OFF_WHITE,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '13px',
  fontWeight: 700,
}

const stepBodyStyle: CSSProperties = {
  margin: 0,
  color: MUTED,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '12px',
  lineHeight: 1.6,
}

export function WhatHappensNext({
  eyebrow = 'What happens next',
  title = 'A controlled review before anything moves forward.',
  intro,
  steps,
}: WhatHappensNextProps) {
  return (
    <aside style={wrapStyle} aria-label={title}>
      <span style={eyebrowStyle}>{eyebrow}</span>
      <h2 style={titleStyle}>{title}</h2>
      {intro && <p style={introStyle}>{intro}</p>}
      <div style={gridStyle}>
        {steps.map((step, index) => (
          <div style={stepStyle} key={step.title}>
            <span style={numberStyle}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 style={stepTitleStyle}>{step.title}</h3>
              <p style={stepBodyStyle}>{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
