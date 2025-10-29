import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Vercel Cron Job: Sync Action Items from Fireflies Meetings
 *
 * Runs every 6 hours to extract new action items from meetings.
 *
 * Vercel Cron documentation:
 * https://vercel.com/docs/cron-jobs
 *
 * Schedule: "0 */6 * * *" (every 6 hours at minute 0)
 * - 00:00, 06:00, 12:00, 18:00 UTC
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized request');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('[Cron] Starting scheduled action items sync...');

  try {
    // Call the extract-all endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3005';

    const response = await fetch(`${baseUrl}/api/action-items/extract-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Cron] Extraction failed:', result);
      return res.status(500).json({
        success: false,
        error: 'Extraction failed',
        details: result,
      });
    }

    console.log('[Cron] Sync complete:', result);

    return res.status(200).json({
      success: true,
      message: 'Action items synced successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
