'use client'
import React from 'react'

/** Corridor playbooks panel — full corridor tables deferred to data module follow-up */
export function CorridorPlaybooksSection(_props: { country?: { iso2: string; label: string }; onPageChange?: (p: string) => void }) {
  return (
    <section className="cc-corridor-playbooks">
      <div className="cc-card-head">CORRIDOR PLAYBOOKS</div>
      <p className="cc-muted">Curated EU, Americas, Africa, and Asia-Pacific medical corridors — full matrix restore pending size-safe data extract.</p>
    </section>
  )
}
