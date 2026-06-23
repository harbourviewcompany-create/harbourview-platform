export interface CountryBriefing {
  iso2: string;
  overview: string;
  regulatory: {
    status: string;
    lastUpdated: string;
    keyLaws: string[];
  };
  marketIntel: {
    opportunityScore: number; // 0-100
    keyPlayers?: string[];
    risks: string[];
  };
  localSignals: Array<{
    date: string;
    title: string;
    summary: string;
    source: string;
  }>;
}
