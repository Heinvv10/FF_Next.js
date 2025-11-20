/**
 * RFQ Operations Client Service
 * Client-side wrapper for RFQ-related API calls
 */

import { procurementApi } from '@/services/api/procurementApi';
import type { RFQ } from '@/services/api/procurementApi';
import type { ProcurementApiContext } from '../../index';

export class RFQClientService {
  /**
   * Get RFQs with pagination
   */
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

  /**
   * Get single RFQ by ID
   */
  static async getRFQById(
    context: ProcurementApiContext,
    rfqId: string
  ): Promise<RFQ> {
    return procurementApi.rfq.getRFQ(context.projectId, rfqId);
  }

  /**
   * Create new RFQ
   */
  static async createRFQ(
    context: ProcurementApiContext,
    rfqData: Partial<RFQ>
  ): Promise<RFQ> {
    return procurementApi.rfq.createRFQ(context.projectId, {
      ...rfqData,
      createdBy: context.userId
    });
  }

  /**
   * Update existing RFQ
   */
  static async updateRFQ(
    context: ProcurementApiContext,
    rfqId: string,
    updateData: Partial<RFQ>
  ): Promise<RFQ> {
    return procurementApi.rfq.updateRFQ(context.projectId, rfqId, updateData);
  }

  /**
   * Delete RFQ
   */
  static async deleteRFQ(
    context: ProcurementApiContext,
    rfqId: string
  ): Promise<void> {
    return procurementApi.rfq.deleteRFQ(context.projectId, rfqId);
  }
}
