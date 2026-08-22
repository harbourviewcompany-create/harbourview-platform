'use client';

import type { TalentListParams, RoleFamily, LocationType } from '@/types/talent';
import {
  ROLE_FAMILY_OPTIONS,
  LOCATION_TYPE_OPTIONS,
} from '@/lib/talent/taxonomy';

interface TalentFiltersProps {
  filters: TalentListParams;
  onChange: (next: Partial<TalentListParams>) => void;
}

export function TalentFilters({ filters, onChange }: TalentFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Role family chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onChange({ roleFamily: null })}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
            !filters.roleFamily
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'border-white/10 text-white/60 hover:border-white/20'
          }`}
        >
          All roles
        </button>
        {ROLE_FAMILY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange({
                roleFamily:
                  filters.roleFamily === opt.value ? null : opt.value,
              })
            }
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
              filters.roleFamily === opt.value
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                : 'border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Location type */}
      <div className="flex gap-2">
        {LOCATION_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange({
                locationType:
                  filters.locationType === opt.value ? null : opt.value,
              })
            }
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              filters.locationType === opt.value
                ? 'bg-white/10 border-white/25 text-white'
                : 'border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
