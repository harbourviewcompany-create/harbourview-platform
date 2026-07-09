export interface PublicSignal {
  id: string;
  title: string;
  summary: string;
  sources: Array<{url: string; title: string; published_at: string}>;
  confidence: number;
}