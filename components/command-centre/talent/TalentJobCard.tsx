'use client';

import type { TalentOpportunity } from '@/types/talent';
import { formatSalaryBand } from '@/lib/talent/taxonomy';
import { ROLE_FAMILIES } from '@/lib/talent/taxonomy';

interface TalentJobCardProps {
  job: TalentOpportunity;
  onSelect: () => void;
}

export function TalentJobCard({ job, onSelect }: TalentJobCardProps) {
  const salary = formatSalaryBand({
    min: job.salary_min,
    max: job.salary_max,
    currency: job.salary_currency,
    period: job.salary_period,
  });

  const familyLabel =
    ROLE_FAMILIES[job.role_family]?.label ?? job.role_family;

  const employmentLabel =
    job.employment_type === 'full_time'
      ? 'Full-Time'
      : job.employment_type === 'part_time'
        ? 'Part-Time'
        : job.employment_type === 'contract'
          ? 'Contract'
          : job.employment_type;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-2xl bg-[#12181f] border border-white/8 p-4 transition active:scale-[0.99] hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[10px] font-semibold tracking-widest text-amber-500/90 uppercase">
          {familyLabel}
          {job.primary_jurisdiction
            ? ` · ${job.primary_jurisdiction}`
            : ''}
        </p>
        {job.is_featured && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
            Featured
          </span>
        )}
      </div>

      <h3 className="text-base font-medium text-white leading-snug mb-1">
        {job.title}
      </h3>

      <p className="text-sm text-white/55 mb-3">
        {job.organization_name ?? 'Organization'}
        {job.organization_location
          ? ` · ${job.organization_location}`
          : job.primary_jurisdiction
            ? ` · ${job.primary_jurisdiction}`
            : ''}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/70">
          {employmentLabel}
        </span>
        {salary && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/70">
            {salary}
          </span>
        )}
        {job.location_type === 'remote' && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/70">
            Remote
          </span>
        )}
        {job.location_type === 'hybrid' && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/70">
            Hybrid
          </span>
        )}
      </div>
    </button>
  );
}
