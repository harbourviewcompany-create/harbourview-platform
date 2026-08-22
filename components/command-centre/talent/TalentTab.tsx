'use client';

/**
 * Command → Talent tab
 * Mobile-first, matches existing Command aesthetic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TalentOpportunity, TalentListParams, RoleFamily, LocationType } from '@/types/talent';
import { TalentJobCard } from './TalentJobCard';
import { TalentJobDetail } from './TalentJobDetail';
import { TalentFilters } from './TalentFilters';
import { TalentEmptyState } from './TalentEmptyState';
import { errorMessage } from '@/lib/errorMessage'

interface TalentTabProps {
  /** Active jurisdiction from Command selector (e.g. "DE") */
  activeJurisdiction?: string | null;
  /** Optional role context */
  activeRole?: string | null;
}

export function TalentTab({
  activeJurisdiction = null,
  activeRole = null,
}: TalentTabProps) {
  const [items, setItems] = useState<TalentOpportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TalentOpportunity | null>(null);

  const [filters, setFilters] = useState<TalentListParams>({
    jurisdiction: activeJurisdiction,
    roleFamily: null,
    locationType: null,
    limit: 20,
    offset: 0,
  });

  // Keep jurisdiction in sync with Command selector
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      jurisdiction: activeJurisdiction,
      offset: 0,
    }));
  }, [activeJurisdiction]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filters.jurisdiction) qs.set('jurisdiction', filters.jurisdiction);
      if (filters.roleFamily) qs.set('roleFamily', filters.roleFamily);
      if (filters.locationType) qs.set('locationType', filters.locationType);
      if (filters.query) qs.set('query', filters.query);
      qs.set('limit', String(filters.limit ?? 20));
      qs.set('offset', String(filters.offset ?? 0));

      const res = await fetch(`/api/talent?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to load opportunities');
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(errorMessage(e, 'Unable to load talent opportunities'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-24">
      {/* Header copy — matches existing screenshot language */}
      <div className="rounded-2xl bg-[#0f1419] border border-white/5 p-4">
        <p className="text-[10px] font-semibold tracking-widest text-amber-500/90 uppercase mb-1">
          Talent
        </p>
        <h2 className="text-xl font-serif text-white mb-2">
          Roles and operating capability
        </h2>
        <p className="text-sm text-white/60 leading-relaxed">
          Talent opportunities remain separated from counterparty records and
          are filtered to the active jurisdiction or role where possible.
        </p>
      </div>

      <TalentFilters
        filters={filters}
        onChange={(next) =>
          setFilters((prev) => ({ ...prev, ...next, offset: 0 }))
        }
      />

      {loading && (
        <div className="text-center text-white/40 py-12 text-sm">
          Loading opportunities…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <TalentEmptyState
          jurisdiction={filters.jurisdiction}
          onClearFilters={() =>
            setFilters({
              jurisdiction: activeJurisdiction,
              roleFamily: null,
              locationType: null,
              limit: 20,
              offset: 0,
            })
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40">
            {total} open role{total === 1 ? '' : 's'}
            {filters.jurisdiction ? ` · ${filters.jurisdiction}` : ''}
          </p>
          {items.map((job) => (
            <TalentJobCard
              key={job.id}
              job={job}
              onSelect={() => setSelected(job)}
            />
          ))}
        </div>
      )}

      {selected && (
        <TalentJobDetail
          job={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
