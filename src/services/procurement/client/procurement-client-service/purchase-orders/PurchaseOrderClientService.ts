/**
 * Purchase Order Operations Client Service
 * Client-side wrapper for purchase order-related API calls
 */

import { procurementApi } from '@/services/api/procurementApi';
import type { PurchaseOrder } from '@/services/api/procurementApi';
import type { ProcurementApiContext } from '../../index';

export class PurchaseOrderClientService {
  /**
   * Get purchase orders with pagination
   */
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

  /**
   * Get single purchase order by ID
   */
  static async getPurchaseOrderById(
    context: ProcurementApiContext,
    orderId: string
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.getOrder(context.projectId, orderId);
  }

  /**
   * Create new purchase order
   */
  static async createPurchaseOrder(
    context: ProcurementApiContext,
    orderData: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.createOrder(context.projectId, {
      ...orderData,
      createdBy: context.userId
    });
  }

  /**
   * Update existing purchase order
   */
  static async updatePurchaseOrder(
    context: ProcurementApiContext,
    orderId: string,
    updateData: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    return procurementApi.purchaseOrders.updateOrder(context.projectId, orderId, updateData);
  }

  /**
   * Delete purchase order
   */
  static async deletePurchaseOrder(
    context: ProcurementApiContext,
    orderId: string
  ): Promise<void> {
    return procurementApi.purchaseOrders.deleteOrder(context.projectId, orderId);
  }
}
