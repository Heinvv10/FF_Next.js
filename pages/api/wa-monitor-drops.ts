/**
 * WA Monitor Drops API
 * GET /api/wa-monitor-drops
 *
 * Endpoints:
 * - GET /api/wa-monitor-drops - Get all drops with summary
 * - GET /api/wa-monitor-drops?id={id} - Get single drop by ID
 * - GET /api/wa-monitor-drops?status={status} - Get drops by status
 *
 * Returns QA review drop data from Neon PostgreSQL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/modules/wa-monitor/lib/apiResponse';
import {
  getAllDrops,
  getDropById,
  getDropsByStatus,
  calculateSummary,
} from '@/modules/wa-monitor/services/waMonitorService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['GET']);
  }

  try {
    const { id, status } = req.query;

    // Get single drop by ID
    if (id && typeof id === 'string') {
      const drop = await getDropById(id);

      if (!drop) {
        return apiResponse.notFound(res, 'Drop', id);
      }

      return apiResponse.success(res, drop);
    }

    // Get drops by status
    if (status && typeof status === 'string') {
      if (status !== 'incomplete' && status !== 'complete') {
        return apiResponse.validationError(res, {
          status: 'Status must be either "incomplete" or "complete"',
        });
      }

      const drops = await getDropsByStatus(status);
      return apiResponse.success(res, drops);
    }

    // Get all drops with summary
    const [drops, summary] = await Promise.all([
      getAllDrops(),
      calculateSummary(),
    ]);

    // Return with summary in response
    return res.status(200).json({
      success: true,
      data: drops,
      summary,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Error in wa-monitor-drops API:', error);
    return apiResponse.internalError(res, error, 'Failed to fetch QA review drops');
  }
}
