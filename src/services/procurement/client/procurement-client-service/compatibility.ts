/**
 * Compatibility Export
 * Maintains backward compatibility with old procurementApiService interface
 */

import { StockClientService } from './stock/StockClientService';
import { BOQClientService } from './boq/BOQClientService';
import { RFQClientService } from './rfq/RFQClientService';
import { PurchaseOrderClientService } from './purchase-orders/PurchaseOrderClientService';
import { HealthCheckService } from './health/HealthCheckService';

/**
 * Legacy procurementApiService object
 * Provides compatibility with old import patterns
 */
export const procurementApiService = {
  // BOQ Methods
  getBOQWithItems: BOQClientService.getBOQWithItems,
  getBOQsByProject: BOQClientService.getBOQsByProject,
  getBOQ: BOQClientService.getBOQ,
  updateBOQ: BOQClientService.updateBOQ,
  deleteBOQ: BOQClientService.deleteBOQ,
  createBOQ: BOQClientService.createBOQ,
  importBOQ: BOQClientService.importBOQ,
  getBOQItems: BOQClientService.getBOQItems,
  getBOQItem: BOQClientService.getBOQItem,
  createBOQItem: BOQClientService.createBOQItem,
  updateBOQItem: BOQClientService.updateBOQItem,
  deleteBOQItem: BOQClientService.deleteBOQItem,
  getBOQExceptions: BOQClientService.getBOQExceptions,
  getBOQException: BOQClientService.getBOQException,
  createBOQException: BOQClientService.createBOQException,
  updateBOQException: BOQClientService.updateBOQException,
  deleteException: BOQClientService.deleteException,

  // Stock Methods
  getStockPositions: StockClientService.getStockPositions,
  getStockPositionById: StockClientService.getStockPositionById,
  createStockPosition: StockClientService.createStockPosition,
  updateStockPosition: StockClientService.updateStockPosition,
  getStockMovements: StockClientService.getStockMovements,
  createStockMovement: StockClientService.createStockMovement,
  processBulkMovement: StockClientService.processBulkMovement,
  getDashboardData: StockClientService.getDashboardData,

  // RFQ Methods
  getRFQList: RFQClientService.getRFQList,
  getRFQById: RFQClientService.getRFQById,
  createRFQ: RFQClientService.createRFQ,
  updateRFQ: RFQClientService.updateRFQ,
  deleteRFQ: RFQClientService.deleteRFQ,

  // Purchase Order Methods
  getPurchaseOrders: PurchaseOrderClientService.getPurchaseOrders,
  getPurchaseOrderById: PurchaseOrderClientService.getPurchaseOrderById,
  createPurchaseOrder: PurchaseOrderClientService.createPurchaseOrder,
  updatePurchaseOrder: PurchaseOrderClientService.updatePurchaseOrder,
  deletePurchaseOrder: PurchaseOrderClientService.deletePurchaseOrder,

  // Health Check
  getHealthStatus: HealthCheckService.getHealthStatus
};
