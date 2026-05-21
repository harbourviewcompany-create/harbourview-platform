export type CnaParserInput = {
  sourceKey: string;
  sourceUrl: string;
  contentType: 'html' | 'pdf';
  content: string | Buffer;
};

export type CnaParserResult = {
  parserVersion: string;
  status: 'placeholder';
  records: never[];
  notes: string[];
};

export function parseUnodcCnaPagePlaceholder(input: CnaParserInput): CnaParserResult {
  if (input.contentType !== 'html') {
    throw new Error('UNODC CNA page parser expects html content.');
  }

  return {
    parserVersion: 'unodc-cna-page-placeholder-v0',
    status: 'placeholder',
    records: [],
    notes: [
      `Parser placeholder registered for ${input.sourceKey}.`,
      'Implementation boundary: fetch, parse, and record extraction must run in controlled ingestion jobs only.',
    ],
  };
}

export function parseUnodcCnaPdfPlaceholder(input: CnaParserInput): CnaParserResult {
  if (input.contentType !== 'pdf') {
    throw new Error('UNODC CNA PDF parser expects pdf content.');
  }

  return {
    parserVersion: 'unodc-cna-pdf-placeholder-v0',
    status: 'placeholder',
    records: [],
    notes: [
      `Parser placeholder registered for ${input.sourceKey}.`,
      'PDF extraction is intentionally deferred until the ingestion runner has storage, hashing, and review gates wired.',
    ],
  };
}
