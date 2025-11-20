/**
 * Worker Lifecycle Management
 * Handles worker creation and termination
 */

import type { WorkerResponse } from '../../../types';
import { log } from '@/lib/logger';
import { getWorkerCode } from '../worker-code/workerCodeTemplate';

export class WorkerLifecycle {
  private onMessage: (worker: Worker, response: WorkerResponse) => void;
  private onError: (worker: Worker, error: ErrorEvent) => void;

  constructor(
    onMessage: (worker: Worker, response: WorkerResponse) => void,
    onError: (worker: Worker, error: ErrorEvent) => void
  ) {
    this.onMessage = onMessage;
    this.onError = onError;
  }

  /**
   * Create new Web Worker
   */
  public async createWorker(): Promise<Worker> {
    // Create worker from blob to avoid bundling issues
    const workerCode = getWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    const worker = new Worker(workerUrl);

    // Set up message handling
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      this.onMessage(worker, response);
    };

    worker.onerror = (error: ErrorEvent) => {
      log.error('Worker error:', { data: error }, 'WorkerManager');
      this.onError(worker, error);
    };

    return worker;
  }

  /**
   * Terminate worker
   */
  public terminateWorker(worker: Worker): void {
    worker.terminate();
  }

  /**
   * Terminate all workers
   */
  public terminateAll(workers: Worker[]): void {
    for (const worker of workers) {
      worker.terminate();
    }
  }
}
