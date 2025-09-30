import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFirefliesMeetings } from '@/lib/fireflies';
import { syncFirefliesMeeting } from '@/lib/fireflies-sync';

interface SyncResponse {
  success: boolean;
  synced?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('Starting Fireflies sync...');
    
    // Check if we have the required API key
    if (!process.env.FIREFLIES_API_KEY) {
      console.error('Missing FIREFLIES_API_KEY environment variable');
      return res.status(500).json({
        success: false,
        error: 'Fireflies API key not configured'
      });
    }

    // Fetch meetings from Fireflies
    const meetings = await fetchFirefliesMeetings();
    console.log(`Fetched ${meetings.length} meetings from Fireflies`);

    if (meetings.length === 0) {
      return res.status(200).json({
        success: true,
        synced: 0
      });
    }

    // Sync each meeting to database
    let syncedCount = 0;
    for (const meeting of meetings) {
      try {
        await syncFirefliesMeeting(meeting);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync meeting ${meeting.id}:`, error);
        // Continue with other meetings even if one fails
      }
    }

    console.log(`Successfully synced ${syncedCount} out of ${meetings.length} meetings`);

    return res.status(200).json({
      success: true,
      synced: syncedCount
    });

  } catch (error) {
    console.error('Error in sync-fireflies:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Fireflies API credentials'
      });
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return res.status(503).json({
        success: false,
        error: 'Failed to connect to Fireflies API'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync meetings'
    });
  }
}