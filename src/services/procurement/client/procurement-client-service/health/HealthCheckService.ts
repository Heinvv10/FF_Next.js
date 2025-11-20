/**
 * Health Check Service
 * Client-side wrapper for API health check
 */

import { procurementApi } from '@/services/api/procurementApi';

export class HealthCheckService {
  /**
   * Get API health status
   */
  static async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    return procurementApi.healthCheck();
  }
}
