/**
 * Contractors API Health Check
 * GET /api/contractors/health - Check contractors API status
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { log } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // For now, just return healthy status
    const dbCheck = { status: 'healthy', message: 'Mock health check' };

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbCheck,
      service: 'contractors-api'
    });
  } catch (error) {
    log.error('Contractors health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'contractors-api'
    });
  }
}