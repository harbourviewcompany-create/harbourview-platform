'use client';

import React, { useState, useEffect } from 'react';
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared';

export type MarketRow = [
  string,           // type (supply/equip/service)
  string,           // category/label
  string,           // title
  string,           // description
  string,           // tags
  string,           // trust bar
  string,           // action
  string            // status
];

export interface DashboardMarketplaceRows {
  cannabis?: MarketRow[];
  equipment?: MarketRow[];
  consumables?: MarketRow[];
  'new-products'?: MarketRow[];
  services?: MarketRow[];
  opportunities?: MarketRow[];
  wanted?: MarketRow[];
}

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted';

interface EduCategory {
  id: string;
  label: string;
  description?: string;
  [key: string]: unknown;
}

interface PipelineData {
  stage?: string;
  count?: number;
  [key: string]: unknown;
}

interface CountryIntel {
  iso2?: string;
  displayName?: string;
  summary?: string;
  [key: string]: unknown;
}

interface CommandCentreProps {
  signals?: DashboardSignal[];
  eduCategories?: EduCategory[];
  initialCountryIso2?: string | null;
  initialRoleId?: string | null;
  wantedCount?: number;
  marketplaceRows?: Partial<DashboardMarketplaceRows>;
  pipeline?: PipelineData;
  wantedListings?: MarketRow[];
  countryIntel?: CountryIntel;
}

export default function CommandCentre({
  signals = [],
  eduCategories = [],
  initialCountryIso2,
  initialRoleId,
  wantedCount = 0,
  marketplaceRows = {},
  pipeline,
  wantedListings = [],
  countryIntel,
}: CommandCentreProps) {
  const [activeView, setActiveView] = useState<MarketView>('cannabis');
  const [status, setStatus] = useState('Connected');

  useEffect(() => {
    // Placeholder for real-time updates
    const timer = setTimeout(() => setStatus('Live'), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Command Centre</h1>
            <p className="text-zinc-400 mt-1">Harbourview Universal Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/30">
              ● {status}
            </div>
          </div>
        </div>

        {/* Marketplace Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4">Marketplace</h2>
          <div className="text-zinc-400 text-sm mb-4">
            Initial Country: {initialCountryIso2 || 'Global'} | Role: {initialRoleId || 'None'}
          </div>
          
          {Object.keys(marketplaceRows).length > 0 ? (
            <pre className="bg-black/50 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(marketplaceRows, null, 2)}
            </pre>
          ) : (
            <p className="text-zinc-500">No marketplace data loaded yet.</p>
          )}
        </div>

        {/* Signals & Other Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h3 className="font-semibold mb-3">Intel Signals</h3>
            <p className="text-zinc-400">Recent signals: {signals.length}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h3 className="font-semibold mb-3">Education & Pipeline</h3>
            <p className="text-zinc-400">Wanted Requests: {wantedCount}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Additional custom styles */
      `}</style>
    </div>
  );
}
