/**
 * Message Handler
 * Manages worker message routing and callbacks
 */

import type { WorkerMessage, WorkerResponse } from '../../../types';

export class MessageHandler {
  private messageHandlers: Map<string, (response: WorkerResponse) => void> = new Map();

  /**
   * Register message handler
   */
  public registerHandler(messageId: string, handler: (response: WorkerResponse) => void): void {
    this.messageHandlers.set(messageId, handler);
  }

  /**
   * Handle incoming worker response
   */
  public handleResponse(response: WorkerResponse): void {
    const handler = this.messageHandlers.get(response.id);
    if (handler) {
      handler(response);
    }
  }

  /**
   * Send message to worker
   */
  public sendMessage(
    worker: Worker,
    message: WorkerMessage,
    handler: (response: WorkerResponse) => void
  ): void {
    this.registerHandler(message.id, handler);
    worker.postMessage(message);
  }

  /**
   * Clear all message handlers
   */
  public clear(): void {
    this.messageHandlers.clear();
  }

  /**
   * Remove specific handler
   */
  public removeHandler(messageId: string): void {
    this.messageHandlers.delete(messageId);
  }
}
