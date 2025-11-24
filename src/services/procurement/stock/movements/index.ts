/**
 * Stock Movement Service - Main Orchestrator
 * Maintains backward compatibility with original StockMovementService
 * Delegates to modular processors
 */

import { BaseService, type ServiceResponse } from '../../../core/BaseService';
import type { StockMovement, StockMovementItem, DrumUsageHistory } from '@/types/procurement/stock';
import type { BulkMovementRequest } from '../StockService';
import { MovementCreator } from './core/MovementCreator';
import { MovementHealth } from './core/MovementHealth';
import { GrnProcessor } from './operations/GrnProcessor';
import { IssueProcessor } from './operations/IssueProcessor';
import type { GRNData, IssueData, TransferData } from './types/movementTypes';

/**
 * Stock Movement Service
 * Orchestrator that delegates to modular services
 */
export class StockMovementService extends BaseService {
  private movementCreator: MovementCreator;
  private movementHealth: MovementHealth;
  private grnProcessor: GrnProcessor;
  private issueProcessor: IssueProcessor;

  constructor() {
    super('StockMovementService', {
      timeout: 45000,
      retries: 1,
      cache: false,
    });

    this.movementCreator = new MovementCreator();
    this.movementHealth = new MovementHealth();
    this.grnProcessor = new GrnProcessor();
    this.issueProcessor = new IssueProcessor();
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<ServiceResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: Record<string, unknown>;
  }>> {
    return this.movementHealth.getHealthStatus();
  }

  /**
   * Create movement
   */
  async createMovement(
    movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<StockMovement>> {
    return this.movementCreator.createMovement(movementData);
  }

  /**
   * Process GRN (Goods Receipt Note)
   */
  async processGRN(
    projectId: string,
    grnData: GRNData
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    return this.grnProcessor.processGRN(projectId, grnData);
  }

  /**
   * Process stock issue
   */
  async processIssue(
    projectId: string,
    issueData: IssueData
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    return this.issueProcessor.processIssue(projectId, issueData);
  }

  /**
   * Process transfer (delegated to original implementation for now)
   */
  async processTransfer(
    transferData: TransferData
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    // TODO: Extract to TransferProcessor
    return this.error('processTransfer not yet migrated to modular architecture', 'NOT_IMPLEMENTED');
  }

  /**
   * Process bulk movement (delegated to original implementation for now)
   */
  async processBulkMovement(
    projectId: string,
    bulkData: BulkMovementRequest
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    // TODO: Extract to BulkMovementProcessor
    return this.error('processBulkMovement not yet migrated to modular architecture', 'NOT_IMPLEMENTED');
  }

  /**
   * Update drum usage (delegated to original implementation for now)
   */
  async updateDrumUsage(
    projectId: string,
    usageData: any
  ): Promise<ServiceResponse<DrumUsageHistory>> {
    // TODO: Extract to DrumUsageHandler
    return this.error('updateDrumUsage not yet migrated to modular architecture', 'NOT_IMPLEMENTED');
  }
}

// Export for backward compatibility
export default StockMovementService;

// Export individual services for direct access
export {
  MovementCreator,
  MovementHealth,
  GrnProcessor,
  IssueProcessor
};

// Export types
export type { GRNData, IssueData, TransferData } from './types/movementTypes';
