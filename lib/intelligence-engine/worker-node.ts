import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DistributedTaskQueue } from './queue/task-queue';
import { CircuitBreaker } from './queue/circuit-breaker';
import { HTMLDataAdapter } from './adapters/html-fetcher';
import { PlaywrightDataAdapter } from './adapters/playwright-fetcher';
import { ScrapeTarget, ScraperResult } from './types';
import crypto from 'crypto';

export class WorkerNode {
  private supabase: SupabaseClient;
  private queue: DistributedTaskQueue;
  private circuitBreaker: CircuitBreaker;
  
  private htmlAdapter: HTMLDataAdapter;
  private playwrightAdapter: PlaywrightDataAdapter;
  
  private workerId: string;
  private isRunning: boolean = false;

  constructor(workerId?: string) {
    this.workerId = workerId || `worker-${crypto.randomUUID().slice(0, 8)}`;
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    this.supabase = createClient(url, key, { auth: { persistSession: false } });
    this.queue = new DistributedTaskQueue(this.supabase);
    this.circuitBreaker = new CircuitBreaker();
    
    this.htmlAdapter = new HTMLDataAdapter();
    this.playwrightAdapter = new PlaywrightDataAdapter();
  }

  /**
   * Main execution loop for the long-running worker daemon.
   */
  async start(pollIntervalMs: number = 10000) {
    this.isRunning = true;
    console.log(`[WorkerNode:${this.workerId}] Booting intelligence extraction node...`);

    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (err: any) {
        console.error(`[WorkerNode:${this.workerId}] Exhaustive loop error:`, err);
      }
      
      // Wait before polling again to prevent DB hammering
      await new Promise(res => setTimeout(res, pollIntervalMs));
    }
  }

  stop() {
    console.log(`[WorkerNode:${this.workerId}] Initiating graceful shutdown...`);
    this.isRunning = false;
  }

  private async processBatch() {
    // Acquire a batch of up to 10 targets utilizing distributed locking
    const targets = await this.queue.acquireTargets(10, this.workerId);
    
    if (targets.length === 0) {
      return; 
    }

    console.log(`[WorkerNode:${this.workerId}] Acquired ${targets.length} targets. Engaging network layer...`);

    // Process identically loaded targets concurrently
    const promises = targets.map(target => this.processTarget(target));
    await Promise.allSettled(promises);
  }

  private async processTarget(target: ScrapeTarget) {
    let domain: string;
    try {
      domain = new URL(target.base_url).hostname;
    } catch {
      await this.queue.markFailure(target.id, 'Invalid URL format', 1);
      return;
    }

    if (this.circuitBreaker.isLocked(domain)) {
       console.log(`[WorkerNode] Skipping ${target.base_url} (Domain Circuit Broken)`);
       // Re-queue for later implicitly, mark minor failure
       await this.queue.markFailure(target.id, 'Domain Circuit Broken', 1);
       return;
    }

    try {
      console.log(`[WorkerNode] Fetching: ${target.source_name} [${target.adapter_type}]`);
      
      const adapter = target.adapter_type === 'playwright_full' 
        ? this.playwrightAdapter 
        : this.htmlAdapter;

      const result = await adapter.fetch(target);

      if (result.status === 'success') {
        this.circuitBreaker.recordSuccess(domain);
        await this.saveSnapshot(result);
        
        // Push content forward to AI processing extraction phase (staged locally)
        await this.stageForAI(result, target);
        
        // Complete the task and reset failure states
        await this.queue.markSuccess(target.id, target.cadence_hours);
      } else {
        throw new Error(result.error_message || 'Unknown network stream failure');
      }

    } catch (err: any) {
      this.circuitBreaker.recordFailure(domain);
      console.error(`[WorkerNode] Error processing ${target.source_name}:`, err.message);
      
      // Pass the failure down the queue for tracking and backoff assignment
      await this.queue.markFailure(target.id, err.message, 1); // Real system queries current consecutive failure state
    }
  }

  private async saveSnapshot(result: ScraperResult) {
    await this.supabase.from('source_snapshots').insert({
      source_id: result.target_id,
      captured_at: result.timestamp,
      raw_html: result.raw_content,
      content_hash: result.content_hash,
      processing_status: 'pending_extraction', // Queued for AI pipeline phase Next
    });
  }

  private async stageForAI(result: ScraperResult, target: ScrapeTarget) {
    // Quick dedupe check
    const { data } = await this.supabase
      .from('hv_import_staging')
      .select('id')
      .eq('content_hash', result.content_hash)
      .single();

    if (!data) {
      await this.supabase.from('hv_import_staging').insert({
        source_id: target.id,
        country_code: target.country_code,
        content_hash: result.content_hash,
        raw_text: result.raw_content,
        processing_status: 'staged',
      });
    }
  }
}
