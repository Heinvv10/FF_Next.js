/**
 * Worker Pool Management
 * Manages worker availability and allocation
 */

import { WORKER_CONFIG } from '../config';

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private readonly maxWorkers: number;

  constructor(maxWorkers: number) {
    this.maxWorkers = maxWorkers;
  }

  /**
   * Add worker to pool
   */
  public addWorker(worker: Worker): void {
    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  /**
   * Get available worker
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
  public canCreateWorker(): boolean {
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
   * Wait for available worker
   */
  public async waitForAvailableWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const checkForWorker = () => {
        if (this.availableWorkers.length > 0) {
          const worker = this.availableWorkers.pop()!;
          this.busyWorkers.add(worker);
          resolve(worker);
        } else {
          setTimeout(checkForWorker, WORKER_CONFIG.WORKER_POLL_INTERVAL);
        }
      };
      checkForWorker();
    });
  }

  /**
   * Remove worker from pool
   */
  public removeWorker(worker: Worker): void {
    // Remove from all collections
    this.busyWorkers.delete(worker);

    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }

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
   * Clear all workers
   */
  public clear(): void {
    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.busyWorkers.clear();
  }

  /**
   * Get all workers
   */
  public getAllWorkers(): Worker[] {
    return [...this.workers];
  }
}
