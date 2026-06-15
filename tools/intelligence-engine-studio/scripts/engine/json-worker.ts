import { globalSourceRegistry } from '../../lib/scraper/registry';
import { JsonTaskQueue } from '../../lib/scraper/json-task-queue';
import os from 'os';

async function bootstrap() {
  console.log('=== HarbourView Lightweight JSON Task Worker ===');
  const workerId = `worker-${os.hostname()}-${process.pid}`;
  const queue = new JsonTaskQueue();

  console.log(`Booting JSON-backed task queue with worker ID: ${workerId}`);
  await queue.init();

  // Initially populate the queue with active sources from the registry
  console.log('Synchronizing source registries with task queue...');
  const sources = globalSourceRegistry.getAll();
  
  for (const source of sources) {
    if (source.is_active) {
      await queue.enqueue({
        id: `task-${source.id}`,
        source_id: source.id,
        next_crawl_at: Date.now(), // Force immediate run for demo purposes
      });
    }
  }

  console.log('Sync complete. Starting execution loop...');

  // Simple execution loop to process available tasks
  setInterval(async () => {
    try {
      // 1. Acquire tasks
      const batch = await queue.acquireTasks(5, workerId);
      
      if (batch.length > 0) {
        console.log(`\n[${workerId}] Acquired ${batch.length} tasks for processing...`);
        
        // 2. Process tasks concurrently
        await Promise.all(batch.map(async (task) => {
          const config = globalSourceRegistry.get(task.source_id);
          if (!config) {
            await queue.failTask(task.id, 'Source configuration missing from registry');
            return;
          }

          console.log(` -> Scraping [${config.country_code}] ${config.source_name} via ${config.adapter_type}`);
          
          try {
            // Simulate scrape delay and execution logic here
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Randomly fail sometimes to demonstrate backoff logic
            if (Math.random() > 0.8) {
              throw new Error('Simulated network timeout');
            }

            console.log(` <- Success: [${config.country_code}] ${config.source_name}`);
            await queue.completeTask(task.id, config.cadence_hours);

          } catch (err: any) {
             console.error(` <- Failed: [${config.country_code}] ${config.source_name} - ${err.message}`);
             await queue.failTask(task.id, err.message);
          }
        }));
      }
    } catch (e) {
      console.error('Execution loop error:', e);
    }
  }, 3000); // Poll every 3 seconds
}

bootstrap().catch(console.error);
