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

  console.log('[Cron] Starting scheduled sync...');

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3005';

    // STEP 1: Sync meetings from Fireflies API
    console.log('[Cron] Step 1: Syncing meetings from Fireflies...');
    const meetingsResponse = await fetch(`${baseUrl}/api/meetings?action=sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const meetingsResult = await meetingsResponse.json();

    if (!meetingsResponse.ok) {
      console.error('[Cron] Meetings sync failed:', meetingsResult);
      return res.status(500).json({
        success: false,
        error: 'Meetings sync failed',
        details: meetingsResult,
      });
    }

    console.log(`[Cron] Synced ${meetingsResult.synced} meetings from Fireflies`);

    // STEP 2: Extract action items from meetings
    console.log('[Cron] Step 2: Extracting action items...');
    const actionItemsResponse = await fetch(`${baseUrl}/api/action-items/extract-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const actionItemsResult = await actionItemsResponse.json();

    if (!actionItemsResponse.ok) {
      console.error('[Cron] Action items extraction failed:', actionItemsResult);
      return res.status(500).json({
        success: false,
        error: 'Action items extraction failed',
        details: actionItemsResult,
      });
    }

    console.log('[Cron] Sync complete');

    return res.status(200).json({
      success: true,
      message: 'Full sync completed successfully',
      data: {
        meetings: meetingsResult,
        action_items: actionItemsResult.data,
      },
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
