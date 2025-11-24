/**
 * Movement Mappers
 * Mapping functions for stock movements
 */

import type {
  StockMovement,
  StockMovementItem,
  DrumUsageHistory,
  MovementTypeType
} from '@/types/procurement/stock';

/**
 * Map database movement record to StockMovement type
 */
export function mapStockMovement(movement: any): StockMovement {
  return {
    id: movement.id,
    projectId: movement.projectId,
    movementType: movement.movementType as MovementTypeType,
    referenceNumber: movement.referenceNumber,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    fromLocation: movement.fromLocation,
    toLocation: movement.toLocation,
    fromProjectId: movement.fromProjectId,
    toProjectId: movement.toProjectId,
    status: movement.status,
    movementDate: movement.movementDate,
    confirmedAt: movement.confirmedAt,
    requestedBy: movement.requestedBy,
    authorizedBy: movement.authorizedBy,
    processedBy: movement.processedBy,
    notes: movement.notes,
    reason: movement.reason,
    createdAt: movement.createdAt,
    updatedAt: movement.updatedAt,
  };
}

/**
 * Map database movement item record to StockMovementItem type
 */
export function mapStockMovementItem(item: any): StockMovementItem {
  const mappedItem: any = {
    id: item.id,
    movementId: item.stockMovementId,
    stockPositionId: item.stockPositionId,
    projectId: item.projectId,
    itemCode: item.itemCode,
    itemName: item.description || item.itemCode,
    description: item.description,
    uom: item.uom,
    plannedQuantity: Number(item.plannedQuantity),
    ...(item.actualQuantity !== undefined && { actualQuantity: Number(item.actualQuantity) }),
    ...(item.actualQuantity !== undefined && { receivedQuantity: Number(item.actualQuantity) }),
    ...(item.unitCost !== undefined && { unitCost: Number(item.unitCost) }),
    ...(item.totalCost !== undefined && { totalCost: Number(item.totalCost) }),
    lotNumbers: item.lotNumbers || [],
    serialNumbers: item.serialNumbers || [],
    itemStatus: item.itemStatus,
    qualityCheckRequired: item.qualityCheckRequired,
    qualityCheckStatus: item.qualityCheckStatus,
    qualityNotes: item.qualityCheckNotes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  return mappedItem as StockMovementItem;
}

/**
 * Map database drum usage record to DrumUsageHistory type
 */
export function mapDrumUsageHistory(usage: any): DrumUsageHistory {
  return {
    id: usage.id,
    drumId: usage.drumId,
    projectId: usage.projectId,
    usageDate: usage.usageDate,
    previousReading: Number(usage.previousReading),
    currentReading: Number(usage.currentReading),
    usedLength: Number(usage.usedLength),
    poleNumber: usage.poleNumber,
    sectionId: usage.sectionId,
    workOrderId: usage.workOrderId,
    technicianId: usage.technicianId,
    installationType: usage.installationType,
    startCoordinates: usage.startCoordinates,
    endCoordinates: usage.endCoordinates,
    installationNotes: usage.installationNotes,
    qualityNotes: usage.qualityNotes,
    createdAt: usage.createdAt,
  };
}
