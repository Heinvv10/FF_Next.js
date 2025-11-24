/**
 * Movement Health
 * Health status checking for movement service
 */

import { BaseService, type ServiceResponse } from '../../../../core/BaseService';
import { db } from '@/lib/neon/connection';
import { stockMovements } from '@/lib/neon/schema/procurement/stock.schema';

export class MovementHealth extends BaseService {
  constructor() {
    super('MovementHealth', {
      timeout: 10000,
      retries: 1,
      cache: false,
    });
  }

  /**
   * Get health status of movement service
   */
  async getHealthStatus(): Promise<ServiceResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: Record<string, unknown>;
  }>> {
    try {
      // Test transaction capabilities
      await db.transaction(async (tx) => {
        await tx.select().from(stockMovements).limit(1);
      });

      return this.success({
        status: 'healthy',
        details: {
          transactionSupport: 'enabled',
          movementProcessing: 'operational',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return this.success({
        status: 'unhealthy',
        details: {
          transactionSupport: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
