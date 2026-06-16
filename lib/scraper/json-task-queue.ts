import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export interface ScraperTask {
  id: string;
  source_id: string; // References ScraperSourceConfig.id
  status: 'pending' | 'processing' | 'completed' | 'failed';
  locked_by?: string;
  locked_until?: number;
  next_crawl_at: number;
  consecutive_failures: number;
  last_error?: string;
}

export class JsonTaskQueue {
  private filePath: string;
  private memoryQueue: Map<string, ScraperTask> = new Map();
  private isLoaded: boolean = false;

  constructor(filename: string = 'scraper-task-queue.json') {
    // In a Next.js environment, we persist to the tmp directory or a persistent mounted volume
    // For local dev, project root is fine.
    const dataDir = path.join(process.cwd(), '.data');
    this.filePath = path.join(dataDir, filename);
  }

  /**
   * Initializes the queue file if it doesn't exist and loads into memory.
   */
  async init() {
    if (this.isLoaded) return;
    
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    if (existsSync(this.filePath)) {
      try {
        const raw = await fs.readFile(this.filePath, 'utf-8');
        const tasks: ScraperTask[] = JSON.parse(raw);
        for (const task of tasks) {
          this.memoryQueue.set(task.id, task);
        }
      } catch (err) {
        console.error('Failed to parse JSON task queue, starting fresh.', err);
      }
    } else {
      await this.persist();
    }
    
    this.isLoaded = true;
  }

  private async persist() {
    const tasks = Array.from(this.memoryQueue.values());
    await fs.writeFile(this.filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  }

  /**
   * Adds or updates a task in the queue.
   */
  async enqueue(task: Omit<ScraperTask, 'status' | 'consecutive_failures'>) {
    await this.init();
    
    const existing = this.memoryQueue.get(task.id);
    const newTask: ScraperTask = {
      ...task,
      status: existing?.status === 'processing' ? 'processing' : 'pending',
      consecutive_failures: existing?.consecutive_failures || 0,
    };
    
    this.memoryQueue.set(newTask.id, newTask);
    await this.persist();
  }

  /**
   * Acquires a batch of tasks that are ready to be crawled.
   * Locks them for the specified worker.
   */
  async acquireTasks(limit: number, workerId: string, leaseDurationMs: number = 5 * 60 * 1000): Promise<ScraperTask[]> {
    await this.init();
    
    const now = Date.now();
    const availableTasks: ScraperTask[] = [];

    // Prioritize processing
    for (const [_, task] of this.memoryQueue.entries()) {
      if (availableTasks.length >= limit) break;

      const isDue = task.next_crawl_at <= now;
      const isUnlocked = !task.locked_until || task.locked_until < now;

      if (isDue && isUnlocked && (task.status === 'pending' || task.status === 'failed')) {
        availableTasks.push(task);
      }
    }

    // Lock acquired tasks
    for (const task of availableTasks) {
      task.status = 'processing';
      task.locked_by = workerId;
      task.locked_until = now + leaseDurationMs;
      this.memoryQueue.set(task.id, task);
    }

    if (availableTasks.length > 0) {
      await this.persist();
    }

    return availableTasks;
  }

  /**
   * Marks a task as successfully completed.
   */
  async completeTask(taskId: string, cadenceHours: number) {
    await this.init();
    const task = this.memoryQueue.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.locked_by = undefined;
    task.locked_until = undefined;
    task.consecutive_failures = 0;
    task.next_crawl_at = Date.now() + (cadenceHours * 60 * 60 * 1000);
    task.last_error = undefined;

    this.memoryQueue.set(task.id, task);
    await this.persist();
  }

  /**
   * Marks a task as failed, triggering exponential backoff.
   */
  async failTask(taskId: string, errorMsg: string) {
    await this.init();
    const task = this.memoryQueue.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.locked_by = undefined;
    task.locked_until = undefined;
    task.consecutive_failures += 1;
    task.last_error = errorMsg;

    // Exponential backoff
    const backoffHours = Math.pow(2, Math.min(task.consecutive_failures, 8)); // Max backoff 256h
    task.next_crawl_at = Date.now() + (backoffHours * 60 * 60 * 1000);

    this.memoryQueue.set(task.id, task);
    await this.persist();
  }
}
