/**
 * GET /api/foto/evaluation/[dr_number]
 * Fetch cached evaluation for a specific DR
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dr_number } = req.query;

    if (!dr_number || typeof dr_number !== 'string') {
      return res.status(400).json({ error: 'Invalid DR number' });
    }

    // TODO: Fetch from database
    // const evaluation = await getEvaluationFromDB(dr_number);

    // For now, return 404 (no cached evaluation)
    return res.status(404).json({
      error: 'No evaluation found',
      message: `No evaluation found for DR ${dr_number}`,
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return res.status(500).json({
      error: 'Failed to fetch evaluation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
