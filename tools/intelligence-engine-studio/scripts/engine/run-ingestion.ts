import { IntelligenceOrchestrator } from '../../lib/intelligence-engine/orchestrator';

async function main() {
  console.log('=== HarbourView Global Data Engine ===');
  const engine = new IntelligenceOrchestrator();
  
  // Pull all active, crawlable targets
  const targets = await engine.getTargets(500);
  
  console.log(`Loaded ${targets.length} targets from the registry.`);
  
  if (targets.length === 0) {
    console.log('No active targets found. Have you seeded the source registry?');
    process.exit(0);
  }

  await engine.runExtraction(targets);
  
  console.log('=== Run Completed ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal Engine Error:', error);
  process.exit(1);
});
