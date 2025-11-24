/**
 * Issue Processor
 * Handles stock issue processing
 */

import { BaseService, type ServiceResponse } from '../../../../core/BaseService';
import { db } from '@/lib/neon/connection';
import {
  stockPositions,
  stockMovements,
  stockMovementItems
} from '@/lib/neon/schema/procurement/stock.schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { StockMovement, StockMovementItem, MovementTypeType } from '@/types/procurement/stock';
import { StockMovementError, InsufficientStockError } from '../../../errors/stock';
import { mapStockMovement, mapStockMovementItem } from '../utils/movementMappers';
import type { IssueData } from '../types/movementTypes';

export class IssueProcessor extends BaseService {
  constructor() {
    super('IssueProcessor', {
      timeout: 45000,
      retries: 1,
      cache: false,
    });
  }

  /**
   * Process stock issue
   */
  async processIssue(
    projectId: string,
    issueData: IssueData
  ): Promise<ServiceResponse<{ movement: StockMovement, items: StockMovementItem[] }>> {
    try {
      return await db.transaction(async (tx) => {
        // Validate stock availability for all items first
        for (const item of issueData.items) {
          const [position] = await tx
            .select()
            .from(stockPositions)
            .where(
              and(
                eq(stockPositions.projectId, projectId),
                eq(stockPositions.itemCode, item.itemCode),
                eq(stockPositions.isActive, true)
              )
            )
            .limit(1);

          if (!position) {
            throw new InsufficientStockError(
              item.itemCode,
              item.issuedQuantity,
              0
            );
          }

          const availableQuantity = Number(position.availableQuantity);
          if (availableQuantity < item.issuedQuantity) {
            throw new InsufficientStockError(
              item.itemCode,
              item.issuedQuantity,
              availableQuantity
            );
          }
        }

        // Create issue movement
        const movementId = uuidv4();
        const movementRecord = {
          id: movementId,
          projectId: projectId,
          movementType: 'ISSUE' as MovementTypeType,
          referenceNumber: issueData.referenceNumber,
          referenceType: 'WORK_ORDER',
          referenceId: issueData.workOrderNumber,
          fromLocation: 'WAREHOUSE',
          toLocation: issueData.issuedTo,
          fromProjectId: null,
          toProjectId: null,
          status: 'completed',
          movementDate: issueData.issueDate,
          confirmedAt: issueData.issueDate,
          requestedBy: issueData.issuedBy,
          authorizedBy: issueData.issuedBy,
          processedBy: issueData.issuedBy,
          notes: null,
          reason: issueData.purpose,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await tx.insert(stockMovements).values(movementRecord);

        const processedItems: StockMovementItem[] = [];

        // Process each item
        for (const item of issueData.items) {
          const itemId = uuidv4();

          // Get current position
          const [position] = await tx
            .select()
            .from(stockPositions)
            .where(
              and(
                eq(stockPositions.projectId, projectId),
                eq(stockPositions.itemCode, item.itemCode)
              )
            )
            .limit(1);

          // Calculate new quantities
          const currentOnHand = Number(position!.onHandQuantity);
          const currentReserved = Number(position!.reservedQuantity);
          const newOnHand = currentOnHand - item.issuedQuantity;
          const newAvailable = newOnHand - currentReserved;

          // Update position
          await tx
            .update(stockPositions)
            .set({
              onHandQuantity: newOnHand.toString(),
              availableQuantity: newAvailable.toString(),
              totalValue: sql`${stockPositions.averageUnitCost} * ${newOnHand}`,
              lastMovementDate: issueData.issueDate,
              updatedAt: new Date(),
            })
            .where(eq(stockPositions.id, position!.id));

          // Create movement item record
          const unitCost = item.unitCost || Number(position!.averageUnitCost) || 0;
          const movementItem = {
            id: itemId,
            stockMovementId: movementId,
            stockPositionId: position!.id,
            projectId: projectId,
            itemCode: item.itemCode,
            description: position!.itemName,
            plannedQuantity: item.requestedQuantity.toString(),
            actualQuantity: item.issuedQuantity.toString(),
            uom: position!.uom,
            unitCost: unitCost.toString(),
            totalCost: (item.issuedQuantity * unitCost).toString(),
            lotNumbers: item.lotNumbers || null,
            serialNumbers: item.serialNumbers || null,
            expiryDate: null,
            qualityCheckRequired: false,
            qualityCheckStatus: 'passed',
            qualityCheckNotes: item.notes,
            itemStatus: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await tx.insert(stockMovementItems).values(movementItem);
          processedItems.push(mapStockMovementItem(movementItem));
        }

        return this.success({
          movement: mapStockMovement(movementRecord),
          items: processedItems,
        });
      });
    } catch (error) {
      if (error instanceof StockMovementError || error instanceof InsufficientStockError) {
        throw error;
      }
      return this.handleError(error, 'processIssue');
    }
  }
}
