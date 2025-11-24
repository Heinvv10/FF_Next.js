/**
 * Stock Client Module
 * Stock operations for procurement client service
 */

import { procurementApi } from '@/services/api/procurementApi';
import type { StockPosition, StockMovement, StockDashboard } from '@/services/api/procurementApi';
import type { ProcurementApiContext } from '../../index';

export class StockClient {
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

  static async getStockPositionById(
    context: ProcurementApiContext,
    positionId: string
  ): Promise<StockPosition> {
    return procurementApi.stock.getPosition(context.projectId, positionId);
  }

  static async createStockPosition(
    context: ProcurementApiContext,
    positionData: Partial<StockPosition>
  ): Promise<StockPosition> {
    return procurementApi.stock.createPosition(context.projectId, positionData);
  }

  static async updateStockPosition(
    context: ProcurementApiContext,
    positionId: string,
    updateData: Partial<StockPosition>
  ): Promise<StockPosition> {
    return procurementApi.stock.updatePosition(context.projectId, positionId, updateData);
  }

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

  static async createStockMovement(
    context: ProcurementApiContext,
    movementData: Partial<StockMovement>
  ): Promise<StockMovement> {
    return procurementApi.stock.createMovement(context.projectId, movementData);
  }

  static async processBulkMovement(
    context: ProcurementApiContext,
    bulkMovementData: any
  ): Promise<{ movement: StockMovement, items: any[] }> {
    return procurementApi.stock.processBulkMovement(context.projectId, {
      ...bulkMovementData,
      userId: context.userId
    });
  }

  static async getDashboardData(
    context: ProcurementApiContext
  ): Promise<StockDashboard> {
    return procurementApi.stock.getDashboard(context.projectId);
  }
}
