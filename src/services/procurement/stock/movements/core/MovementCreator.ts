/**
 * Movement Creator
 * Core movement creation logic
 */

import { BaseService, type ServiceResponse } from '../../../../core/BaseService';
import { db } from '@/lib/neon/connection';
import { stockMovements } from '@/lib/neon/schema/procurement/stock.schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { StockMovement } from '@/types/procurement/stock';
import { StockMovementError } from '../../../errors/stock';
import { mapStockMovement } from '../utils/movementMappers';

export class MovementCreator extends BaseService {
  constructor() {
    super('MovementCreator', {
      timeout: 45000,
      retries: 1,
      cache: false,
    });
  }

  /**
   * Create a stock movement record
   */
  async createMovement(
    movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<StockMovement>> {
    try {
      // Validate required fields
      if (!movementData.projectId || !movementData.movementType || !movementData.referenceNumber) {
        throw new StockMovementError(
          'Missing required fields: projectId, movementType, referenceNumber',
          'adjustment',
          movementData.referenceNumber || '',
          0
        );
      }

      // Check for duplicate reference number in project
      const [existingMovement] = await db
        .select()
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.projectId, movementData.projectId),
            eq(stockMovements.referenceNumber, movementData.referenceNumber)
          )
        )
        .limit(1);

      if (existingMovement) {
        throw new StockMovementError(
          `Movement with reference number ${movementData.referenceNumber} already exists`,
          'adjustment',
          movementData.referenceNumber,
          0
        );
      }

      // Create movement record
      const newMovement = {
        id: uuidv4(),
        ...movementData,
        status: movementData.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(stockMovements).values(newMovement);

      return this.success(mapStockMovement(newMovement));
    } catch (error) {
      if (error instanceof StockMovementError) {
        throw error;
      }
      return this.handleError(error, 'createMovement');
    }
  }
}
