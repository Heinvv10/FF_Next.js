/**
 * WA Monitor Projects Summary API
 * GET /api/wa-monitor-projects-summary
 *
 * Returns today's stats for all projects combined
 * Used for Projects page summary card
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getAllProjectsStatsSummary } from '@/modules/wa-monitor/services/waMonitorService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['GET']);
  }

  try {
    const summary = await getAllProjectsStatsSummary();

    return apiResponse.success(res, summary);

  } catch (error: any) {
    console.error('Error in wa-monitor-projects-summary API:', error);
    return apiResponse.internalError(res, error, 'Failed to fetch projects summary');
  }
}
