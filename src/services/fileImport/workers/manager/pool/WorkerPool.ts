/**
 * Worker Pool
 * Manages the pool of available and busy workers
 */

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private readonly maxWorkers: number;

  constructor(maxWorkers?: number) {
    // Default to half of available CPU cores, minimum 2
    this.maxWorkers = maxWorkers || Math.max(2, Math.floor(navigator.hardwareConcurrency / 2));
  }

  /**
   * Add worker to pool
   */
  public addWorker(worker: Worker): void {
    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  /**
   * Get available worker from pool
   */
  public getAvailableWorker(): Worker | null {
    if (this.availableWorkers.length > 0) {
      const worker = this.availableWorkers.pop()!;
      this.busyWorkers.add(worker);
      return worker;
    }
    return null;
  }

  /**
   * Check if pool can create more workers
   */
  public canCreateMore(): boolean {
    return this.workers.length < this.maxWorkers;
  }

  /**
   * Release worker back to available pool
   */
  public releaseWorker(worker: Worker): void {
    if (this.busyWorkers.has(worker)) {
      this.busyWorkers.delete(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Remove worker from pool
   */
  public removeWorker(worker: Worker): void {
    // Remove from busy workers
    this.busyWorkers.delete(worker);

    // Remove from available workers
    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }

    // Remove from all workers
    const workerIndex = this.workers.indexOf(worker);
    if (workerIndex > -1) {
      this.workers.splice(workerIndex, 1);
    }
  }

  /**
   * Get pool status
   */
  public getStatus(): {
    total: number;
    available: number;
    busy: number;
    maxWorkers: number;
  } {
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      busy: this.busyWorkers.size,
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Get all workers
   */
  public getAllWorkers(): Worker[] {
    return [...this.workers];
  }

  /**
   * Clear pool
   */
  public clear(): void {
    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.busyWorkers.clear();
  }

  /**
   * Wait for available worker
   */
  public async waitForAvailableWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const checkForWorker = () => {
        const worker = this.getAvailableWorker();
        if (worker) {
          resolve(worker);
        } else {
          setTimeout(checkForWorker, 100);
        }
      };
      checkForWorker();
    });
  }
}
