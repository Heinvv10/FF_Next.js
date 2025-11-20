/**
 * Procurement Client Service
 * Client-side wrapper for procurement API calls
 * This service should be used by frontend components instead of direct service imports
 */

import { procurementApi } from '@/services/api/procurementApi';
import type { 
  StockPosition, 
  StockMovement, 
  PurchaseOrder, 
  RFQ, 
  BOQ,
  PaginatedResponse,
  StockDashboard
} from '@/services/api/procurementApi';
import type { ProcurementApiContext } from '../index';
import type { BOQWithItems, BOQItem, BOQException } from '../boqApi/types';

export class ProcurementClientService {
  // Stock Operations
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

  // BOQ Operations
  static async getBOQsByProject(
    context: ProcurementApiContext,
    projectId: string
  ): Promise<BOQ[]> {
    const response = await procurementApi.boq.getBOQs(projectId);
    return response.data;
  }

  static async getBOQ(
    context: ProcurementApiContext,
    boqId: string
  ): Promise<BOQ> {
    return procurementApi.boq.getBOQ(context.projectId, boqId);
  }

  static async getBOQWithItems(
    context: ProcurementApiContext,
    boqId: string
  ): Promise<BOQWithItems> {
    const [boq, items, exceptions] = await Promise.all([
      procurementApi.boq.getBOQ(context.projectId, boqId),
      procurementApi.boq.getItems(context.projectId, boqId),
      procurementApi.boq.getExceptions(context.projectId, boqId)
    ]);

    return {
      ...boq,
      items: items as BOQItem[],
      exceptions: exceptions as BOQException[]
    };
  }

  static async createBOQ(
    context: ProcurementApiContext,
    boqData: Partial<BOQ>
  ): Promise<BOQ> {
    return procurementApi.boq.createBOQ(context.projectId, {
      ...boqData,
      createdBy: context.userId
    });
  }

  static async updateBOQ(
    context: ProcurementApiContext,
    boqId: string,
    updateData: Partial<BOQ>
  ): Promise<BOQ> {
    return procurementApi.boq.updateBOQ(context.projectId, boqId, updateData);
  }

  static async deleteBOQ(
    context: ProcurementApiContext,
    boqId: string
  ): Promise<void> {
    return procurementApi.boq.deleteBOQ(context.projectId, boqId);
  }

  static async importBOQ(
    context: ProcurementApiContext,
    importData: { name: string; data: any[]; mappings?: Record<string, string> }
  ): Promise<BOQ> {
    return procurementApi.boq.importBOQ(context.projectId, importData);
  }

  // BOQ Item Operations
  static async getBOQItems(
    context: ProcurementApiContext,
    boqId: string
  ): Promise<BOQItem[]> {
    const items = await procurementApi.boq.getItems(context.projectId, boqId);
    return items as BOQItem[];
  }

  static async getBOQItem(
    context: ProcurementApiContext,
    itemId: string
  ): Promise<BOQItem> {
    // Since there's no direct endpoint for single item, we'll need to fetch all and filter
    // This should be improved with a proper API endpoint
    throw new Error('getBOQItem not implemented - API endpoint needed');
  }

  static async createBOQItem(
    context: ProcurementApiContext,
    boqId: string,
    itemData: Partial<BOQItem>
  ): Promise<BOQItem> {
    // This needs a proper API endpoint
    throw new Error('createBOQItem not implemented - API endpoint needed');
  }

  static async updateBOQItem(
    context: ProcurementApiContext,
    itemId: string,
    updateData: Partial<BOQItem>
  ): Promise<BOQItem> {
    // This needs a proper API endpoint
    throw new Error('updateBOQItem not implemented - API endpoint needed');
  }

  static async deleteBOQItem(
    context: ProcurementApiContext,
    itemId: string
  ): Promise<void> {
    // This needs a proper API endpoint
    throw new Error('deleteBOQItem not implemented - API endpoint needed');
  }

  // BOQ Exception Operations
  static async getBOQExceptions(
    context: ProcurementApiContext,
    boqId: string
  ): Promise<BOQException[]> {
    const exceptions = await procurementApi.boq.getExceptions(context.projectId, boqId);
    return exceptions as BOQException[];
  }

  static async getBOQException(
    context: ProcurementApiContext,
    exceptionId: string
  ): Promise<BOQException> {
    // This needs a proper API endpoint
    throw new Error('getBOQException not implemented - API endpoint needed');
  }

  static async createBOQException(
    context: ProcurementApiContext,
    boqId: string,
    exceptionData: Partial<BOQException>
  ): Promise<BOQException> {
    // This needs a proper API endpoint
    throw new Error('createBOQException not implemented - API endpoint needed');
  }

  static async updateBOQException(
    context: ProcurementApiContext,
    exceptionId: string,
    updateData: Partial<BOQException>
  ): Promise<BOQException> {
    // This needs a proper API endpoint
    throw new Error('updateBOQException not implemented - API endpoint needed');
  }

  static async deleteException(
    context: ProcurementApiContext,
    exceptionId: string
  ): Promise<void> {
    // This needs a proper API endpoint
    throw new Error('deleteException not implemented - API endpoint needed');
  }

  // RFQ Operations
  static async getRFQList(
    context: ProcurementApiContext,
    filters?: any
  ): Promise<{ rfqs: RFQ[], total: number, page: number, limit: number }> {
    const response = await procurementApi.rfq.getRFQs(context.projectId, filters);
    return {
      rfqs: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit
    };
  }

  static async getRFQById(
    context: ProcurementApiContext,
    rfqId: string
  ): Promise<RFQ> {
    return procurementApi.rfq.getRFQ(context.projectId, rfqId);
  }

  static async createRFQ(
    context: ProcurementApiContext,
    rfqData: Partial<RFQ>
  ): Promise<RFQ> {
    return procurementApi.rfq.createRFQ(context.projectId, {
      ...rfqData,
      createdBy: context.userId
    });
  }

  static async updateRFQ(
    context: ProcurementApiContext,
    rfqId: string,
    updateData: Partial<RFQ>
  ): Promise<RFQ> {
    return procurementApi.rfq.updateRFQ(context.projectId, rfqId, updateData);
  }

  static async deleteRFQ(
    context: ProcurementApiContext,
    rfqId: string
  ): Promise<void> {
    return procurementApi.rfq.deleteRFQ(context.projectId, rfqId);
  }

  // Purchase Order Operations
  static async getPurchaseOrders(
    context: ProcurementApiContext,
    filters?: any
  ): Promise<{ orders: PurchaseOrder[], total: number, page: number, limit: number }> {
    const response = await procurementApi.purchaseOrders.getOrders(context.projectId, filters);
    return {
      orders: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit
    };
  }

  static async getPurchaseOrderById(
    context: ProcurementApiContext,
    orderId: string
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.getOrder(context.projectId, orderId);
  }

  static async createPurchaseOrder(
    context: ProcurementApiContext,
    orderData: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.createOrder(context.projectId, {
      ...orderData,
      createdBy: context.userId
    });
  }

  static async updatePurchaseOrder(
    context: ProcurementApiContext,
    orderId: string,
    updateData: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.updateOrder(context.projectId, orderId, updateData);
  }

  static async deletePurchaseOrder(
    context: ProcurementApiContext,
    orderId: string
  ): Promise<void> {
    return procurementApi.purchaseOrders.deleteOrder(context.projectId, orderId);
  }

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