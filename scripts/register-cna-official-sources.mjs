import { CNA_OFFICIAL_SOURCES, buildRegistrationSnapshotSeed, buildSourceRegistrationPayload } from '../lib/cna/source-registry.ts';

const payload = CNA_OFFICIAL_SOURCES.map((source) => ({
  source: buildSourceRegistrationPayload(source),
  registrationSnapshot: buildRegistrationSnapshotSeed(source),
}));

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), officialSources: payload }, null, 2));
