import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { syncFirefliesToNeon } from '@/services/fireflies/firefliesService';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Cron endpoint for automated meeting sync
 * Protected by CRON_SECRET environment variable
 *
 * Usage: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://app.fibreflow.app/api/meetings-sync-cron
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron attempt', { ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const apiKey = process.env.FIREFLIES_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'FIREFLIES_API_KEY not configured' });
    }

    console.log('[CRON] Starting Fireflies sync...', new Date().toISOString());
    const count = await syncFirefliesToNeon(apiKey, sql);
    console.log(`[CRON] Synced ${count} meetings from Fireflies`);

    return res.status(200).json({
      success: true,
      synced: count,
      timestamp: new Date().toISOString(),
      message: `Synced ${count} meetings from Fireflies`
    });
  } catch (error: any) {
    console.error('[CRON] Error syncing from Fireflies:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
