'use client'
import React from 'react'

export function LabDirectorySection(_props: { country?: { iso2: string; label: string } }) {
  return (
    <section className="cc-lab-directory">
      <div className="cc-card-head">LAB DIRECTORY</div>
      <p className="cc-muted">Accredited testing labs by jurisdiction — full directory restore pending.</p>
    </section>
  )
}
