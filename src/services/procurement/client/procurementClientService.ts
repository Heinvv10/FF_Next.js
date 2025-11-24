/**
 * Procurement Client Service
 * Client-side wrapper for procurement API calls
 * This service should be used by frontend components instead of direct service imports
 */

import { procurementApi } from '@/services/api/procurementApi';
import { StockClient } from './modules/StockClient';
import { BOQClient } from './modules/BOQClient';
import { RFQClient } from './modules/RFQClient';
import { PurchaseOrderClient } from './modules/PurchaseOrderClient';

export class ProcurementClientService {
  // Stock Operations
  static getStockPositions = StockClient.getStockPositions;
  static getStockPositionById = StockClient.getStockPositionById;
  static createStockPosition = StockClient.createStockPosition;
  static updateStockPosition = StockClient.updateStockPosition;
  static getStockMovements = StockClient.getStockMovements;
  static createStockMovement = StockClient.createStockMovement;
  static processBulkMovement = StockClient.processBulkMovement;
  static getDashboardData = StockClient.getDashboardData;

  // BOQ Operations
  static getBOQsByProject = BOQClient.getBOQsByProject;
  static getBOQ = BOQClient.getBOQ;
  static getBOQWithItems = BOQClient.getBOQWithItems;
  static createBOQ = BOQClient.createBOQ;
  static updateBOQ = BOQClient.updateBOQ;
  static deleteBOQ = BOQClient.deleteBOQ;
  static importBOQ = BOQClient.importBOQ;
  static getBOQItems = BOQClient.getBOQItems;
  static getBOQItem = BOQClient.getBOQItem;
  static createBOQItem = BOQClient.createBOQItem;
  static updateBOQItem = BOQClient.updateBOQItem;
  static deleteBOQItem = BOQClient.deleteBOQItem;
  static getBOQExceptions = BOQClient.getBOQExceptions;
  static getBOQException = BOQClient.getBOQException;
  static createBOQException = BOQClient.createBOQException;
  static updateBOQException = BOQClient.updateBOQException;
  static deleteException = BOQClient.deleteException;

  // RFQ Operations
  static getRFQList = RFQClient.getRFQList;
  static getRFQById = RFQClient.getRFQById;
  static createRFQ = RFQClient.createRFQ;
  static updateRFQ = RFQClient.updateRFQ;
  static deleteRFQ = RFQClient.deleteRFQ;

  // Purchase Order Operations
  static getPurchaseOrders = PurchaseOrderClient.getPurchaseOrders;
  static getPurchaseOrderById = PurchaseOrderClient.getPurchaseOrderById;
  static createPurchaseOrder = PurchaseOrderClient.createPurchaseOrder;
  static updatePurchaseOrder = PurchaseOrderClient.updatePurchaseOrder;
  static deletePurchaseOrder = PurchaseOrderClient.deletePurchaseOrder;

  // Health Check
  static async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    return procurementApi.healthCheck();
  }
}

// Create a compatible interface that matches the old procurementApiService
export const procurementApiService = {
  // BOQ Methods
  getBOQWithItems: ProcurementClientService.getBOQWithItems,
  getBOQsByProject: ProcurementClientService.getBOQsByProject,
  getBOQ: ProcurementClientService.getBOQ,
  updateBOQ: ProcurementClientService.updateBOQ,
  deleteBOQ: ProcurementClientService.deleteBOQ,
  createBOQ: ProcurementClientService.createBOQ,
  importBOQ: ProcurementClientService.importBOQ,
  getBOQItems: ProcurementClientService.getBOQItems,
  getBOQItem: ProcurementClientService.getBOQItem,
  createBOQItem: ProcurementClientService.createBOQItem,
  updateBOQItem: ProcurementClientService.updateBOQItem,
  deleteBOQItem: ProcurementClientService.deleteBOQItem,
  getBOQExceptions: ProcurementClientService.getBOQExceptions,
  getBOQException: ProcurementClientService.getBOQException,
  createBOQException: ProcurementClientService.createBOQException,
  updateBOQException: ProcurementClientService.updateBOQException,
  deleteException: ProcurementClientService.deleteException,

  // Stock Methods
  getStockPositions: ProcurementClientService.getStockPositions,
  getStockPositionById: ProcurementClientService.getStockPositionById,
  createStockPosition: ProcurementClientService.createStockPosition,
  updateStockPosition: ProcurementClientService.updateStockPosition,
  getStockMovements: ProcurementClientService.getStockMovements,
  createStockMovement: ProcurementClientService.createStockMovement,
  processBulkMovement: ProcurementClientService.processBulkMovement,
  getDashboardData: ProcurementClientService.getDashboardData,

  // RFQ Methods
  getRFQList: ProcurementClientService.getRFQList,
  getRFQById: ProcurementClientService.getRFQById,
  createRFQ: ProcurementClientService.createRFQ,
  updateRFQ: ProcurementClientService.updateRFQ,
  deleteRFQ: ProcurementClientService.deleteRFQ,

  // Purchase Order Methods
  getPurchaseOrders: ProcurementClientService.getPurchaseOrders,
  getPurchaseOrderById: ProcurementClientService.getPurchaseOrderById,
  createPurchaseOrder: ProcurementClientService.createPurchaseOrder,
  updatePurchaseOrder: ProcurementClientService.updatePurchaseOrder,
  deletePurchaseOrder: ProcurementClientService.deletePurchaseOrder,

  // Health Check
  getHealthStatus: ProcurementClientService.getHealthStatus
};

export default ProcurementClientService;
