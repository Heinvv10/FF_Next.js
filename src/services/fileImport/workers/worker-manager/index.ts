/**
 * Worker Manager - Main Orchestrator
 * Manages lifecycle and communication with file processing Web Workers
 */

import type { WorkerMessage, WorkerResponse } from '../../types';
import { getMaxWorkers } from './config';
import { WorkerPool } from './pool/WorkerPool';
import { WorkerLifecycle } from './lifecycle/WorkerLifecycle';
import { MessageHandler } from './messaging/MessageHandler';
import { WorkerErrorHandler } from './error-handling/WorkerErrorHandler';

export class WorkerManager {
  private pool: WorkerPool;
  private lifecycle: WorkerLifecycle;
  private messageHandler: MessageHandler;

  constructor() {
    const maxWorkers = getMaxWorkers();
    this.pool = new WorkerPool(maxWorkers);
    this.messageHandler = new MessageHandler();

    // Initialize lifecycle with callbacks
    this.lifecycle = new WorkerLifecycle(
      (worker, response) => this.handleWorkerMessage(worker, response),
      (worker, error) => this.handleWorkerError(worker, error)
    );

    this.initializeWorkers();
  }

  /**
   * Initialize Web Workers pool
   */
  private initializeWorkers(): void {
    // For now, we'll create workers on-demand to avoid bundling issues
    // In a production setup, you'd want to pre-create the worker pool
  }

  /**
   * Get available worker or create new one
   */
  public async getWorker(): Promise<Worker> {
    // Check for available worker
    const availableWorker = this.pool.getAvailableWorker();
    if (availableWorker) {
      return availableWorker;
    }

    // Create new worker if under limit
    if (this.pool.canCreateWorker()) {
      const worker = await this.lifecycle.createWorker();
      this.pool.addWorker(worker);
      return this.pool.getAvailableWorker()!;
    }

    // Wait for worker to become available
    return this.pool.waitForAvailableWorker();
  }

  /**
   * Release worker back to available pool
   */
  public releaseWorker(worker: Worker): void {
    this.pool.releaseWorker(worker);
  }

  /**
   * Send message to worker
   */
  public sendMessage(
    worker: Worker,
    message: WorkerMessage,
    handler: (response: WorkerResponse) => void
  ): void {
    this.messageHandler.sendMessage(worker, message, handler);
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(worker: Worker, response: WorkerResponse): void {
    this.messageHandler.handleResponse(response);
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    WorkerErrorHandler.handleError(worker, error);
    this.pool.removeWorker(worker);
    this.lifecycle.terminateWorker(worker);
  }

  /**
   * Get worker pool status
   */
  public getStatus(): {
    total: number;
    available: number;
    busy: number;
    maxWorkers: number;
  } {
    return this.pool.getStatus();
  }

  /**
   * Shutdown all workers
   */
  public async shutdown(): Promise<void> {
    // Clear message handlers
    this.messageHandler.clear();

    // Terminate all workers
    const allWorkers = this.pool.getAllWorkers();
    this.lifecycle.terminateAll(allWorkers);

    // Clear pool
    this.pool.clear();
  }
}
