/**
 * Stock Operations Client Service
 * Client-side wrapper for stock-related API calls
 */

import { procurementApi } from '@/services/api/procurementApi';
import type { StockPosition, StockMovement, StockDashboard } from '@/services/api/procurementApi';
import type { ProcurementApiContext } from '../../index';

export class StockClientService {
  /**
   * Get stock positions with pagination
   */
  static async getStockPositions(
    context: ProcurementApiContext,
    filters?: any
  ): Promise<{ positions: StockPosition[], total: number, page: number, limit: number }> {
    const response = await procurementApi.stock.getPositions(context.projectId, filters);
    return {
      positions: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit
    };
  }

  /**
   * Get single stock position by ID
   */
  static async getStockPositionById(
    context: ProcurementApiContext,
    positionId: string
  ): Promise<StockPosition> {
    return procurementApi.stock.getPosition(context.projectId, positionId);
  }

  /**
   * Create new stock position
   */
  static async createStockPosition(
    context: ProcurementApiContext,
    positionData: Partial<StockPosition>
  ): Promise<StockPosition> {
    return procurementApi.stock.createPosition(context.projectId, positionData);
  }

  /**
   * Update existing stock position
   */
  static async updateStockPosition(
    context: ProcurementApiContext,
    positionId: string,
    updateData: Partial<StockPosition>
  ): Promise<StockPosition> {
    return procurementApi.stock.updatePosition(context.projectId, positionId, updateData);
  }

  /**
   * Get stock movements with pagination
   */
  static async getStockMovements(
    context: ProcurementApiContext,
    filters?: any
  ): Promise<{ movements: StockMovement[], total: number, page: number, limit: number }> {
    const response = await procurementApi.stock.getMovements(context.projectId, filters);
    return {
      movements: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit
    };
  }

  /**
   * Create new stock movement
   */
  static async createStockMovement(
    context: ProcurementApiContext,
    movementData: Partial<StockMovement>
  ): Promise<StockMovement> {
    return procurementApi.stock.createMovement(context.projectId, movementData);
  }

  /**
   * Process bulk stock movement
   */
  static async processBulkMovement(
    context: ProcurementApiContext,
    bulkMovementData: any
  ): Promise<{ movement: StockMovement, items: any[] }> {
    return procurementApi.stock.processBulkMovement(context.projectId, {
      ...bulkMovementData,
      userId: context.userId
    });
  }

  /**
   * Get stock dashboard data
   */
  static async getDashboardData(
    context: ProcurementApiContext
  ): Promise<StockDashboard> {
    return procurementApi.stock.getDashboard(context.projectId);
  }
}
