/**
 * Worker Error Handler
 * Handles worker errors and cleanup
 */

import { log } from '@/lib/logger';
import { WorkerPool } from '../pool/WorkerPool';
import { WorkerLifecycle } from '../pool/WorkerLifecycle';

export class WorkerErrorHandler {
  private workerPool: WorkerPool;

  constructor(workerPool: WorkerPool) {
    this.workerPool = workerPool;
  }

  /**
   * Handle worker error
   */
  public handleError(worker: Worker, error: ErrorEvent): void {
    log.error('Worker error:', { data: error }, 'WorkerManager');

    // Remove worker from pool
    this.workerPool.removeWorker(worker);

    // Terminate worker
    WorkerLifecycle.terminateWorker(worker);
  }

  /**
   * Create error handler function for a worker
   */
  public createErrorHandler(worker: Worker): (error: ErrorEvent) => void {
    return (error: ErrorEvent) => {
      this.handleError(worker, error);
    };
  }
}
