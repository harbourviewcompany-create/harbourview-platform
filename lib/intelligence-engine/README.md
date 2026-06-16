# Global Intelligence Engine: 192+ Country Rollout Architecture

This module provides a robust, scalable Node.js/TypeScript pipeline to continuously ingest regulatory, medical, and market data for all 192+ active HarbourView jurisdictions.

## Architecture

1. **Deep Matrix Discovery Pipeline (`scripts/engine/run-deep-discovery.ts`)**
   - **Taxonomy Mapping (`lib/intelligence-engine/deep-discovery/matrix.ts`)**: Defines an exhaustive 4-pillar taxonomy (Regulatory, Commercial, Scientific, Infrastructure) covering every institution type relevant to the global industry.
   - **AI Entity Resolution (`lib/intelligence-engine/deep-discovery/entity-resolver.ts`)**: Translates generic institutional roles into exact, local government/commercial entities (e.g., mapping "Narcotics Board" to "BfArM" in Germany) utilizing HarbourView Inference Endpoints.
   - Pushes high-fidelity, highly-targeted institutions into the `source_expansion_coverage_queue`.

2. **Multi-Adapter Core Orchestrator (`lib/intelligence-engine/orchestrator.ts`)**
   - Batches active locations from `source_registry`.
   - Distributes fetching across advanced adapters:
     - `HTMLDataAdapter`: Lightweight diff tracking.
     - `PlaywrightDataAdapter`: For SPAs and JS-rendered government portals.
     - `PDFDataAdapter`: (Planned) For parsing official national legislative gazettes.
   - Generates a `content_hash` from the DOM snippet. Aborts early if unchanged.
   - Pushes raw diffs to `source_snapshots`.

3. **HuggingFace Pipeline (`lib/intelligence-engine/adapters/ai-extractor.ts`)**
   - Submits `content_hash` diffs that enter the `hv_import_staging` table directly to HarbourView's HuggingFace Inference Endpoints.
   - Strict Zod validation guarantees the response structure (`SignalDTOSchema`).
   - Categorizes findings (Regulatory, Market, Trade) and determines "Impact Level" metrics before pushing to the internal `signals` DB table which is exposed to the `operator/analyst` Command Centre Dashboard.

## Integration Steps for Existing Repo

To drop this into your existing codebase:

1. Copy the `lib/intelligence-engine/` folder into `harbourview-platform/lib/`.
2. Copy `scripts/engine/run-ingestion.ts` and `scripts/engine/global-discovery.ts` into your `scripts/` directory.
3. Hook the tasks into your Vercel Cron jobs or a containerized worker depending on your cadence. Note: Since `source_registry` has a `cadence_hours` flag, it's preferable to run this frequently.

*For package.json*
```json
"scripts": {
  "intelligence:discover": "tsx scripts/engine/global-discovery.ts",
  "intelligence:ingest": "tsx scripts/engine/run-ingestion.ts"
}
```
