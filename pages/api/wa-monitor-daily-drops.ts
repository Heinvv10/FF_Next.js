/**
 * WA Monitor Daily Drops API
 * GET /api/wa-monitor-daily-drops
 *
 * Returns daily drops count per project for today
 * Used for dashboard and SharePoint sync
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getDailyDropsPerProject } from '@/modules/wa-monitor/services/waMonitorService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['GET']);
  }

  try {
    const dailyDrops = await getDailyDropsPerProject();

    // Calculate total for today
    const total = dailyDrops.reduce((sum, item) => sum + item.count, 0);

    return apiResponse.success(res, {
      drops: dailyDrops,
      total,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

  } catch (error: any) {
    console.error('Error in wa-monitor-daily-drops API:', error);
    return apiResponse.internalError(res, error, 'Failed to fetch daily drops');
  }
}
