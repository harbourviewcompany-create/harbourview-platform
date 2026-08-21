'use client';

import { useState } from 'react';
import type { TalentOpportunity } from '@/types/talent';
import { formatSalaryBand, ROLE_FAMILIES } from '@/lib/talent/taxonomy';

interface TalentJobDetailProps {
  job: TalentOpportunity;
  onClose: () => void;
}

export function TalentJobDetail({ job, onClose }: TalentJobDetailProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salary = formatSalaryBand({
    min: job.salary_min,
    max: job.salary_max,
    currency: job.salary_currency,
    period: job.salary_period,
  });

  const familyLabel =
    ROLE_FAMILIES[job.role_family]?.label ?? job.role_family;

  async function handleApply() {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch('/api/talent/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: job.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Application failed');
      }
      setApplied(true);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to apply');
    } finally {
      setApplying(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/talent/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: job.id }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
    } catch {
      // silent for now
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0f1419] border border-white/10 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-amber-500/90 uppercase mb-1">
              {familyLabel}
              {job.primary_jurisdiction
                ? ` · ${job.primary_jurisdiction}`
                : ''}
            </p>
            <h2 className="text-xl font-serif text-white leading-snug">
              {job.title}
            </h2>
            <p className="text-sm text-white/55 mt-1">
              {job.organization_name}
              {job.organization_location
                ? ` · ${job.organization_location}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white text-sm px-2 py-1"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {salary && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/80">
              {salary}
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/80">
            {job.employment_type.replace('_', '-')}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/80">
            {job.location_type}
          </span>
        </div>

        <section className="mb-5">
          <h3 className="text-xs font-semibold tracking-wide text-white/40 uppercase mb-2">
            Description
          </h3>
          <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </section>

        {job.requirements && (
          <section className="mb-5">
            <h3 className="text-xs font-semibold tracking-wide text-white/40 uppercase mb-2">
              Requirements
            </h3>
            <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </div>
          </section>
        )}

        {job.benefits && (
          <section className="mb-5">
            <h3 className="text-xs font-semibold tracking-wide text-white/40 uppercase mb-2">
              Benefits
            </h3>
            <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {job.benefits}
            </div>
          </section>
        )}

        {error && (
          <p className="text-sm text-red-300 mb-3">{error}</p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {job.application_url ? (
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-medium py-3 text-sm"
            >
              Apply on company site
            </a>
          ) : (
            <button
              type="button"
              disabled={applying || applied}
              onClick={handleApply}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-medium py-3 text-sm"
            >
              {applied
                ? 'Application submitted'
                : applying
                  ? 'Submitting…'
                  : 'Apply with Harbourview profile'}
            </button>
          )}

          <button
            type="button"
            disabled={saving || saved}
            onClick={handleSave}
            className="w-full rounded-xl border border-white/15 text-white/80 hover:bg-white/5 py-3 text-sm"
          >
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save for later'}
          </button>
        </div>

        <p className="text-[11px] text-white/30 mt-4 text-center">
          Harbourview is an equal opportunity surface. Employers are expected
          to comply with applicable employment laws in their jurisdiction.
        </p>
      </div>
    </div>
  );
}
