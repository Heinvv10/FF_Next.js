import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirefliesMeetings } from '@/lib/fireflies-sync';

interface FirefliesMeetingsResponse {
  success: boolean;
  meetings?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FirefliesMeetingsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { limit = '50', offset = '0' } = req.query;
    
    // Validate parameters
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    const offsetNum = parseInt(offset as string) || 0;

    console.log(`Fetching Fireflies meetings with limit: ${limitNum}, offset: ${offsetNum}`);

    // Check database connection
    if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
      console.error('Missing database connection string');
      return res.status(500).json({
        success: false,
        error: 'Database not configured'
      });
    }

    // Get meetings from database
    const meetings = await getFirefliesMeetings(limitNum, offsetNum);
    
    console.log(`Retrieved ${meetings.length} meetings from database`);

    // Transform meetings data for frontend
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      created_at: meeting.created_at,
      participants: meeting.participants || [],
      duration: meeting.duration || 0,
      full_text: meeting.full_text,
      summary: meeting.summary,
      bullet_points: meeting.bullet_points || []
    }));

    return res.status(200).json({
      success: true,
      meetings: transformedMeetings
    });

  } catch (error) {
    console.error('Error in fireflies-meetings:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('connect') || error.message?.includes('connection')) {
      return res.status(503).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    if (error.message?.includes('syntax') || error.message?.includes('SQL')) {
      return res.status(500).json({
        success: false,
        error: 'Database query error'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch meetings'
    });
  }
}