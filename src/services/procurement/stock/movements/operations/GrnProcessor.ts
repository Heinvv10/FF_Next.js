/**
 * GRN Processor
 * Handles Goods Receipt Note (GRN) processing
 */

import { BaseService, type ServiceResponse } from '../../../../core/BaseService';
import { db } from '@/lib/neon/connection';
import {
  stockPositions,
  stockMovements,
  stockMovementItems
} from '@/lib/neon/schema/procurement/stock.schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { StockMovement, StockMovementItem, MovementTypeType } from '@/types/procurement/stock';
import { StockMovementError } from '../../../errors/stock';
import { mapStockMovement, mapStockMovementItem } from '../utils/movementMappers';
import type { GRNData } from '../types/movementTypes';

export class GrnProcessor extends BaseService {
  constructor() {
    super('GrnProcessor', {
      timeout: 45000,
      retries: 1,
      cache: false,
    });
  }

  /**
   * Process Goods Receipt Note (GRN)
   */
  async processGRN(
    projectId: string,
    grnData: GRNData
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    try {
      return await db.transaction(async (tx) => {
        // Create GRN movement
        const movementId = uuidv4();
        const movementRecord = {
          id: movementId,
          projectId: projectId,
          movementType: 'GRN' as MovementTypeType,
          referenceNumber: grnData.referenceNumber,
          referenceType: 'PO',
          referenceId: grnData.poNumber,
          fromLocation: grnData.supplierName,
          toLocation: 'WAREHOUSE',
          fromProjectId: null,
          toProjectId: null,
          status: 'completed',
          movementDate: grnData.receivedDate,
          confirmedAt: grnData.receivedDate,
          requestedBy: grnData.receivedBy,
          authorizedBy: grnData.receivedBy,
          processedBy: grnData.receivedBy,
          notes: `GRN from supplier: ${grnData.supplierName}`,
          reason: 'Goods Receipt',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await tx.insert(stockMovements).values(movementRecord);

        const processedItems: StockMovementItem[] = [];

        // Process each item
        for (const item of grnData.items) {
          const itemId = uuidv4();

          // Create movement item record
          const movementItem = {
            id: itemId,
            stockMovementId: movementId,
            stockPositionId: '', // Will be set after creating/updating position
            projectId: projectId,
            itemCode: item.itemCode,
            description: item.itemName,
            plannedQuantity: item.plannedQuantity.toString(),
            actualQuantity: item.receivedQuantity.toString(),
            uom: 'EA', // Default UOM
            unitCost: item.unitCost.toString(),
            totalCost: (item.receivedQuantity * item.unitCost).toString(),
            lotNumbers: item.lotNumbers || null,
            serialNumbers: item.serialNumbers || null,
            expiryDate: null,
            qualityCheckRequired: item.qualityCheckRequired || false,
            qualityCheckStatus: item.qualityCheckRequired ? 'pending' : 'passed',
            qualityCheckNotes: item.qualityNotes,
            itemStatus: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Check if stock position exists
          const [existingPosition] = await tx
            .select()
            .from(stockPositions)
            .where(
              and(
                eq(stockPositions.projectId, projectId),
                eq(stockPositions.itemCode, item.itemCode)
              )
            )
            .limit(1);

          let positionId: string;

          if (existingPosition) {
            // Update existing position
            positionId = existingPosition.id;
            const currentOnHand = Number(existingPosition.onHandQuantity);
            const currentReserved = Number(existingPosition.reservedQuantity);
            const currentCost = Number(existingPosition.averageUnitCost) || 0;

            const newOnHand = currentOnHand + item.receivedQuantity;
            const newAvailable = newOnHand - currentReserved;

            // Calculate weighted average cost
            const currentValue = currentOnHand * currentCost;
            const newItemValue = item.receivedQuantity * item.unitCost;
            const newAverageCost = newOnHand > 0 ? (currentValue + newItemValue) / newOnHand : item.unitCost;
            const newTotalValue = newOnHand * newAverageCost;

            await tx
              .update(stockPositions)
              .set({
                onHandQuantity: newOnHand.toString(),
                availableQuantity: newAvailable.toString(),
                averageUnitCost: newAverageCost.toString(),
                totalValue: newTotalValue.toString(),
                lastMovementDate: grnData.receivedDate,
                updatedAt: new Date(),
              })
              .where(eq(stockPositions.id, existingPosition.id));
          } else {
            // Create new position
            positionId = uuidv4();
            const newPosition = {
              id: positionId,
              projectId: projectId,
              itemCode: item.itemCode,
              itemName: item.itemName,
              description: item.itemName,
              uom: 'EA', // Default UOM
              onHandQuantity: item.receivedQuantity.toString(),
              reservedQuantity: '0',
              availableQuantity: item.receivedQuantity.toString(),
              inTransitQuantity: '0',
              averageUnitCost: item.unitCost.toString(),
              totalValue: (item.receivedQuantity * item.unitCost).toString(),
              warehouseLocation: 'WAREHOUSE',
              lastMovementDate: grnData.receivedDate,
              isActive: true,
              stockStatus: 'normal',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await tx.insert(stockPositions).values(newPosition);
          }

          // Update movement item with position ID
          movementItem.stockPositionId = positionId;
          await tx.insert(stockMovementItems).values(movementItem);

          processedItems.push(mapStockMovementItem(movementItem));
        }

        return this.success({
          movement: mapStockMovement(movementRecord),
          items: processedItems,
        });
      });
    } catch (error) {
      if (error instanceof StockMovementError) {
        throw error;
      }
      return this.handleError(error, 'processGRN');
    }
  }
}
