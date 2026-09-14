'use client';

import { useRouter } from 'next/navigation';

export interface OpportunityPayload {
  id?: string;
  country?: string;
  signalType?: string;
  score?: number;
  source?: string;
  [key: string]: any;
}

/**
 * Routes the user into the intake / routing flow with context pre-filled.
 * Keeps the public/private boundary intact by only passing public-safe fields.
 */
export function routeToOpportunity(item: OpportunityPayload) {
  const params = new URLSearchParams();
  params.set('source', 'command_center_chart');

  if (item.country) params.set('country', item.country);
  if (item.signalType) params.set('signalType', item.signalType);
  if (item.score) params.set('score', String(item.score));
  if (item.id) params.set('opportunityId', item.id);

  // Prefer the existing intake / globe-router flow
  if (typeof window !== 'undefined') {
    window.location.href = `/intake?${params.toString()}`;
  }
}

/**
 * Hook version for components that already use the App Router.
 */
export function useRouteToOpportunity() {
  const router = useRouter();

  return (item: OpportunityPayload) => {
    const params = new URLSearchParams();
    params.set('source', 'command_center_chart');

    if (item.country) params.set('country', item.country);
    if (item.signalType) params.set('signalType', item.signalType);
    if (item.score) params.set('score', String(item.score));
    if (item.id) params.set('opportunityId', item.id);

    router.push(`/intake?${params.toString()}`);
  };
}
