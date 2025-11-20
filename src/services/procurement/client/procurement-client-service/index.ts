/**
 * Procurement Client Service - Main Orchestrator
 * Combines all procurement resource services into a single class
 */

import { StockClientService } from './stock/StockClientService';
import { BOQClientService } from './boq/BOQClientService';
import { RFQClientService } from './rfq/RFQClientService';
import { PurchaseOrderClientService } from './purchase-orders/PurchaseOrderClientService';
import { HealthCheckService } from './health/HealthCheckService';

/**
 * Main Procurement Client Service
 * Client-side wrapper for all procurement API calls
 */
export class ProcurementClientService {
  // Stock Operations
  static getStockPositions = StockClientService.getStockPositions;
  static getStockPositionById = StockClientService.getStockPositionById;
  static createStockPosition = StockClientService.createStockPosition;
  static updateStockPosition = StockClientService.updateStockPosition;
  static getStockMovements = StockClientService.getStockMovements;
  static createStockMovement = StockClientService.createStockMovement;
  static processBulkMovement = StockClientService.processBulkMovement;
  static getDashboardData = StockClientService.getDashboardData;

  // BOQ Operations
  static getBOQsByProject = BOQClientService.getBOQsByProject;
  static getBOQ = BOQClientService.getBOQ;
  static getBOQWithItems = BOQClientService.getBOQWithItems;
  static createBOQ = BOQClientService.createBOQ;
  static updateBOQ = BOQClientService.updateBOQ;
  static deleteBOQ = BOQClientService.deleteBOQ;
  static importBOQ = BOQClientService.importBOQ;

  // BOQ Item Operations
  static getBOQItems = BOQClientService.getBOQItems;
  static getBOQItem = BOQClientService.getBOQItem;
  static createBOQItem = BOQClientService.createBOQItem;
  static updateBOQItem = BOQClientService.updateBOQItem;
  static deleteBOQItem = BOQClientService.deleteBOQItem;

  // BOQ Exception Operations
  static getBOQExceptions = BOQClientService.getBOQExceptions;
  static getBOQException = BOQClientService.getBOQException;
  static createBOQException = BOQClientService.createBOQException;
  static updateBOQException = BOQClientService.updateBOQException;
  static deleteException = BOQClientService.deleteException;

  // RFQ Operations
  static getRFQList = RFQClientService.getRFQList;
  static getRFQById = RFQClientService.getRFQById;
  static createRFQ = RFQClientService.createRFQ;
  static updateRFQ = RFQClientService.updateRFQ;
  static deleteRFQ = RFQClientService.deleteRFQ;

  // Purchase Order Operations
  static getPurchaseOrders = PurchaseOrderClientService.getPurchaseOrders;
  static getPurchaseOrderById = PurchaseOrderClientService.getPurchaseOrderById;
  static createPurchaseOrder = PurchaseOrderClientService.createPurchaseOrder;
  static updatePurchaseOrder = PurchaseOrderClientService.updatePurchaseOrder;
  static deletePurchaseOrder = PurchaseOrderClientService.deletePurchaseOrder;

  // Health Check
  static getHealthStatus = HealthCheckService.getHealthStatus;
}

// Re-export individual services for modular usage
export { StockClientService } from './stock/StockClientService';
export { BOQClientService } from './boq/BOQClientService';
export { RFQClientService } from './rfq/RFQClientService';
export { PurchaseOrderClientService } from './purchase-orders/PurchaseOrderClientService';
export { HealthCheckService } from './health/HealthCheckService';

// Re-export compatibility layer
export { procurementApiService } from './compatibility';
